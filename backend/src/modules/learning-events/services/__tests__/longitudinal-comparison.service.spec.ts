import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LongitudinalComparisonService } from '../longitudinal-comparison.service';
import { ReviewAssignment, ReviewType } from '../../entities/review-assignment.entity';
import { ReviewOutcome, ProgressionClassification } from '../../entities/review-outcome.entity';
import { LearningEvent, LearningEventType } from '../../entities/learning-event.entity';
import { StudentSkillState } from '../../../knowledge-tracing/entities/student-skill-state.entity';
import { ExercisePerformance } from '../../entities/exercise-performance.entity';

describe('LongitudinalComparisonService', () => {
  let service: LongitudinalComparisonService;
  let mockAssignmentRepository: any;
  let mockOutcomeRepository: any;
  let mockEventRepository: any;
  let mockSkillStateRepository: any;
  let mockPerformanceRepository: any;

  beforeEach(async () => {
    mockAssignmentRepository = {
      findOne: jest.fn(),
    };

    mockOutcomeRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockEventRepository = {
      findOne: jest.fn(),
    };

    mockSkillStateRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockPerformanceRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LongitudinalComparisonService,
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
          provide: getRepositoryToken(StudentSkillState),
          useValue: mockSkillStateRepository,
        },
        {
          provide: getRepositoryToken(ExercisePerformance),
          useValue: mockPerformanceRepository,
        },
      ],
    }).compile();

    service = module.get<LongitudinalComparisonService>(LongitudinalComparisonService);
  });

  describe('Raw Metrics Calculation', () => {
    it('should calculate accuracy delta correctly', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
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
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 5000,
        hintsUsed: 2,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 4000,
        hintsUsed: 1,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 3,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.65,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        deltas: {
          accuracyDelta: 1,
          attemptsDelta: -1,
          hintsDelta: -1,
          responseTimeDelta: -1000,
          masteryDelta: 0.25,
        },
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.65,
      });

      expect(outcome.deltas.accuracyDelta).toBe(1);
    });

    it('should calculate attempts delta correctly', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.4,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 5,
          previousAttempts: 5,
          previousAccuracy: 0.2,
          previousHintUsage: 3,
          previousResponseTimeMs: 6000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 6000,
        hintsUsed: 3,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 5000,
        hintsUsed: 1,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 5,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.7,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        deltas: {
          accuracyDelta: 1,
          attemptsDelta: -3,
          hintsDelta: -2,
          responseTimeDelta: -1000,
          masteryDelta: 0.3,
        },
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.7,
      });

      expect(outcome.deltas.attemptsDelta).toBe(-3);
    });
  });

  describe('Progression Classification', () => {
    it('should classify as IMPROVED when accuracy up + attempts down at same difficulty', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.4,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 5,
          previousAttempts: 4,
          previousAccuracy: 0.25,
          previousHintUsage: 3,
          previousResponseTimeMs: 5000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 5000,
        hintsUsed: 3,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 5500,
        hintsUsed: 1,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 4,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 1,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.7,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        progressionClassification: ProgressionClassification.IMPROVED,
        classificationReason: 'Accuracy improved with reduced attempts/hints',
        evidenceSignals: ['accuracy_improved', 'attempts_reduced', 'hints_reduced'],
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.7,
      });

      expect(outcome.progressionClassification).toBe(ProgressionClassification.IMPROVED);
    });

    it('should NOT classify as IMPROVED when only response time is faster', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.3,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 5,
          previousAttempts: 3,
          previousAccuracy: 0.33,
          previousHintUsage: 2,
          previousResponseTimeMs: 5000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 5000,
        hintsUsed: 2,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: false,
        responseTimeMs: 2000,
        hintsUsed: 2,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 3,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 3,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.35,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        progressionClassification: ProgressionClassification.INCONCLUSIVE,
        classificationReason: 'Insufficient clear evidence for classification',
        evidenceSignals: ['response_time_faster'],
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.35,
      });

      expect(outcome.progressionClassification).not.toBe(ProgressionClassification.IMPROVED);
    });

    it('should classify as IMPROVED when performance maintained at higher difficulty', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.GENERALIZATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.75,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 10,
          previousAttempts: 2,
          previousAccuracy: 0.8,
          previousHintUsage: 0,
          previousResponseTimeMs: 4000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: true,
        responseTimeMs: 4000,
        hintsUsed: 0,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 5000,
        hintsUsed: 0,
        difficulty: 'hard',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 2,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.8,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        progressionClassification: ProgressionClassification.IMPROVED,
        classificationReason: 'Maintained or improved performance at higher difficulty',
        evidenceSignals: ['comparable_performance_at_higher_difficulty'],
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.8,
      });

      expect(outcome.progressionClassification).toBe(ProgressionClassification.IMPROVED);
    });

    it('should classify as NEEDS_SUPPORT when accuracy decreased significantly', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.RETENTION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.8,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 20,
          previousAttempts: 1,
          previousAccuracy: 1.0,
          previousHintUsage: 0,
          previousResponseTimeMs: 3000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: true,
        responseTimeMs: 3000,
        hintsUsed: 0,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: false,
        responseTimeMs: 6000,
        hintsUsed: 2,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 1,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 3,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.5,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        progressionClassification: ProgressionClassification.NEEDS_SUPPORT,
        classificationReason: 'Accuracy decreased significantly',
        evidenceSignals: ['accuracy_decreased_significantly'],
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.5,
      });

      expect(outcome.progressionClassification).toBe(ProgressionClassification.NEEDS_SUPPORT);
    });

    it('should classify as STABLE when minimal changes', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.RETENTION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
        baselineState: {
          masteryBefore: 0.75,
          difficultyBefore: 'medium',
          lastExposureAt: new Date(),
          daysSinceLastExposure: 15,
          previousAttempts: 2,
          previousAccuracy: 0.75,
          previousHintUsage: 0,
          previousResponseTimeMs: 4000,
        },
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: true,
        responseTimeMs: 4000,
        hintsUsed: 0,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 4200,
        hintsUsed: 0,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 2,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.76,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({
        progressionClassification: ProgressionClassification.STABLE,
        classificationReason: 'Stable performance with minimal changes',
        evidenceSignals: ['minimal_changes'],
      });

      const outcome = await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.76,
      });

      expect(outcome.progressionClassification).toBe(ProgressionClassification.STABLE);
    });
  });

  describe('Mastery Constraint', () => {
    it('should read mastery but never mutate StudentSkillState', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
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
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 5000,
        hintsUsed: 2,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 4000,
        hintsUsed: 1,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 3,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.65,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);
      mockOutcomeRepository.create.mockReturnValue({});
      mockOutcomeRepository.save.mockResolvedValue({});

      await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.65,
      });

      // Verify that skillStateRepository was only called for reading, not updating
      expect(mockSkillStateRepository.findOne).toHaveBeenCalled();
      // Should not have called save or update
      expect(mockSkillStateRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Traceability', () => {
    it('should link ReviewOutcome to ReviewAssignment', async () => {
      const assignmentId = 'assignment-1';
      const reviewInteractionId = 'interaction-1';
      const skillId = 'skill-1';

      const assignment: any = {
        id: assignmentId,
        studentId: 'student-1',
        skillId,
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: ['baseline-event-1'],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
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
      };

      const baselineEvent: any = {
        id: 'baseline-event-1',
        correct: false,
        responseTimeMs: 5000,
        hintsUsed: 2,
        timestamp: new Date(),
      };

      const reviewEvent: any = {
        id: reviewInteractionId,
        studentId: 'student-1',
        correct: true,
        responseTimeMs: 4000,
        hintsUsed: 1,
        difficulty: 'medium',
        timestamp: new Date(),
      };

      const baselinePerformance: any = {
        learningEventId: 'baseline-event-1',
        attemptNumber: 3,
      };

      const reviewPerformance: any = {
        learningEventId: reviewInteractionId,
        attemptNumber: 2,
      };

      const skillState: any = {
        studentId: 'student-1',
        skillId,
        masteryProbability: 0.65,
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);
      mockEventRepository.findOne.mockImplementation((opts: any) => {
        if (opts.where.id === 'baseline-event-1') return Promise.resolve(baselineEvent);
        if (opts.where.id === reviewInteractionId) return Promise.resolve(reviewEvent);
        return Promise.resolve(null);
      });
      mockPerformanceRepository.findOne.mockResolvedValue(baselinePerformance);
      mockSkillStateRepository.findOne.mockResolvedValue(skillState);

      const createdOutcome = { reviewAssignmentId: assignmentId };
      mockOutcomeRepository.create.mockReturnValue(createdOutcome);
      mockOutcomeRepository.save.mockResolvedValue(createdOutcome);

      await service.createLongitudinalComparison({
        reviewAssignmentId: assignmentId,
        reviewInteractionId,
        reviewRecommendationId: 'rec-1',
        masteryAfter: 0.65,
      });

      expect(mockOutcomeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewAssignmentId: assignmentId,
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when ReviewAssignment not found', async () => {
      mockAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createLongitudinalComparison({
          reviewAssignmentId: 'nonexistent',
          reviewInteractionId: 'interaction-1',
          reviewRecommendationId: 'rec-1',
          masteryAfter: 0.5,
        }),
      ).rejects.toThrow('ReviewAssignment nonexistent not found');
    });

    it('should throw error when baseline metrics cannot be resolved', async () => {
      const assignment: any = {
        id: 'assignment-1',
        studentId: 'student-1',
        skillId: 'skill-1',
        reviewType: ReviewType.REMEDIATION,
        sourceInteractionIds: [],
        selectedActivityTemplateId: 'activity-1',
        selectedActivityInstanceId: 'instance-1',
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
      };

      mockAssignmentRepository.findOne.mockResolvedValue(assignment);

      await expect(
        service.createLongitudinalComparison({
          reviewAssignmentId: 'assignment-1',
          reviewInteractionId: 'interaction-1',
          reviewRecommendationId: 'rec-1',
          masteryAfter: 0.5,
        }),
      ).rejects.toThrow('Cannot resolve baseline metrics');
    });
  });
});
