import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewOrchestrationService } from '../review-orchestration.service';
import { ReviewAssignment, ReviewType } from '../../entities/review-assignment.entity';
import { ReviewOutcome } from '../../entities/review-outcome.entity';
import { LearningEvent } from '../../entities/learning-event.entity';
import { ChildProfile } from '../../../users/entities/child-profile.entity';
import { Activity } from '../../../activities/entities/activity.entity';
import { ReviewCandidateGenerationService } from '../review-candidate-generation.service';
import { ReviewSelectionService } from '../review-selection.service';
import { ReviewTriggerService } from '../review-trigger.service';
import { LongitudinalComparisonService } from '../longitudinal-comparison.service';

describe('ReviewOrchestrationService', () => {
  let service: ReviewOrchestrationService;
  let mockAssignmentRepository: any;
  let mockOutcomeRepository: any;
  let mockEventRepository: any;
  let mockChildProfileRepository: any;
  let mockActivityRepository: any;
  let mockCandidateService: any;
  let mockSelectionService: any;
  let mockTriggerService: any;
  let mockComparisonService: any;

  beforeEach(async () => {
    mockAssignmentRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockOutcomeRepository = {
      find: jest.fn(),
    };

    mockEventRepository = {
      find: jest.fn(),
    };

    mockChildProfileRepository = {
      findOne: jest.fn(),
    };

    mockActivityRepository = {
      findOne: jest.fn(),
    };

    mockCandidateService = {
      generateReviewCandidates: jest.fn(),
    };

    mockSelectionService = {
      selectReviewActivity: jest.fn(),
    };

    mockTriggerService = {
      isNewLearningSession: jest.fn(),
      shouldTriggerRetentionReview: jest.fn(),
    };

    mockComparisonService = {
      createLongitudinalComparison: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewOrchestrationService,
        {
          provide: getRepositoryToken(ReviewAssignment),
          useValue: mockAssignmentRepository,
        },
        {
          provide: getRepositoryToken(ReviewOutcome),
          useValue: mockOutcomeRepository,
        },
        {
          provide: getRepositoryToken(LearningEvent),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(ChildProfile),
          useValue: mockChildProfileRepository,
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
        {
          provide: ReviewCandidateGenerationService,
          useValue: mockCandidateService,
        },
        {
          provide: ReviewSelectionService,
          useValue: mockSelectionService,
        },
        {
          provide: ReviewTriggerService,
          useValue: mockTriggerService,
        },
        {
          provide: LongitudinalComparisonService,
          useValue: mockComparisonService,
        },
      ],
    }).compile();

    service = module.get<ReviewOrchestrationService>(ReviewOrchestrationService);
  });

  describe('Review Session Creation', () => {
    it('should create review session with candidates', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-1';

      const candidates = [
        {
          skillId: 'skill-1',
          reviewType: ReviewType.REMEDIATION,
          priorityScore: 0.8,
          sourceInteractionIds: ['event-1'],
          sourceRecommendationIds: ['rec-1'],
          scoringConfiguration: { version: '1.0.0', weights: {}, thresholds: {}, timestamp: new Date() },
          scoringBreakdown: {},
          baselineState: {
            masteryBefore: 0.4,
            difficultyBefore: 'medium',
            lastExposureAt: new Date(),
            daysSinceLastExposure: 5,
            previousAttempts: 3,
            previousAccuracy: 0.33,
            previousHintUsage: 2,
            previousResponseTimeMs: 5000,
          },
        },
      ];

      mockCandidateService.generateReviewCandidates.mockResolvedValue(candidates);
      mockSelectionService.selectReviewActivity.mockResolvedValue({
        templateId: 'activity-1',
        instanceId: 'instance-1',
        activity: {},
        reviewType: ReviewType.REMEDIATION,
        reason: 'Selected for remediation',
        instanceComparison: 'EQUIVALENT_INSTANCE',
      });

      const assignment = {
        id: 'assignment-1',
        studentId,
        skillId: 'skill-1',
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['event-1'],
        sourceRecommendationIds: ['rec-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        reason: 'Selected for remediation',
        priorityScore: 0.8,
        scoringConfiguration: candidates[0].scoringConfiguration,
        scoringBreakdown: candidates[0].scoringBreakdown,
        baselineState: candidates[0].baselineState,
      };

      mockAssignmentRepository.create.mockReturnValue(assignment);
      mockAssignmentRepository.save.mockResolvedValue(assignment);

      const result = await service.createReviewSession(studentId, sessionId);

      expect(result.studentId).toBe(studentId);
      expect(result.sessionId).toBe(sessionId);
      expect(result.assignments.length).toBeGreaterThan(0);
      expect(result.composition.remediation).toBeGreaterThan(0);
    });

    it('should handle insufficient candidates gracefully', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-1';

      mockCandidateService.generateReviewCandidates.mockResolvedValue([]);

      const result = await service.createReviewSession(studentId, sessionId);

      expect(result.assignments.length).toBe(0);
      expect(result.composition.remediation).toBe(0);
      expect(result.composition.retention).toBe(0);
      expect(result.composition.generalization).toBe(0);
    });

    it('should distribute review composition correctly', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-1';

      const candidates = Array.from({ length: 10 }, (_, i) => ({
        skillId: `skill-${i}`,
        reviewType: i < 6 ? ReviewType.REMEDIATION : i < 8 ? ReviewType.RETENTION : ReviewType.GENERALIZATION,
        priorityScore: 0.7,
        sourceInteractionIds: [`event-${i}`],
        sourceRecommendationIds: [`rec-${i}`],
        scoringConfiguration: { version: '1.0.0', weights: {}, thresholds: {}, timestamp: new Date() },
        scoringBreakdown: {},
        baselineState: {
          masteryBefore: 0.4,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 5,
          previousAttempts: 3,
          previousAccuracy: 0.33,
          previousHintUsage: 2,
          previousResponseTimeMs: 5000,
        },
      }));

      mockCandidateService.generateReviewCandidates.mockResolvedValue(candidates);
      mockSelectionService.selectReviewActivity.mockResolvedValue({
        templateId: 'activity-1',
        instanceId: 'instance-1',
        activity: {},
        reviewType: ReviewType.REMEDIATION,
        reason: 'Selected',
        instanceComparison: 'EQUIVALENT_INSTANCE',
      });

      mockAssignmentRepository.create.mockImplementation((data: any) => data);
      mockAssignmentRepository.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.createReviewSession(studentId, sessionId, {
        remediationPercentage: 60,
        retentionPercentage: 20,
        generalizationPercentage: 20,
        targetReviewSize: 10,
      });

      expect(result.assignments.length).toBeLessThanOrEqual(10);
      expect(result.composition.remediation + result.composition.retention + result.composition.generalization).toBeLessThanOrEqual(10);
    });
  });

  describe('Review Activity Completion', () => {
    it('should complete review activity and create outcome', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const reviewRecommendationId = 'rec-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId: 'skill-1',
        reviewType: ReviewType.REMEDIATION,
        completedAt: null,
      };

      const outcome: any = {
        id: 'outcome-1',
        reviewAssignmentId: assignmentId,
        progressionClassification: 'IMPROVED',
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockAssignmentRepository.save.mockResolvedValue({ ...assignment, completedAt: new Date() });
      mockComparisonService.createLongitudinalComparison.mockResolvedValue(outcome);

      const result = await service.completeReviewActivity(assignmentId, 'attempt-1');

      expect(result.reviewAssignmentId).toBe(assignmentId);
      expect(mockAssignmentRepository.save).toHaveBeenCalled();
      expect(mockComparisonService.createLongitudinalComparison).toHaveBeenCalled();
    });

    it('should throw error when assignment not found', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeReviewActivity('nonexistent', 'attempt-1'),
      ).rejects.toThrow('ReviewAssignment nonexistent not found');
    });
  });

  describe('Review Trigger', () => {
    it('should trigger review for new session with retention candidates', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-2';

      mockTriggerService.isNewLearningSession.mockResolvedValue({
        isNewSession: true,
        sessionGapMinutes: 120,
        lastActivityTimestamp: new Date(),
        currentSessionId: sessionId,
      });

      mockTriggerService.shouldTriggerRetentionReview.mockResolvedValue(true);

      const shouldTrigger = await service.shouldTriggerReview(studentId, sessionId);

      expect(shouldTrigger).toBe(true);
    });

    it('should NOT trigger review for same session', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-1';

      mockTriggerService.isNewLearningSession.mockResolvedValue({
        isNewSession: false,
        sessionGapMinutes: 30,
        lastActivityTimestamp: new Date(),
        currentSessionId: sessionId,
      });

      const shouldTrigger = await service.shouldTriggerReview(studentId, sessionId);

      expect(shouldTrigger).toBe(false);
    });
  });

  describe('getNextReviewActivity', () => {
    it('filters out completed assignments using IsNull (not undefined)', async () => {
      // Regression test: `completedAt: undefined` in a TypeORM where clause is
      // silently ignored (it does not mean "IS NULL"), which previously made
      // this method always return the oldest assignment ever created, even
      // after it was completed. It must use IsNull() to actually exclude
      // completed assignments.
      mockAssignmentRepository.findOne.mockResolvedValue({
        id: 'assignment-1',
        selectedActivityInstanceId: 'activity-1',
        reviewType: ReviewType.RETENTION,
      });
      mockActivityRepository.findOne.mockResolvedValue({ id: 'activity-1', title: 'Review activity' });

      await service.getNextReviewActivity('student-1');

      const whereClause = mockAssignmentRepository.findOne.mock.calls[0][0].where;
      expect(whereClause.completedAt).not.toBeUndefined();
      expect(whereClause.completedAt).not.toBe(undefined);
    });

    it('returns the full persisted Activity, not just an id stub', async () => {
      const fullActivity = { id: 'activity-1', title: 'Soma simples', content: { items: [] }, bnccSkills: ['EF01MA01'] };
      mockAssignmentRepository.findOne.mockResolvedValue({
        id: 'assignment-1',
        selectedActivityInstanceId: 'activity-1',
        reviewType: ReviewType.REMEDIATION,
      });
      mockActivityRepository.findOne.mockResolvedValue(fullActivity);

      const result = await service.getNextReviewActivity('student-1');

      expect(result).toEqual({
        activity: fullActivity,
        reviewAssignmentId: 'assignment-1',
        reviewType: ReviewType.REMEDIATION,
      });
    });

    it('returns null when no assignment is pending', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);

      const result = await service.getNextReviewActivity('student-1');

      expect(result).toBeNull();
    });
  });

  describe('triggerAutomaticReviewIfDue', () => {
    it('does nothing when a review is already pending', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue({
        id: 'assignment-1',
        selectedActivityInstanceId: 'activity-1',
        reviewType: ReviewType.RETENTION,
      });
      mockActivityRepository.findOne.mockResolvedValue({ id: 'activity-1' });

      await service.triggerAutomaticReviewIfDue('student-1');

      expect(mockTriggerService.isNewLearningSession).not.toHaveBeenCalled();
      expect(mockCandidateService.generateReviewCandidates).not.toHaveBeenCalled();
    });

    it('does nothing when not a new learning session', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);
      mockTriggerService.isNewLearningSession.mockResolvedValue({ isNewSession: false });

      await service.triggerAutomaticReviewIfDue('student-1');

      expect(mockTriggerService.shouldTriggerRetentionReview).not.toHaveBeenCalled();
      expect(mockCandidateService.generateReviewCandidates).not.toHaveBeenCalled();
    });

    it('creates a review session when a new session is due for retention', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);
      mockTriggerService.isNewLearningSession.mockResolvedValue({ isNewSession: true });
      mockTriggerService.shouldTriggerRetentionReview.mockResolvedValue(true);
      mockCandidateService.generateReviewCandidates.mockResolvedValue([]);

      await service.triggerAutomaticReviewIfDue('student-1');

      expect(mockCandidateService.generateReviewCandidates).toHaveBeenCalledWith('student-1');
    });
  });

  describe('startManualReviewSession', () => {
    it('reports an existing pending review instead of creating a duplicate', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue({
        id: 'assignment-1',
        selectedActivityInstanceId: 'activity-1',
        reviewType: ReviewType.RETENTION,
      });
      mockActivityRepository.findOne.mockResolvedValue({ id: 'activity-1' });

      const result = await service.startManualReviewSession('student-1');

      expect(result).toEqual({ available: true, assignmentsCount: 1 });
      expect(mockCandidateService.generateReviewCandidates).not.toHaveBeenCalled();
    });

    it('reports unavailable when no skill is due (e.g. everything in cooldown)', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);
      mockCandidateService.generateReviewCandidates.mockResolvedValue([]);

      const result = await service.startManualReviewSession('student-1');

      expect(result).toEqual({ available: false, assignmentsCount: 0 });
    });

    it('creates a focused 5-item session when candidates are available', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);
      mockCandidateService.generateReviewCandidates.mockResolvedValue([
        {
          skillId: 'skill-1',
          reviewType: ReviewType.RETENTION,
          priorityScore: 0.5,
          sourceInteractionIds: [],
          baselineState: {},
        },
      ]);
      mockSelectionService.selectReviewActivity.mockResolvedValue({
        templateId: 'template-1',
        instanceId: 'instance-1',
        reason: 'due for retention',
      });
      mockAssignmentRepository.create.mockImplementation((data: any) => data);
      mockAssignmentRepository.save.mockImplementation((data: any) => Promise.resolve({ ...data, id: 'assignment-new' }));

      const result = await service.startManualReviewSession('student-1');

      expect(result).toEqual({ available: true, assignmentsCount: 1 });
    });
  });

  describe('Review Analytics', () => {
    it('should return review analytics for student', async () => {
      const studentId = 'student-1';

      const assignments = [
        {
          id: 'assignment-1',
          studentId,
          skillId: 'skill-1',
          reviewType: ReviewType.REMEDIATION,
          completedAt: new Date(),
        },
        {
          id: 'assignment-2',
          studentId,
          skillId: 'skill-2',
          reviewType: ReviewType.RETENTION,
          completedAt: null,
        },
      ];

      const outcomes = [
        {
          id: 'outcome-1',
          studentId,
          progressionClassification: 'IMPROVED',
        },
      ];

      mockAssignmentRepository.find.mockResolvedValue(assignments);
      mockOutcomeRepository.find.mockResolvedValue(outcomes);

      const analytics = await service.getReviewAnalytics(studentId);

      expect(analytics.totalReviewActivities).toBe(2);
      expect(analytics.completedReviewActivities).toBe(1);
      expect(analytics.reviewComposition.remediation).toBe(1);
      expect(analytics.reviewComposition.retention).toBe(1);
      expect(analytics.progressionClassifications.improved).toBe(1);
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full review flow from trigger to outcome', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-2';

      // Step 1: Check if review should trigger
      mockTriggerService.isNewLearningSession.mockResolvedValue({
        isNewSession: true,
        sessionGapMinutes: 120,
        lastActivityTimestamp: new Date(),
        currentSessionId: sessionId,
      });

      mockTriggerService.shouldTriggerRetentionReview.mockResolvedValue(true);

      const shouldTrigger = await service.shouldTriggerReview(studentId, sessionId);
      expect(shouldTrigger).toBe(true);

      // Step 2: Create review session
      const candidates = [
        {
          skillId: 'skill-1',
          reviewType: ReviewType.RETENTION,
          priorityScore: 0.7,
          sourceInteractionIds: ['event-1'],
          sourceRecommendationIds: ['rec-1'],
          scoringConfiguration: { version: '1.0.0', weights: {}, thresholds: {}, timestamp: new Date() },
          scoringBreakdown: {},
          baselineState: {
            masteryBefore: 0.8,
            difficultyBefore: 'medium',
            lastExposureAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            daysSinceLastExposure: 20,
            previousAttempts: 2,
            previousAccuracy: 0.8,
            previousHintUsage: 0,
            previousResponseTimeMs: 4000,
          },
        },
      ];

      mockCandidateService.generateReviewCandidates.mockResolvedValue(candidates);
      mockSelectionService.selectReviewActivity.mockResolvedValue({
        templateId: 'activity-1',
        instanceId: 'instance-1',
        activity: {},
        reviewType: ReviewType.RETENTION,
        reason: 'Retention review',
        instanceComparison: 'EQUIVALENT_INSTANCE',
      });

      const assignment = {
        id: 'assignment-1',
        studentId,
        skillId: 'skill-1',
        reviewType: ReviewType.RETENTION,
        sourceInteractionIds: ['event-1'],
        sourceRecommendationIds: ['rec-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        reason: 'Retention review',
        priorityScore: 0.7,
        scoringConfiguration: candidates[0].scoringConfiguration,
        scoringBreakdown: candidates[0].scoringBreakdown,
        baselineState: candidates[0].baselineState,
        completedAt: null,
      };

      mockAssignmentRepository.create.mockReturnValue(assignment);
      mockAssignmentRepository.save.mockResolvedValue(assignment);

      const session = await service.createReviewSession(studentId, sessionId);
      expect(session.assignments.length).toBeGreaterThan(0);

      // Step 3: Complete review activity
      const outcome = {
        id: 'outcome-1',
        reviewAssignmentId: 'assignment-1',
        progressionClassification: 'STABLE',
        deltas: {
          accuracyDelta: 0,
          attemptsDelta: 0,
          hintsDelta: 0,
          responseTimeDelta: 500,
          masteryDelta: 0.05,
        },
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockComparisonService.createLongitudinalComparison.mockResolvedValue(outcome);

      const completedOutcome = await service.completeReviewActivity(
        'assignment-1',
        'review-attempt-1',
      );

      expect(completedOutcome.progressionClassification).toBe('STABLE');
      expect(completedOutcome.deltas.masteryDelta).toBe(0.05);
    });
  });

  describe('Traceability', () => {
    it('should preserve source interaction IDs through assignment', async () => {
      const studentId = 'student-1';
      const sessionId = 'session-1';
      const sourceInteractionIds = ['event-1', 'event-2', 'event-3'];

      const candidates = [
        {
          skillId: 'skill-1',
          reviewType: ReviewType.REMEDIATION,
          priorityScore: 0.8,
          sourceInteractionIds,
          sourceRecommendationIds: ['rec-1'],
          scoringConfiguration: { version: '1.0.0', weights: {}, thresholds: {}, timestamp: new Date() },
          scoringBreakdown: {},
          baselineState: {
            masteryBefore: 0.4,
            difficultyBefore: 'medium',
            lastExposureAt: new Date(),
            daysSinceLastExposure: 5,
            previousAttempts: 3,
            previousAccuracy: 0.33,
            previousHintUsage: 2,
            previousResponseTimeMs: 5000,
          },
        },
      ];

      mockCandidateService.generateReviewCandidates.mockResolvedValue(candidates);
      mockSelectionService.selectReviewActivity.mockResolvedValue({
        templateId: 'activity-1',
        instanceId: 'instance-1',
        activity: {},
        reviewType: ReviewType.REMEDIATION,
        reason: 'Selected',
        instanceComparison: 'EQUIVALENT_INSTANCE',
      });

      mockAssignmentRepository.create.mockImplementation((data: any) => data);
      mockAssignmentRepository.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await service.createReviewSession(studentId, sessionId);

      expect(result.assignments[0].sourceInteractionIds).toEqual(sourceInteractionIds);
    });
  });
});
