import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewCandidateGenerationService } from '../review-candidate-generation.service';
import { ExercisePerformance } from '../../entities/exercise-performance.entity';
import { LearningEvent, LearningEventType } from '../../entities/learning-event.entity';
import { StudentSkillState } from '../../../knowledge-tracing/entities/student-skill-state.entity';
import { ActivityAttempt } from '../../../activities/entities/activity-attempt.entity';
import { Activity } from '../../../activities/entities/activity.entity';
import { ConfigService } from '@nestjs/config';
import { ReviewType } from '../../entities/review-assignment.entity';

describe('ReviewCandidateGenerationService', () => {
  let service: ReviewCandidateGenerationService;
  let mockPerformanceRepository: any;
  let mockEventRepository: any;
  let mockSkillStateRepository: any;
  let mockActivityAttemptRepository: any;
  let mockActivityRepository: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPerformanceRepository = {
      find: jest.fn(),
    };

    mockEventRepository = {
      find: jest.fn(),
    };

    mockSkillStateRepository = {
      find: jest.fn(),
    };

    mockActivityAttemptRepository = {
      findOne: jest.fn(),
    };

    mockActivityRepository = {
      findOne: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key, defaultValue) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewCandidateGenerationService,
        {
          provide: getRepositoryToken(ExercisePerformance),
          useValue: mockPerformanceRepository,
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
          provide: getRepositoryToken(ActivityAttempt),
          useValue: mockActivityAttemptRepository,
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ReviewCandidateGenerationService>(ReviewCandidateGenerationService);
  });

  describe('Score Normalization', () => {
    it('should keep score in [0,1] range', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);

      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach((candidate) => {
        expect(candidate.priorityScore).toBeGreaterThanOrEqual(0);
        expect(candidate.priorityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should normalize error score to [0,1]', () => {
      const errorScore = (service as any).normalizeErrorScore(10, 3);
      expect(errorScore).toBe(0.3);
      expect(errorScore).toBeGreaterThanOrEqual(0);
      expect(errorScore).toBeLessThanOrEqual(1);
    });

    it('should normalize remediation attempt score to [0,1]', () => {
      const attemptScore = (service as any).normalizeRemediationAttemptScore(2);
      expect(attemptScore).toBeGreaterThanOrEqual(0);
      expect(attemptScore).toBeLessThanOrEqual(1);
    });

    it('should normalize remediation help score to [0,1]', () => {
      const helpScore = (service as any).normalizeRemediationHelpScore(3);
      expect(helpScore).toBeGreaterThanOrEqual(0);
      expect(helpScore).toBeLessThanOrEqual(1);
    });

    it('should normalize remediation mastery score to [0,1]', () => {
      const masteryScore = (service as any).normalizeRemediationMasteryScore(0.7);
      expect(masteryScore).toBeGreaterThanOrEqual(0);
      expect(masteryScore).toBeLessThanOrEqual(1);
    });

    it('should normalize recency score to [0,1]', () => {
      const recencyScore = (service as any).normalizeRecencyScore(14);
      expect(recencyScore).toBeGreaterThanOrEqual(0);
      expect(recencyScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Response Time Handling', () => {
    it('should prevent response time from dominating score', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);

      // Very fast response time
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 500, // Very fast
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);
      expect(candidates.length).toBeGreaterThan(0);

      // Score should not be 1.0 just because response time is fast
      expect(candidates[0].priorityScore).toBeLessThan(1);
    });
  });

  describe('Scoring Configuration', () => {
    it('should persist scoring configuration with version', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);
      expect(candidates.length).toBeGreaterThan(0);

      // Scoring breakdown should include all 8 factors
      const breakdown = candidates[0].scoringBreakdown;
      expect(breakdown.errorScore).toBeDefined();
      expect(breakdown.attemptScore).toBeDefined();
      expect(breakdown.helpScore).toBeDefined();
      expect(breakdown.engagementScore).toBeDefined();
      expect(breakdown.responseTimeScore).toBeDefined();
      expect(breakdown.completionScore).toBeDefined();
      expect(breakdown.masteryScore).toBeDefined();
      expect(breakdown.recencyScore).toBeDefined();
    });

    it('should respect configured weights', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);
      expect(candidates.length).toBeGreaterThan(0);

      // Score should be deterministic weighted sum
      const breakdown = candidates[0].scoringBreakdown;
      const expectedScore =
        0.2 * (breakdown.errorScore || 0) +
        0.15 * (breakdown.attemptScore || 0) +
        0.15 * (breakdown.helpScore || 0) +
        0.1 * (breakdown.engagementScore || 0) +
        0.1 * (breakdown.responseTimeScore || 0) +
        0.1 * (breakdown.completionScore || 0) +
        0.1 * (breakdown.masteryScore || 0) +
        0.1 * (breakdown.recencyScore || 0);

      // Allow small floating point error
      expect(Math.abs(candidates[0].priorityScore - expectedScore)).toBeLessThan(0.01);
    });
  });

  describe('Baseline Selection', () => {
    it('should preserve source interaction IDs', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);

      const eventId1 = 'event-1';
      const eventId2 = 'event-2';

      mockEventRepository.find.mockResolvedValue([
        {
          id: eventId1,
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
        {
          id: eventId2,
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 6000,
          hintsUsed: 2,
          timestamp: new Date(Date.now() - 1000),
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);
      expect(candidates.length).toBeGreaterThan(0);

      // Source interaction IDs should be preserved
      expect(candidates[0].sourceInteractionIds).toBeDefined();
      expect(candidates[0].sourceInteractionIds.length).toBeGreaterThan(0);
    });

    it('should handle missing evidence safely', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 0 },
      ]);

      mockEventRepository.find.mockResolvedValue([]); // No events

      const candidates = await service.generateReviewCandidates(studentId, { minEvidence: 1 });

      // Should handle gracefully with no candidates
      expect(candidates).toBeDefined();
      expect(Array.isArray(candidates)).toBe(true);
    });
  });

  describe('Review Type Determination', () => {
    it('should return REMEDIATION for low mastery', () => {
      const reviewType = (service as any).determineReviewType(0.4, {
        totalAttempts: 5,
        accuracy: 0.6,
        incorrectAttempts: 2,
        totalHints: 2,
        medianResponseTimeMs: 5000,
        lastExposureAt: new Date(),
        daysSinceLastExposure: 1,
        skipCount: 0,
        changeRequestCount: 0,
        totalExposures: 5,
        completedActivities: 5,
        presentedActivities: 5,
        sourceInteractionIds: [],
        baselineState: {} as any,
      });
      expect(reviewType).toBe(ReviewType.REMEDIATION);
    });

    it('should return GENERALIZATION for high accuracy and sufficient attempts', () => {
      const reviewType = (service as any).determineReviewType(0.85, {
        totalAttempts: 10,
        accuracy: 0.9,
        incorrectAttempts: 1,
        totalHints: 1,
        medianResponseTimeMs: 3000,
        lastExposureAt: new Date(),
        daysSinceLastExposure: 1,
        skipCount: 0,
        changeRequestCount: 0,
        totalExposures: 10,
        completedActivities: 10,
        presentedActivities: 10,
        sourceInteractionIds: [],
        baselineState: {} as any,
      });
      expect(reviewType).toBe(ReviewType.GENERALIZATION);
    });

    it('should return RETENTION for mastered but not recent', () => {
      const reviewType = (service as any).determineReviewType(0.75, {
        totalAttempts: 5,
        accuracy: 0.8,
        incorrectAttempts: 1,
        totalHints: 1,
        medianResponseTimeMs: 3000,
        lastExposureAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        daysSinceLastExposure: 20,
        skipCount: 0,
        changeRequestCount: 0,
        totalExposures: 5,
        completedActivities: 5,
        presentedActivities: 5,
        sourceInteractionIds: [],
        baselineState: {} as any,
      });
      expect(reviewType).toBe(ReviewType.RETENTION);
    });
  });

  describe('Mastery Constraint', () => {
    it('should read mastery but never mutate StudentSkillState', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);
      mockSkillStateRepository.save = jest.fn();
      mockSkillStateRepository.update = jest.fn();

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
      ]);

      await service.generateReviewCandidates(studentId);

      // Verify only read operation was called
      expect(mockSkillStateRepository.find).toHaveBeenCalled();
      // Verify no save/update operations
      expect(mockSkillStateRepository.save).not.toHaveBeenCalled();
      expect(mockSkillStateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Determinism', () => {
    it('should produce deterministic scores for same inputs', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      const mockSkillState = { studentId, skillId, masteryProbability: 0.5, observations: 5 };
      const mockEvents = [
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date('2026-09-24T10:00:00Z'),
        },
      ];

      // First call
      mockSkillStateRepository.find.mockResolvedValue([mockSkillState]);
      mockEventRepository.find.mockResolvedValue(mockEvents);
      const candidates1 = await service.generateReviewCandidates(studentId);

      // Second call with same inputs
      mockSkillStateRepository.find.mockResolvedValue([mockSkillState]);
      mockEventRepository.find.mockResolvedValue(mockEvents);
      const candidates2 = await service.generateReviewCandidates(studentId);

      // Scores should be identical
      expect(candidates1[0].priorityScore).toBe(candidates2[0].priorityScore);
      expect(candidates1[0].scoringBreakdown).toEqual(candidates2[0].scoringBreakdown);
    });
  });

  describe('REMEDIATION Monotonic Behavior', () => {
    it('should increase remediation priority with more errors', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Low errors (1 out of 5)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-4',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-5',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // High errors (4 out of 5)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-4',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-5',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // More errors should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase remediation priority with more attempts', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Few attempts (2)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.4, observations: 2 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // Many attempts (6)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 6 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-4',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-5',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-6',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // More attempts should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase remediation priority with more hints', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Few hints (0)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.4, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // Many hints (4)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 2,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 1,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // More hints should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase remediation priority with more skips', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // No skips (3 attempts, all submitted)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.4, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ACTIVITY_PRESENTED,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // With skips (3 presented, 1 skipped, 2 submitted)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.4, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ACTIVITY_PRESENTED,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ACTIVITY_SKIPPED,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ACTIVITY_PRESENTED,
          timestamp: new Date(),
        },
        {
          id: 'event-4',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-5',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // More skips should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase remediation priority with lower mastery', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Higher mastery (0.6)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.6, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // Lower mastery (0.2)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.2, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // Lower mastery should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });

    it('should increase remediation priority with non-completion', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // All completed
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.4, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ACTIVITY_PRESENTED,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // Some abandoned
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ACTIVITY_PRESENTED,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ACTIVITY_ABANDONED,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // Non-completion should increase remediation priority
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('RETENTION Monotonic Behavior', () => {
    it('should increase retention priority with higher mastery', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Lower mastery (0.5)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.5, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const breakdown1 = candidates1[0].scoringBreakdown;

      // Higher mastery (0.9)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.9, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const breakdown2 = candidates2[0].scoringBreakdown;

      // Higher mastery should increase retention mastery score
      expect(breakdown2.masteryScore || 0).toBeGreaterThan(breakdown1.masteryScore || 0);
    });

    it('should use recency score for retention (exponential decay)', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // 1 day since exposure - RETENTION type
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.8, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const breakdown1 = candidates1[0].scoringBreakdown;

      // 30 days since exposure - RETENTION type, same mastery
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.8, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const breakdown2 = candidates2[0].scoringBreakdown;

      // [RESEARCH DATA CORRECTNESS]: Recency score should be HIGHER for older exposures
      // For RETENTION: 1d < 7d < 14d < 30d in reason to CHECK retention
      // Elapsed time increases retention priority (bounded increasing function)
      expect(breakdown2.recencyScore || 0).toBeGreaterThan(breakdown1.recencyScore || 0);
    });

    it('should NOT create strong retention candidate from low mastery + elapsed time alone', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Low mastery + long elapsed time (should be REMEDIATION, not RETENTION)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 5 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 5000,
          hintsUsed: 0,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      ]);

      const candidates = await service.generateReviewCandidates(studentId);
      expect(candidates.length).toBeGreaterThan(0);

      // Should be classified as REMEDIATION, not RETENTION
      expect(candidates[0].reviewType).toBe(ReviewType.REMEDIATION);
    });
  });

  describe('Response Time Semantics', () => {
    it('should NOT use response time alone to determine progression', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      // Low accuracy (REMEDIATION - needs help)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.3, observations: 3 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 1000, // Fast
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 1000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: false,
          responseTimeMs: 1000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates1 = await service.generateReviewCandidates(studentId);
      const score1 = candidates1[0].priorityScore;

      // High accuracy (GENERALIZATION - ready to generalize)
      mockSkillStateRepository.find.mockResolvedValue([
        { studentId, skillId, masteryProbability: 0.85, observations: 10 },
      ]);
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000, // Slow
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-3',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-4',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-5',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-6',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-7',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-8',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-9',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
        {
          id: 'event-10',
          eventType: LearningEventType.ANSWER_SUBMITTED,
          correct: true,
          responseTimeMs: 15000,
          hintsUsed: 0,
          timestamp: new Date(),
        },
      ]);

      const candidates2 = await service.generateReviewCandidates(studentId);
      const score2 = candidates2[0].priorityScore;

      // REMEDIATION (low accuracy) should have lower mastery score than GENERALIZATION (high accuracy)
      // Response time alone does NOT determine progression
      const breakdown1 = candidates1[0].scoringBreakdown;
      const breakdown2 = candidates2[0].scoringBreakdown;
      expect(breakdown1.masteryScore || 0).toBeLessThan(breakdown2.masteryScore || 0);
    });
  });
});
