import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewAssignment, ReviewType } from '../entities/review-assignment.entity';
import { ReviewOutcome, ProgressionClassification, PerformanceMetrics, PerformanceDelta, NormalizedDeltas, LongitudinalMetadata } from '../entities/review-outcome.entity';
import { LearningEvent, LearningEventType } from '../entities/learning-event.entity';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { ExercisePerformance } from '../entities/exercise-performance.entity';

export interface LongitudinalComparisonInput {
  reviewAssignmentId: string;
  reviewInteractionId: string;
  reviewRecommendationId: string;
  masteryAfter: number;
}

export interface EvidenceSufficiency {
  level: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';
  missingElements: string[];
  confidence: number; // 0-1
}

@Injectable()
export class LongitudinalComparisonService {
  private readonly logger = new Logger(LongitudinalComparisonService.name);

  constructor(
    @InjectRepository(ReviewAssignment)
    private readonly reviewAssignmentRepository: Repository<ReviewAssignment>,
    @InjectRepository(ReviewOutcome)
    private readonly reviewOutcomeRepository: Repository<ReviewOutcome>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(StudentSkillState)
    private readonly skillStateRepository: Repository<StudentSkillState>,
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
  ) {}

  /**
   * Create longitudinal comparison between baseline and review evidence
   */
  async createLongitudinalComparison(input: LongitudinalComparisonInput): Promise<ReviewOutcome> {
    // Step 1: Resolve ReviewAssignment
    const assignment = await this.reviewAssignmentRepository.findOne({
      where: { id: input.reviewAssignmentId },
    });

    if (!assignment) {
      throw new Error(`ReviewAssignment ${input.reviewAssignmentId} not found`);
    }

    // Step 2: Resolve baseline evidence
    const baselineMetrics = await this.resolveBaselineMetrics(assignment);

    if (!baselineMetrics) {
      throw new Error(`Cannot resolve baseline metrics for assignment ${input.reviewAssignmentId}`);
    }

    // Step 3: Resolve review evidence
    const reviewMetrics = await this.resolveReviewMetrics(input.reviewInteractionId, assignment.skillId);

    if (!reviewMetrics) {
      throw new Error(`Cannot resolve review metrics for interaction ${input.reviewInteractionId}`);
    }

    // Step 4: Calculate raw deltas
    const deltas = this.calculateDeltas(baselineMetrics, reviewMetrics);

    // Step 5: Calculate normalized deltas
    const normalizedDeltas = this.normalizeDeltas(deltas, baselineMetrics, reviewMetrics);

    // Step 6: Get mastery before
    const masteryBefore = assignment.baselineState.masteryBefore;
    const masteryAfter = input.masteryAfter;
    const masteryDelta = masteryAfter - masteryBefore;

    // Step 7: Calculate days since baseline
    const baselineEvent = await this.eventRepository.findOne({
      where: { id: assignment.sourceInteractionIds[0] },
    });

    const daysSinceBaseline = baselineEvent
      ? Math.floor((Date.now() - baselineEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Step 8: Determine instance comparison
    const instanceComparison = this.determineInstanceComparison(assignment);

    // Step 9: Determine difficulty comparison
    const difficultyComparison = this.determineDifficultyComparison(baselineMetrics, reviewMetrics);

    // Step 10: Check evidence sufficiency
    const sufficiency = this.checkEvidenceSufficiency(baselineMetrics, reviewMetrics);

    // Step 11: Classify progression (conservative)
    const { classification, reason, signals } = this.classifyProgression(
      deltas,
      normalizedDeltas,
      masteryDelta,
      instanceComparison,
      difficultyComparison,
      sufficiency,
    );

    // Step 12: Build metadata
    const metadata: LongitudinalMetadata = {
      instanceComparison,
      difficultyComparison,
      conceptCoverage: [], // TODO: extract from activity ontology
      conceptsNewInReview: [],
      daysSinceBaseline,
      sameTemplate: assignment.selectedActivityTemplateId === (baselineEvent as any)?.activityId,
      sameInstance: assignment.selectedActivityInstanceId === (baselineEvent as any)?.activityId,
      reviewType: assignment.reviewType,
    };

    // Step 13: Persist ReviewOutcome
    const outcome = this.reviewOutcomeRepository.create({
      reviewAssignmentId: assignment.id,
      studentId: assignment.studentId,
      skillId: assignment.skillId,
      reviewInteractionId: input.reviewInteractionId,
      reviewRecommendationId: input.reviewRecommendationId,
      baselineMetrics,
      reviewMetrics,
      deltas,
      normalizedDeltas,
      progressionClassification: classification,
      classificationReason: reason,
      evidenceSignals: signals,
      metadata,
    });

    return this.reviewOutcomeRepository.save(outcome);
  }

  /**
   * Resolve baseline metrics from ReviewAssignment source evidence
   */
  private async resolveBaselineMetrics(assignment: ReviewAssignment): Promise<PerformanceMetrics | null> {
    if (assignment.sourceInteractionIds.length === 0) {
      return null;
    }

    // Get the most recent baseline interaction
    const baselineEvent = await this.eventRepository.findOne({
      where: { id: assignment.sourceInteractionIds[0] },
    });

    if (!baselineEvent) {
      return null;
    }

    // Use baseline state from assignment
    return {
      accuracy: assignment.baselineState.previousAccuracy,
      averageResponseTimeMs: assignment.baselineState.previousResponseTimeMs || 0,
      averageAttempts: assignment.baselineState.previousAttempts || 1,
      hintsUsed: assignment.baselineState.previousHintUsage || 0,
      masteryProbability: assignment.baselineState.masteryBefore,
      difficultyLevel: assignment.baselineState.difficultyBefore,
    };
  }

  /**
   * Resolve review metrics from review interaction
   */
  private async resolveReviewMetrics(reviewInteractionId: string, skillId: string): Promise<PerformanceMetrics | null> {
    const reviewEvent = await this.eventRepository.findOne({
      where: { id: reviewInteractionId },
    });

    if (!reviewEvent) {
      return null;
    }

    // Get current mastery (will be updated by BKT before this is called)
    const skillState = await this.skillStateRepository.findOne({
      where: { studentId: reviewEvent.studentId, skillId },
    });

    return {
      accuracy: reviewEvent.correct ? 1 : 0,
      averageResponseTimeMs: reviewEvent.responseTimeMs || 0,
      averageAttempts: 1, // Single interaction
      hintsUsed: reviewEvent.hintsUsed || 0,
      masteryProbability: skillState?.masteryProbability || 0.5,
      difficultyLevel: (reviewEvent as any).difficulty || 'medium',
    };
  }

  /**
   * Calculate raw deltas (review - baseline)
   */
  private calculateDeltas(baseline: PerformanceMetrics, review: PerformanceMetrics): PerformanceDelta {
    return {
      accuracyDelta: review.accuracy - baseline.accuracy,
      responseTimeDelta: review.averageResponseTimeMs - baseline.averageResponseTimeMs,
      attemptsDelta: review.averageAttempts - baseline.averageAttempts,
      hintsDelta: review.hintsUsed - baseline.hintsUsed,
      masteryDelta: review.masteryProbability - baseline.masteryProbability,
    };
  }

  /**
   * Normalize deltas to [-1, +1] scale
   */
  private normalizeDeltas(deltas: PerformanceDelta, baseline: PerformanceMetrics, review: PerformanceMetrics): NormalizedDeltas {
    // Accuracy delta: already in [-1, +1]
    const accuracyDeltaNormalized = deltas.accuracyDelta;

    // Response time delta: normalize to [-1, +1]
    // Positive = faster (improvement), Negative = slower (potential regression)
    const maxResponseTime = Math.max(baseline.averageResponseTimeMs, review.averageResponseTimeMs, 1);
    const responseTimeDeltaNormalized = -deltas.responseTimeDelta / maxResponseTime;

    // Attempts delta: normalize to [-1, +1]
    // Positive = fewer attempts (improvement), Negative = more attempts (potential regression)
    const maxAttempts = Math.max(baseline.averageAttempts, review.averageAttempts, 1);
    const attemptsDeltaNormalized = -deltas.attemptsDelta / maxAttempts;

    // Hints delta: normalize to [-1, +1]
    // Positive = fewer hints (improvement), Negative = more hints (potential regression)
    const maxHints = Math.max(baseline.hintsUsed, review.hintsUsed, 1);
    const hintsDeltaNormalized = -deltas.hintsDelta / maxHints;

    // Mastery delta: already in [-1, +1]
    const masteryDeltaNormalized = deltas.masteryDelta;

    return {
      accuracyDeltaNormalized,
      responseTimeDeltaNormalized,
      attemptsDeltaNormalized,
      hintsDeltaNormalized,
      masteryDeltaNormalized,
    };
  }

  /**
   * Determine instance comparison type
   */
  private determineInstanceComparison(
    assignment: ReviewAssignment,
  ): 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' {
    // For now, default to EQUIVALENT_INSTANCE
    // In future, would check activity metadata for parametric differences
    return 'EQUIVALENT_INSTANCE';
  }

  /**
   * Determine difficulty comparison
   */
  private determineDifficultyComparison(baseline: PerformanceMetrics, review: PerformanceMetrics): 'same' | 'harder' | 'easier' {
    const difficultyOrder = { very_easy: 0, easy: 1, medium: 2, hard: 3, extreme: 4 };
    const baselineDiff = difficultyOrder[baseline.difficultyLevel as keyof typeof difficultyOrder] ?? 2;
    const reviewDiff = difficultyOrder[review.difficultyLevel as keyof typeof difficultyOrder] ?? 2;

    if (reviewDiff > baselineDiff) return 'harder';
    if (reviewDiff < baselineDiff) return 'easier';
    return 'same';
  }

  /**
   * Check evidence sufficiency
   */
  private checkEvidenceSufficiency(baseline: PerformanceMetrics, review: PerformanceMetrics): EvidenceSufficiency {
    const missingElements: string[] = [];
    let confidence = 1.0;

    if (!baseline.averageResponseTimeMs) {
      missingElements.push('baseline_response_time');
      confidence -= 0.1;
    }

    if (!review.averageResponseTimeMs) {
      missingElements.push('review_response_time');
      confidence -= 0.1;
    }

    if (baseline.averageAttempts === 0) {
      missingElements.push('baseline_attempts');
      confidence -= 0.15;
    }

    if (review.averageAttempts === 0) {
      missingElements.push('review_attempts');
      confidence -= 0.15;
    }

    const level = missingElements.length === 0 ? 'SUFFICIENT' : missingElements.length <= 2 ? 'PARTIAL' : 'INSUFFICIENT';

    return { level, missingElements, confidence: Math.max(confidence, 0) };
  }

  /**
   * Classify progression conservatively
   */
  private classifyProgression(
    deltas: PerformanceDelta,
    normalizedDeltas: NormalizedDeltas,
    masteryDelta: number,
    instanceComparison: string,
    difficultyComparison: string,
    sufficiency: EvidenceSufficiency,
  ): { classification: ProgressionClassification; reason: string; signals: string[] } {
    const signals: string[] = [];

    // Insufficient evidence
    if (sufficiency.level === 'INSUFFICIENT') {
      return {
        classification: ProgressionClassification.INCONCLUSIVE,
        reason: `Insufficient evidence: ${sufficiency.missingElements.join(', ')}`,
        signals: [`insufficient_evidence: ${sufficiency.missingElements.join(',')}`],
      };
    }

    // Collect evidence signals
    const accuracyImproved = deltas.accuracyDelta > 0;
    const attemptsReduced = deltas.attemptsDelta < 0;
    const hintsReduced = deltas.hintsDelta < 0;
    const responseTimeFaster = deltas.responseTimeDelta < 0;
    const masteryIncreased = masteryDelta > 0;

    if (accuracyImproved) signals.push('accuracy_improved');
    if (attemptsReduced) signals.push('attempts_reduced');
    if (hintsReduced) signals.push('hints_reduced');
    if (responseTimeFaster) signals.push('response_time_faster');
    if (masteryIncreased) signals.push('mastery_increased');

    // IMPROVED: multiple positive signals at comparable difficulty
    if (difficultyComparison === 'same' || difficultyComparison === 'easier') {
      const positiveSignals = [accuracyImproved, attemptsReduced, hintsReduced].filter(Boolean).length;

      if (positiveSignals >= 2 && !responseTimeFaster) {
        // Multiple improvements without relying on speed
        return {
          classification: ProgressionClassification.IMPROVED,
          reason: `Multiple improvements observed: ${signals.join(', ')}`,
          signals,
        };
      }

      if (accuracyImproved && (attemptsReduced || hintsReduced)) {
        // Accuracy up + efficiency up
        return {
          classification: ProgressionClassification.IMPROVED,
          reason: `Accuracy improved with reduced attempts/hints`,
          signals,
        };
      }
    }

    // IMPROVED: comparable performance at higher difficulty
    if (difficultyComparison === 'harder' && deltas.accuracyDelta >= 0) {
      signals.push('comparable_performance_at_higher_difficulty');
      return {
        classification: ProgressionClassification.IMPROVED,
        reason: `Maintained or improved performance at higher difficulty`,
        signals,
      };
    }

    // NEEDS_SUPPORT: accuracy decreased significantly
    if (deltas.accuracyDelta < -0.3) {
      signals.push('accuracy_decreased_significantly');
      return {
        classification: ProgressionClassification.NEEDS_SUPPORT,
        reason: `Accuracy decreased significantly`,
        signals,
      };
    }

    // NEEDS_SUPPORT: many more attempts or hints
    if (deltas.attemptsDelta > 2 || deltas.hintsDelta > 3) {
      signals.push('increased_help_dependency');
      return {
        classification: ProgressionClassification.NEEDS_SUPPORT,
        reason: `Increased attempts or hints required`,
        signals,
      };
    }

    // STABLE: minimal changes
    if (Math.abs(deltas.accuracyDelta) < 0.2 && Math.abs(deltas.attemptsDelta) < 1 && Math.abs(deltas.hintsDelta) < 1) {
      signals.push('minimal_changes');
      return {
        classification: ProgressionClassification.STABLE,
        reason: `Stable performance with minimal changes`,
        signals,
      };
    }

    // INCONCLUSIVE: contradictory evidence
    const contradictions: string[] = [];
    if (accuracyImproved && responseTimeFaster && deltas.responseTimeDelta > 1000) {
      // Faster but much slower is contradictory
      contradictions.push('response_time_contradiction');
    }

    if (deltas.accuracyDelta < 0 && responseTimeFaster) {
      contradictions.push('accuracy_vs_speed_contradiction');
    }

    if (contradictions.length > 0) {
      return {
        classification: ProgressionClassification.INCONCLUSIVE,
        reason: `Contradictory evidence: ${contradictions.join(', ')}`,
        signals: [...signals, ...contradictions],
      };
    }

    // Default: INCONCLUSIVE
    return {
      classification: ProgressionClassification.INCONCLUSIVE,
      reason: `Insufficient clear evidence for classification`,
      signals,
    };
  }
}
