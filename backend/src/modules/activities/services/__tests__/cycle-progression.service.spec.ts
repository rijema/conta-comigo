import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CycleProgressionService } from '../cycle-progression.service';
import { ActivityAttempt } from '../../entities/activity-attempt.entity';
import { LearningEvent, LearningEventType } from '../../../learning-events/entities/learning-event.entity';

describe('CycleProgressionService', () => {
  let service: CycleProgressionService;
  let mockEventRepository: any;
  let mockAttemptRepository: any;

  beforeEach(async () => {
    mockEventRepository = {
      find: jest.fn(),
    };

    mockAttemptRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CycleProgressionService,
        {
          provide: getRepositoryToken(ActivityAttempt),
          useValue: mockAttemptRepository,
        },
        {
          provide: getRepositoryToken(LearningEvent),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<CycleProgressionService>(CycleProgressionService);
  });

  describe('deriveCurrentCycle', () => {
    it('should return cycle 1 when no activities completed', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(1);
    });

    it('should return cycle 1 when 1-9 activities completed', async () => {
      const completedEvents = Array.from({ length: 5 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(1);
    });

    it('should return cycle 1 when exactly 9 activities completed', async () => {
      const completedEvents = Array.from({ length: 9 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(1);
    });

    it('should return cycle 2 when exactly 10 activities completed', async () => {
      // [INTEGRATION 3C-FINAL]: 10 completed activities = cycle 2 starts
      const completedEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(2);
    });

    it('should return cycle 2 when 11-19 activities completed', async () => {
      const completedEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(2);
    });

    it('should return cycle 3 when exactly 20 activities completed', async () => {
      const completedEvents = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      expect(cycle).toBe(3);
    });

    it('should exclude activities from different islands', async () => {
      // [INTEGRATION 3C-FINAL]: Only count activities from the specified island
      const completedEvents = [
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `event-sun-${i}`,
          studentId: 'student-1',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          metadata: { islandId: 'island-sun' },
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `event-moon-${i}`,
          studentId: 'student-1',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          metadata: { islandId: 'island-moon' },
        })),
      ];

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      // Only 8 activities from island-sun count
      expect(cycle).toBe(1);
    });

    it('should exclude review attempts', async () => {
      // [INTEGRATION 3C-FINAL]: Review attempts do not increment cycle progression
      const completedEvents = [
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `event-normal-${i}`,
          studentId: 'student-1',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          metadata: { islandId: 'island-sun' },
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `event-review-${i}`,
          studentId: 'student-1',
          eventType: LearningEventType.ACTIVITY_COMPLETED,
          metadata: { islandId: 'island-sun', reviewAssignmentId: `review-${i}` },
        })),
      ];

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const cycle = await service.deriveCurrentCycle('student-1', 'island-sun');

      // Only 8 normal activities count, review attempts excluded
      expect(cycle).toBe(1);
    });
  });

  describe('deriveCurrentCyclePosition', () => {
    it('should return position 1 when no activities completed', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      const position = await service.deriveCurrentCyclePosition('student-1', 'island-sun');

      expect(position).toBe(1);
    });

    it('should return position 5 when 4 activities completed', async () => {
      const completedEvents = Array.from({ length: 4 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const position = await service.deriveCurrentCyclePosition('student-1', 'island-sun');

      expect(position).toBe(5);
    });

    it('should return position 10 when 9 activities completed', async () => {
      const completedEvents = Array.from({ length: 9 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const position = await service.deriveCurrentCyclePosition('student-1', 'island-sun');

      expect(position).toBe(10);
    });

    it('should return position 1 when 10 activities completed (cycle boundary)', async () => {
      // [INTEGRATION 3C-FINAL]: After 10 completions, position resets to 1 (cycle 2 starts)
      const completedEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const position = await service.deriveCurrentCyclePosition('student-1', 'island-sun');

      expect(position).toBe(1);
    });

    it('should return position 5 when 14 activities completed (cycle 2, position 5)', async () => {
      const completedEvents = Array.from({ length: 14 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const position = await service.deriveCurrentCyclePosition('student-1', 'island-sun');

      expect(position).toBe(5);
    });
  });

  describe('willNextActivityTriggerCheckpoint', () => {
    it('should return false when position < 10', async () => {
      const completedEvents = Array.from({ length: 5 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const willTrigger = await service.willNextActivityTriggerCheckpoint('student-1', 'island-sun');

      expect(willTrigger).toBe(false);
    });

    it('should return true when position = 10 (checkpoint will trigger)', async () => {
      // [INTEGRATION 3C-FINAL]: Position 10 means next completion triggers checkpoint
      const completedEvents = Array.from({ length: 9 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const willTrigger = await service.willNextActivityTriggerCheckpoint('student-1', 'island-sun');

      expect(willTrigger).toBe(true);
    });

    it('should return false when position = 1 (just started new cycle)', async () => {
      const completedEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        studentId: 'student-1',
        eventType: LearningEventType.ACTIVITY_COMPLETED,
        metadata: { islandId: 'island-sun' },
      }));

      mockEventRepository.find.mockResolvedValue(completedEvents);

      const willTrigger = await service.willNextActivityTriggerCheckpoint('student-1', 'island-sun');

      expect(willTrigger).toBe(false);
    });
  });

  describe('cycle size configuration', () => {
    it('should return cycle size of 10', () => {
      const size = service.getCycleSize();
      expect(size).toBe(10);
    });
  });
});
