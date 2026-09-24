import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseProgressionService } from '../exercise-progression.service';
import { Activity } from '../../entities/activity.entity';
import { ExercisePerformance } from '../../../learning-events/entities/exercise-performance.entity';
import { ExercisePerformanceService } from '../../../learning-events/services/exercise-performance.service';

describe('ExerciseProgressionService', () => {
  let service: ExerciseProgressionService;
  let mockActivityRepository: jest.Mocked<Repository<Activity>>;
  let mockPerformanceService: jest.Mocked<ExercisePerformanceService>;

  beforeEach(async () => {
    mockActivityRepository = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockPerformanceService = {
      getCompletedActivitiesInSession: jest.fn(),
      getCompletedActivitiesInIsland: jest.fn(),
      getMetricsByUserAndIsland: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseProgressionService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
        },
        {
          provide: getRepositoryToken(ExercisePerformance),
          useValue: {},
        },
        {
          provide: ExercisePerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    service = module.get<ExerciseProgressionService>(
      ExerciseProgressionService,
    );
  });

  describe('suggestNextExercise', () => {
    it('should suggest a new exercise with appropriate difficulty based on accuracy', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          title: 'Contar estrelas',
          difficulty: 'easy',
        },
        {
          id: 'activity-2',
          title: 'Contar maçãs',
          difficulty: 'medium',
        },
      ] as any;

      const mockMetrics = {
        totalAttempts: 5,
        correctAttempts: 4,
        accuracy: 0.8,
        averageResponseTimeMs: 5000,
        totalHintsUsed: 2,
        averageHintsPerAttempt: 0.4,
        tutorialOpenedCount: 1,
        instructionReplayCount: 0,
        skippedCount: 0,
        averageScore: 0.8,
      };

      mockPerformanceService.getCompletedActivitiesInSession.mockResolvedValue(
        [],
      );
      mockPerformanceService.getCompletedActivitiesInIsland.mockResolvedValue([
        'activity-1',
      ]);
      mockPerformanceService.getMetricsByUserAndIsland.mockResolvedValue(
        mockMetrics,
      );

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActivities),
      };

      mockActivityRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const suggestion = await service.suggestNextExercise(
        'user-123',
        'island-sun',
        'session-456',
      );

      expect(suggestion).toBeDefined();
      expect(suggestion?.activityId).toBeDefined();
      expect(suggestion?.title).toBeDefined();
      expect(suggestion?.difficulty).toBeDefined();
      expect(suggestion?.reason).toBeDefined();
      expect(suggestion?.score).toBeGreaterThan(0);
    });

    it('should avoid activities already done in current session', async () => {
      mockPerformanceService.getCompletedActivitiesInSession.mockResolvedValue(
        ['activity-1'],
      );
      mockPerformanceService.getCompletedActivitiesInIsland.mockResolvedValue([
        'activity-1',
      ]);
      mockPerformanceService.getMetricsByUserAndIsland.mockResolvedValue({
        totalAttempts: 1,
        correctAttempts: 1,
        accuracy: 1,
        averageResponseTimeMs: 5000,
        totalHintsUsed: 0,
        averageHintsPerAttempt: 0,
        tutorialOpenedCount: 0,
        instructionReplayCount: 0,
        skippedCount: 0,
        averageScore: 1,
      });

      const mockActivities = [
        {
          id: 'activity-2',
          title: 'Contar maçãs',
          difficulty: 'hard',
        },
      ] as any;

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActivities),
      };

      mockActivityRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const suggestion = await service.suggestNextExercise(
        'user-123',
        'island-sun',
        'session-456',
      );

      expect(suggestion?.activityId).toBe('activity-2');
    });
  });

  describe('getIslandProgress', () => {
    it('should return complete island progress', async () => {
      const mockActivities = [
        { id: 'activity-1', title: 'Contar', difficulty: 'easy' },
        { id: 'activity-2', title: 'Contar mais', difficulty: 'medium' },
      ] as any;

      const mockMetrics = {
        totalAttempts: 10,
        correctAttempts: 7,
        accuracy: 0.7,
        averageResponseTimeMs: 5000,
        totalHintsUsed: 5,
        averageHintsPerAttempt: 0.5,
        tutorialOpenedCount: 2,
        instructionReplayCount: 1,
        skippedCount: 0,
        averageScore: 0.7,
      };

      mockPerformanceService.getCompletedActivitiesInIsland.mockResolvedValue(
        ['activity-1'],
      );
      mockPerformanceService.getMetricsByUserAndIsland.mockResolvedValue(
        mockMetrics,
      );

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockActivities),
      };

      mockActivityRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const progress = await service.getIslandProgress(
        'user-123',
        'island-sun',
      );

      expect(progress.completedCount).toBe(1);
      expect(progress.totalCount).toBe(2);
      expect(progress.accuracy).toBe(0.7);
      expect(progress.averageTimeSeconds).toBe(5);
      expect(progress.nextSuggestion).toBeDefined();
    });
  });
});
