import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ExercisePerformance } from '../entities/exercise-performance.entity';
import { LearningEvent, LearningEventType } from '../entities/learning-event.entity';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { ReviewType, ScoringConfiguration, ScoringBreakdown, BaselineState } from '../entities/review-assignment.entity';

export interface ReviewCandidate {
  skillId: string;
  reviewType: ReviewType;
  priorityScore: number;
  scoringBreakdown: ScoringBreakdown;
  baselineState: BaselineState;
  sourceInteractionIds: string[];
}

/**
 * [PARÂMETRO EXPERIMENTAL]
 * All weights and thresholds are initial configurable heuristics, NOT empirically validated.
 * They must be configured and versioned for reproducibility.
 */
@Injectable()
export class ReviewCandidateGenerationService {
  private readonly logger = new Logger(ReviewCandidateGenerationService.name);

  // Configuration parameters (all configurable)
  private readonly retentionHalfLifeDays: number;
  private readonly minAttemptsForGeneralization: number;
  private readonly maxReviewsPerSkill: number;
  private readonly targetSuccessProbability: number;
  private readonly slowResponseThresholdMs: number;
  private readonly maxExpectedAttempts: number;
  private readonly maxExpectedHints: number;

  // Scoring weights (configurable, must sum to 1.0)
  private readonly weights = {
    error: 0.20,
    attempts: 0.15,
    help: 0.15,
    engagement: 0.10,
    responseTime: 0.10,
    completion: 0.10,
    mastery: 0.10,
    recency: 0.10,
  };

  constructor(
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(StudentSkillState)
    private readonly skillStateRepository: Repository<StudentSkillState>,
    private readonly configService: ConfigService,
  ) {
    this.retentionHalfLifeDays = this.configService.get<number>('REVIEW_RETENTION_HALF_LIFE_DAYS', 14);
    this.minAttemptsForGeneralization = this.configService.get<number>('REVIEW_MIN_ATTEMPTS_GENERALIZATION', 5);
    this.maxReviewsPerSkill = this.configService.get<number>('REVIEW_MAX_REVIEWS_PER_SKILL', 3);
    this.targetSuccessProbability = this.configService.get<number>('HYBRID_TARGET_SUCCESS_PROBABILITY', 0.7);
    this.slowResponseThresholdMs = this.configService.get<number>('REVIEW_SLOW_RESPONSE_THRESHOLD_MS', 10000);
    this.maxExpectedAttempts = this.configService.get<number>('REVIEW_MAX_EXPECTED_ATTEMPTS', 3);
    this.maxExpectedHints = this.configService.get<number>('REVIEW_MAX_EXPECTED_HINTS', 5);
  }

  /**
   * Generate review candidates for a student across all skills
   */
  async generateReviewCandidates(
    studentId: string,
    options?: { lookbackDays?: number; minEvidence?: number },
  ): Promise<ReviewCandidate[]> {
    const lookbackDays = options?.lookbackDays ?? 30;
    const minEvidence = options?.minEvidence ?? 1;

    const skillStates = await this.skillStateRepository.find({
      where: { studentId },
    });

    const candidates: ReviewCandidate[] = [];

    for (const skillState of skillStates) {
      const evidence = await this.getSkillEvidence(studentId, skillState.skillId, lookbackDays);

      if (evidence.totalAttempts < minEvidence) {
        continue;
      }

      const scoringConfig = this.getCurrentScoringConfiguration();
      const priorityScore = await this.calculateReviewPriorityScore(
        studentId,
        skillState.skillId,
        evidence,
        skillState.masteryProbability,
        scoringConfig,
      );

      if (priorityScore.score > 0) {
        candidates.push({
          skillId: skillState.skillId,
          reviewType: this.determineReviewType(skillState.masteryProbability, evidence),
          priorityScore: priorityScore.score,
          scoringBreakdown: priorityScore.breakdown,
          baselineState: evidence.baselineState,
          sourceInteractionIds: evidence.sourceInteractionIds,
        });
      }
    }

    return candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Calculate Review Priority Score with purpose-specific scoring
   * [PARÂMETRO EXPERIMENTAL] All weights are configurable heuristics
   * 
   * SEMANTIC CORRECTION: Different review types require different factor directions
   * - REMEDIATION: prioritizes evidence of difficulty (errors, attempts, help, non-completion)
   * - RETENTION: prioritizes previously demonstrated mastery + time since exposure
   * - GENERALIZATION: prioritizes sufficient prior evidence + mastery
   */
  async calculateReviewPriorityScore(
    studentId: string,
    skillId: string,
    evidence: SkillEvidence,
    masteryProbability: number,
    scoringConfig: ScoringConfiguration,
  ): Promise<{ score: number; breakdown: ScoringBreakdown }> {
    const reviewType = this.determineReviewType(masteryProbability, evidence);

    let finalScore: number;
    let breakdown: ScoringBreakdown;

    if (reviewType === ReviewType.REMEDIATION) {
      ({ score: finalScore, breakdown } = this.calculateRemediationScore(evidence, masteryProbability, scoringConfig));
    } else if (reviewType === ReviewType.RETENTION) {
      ({ score: finalScore, breakdown } = this.calculateRetentionScore(evidence, masteryProbability, scoringConfig));
    } else {
      // GENERALIZATION
      ({ score: finalScore, breakdown } = this.calculateGeneralizationScore(evidence, masteryProbability, scoringConfig));
    }

    return {
      score: Math.min(Math.max(finalScore, 0), 1), // Clamp to [0,1]
      breakdown,
    };
  }

  /**
   * REMEDIATION scoring: prioritizes evidence of difficulty
   * Higher score = stronger need for remediation
   */
  private calculateRemediationScore(
    evidence: SkillEvidence,
    masteryProbability: number,
    scoringConfig: ScoringConfiguration,
  ): { score: number; breakdown: ScoringBreakdown } {
    // For REMEDIATION: more errors = higher priority
    const errorScore = this.normalizeErrorScore(evidence.totalAttempts, evidence.incorrectAttempts);

    // For REMEDIATION: more attempts = higher priority (indicates struggle)
    const attemptScore = this.normalizeRemediationAttemptScore(evidence.totalAttempts);

    // For REMEDIATION: more hints = higher priority (indicates need for help)
    const helpScore = this.normalizeRemediationHelpScore(evidence.totalHints);

    // For REMEDIATION: more skips/abandonment = higher priority
    const engagementScore = this.normalizeRemediationEngagementScore(
      evidence.skipCount,
      evidence.changeRequestCount,
      evidence.totalExposures,
    );

    // For REMEDIATION: response time is secondary (not primary signal)
    const responseTimeScore = 0.5; // Neutral for remediation

    // For REMEDIATION: non-completion = higher priority
    const completionScore = this.normalizeRemediationCompletionScore(evidence.completedActivities, evidence.presentedActivities);

    // For REMEDIATION: lower mastery = higher priority
    const masteryScore = this.normalizeRemediationMasteryScore(masteryProbability);

    // For REMEDIATION: recent errors = higher priority (not decay)
    const recencyScore = this.normalizeRemediationRecencyScore(evidence.daysSinceLastExposure, evidence.lastExposureAt);

    const weights = scoringConfig.weights;
    const finalScore =
      (weights.error || this.weights.error) * errorScore +
      (weights.attempts || this.weights.attempts) * attemptScore +
      (weights.help || this.weights.help) * helpScore +
      (weights.engagement || this.weights.engagement) * engagementScore +
      (weights.responseTime || this.weights.responseTime) * responseTimeScore +
      (weights.completion || this.weights.completion) * completionScore +
      (weights.mastery || this.weights.mastery) * masteryScore +
      (weights.recency || this.weights.recency) * recencyScore;

    return {
      score: finalScore,
      breakdown: {
        errorScore,
        attemptScore,
        helpScore,
        engagementScore,
        responseTimeScore,
        completionScore,
        masteryScore,
        recencyScore,
        normalizedFactors: {
          errorScore,
          attemptScore,
          helpScore,
          engagementScore,
          responseTimeScore,
          completionScore,
          masteryScore,
          recencyScore,
        },
      },
    };
  }

  /**
   * RETENTION scoring: prioritizes previously demonstrated mastery + time since exposure
   * Higher score = stronger need for retention review
   */
  private calculateRetentionScore(
    evidence: SkillEvidence,
    masteryProbability: number,
    scoringConfig: ScoringConfiguration,
  ): { score: number; breakdown: ScoringBreakdown } {
    // For RETENTION: errors are secondary (already mastered)
    const errorScore = 0.1; // Low weight for retention

    // For RETENTION: attempts are secondary
    const attemptScore = 0.2; // Low weight for retention

    // For RETENTION: hints are secondary
    const helpScore = 0.1; // Low weight for retention

    // For RETENTION: engagement is secondary
    const engagementScore = 0.2; // Low weight for retention

    // For RETENTION: response time is secondary
    const responseTimeScore = 0.3; // Low weight for retention

    // For RETENTION: completion is secondary (already completed)
    const completionScore = 0.2; // Low weight for retention

    // For RETENTION: HIGH mastery = higher priority (previously mastered)
    const masteryScore = this.normalizeRetentionMasteryScore(masteryProbability);

    // For RETENTION: time since exposure = higher priority (exponential decay)
    const recencyScore = this.normalizeRecencyScore(evidence.daysSinceLastExposure);

    const weights = scoringConfig.weights;
    const finalScore =
      (weights.error || this.weights.error) * errorScore +
      (weights.attempts || this.weights.attempts) * attemptScore +
      (weights.help || this.weights.help) * helpScore +
      (weights.engagement || this.weights.engagement) * engagementScore +
      (weights.responseTime || this.weights.responseTime) * responseTimeScore +
      (weights.completion || this.weights.completion) * completionScore +
      (weights.mastery || this.weights.mastery) * masteryScore +
      (weights.recency || this.weights.recency) * recencyScore;

    return {
      score: finalScore,
      breakdown: {
        errorScore,
        attemptScore,
        helpScore,
        engagementScore,
        responseTimeScore,
        completionScore,
        masteryScore,
        recencyScore,
        normalizedFactors: {
          errorScore,
          attemptScore,
          helpScore,
          engagementScore,
          responseTimeScore,
          completionScore,
          masteryScore,
          recencyScore,
        },
      },
    };
  }

  /**
   * GENERALIZATION scoring: prioritizes sufficient prior evidence + mastery
   * Higher score = stronger candidate for generalization review
   */
  private calculateGeneralizationScore(
    evidence: SkillEvidence,
    masteryProbability: number,
    scoringConfig: ScoringConfiguration,
  ): { score: number; breakdown: ScoringBreakdown } {
    // For GENERALIZATION: errors are secondary (already mastered)
    const errorScore = 0.1; // Low weight for generalization

    // For GENERALIZATION: attempts indicate prior exposure (positive)
    const attemptScore = this.normalizeGeneralizationAttemptScore(evidence.totalAttempts);

    // For GENERALIZATION: hints are secondary
    const helpScore = 0.1; // Low weight for generalization

    // For GENERALIZATION: engagement is secondary
    const engagementScore = 0.2; // Low weight for generalization

    // For GENERALIZATION: response time is secondary
    const responseTimeScore = 0.2; // Low weight for generalization

    // For GENERALIZATION: completion indicates prior success
    const completionScore = this.normalizeGeneralizationCompletionScore(evidence.completedActivities, evidence.presentedActivities);

    // For GENERALIZATION: HIGH mastery = higher priority (ready to generalize)
    const masteryScore = this.normalizeGeneralizationMasteryScore(masteryProbability);

    // For GENERALIZATION: recency is secondary (mastery is stable)
    const recencyScore = 0.2; // Low weight for generalization

    const weights = scoringConfig.weights;
    const finalScore =
      (weights.error || this.weights.error) * errorScore +
      (weights.attempts || this.weights.attempts) * attemptScore +
      (weights.help || this.weights.help) * helpScore +
      (weights.engagement || this.weights.engagement) * engagementScore +
      (weights.responseTime || this.weights.responseTime) * responseTimeScore +
      (weights.completion || this.weights.completion) * completionScore +
      (weights.mastery || this.weights.mastery) * masteryScore +
      (weights.recency || this.weights.recency) * recencyScore;

    return {
      score: finalScore,
      breakdown: {
        errorScore,
        attemptScore,
        helpScore,
        engagementScore,
        responseTimeScore,
        completionScore,
        masteryScore,
        recencyScore,
        normalizedFactors: {
          errorScore,
          attemptScore,
          helpScore,
          engagementScore,
          responseTimeScore,
          completionScore,
          masteryScore,
          recencyScore,
        },
      },
    };
  }

  /**
   * Determine review type based on mastery and evidence
   */
  private determineReviewType(masteryProbability: number, evidence: SkillEvidence): ReviewType {
    // REMEDIATION: low mastery or recent errors
    if (masteryProbability < 0.5 || evidence.accuracy < 0.7) {
      return ReviewType.REMEDIATION;
    }

    // GENERALIZATION: high accuracy, sufficient exposure
    if (evidence.accuracy > 0.8 && evidence.totalAttempts >= this.minAttemptsForGeneralization) {
      return ReviewType.GENERALIZATION;
    }

    // RETENTION: mastered but not seen recently
    return ReviewType.RETENTION;
  }

  // ============================================================================
  // REMEDIATION-SPECIFIC NORMALIZATION FUNCTIONS
  // ============================================================================

  /**
   * REMEDIATION: More attempts = higher priority (indicates struggle)
   * Normalized: 0 (few attempts) → 1 (many attempts)
   */
  private normalizeRemediationAttemptScore(totalAttempts: number): number {
    return Math.min(totalAttempts / this.maxExpectedAttempts, 1);
  }

  /**
   * REMEDIATION: More hints = higher priority (indicates need for help)
   * Normalized: 0 (no hints) → 1 (many hints)
   */
  private normalizeRemediationHelpScore(totalHints: number): number {
    return Math.min(totalHints / this.maxExpectedHints, 1);
  }

  /**
   * REMEDIATION: More skips/abandonment = higher priority
   * Normalized: 0 (engaged) → 1 (frequent skips/changes)
   */
  private normalizeRemediationEngagementScore(skipCount: number, changeRequestCount: number, totalExposures: number): number {
    if (totalExposures === 0) return 0.5; // Neutral if no data
    const disengagementCount = skipCount + changeRequestCount;
    return Math.min(disengagementCount / totalExposures, 1);
  }

  /**
   * REMEDIATION: Non-completion = higher priority
   * Normalized: 0 (all completed) → 1 (many abandoned)
   */
  private normalizeRemediationCompletionScore(completedActivities: number, presentedActivities: number): number {
    if (presentedActivities === 0) return 0.5; // Neutral if no data
    const abandonmentRate = 1 - completedActivities / presentedActivities;
    return abandonmentRate;
  }

  /**
   * REMEDIATION: Lower mastery = higher priority
   * Normalized: 0 (high mastery) → 1 (low mastery)
   */
  private normalizeRemediationMasteryScore(masteryProbability: number): number {
    return 1 - masteryProbability;
  }

  /**
   * REMEDIATION: Recent errors = higher priority (not decay)
   * Normalized: 0 (old errors) → 1 (recent errors)
   * Inverse of retention decay
   */
  private normalizeRemediationRecencyScore(daysSinceLastExposure: number, lastExposureAt: Date | null): number {
    if (lastExposureAt === null || daysSinceLastExposure <= 0) return 0;
    // Inverse of exponential decay: recent = high score
    return 1 - Math.exp(-daysSinceLastExposure / this.retentionHalfLifeDays);
  }

  // ============================================================================
  // RETENTION-SPECIFIC NORMALIZATION FUNCTIONS
  // ============================================================================

  /**
   * RETENTION: High mastery = higher priority (previously mastered)
   * Normalized: 0 (low mastery) → 1 (high mastery)
   */
  private normalizeRetentionMasteryScore(masteryProbability: number): number {
    return masteryProbability;
  }

  // ============================================================================
  // GENERALIZATION-SPECIFIC NORMALIZATION FUNCTIONS
  // ============================================================================

  /**
   * GENERALIZATION: More attempts = higher priority (indicates prior exposure)
   * Normalized: 0 (few attempts) → 1 (many attempts)
   */
  private normalizeGeneralizationAttemptScore(totalAttempts: number): number {
    return Math.min(totalAttempts / this.minAttemptsForGeneralization, 1);
  }

  /**
   * GENERALIZATION: High completion = higher priority (indicates prior success)
   * Normalized: 0 (many abandoned) → 1 (all completed)
   */
  private normalizeGeneralizationCompletionScore(completedActivities: number, presentedActivities: number): number {
    if (presentedActivities === 0) return 0.5; // Neutral if no data
    return completedActivities / presentedActivities;
  }

  /**
   * GENERALIZATION: High mastery = higher priority (ready to generalize)
   * Normalized: 0 (low mastery) → 1 (high mastery)
   */
  private normalizeGeneralizationMasteryScore(masteryProbability: number): number {
    return masteryProbability;
  }

  // ============================================================================
  // SHARED NORMALIZATION FUNCTIONS
  // ============================================================================

  /**
   * CRITICAL: Error frequency score (used by all types)
   * Normalized: 0 (all correct) → 1 (all incorrect)
   */
  private normalizeErrorScore(totalAttempts: number, incorrectAttempts: number): number {
    if (totalAttempts === 0) return 0;
    return Math.min(incorrectAttempts / totalAttempts, 1);
  }

  /**
   * Recency/retention score (used by RETENTION and GENERALIZATION)
   * Exponential decay: skills not seen recently score higher
   * Normalized: 0 (seen today) → 1 (not seen in 30+ days)
   */
  private normalizeRecencyScore(daysSinceLastExposure: number): number {
    if (daysSinceLastExposure <= 0) return 0;
    return Math.exp(-daysSinceLastExposure / this.retentionHalfLifeDays);
  }

  /**
   * Get current scoring configuration (versioned)
   */
  private getCurrentScoringConfiguration(): ScoringConfiguration {
    return {
      version: 'review-priority-score/1.0.0',
      weights: this.weights,
      thresholds: {
        slowResponseThresholdMs: this.slowResponseThresholdMs,
        maxExpectedAttempts: this.maxExpectedAttempts,
        maxExpectedHints: this.maxExpectedHints,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get baseline evidence for a skill
   */
  private async getSkillEvidence(studentId: string, skillId: string, lookbackDays: number): Promise<SkillEvidence> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    const events = await this.eventRepository.find({
      where: {
        studentId,
        bnccSkillId: skillId,
      },
      order: { timestamp: 'DESC' },
    });

    // Filter by lookback window
    const relevantEvents = events.filter((e) => e.timestamp >= cutoffDate);

    const lastExposureAt = relevantEvents.length > 0 ? relevantEvents[0].timestamp : null;
    const daysSinceLastExposure = lastExposureAt
      ? Math.floor((Date.now() - lastExposureAt.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Calculate metrics
    const submittedEvents = relevantEvents.filter((e) => e.eventType === LearningEventType.ANSWER_SUBMITTED);
    const incorrectCount = submittedEvents.filter((e) => e.correct === false).length;
    const correctCount = submittedEvents.filter((e) => e.correct === true).length;
    const totalAttempts = submittedEvents.length;
    const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;

    const hintsEvents = relevantEvents.filter((e) => e.eventType === LearningEventType.HINT_REQUESTED);
    const totalHints = hintsEvents.reduce((sum, e) => sum + (e.hintsUsed || 0), 0);

    const responseTimes = submittedEvents
      .map((e) => e.responseTimeMs)
      .filter((rt): rt is number => rt !== null && rt !== undefined)
      .sort((a, b) => a - b);
    const medianResponseTimeMs = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0;

    const skipCount = relevantEvents.filter((e) => e.eventType === LearningEventType.ACTIVITY_SKIPPED).length;
    const changeRequestCount = relevantEvents.filter((e) => e.eventType === LearningEventType.ACTIVITY_ABANDONED).length;
    const presentedCount = relevantEvents.filter((e) => e.eventType === LearningEventType.ACTIVITY_PRESENTED).length;
    const completedCount = relevantEvents.filter((e) => e.eventType === LearningEventType.ACTIVITY_COMPLETED).length;

    const sourceInteractionIds = submittedEvents.map((e) => e.id);

    return {
      totalAttempts,
      accuracy,
      incorrectAttempts: incorrectCount,
      totalHints,
      medianResponseTimeMs,
      lastExposureAt,
      daysSinceLastExposure,
      skipCount,
      changeRequestCount,
      totalExposures: presentedCount,
      completedActivities: completedCount,
      presentedActivities: presentedCount,
      sourceInteractionIds,
      baselineState: {
        masteryBefore: 0, // Will be set by caller
        difficultyBefore: 'unknown',
        lastExposureAt,
        daysSinceLastExposure,
        previousAttempts: totalAttempts,
        previousAccuracy: accuracy,
        previousHintUsage: totalHints,
        previousResponseTimeMs: medianResponseTimeMs,
      },
    };
  }
}

interface SkillEvidence {
  totalAttempts: number;
  accuracy: number;
  incorrectAttempts: number;
  totalHints: number;
  medianResponseTimeMs: number;
  lastExposureAt: Date | null;
  daysSinceLastExposure: number;
  skipCount: number;
  changeRequestCount: number;
  totalExposures: number;
  completedActivities: number;
  presentedActivities: number;
  sourceInteractionIds: string[];
  baselineState: BaselineState;
}
