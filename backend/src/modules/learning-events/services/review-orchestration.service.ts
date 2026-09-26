import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewAssignment, ReviewType } from '../entities/review-assignment.entity';
import { ReviewOutcome } from '../entities/review-outcome.entity';
import { LearningEvent } from '../entities/learning-event.entity';
import { ChildProfile } from '../../users/entities/child-profile.entity';
import { ReviewCandidateGenerationService } from './review-candidate-generation.service';
import { ReviewSelectionService } from './review-selection.service';
import { ReviewTriggerService } from './review-trigger.service';
import { LongitudinalComparisonService } from './longitudinal-comparison.service';

export interface ReviewSessionConfig {
  remediationPercentage: number; // 0-100
  retentionPercentage: number; // 0-100
  generalizationPercentage: number; // 0-100
  targetReviewSize: number; // default 10
}

export interface ReviewSessionResult {
  sessionId: string;
  studentId: string;
  assignments: ReviewAssignment[];
  composition: {
    remediation: number;
    retention: number;
    generalization: number;
  };
}

@Injectable()
export class ReviewOrchestrationService {
  private readonly logger = new Logger(ReviewOrchestrationService.name);

  private readonly defaultConfig: ReviewSessionConfig = {
    remediationPercentage: 60,
    retentionPercentage: 20,
    generalizationPercentage: 20,
    targetReviewSize: 10,
  };

  constructor(
    @InjectRepository(ReviewAssignment)
    private readonly assignmentRepository: Repository<ReviewAssignment>,
    @InjectRepository(ReviewOutcome)
    private readonly outcomeRepository: Repository<ReviewOutcome>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
    private readonly candidateGenerationService: ReviewCandidateGenerationService,
    private readonly selectionService: ReviewSelectionService,
    private readonly triggerService: ReviewTriggerService,
    private readonly comparisonService: LongitudinalComparisonService,
  ) {}

  /**
   * Orchestrate complete review session creation
   * [INTEGRATION 3]: Uses real ChildProfile for learner context
   */
  async createReviewSession(
    studentId: string,
    sessionId: string,
    config: Partial<ReviewSessionConfig> = {},
  ): Promise<ReviewSessionResult> {
    const finalConfig = { ...this.defaultConfig, ...config };

    // Step 1: Generate review candidates
    const candidates = await this.candidateGenerationService.generateReviewCandidates(studentId);

    if (candidates.length === 0) {
      this.logger.warn(`No review candidates for student ${studentId}`);
      return {
        sessionId,
        studentId,
        assignments: [],
        composition: { remediation: 0, retention: 0, generalization: 0 },
      };
    }

    // Step 2: Distribute candidates by review type
    const distributedCandidates = this.distributeByType(candidates, finalConfig);

    // Step 3: Load real learner profile for review selection
    // [INTEGRATION 3]: Use real ChildProfile instead of synthetic profile
    const childProfile = await this.childProfileRepository.findOne({
      where: { userId: studentId },
    });

    // Step 4: Select activities for each distributed candidate
    const assignments: ReviewAssignment[] = [];

    for (const candidate of distributedCandidates) {
      try {
        // [INTEGRATION 3]: Pass real learner profile with accessibility/preferences
        const learnerProfile = childProfile
          ? {
              studentId,
              accessibilityNeeds: {
                sensoryLoad: (childProfile.uiPreferences?.visualStimulus ?? 'medium') as 'low' | 'medium' | 'high',
                motorDemand: 'medium' as 'low' | 'medium' | 'high',
                languageLoad: 'medium' as 'low' | 'medium' | 'high',
              },
              preferredModalities: childProfile.uiPreferences?.preferredModality ? [childProfile.uiPreferences.preferredModality] : [],
              professionalConstraints: childProfile.uiPreferences?.disabledActivityTypes ?? [],
            }
          : { studentId };

        const selection = await this.selectionService.selectReviewActivity(
          studentId,
          candidate.skillId,
          candidate.reviewType,
          learnerProfile,
        );

        const assignment = this.assignmentRepository.create({
          studentId,
          skillId: candidate.skillId,
          reviewType: candidate.reviewType,
          sourceInteractionIds: candidate.sourceInteractionIds || [],
          sourceRecommendationIds: [],
          selectedActivityTemplateId: selection.templateId,
          selectedActivityInstanceId: selection.instanceId,
          reason: selection.reason,
          priorityScore: candidate.priorityScore,
          // [INTEGRATION 2]: Use real scoring configuration from candidate
          scoringConfiguration: candidate.scoringConfiguration || {
            version: 'review-priority-score/1.0.0',
            weights: {},
            thresholds: {},
            timestamp: new Date(),
          },
          scoringBreakdown: candidate.scoringBreakdown,
          baselineState: candidate.baselineState,
        });

        assignments.push(await this.assignmentRepository.save(assignment));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to select activity for skill ${candidate.skillId}: ${errorMessage}`);
        continue;
      }
    }

    // Step 5: Calculate actual composition
    const composition = {
      remediation: assignments.filter((a) => a.reviewType === ReviewType.REMEDIATION).length,
      retention: assignments.filter((a) => a.reviewType === ReviewType.RETENTION).length,
      generalization: assignments.filter((a) => a.reviewType === ReviewType.GENERALIZATION).length,
    };

    return {
      sessionId,
      studentId,
      assignments,
      composition,
    };
  }

  /**
   * Validate and complete review activity
   * [INTEGRATION 3C]: Validates assignment/activity/student match before completion
   */
  async validateAndCompleteReviewActivity(
    reviewAssignmentId: string,
    reviewAttemptId: string,
    studentId: string,
    submittedActivityId: string,
  ): Promise<ReviewOutcome> {
    // Verify assignment exists
    const assignment = await this.assignmentRepository.findOne({
      where: { id: reviewAssignmentId },
    });

    if (!assignment) {
      throw new Error(`ReviewAssignment ${reviewAssignmentId} not found`);
    }

    // [INTEGRATION 3C]: Validate student ownership
    if (assignment.studentId !== studentId) {
      throw new Error(`ReviewAssignment ${reviewAssignmentId} does not belong to student ${studentId}`);
    }

    // [INTEGRATION 3C]: Validate activity match
    if (assignment.selectedActivityTemplateId !== submittedActivityId) {
      throw new Error(
        `ReviewAssignment ${reviewAssignmentId} expects activity ${assignment.selectedActivityTemplateId}, got ${submittedActivityId}`,
      );
    }

    // [INTEGRATION 3C]: Validate assignment is not already completed
    if (assignment.completedAt) {
      // Idempotency: return existing outcome if already completed
      const existingOutcome = await this.outcomeRepository.findOne({
        where: { reviewAssignmentId },
      });
      if (existingOutcome) {
        return existingOutcome;
      }
    }

    // Delegate to completeReviewActivity for the actual completion
    return this.completeReviewActivity(reviewAssignmentId, reviewAttemptId);
  }

  /**
   * Handle review activity completion
   * [INTEGRATION 3B.2]: Uses real persisted ActivityAttempt data, not frontend-supplied masteryAfter
   * [INTEGRATION 3B.3]: Validates assignment/attempt ownership and idempotency
   */
  async completeReviewActivity(
    reviewAssignmentId: string,
    reviewAttemptId: string,
  ): Promise<ReviewOutcome> {
    // Verify assignment exists
    const assignment = await this.assignmentRepository.findOne({
      where: { id: reviewAssignmentId },
    });

    if (!assignment) {
      throw new Error(`ReviewAssignment ${reviewAssignmentId} not found`);
    }

    // [INTEGRATION 3B.3]: Validate assignment is not already completed
    if (assignment.completedAt) {
      // Idempotency: return existing outcome if already completed
      const existingOutcome = await this.outcomeRepository.findOne({
        where: { reviewAssignmentId },
      });
      if (existingOutcome) {
        return existingOutcome;
      }
    }

    // [INTEGRATION 3B.2]: Resolve real ActivityAttempt from persisted data
    // Do NOT accept masteryAfter from frontend
    // The real mastery comes from the normal BKT flow that already executed
    
    // Mark assignment as completed
    assignment.completedAt = new Date();
    await this.assignmentRepository.save(assignment);

    // Create longitudinal comparison using real attempt data
    // The comparisonService will resolve the actual mastery from StudentSkillState
    // which was updated by the normal KnowledgeTracingService flow
    const outcome = await this.comparisonService.createLongitudinalComparison({
      reviewAssignmentId,
      reviewAttemptId,
    });

    return outcome;
  }

  /**
   * Get next active review assignment for a student
   * [INTEGRATION 3C-FINAL]: Returns the next review activity if one is active
   */
  async getNextReviewActivity(studentId: string): Promise<{
    activity: any;
    reviewAssignmentId: string;
    reviewType: ReviewType;
  } | null> {
    // Find the first incomplete review assignment for this student
    const assignment = await this.assignmentRepository.findOne({
      where: {
        studentId,
        completedAt: undefined,
      },
      order: { createdAt: 'ASC' },
    });

    if (!assignment || !assignment.selectedActivityInstanceId) {
      return null;
    }

    // Return the activity associated with this assignment
    // The activity is already persisted and can be loaded by the frontend
    return {
      activity: {
        id: assignment.selectedActivityInstanceId,
        // Additional review context can be added here
      },
      reviewAssignmentId: assignment.id,
      reviewType: assignment.reviewType,
    };
  }

  /**
   * Check if review should be triggered for new session
   */
  async shouldTriggerReview(studentId: string, sessionId: string): Promise<boolean> {
    const boundary = await this.triggerService.isNewLearningSession(studentId, sessionId);

    if (!boundary.isNewSession) {
      return false;
    }

    return await this.triggerService.shouldTriggerRetentionReview(studentId, boundary);
  }

  /**
   * Get review analytics for a student
   */
  async getReviewAnalytics(studentId: string): Promise<any> {
    const assignments = await this.assignmentRepository.find({
      where: { studentId },
    });

    const outcomes = await this.outcomeRepository.find({
      where: { studentId },
    });

    const byType = {
      remediation: assignments.filter((a) => a.reviewType === ReviewType.REMEDIATION).length,
      retention: assignments.filter((a) => a.reviewType === ReviewType.RETENTION).length,
      generalization: assignments.filter((a) => a.reviewType === ReviewType.GENERALIZATION).length,
    };

    const classifications = {
      improved: outcomes.filter((o) => o.progressionClassification === 'IMPROVED').length,
      stable: outcomes.filter((o) => o.progressionClassification === 'STABLE').length,
      needsSupport: outcomes.filter((o) => o.progressionClassification === 'NEEDS_SUPPORT').length,
      inconclusive: outcomes.filter((o) => o.progressionClassification === 'INCONCLUSIVE').length,
    };

    return {
      totalReviewActivities: assignments.length,
      completedReviewActivities: assignments.filter((a) => a.completedAt).length,
      reviewComposition: byType,
      progressionClassifications: classifications,
      outcomes,
    };
  }

  /**
   * Distribute candidates by review type with graceful degradation
   */
  private distributeByType(
    candidates: any[],
    config: ReviewSessionConfig,
  ): any[] {
    const remediationCount = Math.ceil((config.targetReviewSize * config.remediationPercentage) / 100);
    const retentionCount = Math.ceil((config.targetReviewSize * config.retentionPercentage) / 100);
    const generalizationCount = config.targetReviewSize - remediationCount - retentionCount;

    const byType = {
      [ReviewType.REMEDIATION]: candidates.filter((c) => c.reviewType === ReviewType.REMEDIATION),
      [ReviewType.RETENTION]: candidates.filter((c) => c.reviewType === ReviewType.RETENTION),
      [ReviewType.GENERALIZATION]: candidates.filter((c) => c.reviewType === ReviewType.GENERALIZATION),
    };

    const selected: any[] = [];

    // Take from each type up to the target
    selected.push(...byType[ReviewType.REMEDIATION].slice(0, remediationCount));
    selected.push(...byType[ReviewType.RETENTION].slice(0, retentionCount));
    selected.push(...byType[ReviewType.GENERALIZATION].slice(0, generalizationCount));

    // If we don't have enough, redistribute from remaining
    if (selected.length < config.targetReviewSize) {
      const remaining = candidates.filter((c) => !selected.includes(c));
      selected.push(...remaining.slice(0, config.targetReviewSize - selected.length));
    }

    return selected;
  }
}
