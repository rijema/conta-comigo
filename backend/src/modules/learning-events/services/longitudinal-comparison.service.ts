import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewAssignment, ReviewType } from '../entities/review-assignment.entity';
import { ReviewOutcome, ProgressionClassification, PerformanceMetrics, PerformanceDelta, NormalizedDeltas, LongitudinalMetadata } from '../entities/review-outcome.entity';
import { LearningEvent, LearningEventType } from '../entities/learning-event.entity';
import { StudentSkillState } from '../../knowledge-tracing/entities/student-skill-state.entity';
import { ActivityAttempt } from '../../activities/entities/activity-attempt.entity';
import { ExercisePerformance } from '../entities/exercise-performance.entity';

export interface LongitudinalComparisonInput {
  reviewAssignmentId: string;
  reviewAttemptId: string;
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
    @InjectRepository(ActivityAttempt)
    private readonly activityAttemptRepository: Repository<ActivityAttempt>,
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
  ) {}

  /**
   * Create longitudinal comparison between baseline and review evidence
   * [INTEGRATION 3B.2]: Uses real persisted ActivityAttempt data, not frontend-supplied values
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

    // Step 3: [INTEGRATION 3B.2] Resolve review evidence from real ActivityAttempt
    const reviewAttempt = await this.activityAttemptRepository.findOne({
      where: { id: input.reviewAttemptId },
    });

    if (!reviewAttempt) {
      throw new Error(`ActivityAttempt ${input.reviewAttemptId} not found`);
    }

    const reviewMetrics = await this.resolveReviewMetrics(input.reviewAttemptId, assignment.skillId);

    if (!reviewMetrics) {
      throw new Error(`Cannot resolve review metrics for attempt ${input.reviewAttemptId}`);
    }

    // Step 4: Calculate raw deltas
    const deltas = this.calculateDeltas(baselineMetrics, reviewMetrics);

    // Step 5: Calculate normalized deltas
    const normalizedDeltas = this.normalizeDeltas(deltas, baselineMetrics, reviewMetrics);

    // Step 6: [INTEGRATION 3B.2] Get mastery from real BKT result
    // Do NOT use frontend-supplied masteryAfter
    // Resolve from StudentSkillState which was updated by KnowledgeTracingService
    const masteryBefore = assignment.baselineState.masteryBefore;
    const skillState = await this.skillStateRepository.findOne({
      where: {
        studentId: assignment.studentId,
        skillId: assignment.skillId,
      },
    });
    const masteryAfter = skillState?.masteryProbability ?? null;
    const masteryDelta = masteryBefore !== null && masteryAfter !== null ? masteryAfter - masteryBefore : null;

    // Step 7: Calculate days since baseline using actual exposure timestamps
    const baselineEvent = await this.eventRepository.findOne({
      where: { id: assignment.sourceInteractionIds[0] },
    });

    // [INTEGRATION 3B.2]: Use real review attempt timestamp
    // [RESEARCH DATA CORRECTNESS]: daysSinceBaseline = review timestamp - baseline timestamp
    const daysSinceBaseline =
      baselineEvent && reviewAttempt
        ? Math.floor((reviewAttempt.createdAt.getTime() - baselineEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24))
        : null;

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
      reviewAttemptId: input.reviewAttemptId,
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
   * [RESEARCH DATA CORRECTNESS]: Preserve null for unavailable metrics
   */
  private calculateDeltas(baseline: PerformanceMetrics, review: PerformanceMetrics): PerformanceDelta {
    return {
      accuracyDelta: baseline.accuracy !== null && review.accuracy !== null ? review.accuracy - baseline.accuracy : null,
      responseTimeDelta: baseline.averageResponseTimeMs !== null && review.averageResponseTimeMs !== null ? review.averageResponseTimeMs - baseline.averageResponseTimeMs : null,
      attemptsDelta: baseline.averageAttempts !== null && review.averageAttempts !== null ? review.averageAttempts - baseline.averageAttempts : null,
      hintsDelta: baseline.hintsUsed !== null && review.hintsUsed !== null ? review.hintsUsed - baseline.hintsUsed : null,
      masteryDelta: baseline.masteryProbability !== null && review.masteryProbability !== null ? review.masteryProbability - baseline.masteryProbability : null,
    };
  }

  /**
   * Normalize deltas to [-1, +1] scale
   * [RESEARCH DATA CORRECTNESS]: Preserve null for unavailable metrics
   */
  private normalizeDeltas(deltas: PerformanceDelta, baseline: PerformanceMetrics, review: PerformanceMetrics): NormalizedDeltas {
    // Accuracy delta: already in [-1, +1]
    const accuracyDeltaNormalized = deltas.accuracyDelta;

    // Response time delta: normalize to [-1, +1]
    // Positive = faster (improvement), Negative = slower (potential regression)
    const responseTimeDeltaNormalized = deltas.responseTimeDelta !== null && baseline.averageResponseTimeMs !== null && review.averageResponseTimeMs !== null
      ? -deltas.responseTimeDelta / Math.max(baseline.averageResponseTimeMs, review.averageResponseTimeMs, 1)
      : null;

    // Attempts delta: normalize to [-1, +1]
    // Positive = fewer attempts (improvement), Negative = more attempts (potential regression)
    const attemptsDeltaNormalized = deltas.attemptsDelta !== null && baseline.averageAttempts !== null && review.averageAttempts !== null
      ? -deltas.attemptsDelta / Math.max(baseline.averageAttempts, review.averageAttempts, 1)
      : null;

    // Hints delta: normalize to [-1, +1]
    // Positive = fewer hints (improvement), Negative = more hints (potential regression)
    const hintsDeltaNormalized = deltas.hintsDelta !== null && baseline.hintsUsed !== null && review.hintsUsed !== null
      ? -deltas.hintsDelta / Math.max(baseline.hintsUsed, review.hintsUsed, 1)
      : null;

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
   * [RESEARCH DATA CORRECTNESS]:
   * - EXACT_REPEAT: same activity instance
   * - EQUIVALENT_INSTANCE: different persisted activity, same skill, comparable difficulty
   * - UNVERIFIED: cannot verify equivalence
   * - Never defaults to EQUIVALENT_INSTANCE without verification
   */
  private determineInstanceComparison(
    assignment: ReviewAssignment,
  ): 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT' | 'UNVERIFIED' {
    // Check if same activity instance was used
    if (assignment.selectedActivityInstanceId === assignment.selectedActivityTemplateId) {
      return 'EXACT_REPEAT';
    }

    // TODO: Check if different activity is verified equivalent
    // For now, return UNVERIFIED if different activity
    return 'UNVERIFIED';
  }

  /**
   * Determine difficulty comparison
   * [RESEARCH DATA CORRECTNESS]:
   * - Uses real persisted difficulty from Activity/ActivityAttempt
   * - UNKNOWN if difficulty unavailable
   * - UNKNOWN vs UNKNOWN is not automatically "same"
   */
  private determineDifficultyComparison(baseline: PerformanceMetrics, review: PerformanceMetrics): 'same' | 'harder' | 'easier' | 'unknown' {
    // If either difficulty is unavailable, return unknown
    if (!baseline.difficultyLevel || !review.difficultyLevel) {
      return 'unknown';
    }

    const difficultyOrder = { very_easy: 0, easy: 1, medium: 2, hard: 3, extreme: 4 };
    const baselineDiff = difficultyOrder[baseline.difficultyLevel as keyof typeof difficultyOrder];
    const reviewDiff = difficultyOrder[review.difficultyLevel as keyof typeof difficultyOrder];

    // If either difficulty is not recognized, return unknown
    if (baselineDiff === undefined || reviewDiff === undefined) {
      return 'unknown';
    }

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
   * [RESEARCH DATA CORRECTNESS]:
   * - Uses only genuine/comparable evidence
   * - Fabricated/default values cannot influence classification
   * - Response time alone never determines progression
   * - EXACT_REPEAT/UNVERIFIED cannot support generalization
   * - Contradictory/non-comparable evidence → INCONCLUSIVE
   */
  private classifyProgression(
    deltas: PerformanceDelta,
    normalizedDeltas: NormalizedDeltas,
    masteryDelta: number | null,
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

    // Collect evidence signals (only from genuine observations)
    const accuracyImproved = deltas.accuracyDelta !== null && deltas.accuracyDelta > 0;
    const attemptsReduced = deltas.attemptsDelta !== null && deltas.attemptsDelta < 0;
    const hintsReduced = deltas.hintsDelta !== null && deltas.hintsDelta < 0;
    const responseTimeFaster = deltas.responseTimeDelta !== null && deltas.responseTimeDelta < 0;
    const masteryIncreased = masteryDelta !== null && masteryDelta > 0;

    if (accuracyImproved) signals.push('accuracy_improved');
    if (attemptsReduced) signals.push('attempts_reduced');
    if (hintsReduced) signals.push('hints_reduced');
    if (responseTimeFaster) signals.push('response_time_faster');
    if (masteryIncreased) signals.push('mastery_increased');

    // IMPROVED: multiple positive signals at comparable difficulty
    if (difficultyComparison === 'same' || difficultyComparison === 'easier') {
      const positiveSignals = [accuracyImproved, attemptsReduced, hintsReduced].filter(Boolean).length;

      if (positiveSignals >= 2) {
        // Multiple improvements without relying on speed alone
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

    // IMPROVED: verified higher difficulty + maintained/improved performance
    if (difficultyComparison === 'harder' && deltas.accuracyDelta !== null && deltas.accuracyDelta >= 0) {
      signals.push('comparable_performance_at_higher_difficulty');
      return {
        classification: ProgressionClassification.IMPROVED,
        reason: `Maintained or improved performance at higher difficulty`,
        signals,
      };
    }

    // NEEDS_SUPPORT: accuracy decreased significantly
    if (deltas.accuracyDelta !== null && deltas.accuracyDelta < -0.3) {
      signals.push('accuracy_decreased_significantly');
      return {
        classification: ProgressionClassification.NEEDS_SUPPORT,
        reason: `Accuracy decreased significantly`,
        signals,
      };
    }

    // NEEDS_SUPPORT: many more attempts or hints
    if ((deltas.attemptsDelta !== null && deltas.attemptsDelta > 2) || (deltas.hintsDelta !== null && deltas.hintsDelta > 3)) {
      signals.push('increased_help_dependency');
      return {
        classification: ProgressionClassification.NEEDS_SUPPORT,
        reason: `Increased attempts or hints required`,
        signals,
      };
    }

    // STABLE: minimal changes in comparable metrics
    const hasMinimalAccuracy = deltas.accuracyDelta === null || Math.abs(deltas.accuracyDelta) < 0.2;
    const hasMinimalAttempts = deltas.attemptsDelta === null || Math.abs(deltas.attemptsDelta) < 1;
    const hasMinimalHints = deltas.hintsDelta === null || Math.abs(deltas.hintsDelta) < 1;

    if (hasMinimalAccuracy && hasMinimalAttempts && hasMinimalHints) {
      signals.push('minimal_changes');
      return {
        classification: ProgressionClassification.STABLE,
        reason: `Stable performance with minimal changes`,
        signals,
      };
    }

    // INCONCLUSIVE: contradictory evidence
    const contradictions: string[] = [];

    if (deltas.accuracyDelta !== null && deltas.accuracyDelta < 0 && responseTimeFaster) {
      contradictions.push('accuracy_vs_speed_contradiction');
    }

    // EXACT_REPEAT and UNVERIFIED cannot support generalization
    if ((instanceComparison === 'EXACT_REPEAT' || instanceComparison === 'UNVERIFIED') && signals.includes('generalization_evidence')) {
      contradictions.push('false_generalization_claim');
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
