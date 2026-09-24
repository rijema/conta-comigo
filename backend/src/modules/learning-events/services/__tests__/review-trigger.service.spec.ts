import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewTriggerService } from '../review-trigger.service';
import { LearningEvent, LearningEventType } from '../../entities/learning-event.entity';
import { ConfigService } from '@nestjs/config';
import { ReviewType } from '../../entities/review-assignment.entity';

describe('ReviewTriggerService', () => {
  let service: ReviewTriggerService;
  let mockEventRepository: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockEventRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key, defaultValue) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewTriggerService,
        {
          provide: getRepositoryToken(LearningEvent),
          useValue: mockEventRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ReviewTriggerService>(ReviewTriggerService);
  });

  describe('Session Boundary Detection', () => {
    it('should detect new session after gap exceeds threshold', async () => {
      const studentId = 'student-1';
      const currentSessionId = 'session-2';

      // Last activity 2 hours ago
      const lastActivityTime = new Date(Date.now() - 2 * 60 * 60 * 1000);

      mockEventRepository.findOne.mockResolvedValue({
        id: 'event-1',
        studentId,
        timestamp: lastActivityTime,
      });

      const boundary = await service.isNewLearningSession(studentId, currentSessionId);

      expect(boundary.isNewSession).toBe(true);
      expect(boundary.sessionGapMinutes).toBeGreaterThan(60);
    });

    it('should NOT detect new session within threshold', async () => {
      const studentId = 'student-1';
      const currentSessionId = 'session-1';

      // Last activity 30 minutes ago
      const lastActivityTime = new Date(Date.now() - 30 * 60 * 1000);

      mockEventRepository.findOne.mockResolvedValue({
        id: 'event-1',
        studentId,
        timestamp: lastActivityTime,
      });

      const boundary = await service.isNewLearningSession(studentId, currentSessionId);

      expect(boundary.isNewSession).toBe(false);
      expect(boundary.sessionGapMinutes).toBeLessThan(60);
    });

    it('should detect first session ever', async () => {
      const studentId = 'student-1';
      const currentSessionId = 'session-1';

      mockEventRepository.findOne.mockResolvedValue(null);

      const boundary = await service.isNewLearningSession(studentId, currentSessionId);

      expect(boundary.isNewSession).toBe(true);
      expect(boundary.lastActivityTimestamp).toBeNull();
    });
  });

  describe('Checkpoint Milestone Detection', () => {
    it('should detect checkpoint after threshold activities', async () => {
      const studentId = 'student-1';
      const islandId = 'island-1';

      // 10 completed activities
      const activities = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        studentId,
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        timestamp: new Date(),
      }));

      mockEventRepository.find.mockResolvedValue(activities);

      const milestone = await service.detectCheckpointMilestone(studentId, islandId);

      expect(milestone).toBeDefined();
      expect(milestone?.completedActivitiesCount).toBe(10);
    });

    it('should NOT detect checkpoint before threshold', async () => {
      const studentId = 'student-1';
      const islandId = 'island-1';

      // 5 completed activities
      const activities = Array.from({ length: 5 }, (_, i) => ({
        id: `event-${i}`,
        studentId,
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        timestamp: new Date(),
      }));

      mockEventRepository.find.mockResolvedValue(activities);

      const milestone = await service.detectCheckpointMilestone(studentId, islandId);

      expect(milestone).toBeNull();
    });
  });

  describe('Retention Review Trigger', () => {
    it('should trigger retention review for new session with old skills', async () => {
      const studentId = 'student-1';
      const sessionBoundary = {
        isNewSession: true,
        sessionGapMinutes: 120,
        lastActivityTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        currentSessionId: 'session-2',
      };

      // Skills not seen in 20 days
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          studentId,
          bnccSkillId: 'skill-1',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
      ]);

      const shouldTrigger = await service.shouldTriggerRetentionReview(studentId, sessionBoundary);

      expect(shouldTrigger).toBe(true);
    });

    it('should NOT trigger retention review for same session', async () => {
      const studentId = 'student-1';
      const sessionBoundary = {
        isNewSession: false,
        sessionGapMinutes: 30,
        lastActivityTimestamp: new Date(Date.now() - 30 * 60 * 1000),
        currentSessionId: 'session-1',
      };

      const shouldTrigger = await service.shouldTriggerRetentionReview(studentId, sessionBoundary);

      expect(shouldTrigger).toBe(false);
    });

    it('should NOT trigger retention review when all skills are recent', async () => {
      const studentId = 'student-1';
      const sessionBoundary = {
        isNewSession: true,
        sessionGapMinutes: 120,
        lastActivityTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        currentSessionId: 'session-2',
      };

      // Skills seen recently (5 days ago)
      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          studentId,
          bnccSkillId: 'skill-1',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ]);

      const shouldTrigger = await service.shouldTriggerRetentionReview(studentId, sessionBoundary);

      expect(shouldTrigger).toBe(false);
    });
  });

  describe('Skills Needing Retention', () => {
    it('should identify skills not seen in retention half-life', async () => {
      const studentId = 'student-1';

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          studentId,
          bnccSkillId: 'skill-1',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
        {
          id: 'event-2',
          studentId,
          bnccSkillId: 'skill-2',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      ]);

      const skillsNeedingRetention = await service.getSkillsNeedingRetention(studentId);

      expect(skillsNeedingRetention).toContain('skill-1');
      expect(skillsNeedingRetention).not.toContain('skill-2');
    });
  });

  describe('Review Type Determination', () => {
    it('should return REMEDIATION for low mastery', () => {
      const reviewType = service.determineReviewType(0.4, 0.6, 5);
      expect(reviewType).toBe(ReviewType.REMEDIATION);
    });

    it('should return REMEDIATION for low accuracy', () => {
      const reviewType = service.determineReviewType(0.7, 0.6, 5);
      expect(reviewType).toBe(ReviewType.REMEDIATION);
    });

    it('should return GENERALIZATION for high accuracy and recent', () => {
      const reviewType = service.determineReviewType(0.8, 0.9, 5);
      expect(reviewType).toBe(ReviewType.GENERALIZATION);
    });

    it('should return RETENTION for mastered but not recent', () => {
      const reviewType = service.determineReviewType(0.8, 0.85, 20);
      expect(reviewType).toBe(ReviewType.RETENTION);
    });
  });
});
