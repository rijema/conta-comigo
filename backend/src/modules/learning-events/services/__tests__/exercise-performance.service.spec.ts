import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExercisePerformanceService } from '../exercise-performance.service';
import { ExercisePerformance } from '../../entities/exercise-performance.entity';

describe('ExercisePerformanceService', () => {
  let service: ExercisePerformanceService;
  let mockRepository: jest.Mocked<Repository<ExercisePerformance>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisePerformanceService,
        {
          provide: getRepositoryToken(ExercisePerformance),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ExercisePerformanceService>(
      ExercisePerformanceService,
    );
  });

  describe('recordPerformance', () => {
    it('should record a performance entry', async () => {
      const input = {
        userId: 'user-123',
        activityId: 'activity-456',
        islandId: 'island-sun',
        isCorrect: true,
        score: 1,
        responseTimeMs: 5000,
        hintsUsed: 0,
      };

      const mockPerformance = { id: 'perf-789', ...input } as any;

      mockRepository.create.mockReturnValue(mockPerformance);
      mockRepository.save.mockResolvedValue(mockPerformance);

      const result = await service.recordPerformance(input);

      expect(mockRepository.create).toHaveBeenCalledWith(input);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPerformance);
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('getMetricsByUserAndActivity', () => {
    it('should calculate metrics correctly', async () => {
      const performances = [
        {
          isCorrect: true,
          score: 1,
          responseTimeMs: 5000,
          hintsUsed: 0,
          tutorialOpenedCount: 0,
          instructionReplayCount: 0,
          skipped: false,
        },
        {
          isCorrect: true,
          score: 1,
          responseTimeMs: 4000,
          hintsUsed: 1,
          tutorialOpenedCount: 1,
          instructionReplayCount: 0,
          skipped: false,
        },
        {
          isCorrect: false,
          score: 0,
          responseTimeMs: 8000,
          hintsUsed: 2,
          tutorialOpenedCount: 0,
          instructionReplayCount: 1,
          skipped: false,
        },
      ] as any;

      mockRepository.find.mockResolvedValue(performances);

      const metrics = await service.getMetricsByUserAndActivity(
        'user-123',
        'activity-456',
      );

      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.correctAttempts).toBe(2);
      expect(metrics.accuracy).toBeCloseTo(0.667, 2);
      expect(metrics.averageResponseTimeMs).toBeCloseTo(5667, 0);
      expect(metrics.totalHintsUsed).toBe(3);
      expect(metrics.averageHintsPerAttempt).toBe(1);
      expect(metrics.tutorialOpenedCount).toBe(1);
      expect(metrics.instructionReplayCount).toBe(1);
      expect(metrics.skippedCount).toBe(0);
      expect(metrics.averageScore).toBeCloseTo(0.667, 2);
    });

    it('should return zero metrics for empty performance', async () => {
      mockRepository.find.mockResolvedValue([]);

      const metrics = await service.getMetricsByUserAndActivity(
        'user-123',
        'activity-456',
      );

      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.accuracy).toBe(0);
      expect(metrics.averageResponseTimeMs).toBe(0);
    });
  });

  describe('getCompletedActivitiesInSession', () => {
    it('should return unique activity IDs', async () => {
      const performances = [
        { activityId: 'activity-1' },
        { activityId: 'activity-2' },
        { activityId: 'activity-1' }, // duplicate
        { activityId: 'activity-3' },
      ] as any;

      mockRepository.find.mockResolvedValue(performances);

      const completed = await service.getCompletedActivitiesInSession(
        'user-123',
        'session-456',
      );

      expect(completed).toHaveLength(3);
      expect(completed).toContain('activity-1');
      expect(completed).toContain('activity-2');
      expect(completed).toContain('activity-3');
    });
  });
});
