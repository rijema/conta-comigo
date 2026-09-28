import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IslandContextService } from './island-context.service';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

describe('IslandContextService', () => {
  let service: IslandContextService;
  let mockAttemptRepo: any;

  beforeEach(async () => {
    mockAttemptRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IslandContextService,
        {
          provide: getRepositoryToken(ActivityAttempt),
          useValue: mockAttemptRepo,
        },
      ],
    }).compile();

    service = module.get<IslandContextService>(IslandContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeIslandContext', () => {
    it('should return empty context when no attempts exist', async () => {
      mockAttemptRepo.find.mockResolvedValue([]);

      const context = await service.analyzeIslandContext('user-123');

      expect(context).toEqual({});
    });

    it('should calculate success rate by activity type', async () => {
      const attempts = [
        {
          isCorrect: true,
          activity: { type: 'quiz' },
          createdAt: new Date(),
          islandId: 'island-numbers',
        },
        {
          isCorrect: true,
          activity: { type: 'quiz' },
          createdAt: new Date(),
          islandId: 'island-numbers',
        },
        {
          isCorrect: false,
          activity: { type: 'drag_drop' },
          createdAt: new Date(),
          islandId: 'island-numbers',
        },
      ];

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const context = await service.analyzeIslandContext('user-123');

      expect(context.successRateByType).toBeDefined();
      expect(context.successRateByType?.quiz).toBe(1.0); // 2/2
      expect(context.successRateByType?.drag_drop).toBe(0); // 0/1
    });

    it('should calculate time since last attempt', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const attempts = [
        {
          isCorrect: true,
          activity: { type: 'quiz' },
          createdAt: oneHourAgo,
          adeDecisionContext: { islandId: 'island-numbers' },
        },
      ];

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const context = await service.analyzeIslandContext('user-123');

      expect(context.timeSinceLastAttempt).toBeDefined();
      expect(context.timeSinceLastAttempt).toBeGreaterThanOrEqual(3600000);
      expect(context.timeSinceLastAttempt).toBeLessThan(3600000 + 5000); // Allow 5s margin
    });

    it('should extract current island from recent attempts', async () => {
      const attempts = [
        {
          isCorrect: true,
          activity: { type: 'quiz' },
          createdAt: new Date(),
          islandId: 'island-colors',
        },
        {
          isCorrect: true,
          activity: { type: 'quiz' },
          createdAt: new Date(Date.now() - 1000),
          islandId: 'island-numbers',
        },
      ];

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const context = await service.analyzeIslandContext('user-123');

      expect(context.currentIslandId).toBe('island-colors'); // Most recent
    });

    it('should calculate island progress', async () => {
      const attempts = Array.from({ length: 8 }, (_, i) => ({
        isCorrect: true,
        activity: { type: 'quiz' },
        createdAt: new Date(),
        islandId: 'island-numbers',
        cycleNumber: i + 1,
        activityId: `activity-${i}`,
      }));

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const context = await service.analyzeIslandContext('user-123');

      // 8 unique activities / 10 per island = 80%
      expect(context.islandProgress).toBe(80);
    });
  });

  describe('enhanceAdeDecision', () => {
    it('should recommend starting with island-numbers when no context', async () => {
      mockAttemptRepo.find.mockResolvedValue([]);

      const enhancement = await service.enhanceAdeDecision(
        'user-123',
        'medium',
        'visual',
      );

      expect(enhancement.islandId).toBe('island-numbers');
      expect(enhancement.sequenceInIsland).toBe(1);
      expect(enhancement.shouldStayInIsland).toBe(true);
    });

    it('should recommend staying in island when progress < 80%', async () => {
      const attempts = Array.from({ length: 5 }, (_, i) => ({
        isCorrect: true,
        activity: { type: 'quiz' },
        createdAt: new Date(),
        islandId: 'island-numbers',
        activityId: `activity-${i}`,
      }));

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const enhancement = await service.enhanceAdeDecision(
        'user-123',
        'medium',
        'visual',
      );

      expect(enhancement.shouldStayInIsland).toBe(true);
      expect(enhancement.shouldProgressToNextIsland).toBe(false);
    });

    it('should recommend progressing to next island when progress >= 80% and success >= 75%', async () => {
      const attempts = Array.from({ length: 10 }, (_, i) => ({
        isCorrect: i < 8, // 8/10 = 80% success
        activity: { type: 'quiz' },
        createdAt: new Date(),
        islandId: 'island-numbers',
        cycleNumber: i + 1,
        activityId: `activity-${i}`,
      }));

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const enhancement = await service.enhanceAdeDecision(
        'user-123',
        'medium',
        'visual',
      );

      expect(enhancement.shouldProgressToNextIsland).toBe(true);
    });
  });

  describe('getNextIsland', () => {
    it('should return next island in sequence', () => {
      expect(service.getNextIsland('island-numbers')).toBe('island-colors');
      expect(service.getNextIsland('island-colors')).toBe('island-beach');
    });

    it('should return undefined for last island', () => {
      expect(service.getNextIsland('island-school')).toBeUndefined();
    });

    it('should return undefined for unknown island', () => {
      expect(service.getNextIsland('island-unknown')).toBeUndefined();
    });
  });

  describe('getRecommendedSequencePosition', () => {
    it('should return 1 when no attempts in island', async () => {
      mockAttemptRepo.find.mockResolvedValue([]);

      const position = await service.getRecommendedSequencePosition(
        'user-123',
        'island-numbers',
      );

      expect(position).toBe(1);
    });

    it('should return next sequence when 4+ of last 5 correct', async () => {
      const attempts = Array.from({ length: 5 }, (_, i) => ({
        isCorrect: i < 4, // 4/5 correct
        activity: { type: 'quiz' },
        createdAt: new Date(Date.now() - i * 1000),
        islandId: 'island-numbers',
        cycleNumber: 3,
        activityId: `activity-${i}`,
      }));

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const position = await service.getRecommendedSequencePosition(
        'user-123',
        'island-numbers',
      );

      expect(position).toBe(4); // Advance from 3 to 4
    });

    it('should stay at current sequence when < 4 of last 5 correct', async () => {
      const attempts = Array.from({ length: 5 }, (_, i) => ({
        isCorrect: i < 2, // 2/5 correct
        activity: { type: 'quiz' },
        createdAt: new Date(Date.now() - i * 1000),
        islandId: 'island-numbers',
        cycleNumber: 3,
        activityId: `activity-${i}`,
      }));

      mockAttemptRepo.find.mockResolvedValue(attempts);

      const position = await service.getRecommendedSequencePosition(
        'user-123',
        'island-numbers',
      );

      expect(position).toBe(3); // Stay at 3
    });
  });
});
