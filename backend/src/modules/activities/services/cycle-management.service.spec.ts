import { Test, TestingModule } from '@nestjs/testing';
import { CycleManagementService } from './cycle-management.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentCycleTracking } from '../entities/student-cycle-tracking.entity';
import { CycleExerciseAssignment } from '../entities/cycle-exercise-assignment.entity';
import { Activity } from '../entities/activity.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CycleManagementService - Cycle Progression', () => {
  let service: CycleManagementService;
  let cycleRepo: Repository<StudentCycleTracking>;
  let assignmentRepo: Repository<CycleExerciseAssignment>;
  let activityRepo: Repository<Activity>;

  const mockUserId = 'student-123';
  const mockIslandId = 'island-sol';
  const mockCycleNumber = 1;
  const mockSkillFocus = 'EF01MA03';

  const mockCycle: StudentCycleTracking = {
    id: 'cycle-1',
    student_id: mockUserId,
    island_id: mockIslandId,
    cycle_number: mockCycleNumber,
    skill_focus: mockSkillFocus,
    current_position: 3,
    status: 'active',
    total_exercises: 10,
    exercises_completed_count: 2,
    created_at: new Date(),
    updated_at: new Date(),
    completed_at: null,
  } as any;

  const mockAssignment: CycleExerciseAssignment = {
    id: 'assign-1',
    cycle_tracking_id: 'cycle-1',
    activity_id: 'activity-1',
    position_in_cycle: 3,
    is_completed: false,
    student_score: null,
    completed_at: null,
  } as any;

  const mockActivity: Activity = {
    id: 'activity-1',
    title: 'Test Activity',
    bnccSkills: [mockSkillFocus],
    difficulty: 'easy',
    type: 'quiz',
    isActive: true,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CycleManagementService,
        {
          provide: getRepositoryToken(StudentCycleTracking),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CycleExerciseAssignment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CycleManagementService>(CycleManagementService);
    cycleRepo = module.get<Repository<StudentCycleTracking>>(
      getRepositoryToken(StudentCycleTracking),
    );
    assignmentRepo = module.get<Repository<CycleExerciseAssignment>>(
      getRepositoryToken(CycleExerciseAssignment),
    );
    activityRepo = module.get<Repository<Activity>>(getRepositoryToken(Activity));
  });

  describe('getCycleState', () => {
    it('should return cycle state with assignments', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(mockCycle);
      jest
        .spyOn(assignmentRepo, 'find')
        .mockResolvedValueOnce([mockAssignment]);
      jest.spyOn(activityRepo, 'findOne').mockResolvedValueOnce(mockActivity);

      // Act
      const result = await service.getCycleState(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
      );

      // Assert
      expect(result.cycle).toEqual(mockCycle);
      expect(result.currentPosition).toBe(3);
      expect(result.totalExercises).toBe(10);
      expect(result.status).toBe('active');
      expect(result.nextExercise).toEqual(mockActivity);
    });

    it('should throw NotFoundException if cycle not found', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.getCycleState(mockUserId, mockIslandId, mockCycleNumber),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeExercise - Cycle Progression', () => {
    it('should mark exercise complete and advance position', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(mockCycle);
      jest
        .spyOn(assignmentRepo, 'findOne')
        .mockResolvedValueOnce(mockAssignment);
      jest.spyOn(assignmentRepo, 'save').mockResolvedValueOnce(mockAssignment);
      jest.spyOn(cycleRepo, 'save').mockResolvedValueOnce({
        ...mockCycle,
        current_position: 4,
        exercises_completed_count: 3,
      });

      // Act
      const result = await service.completeExercise(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
        1.0, // Perfect score
      );

      // Assert
      expect(assignmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_completed: true,
          student_score: 1.0,
        }),
      );

      expect(cycleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          current_position: 4, // Advanced from 3
          exercises_completed_count: 3, // Incremented
        }),
      );
    });

    it('should mark cycle complete when position reaches 10', async () => {
      // Arrange
      const cycle10 = { ...mockCycle, current_position: 10, exercises_completed_count: 9 };
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(cycle10);
      jest
        .spyOn(assignmentRepo, 'findOne')
        .mockResolvedValueOnce(mockAssignment);
      jest.spyOn(assignmentRepo, 'save').mockResolvedValueOnce(mockAssignment);

      const savedCycle = {
        ...cycle10,
        status: 'completed' as const,
        completed_at: new Date(),
        exercises_completed_count: 10,
      };
      jest.spyOn(cycleRepo, 'save').mockResolvedValueOnce(savedCycle);

      // Act
      await service.completeExercise(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
        1.0,
      );

      // Assert
      expect(cycleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          exercises_completed_count: 10,
        }),
      );
    });

    it('should record partial score (0.5) for partially correct answers', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(mockCycle);
      jest
        .spyOn(assignmentRepo, 'findOne')
        .mockResolvedValueOnce(mockAssignment);
      jest.spyOn(assignmentRepo, 'save').mockResolvedValueOnce(mockAssignment);
      jest.spyOn(cycleRepo, 'save').mockResolvedValueOnce(mockCycle);

      // Act
      await service.completeExercise(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
        0.5,
      );

      // Assert
      expect(assignmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          student_score: 0.5,
        }),
      );
    });

    it('should record zero score for incorrect answers', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(mockCycle);
      jest
        .spyOn(assignmentRepo, 'findOne')
        .mockResolvedValueOnce(mockAssignment);
      jest.spyOn(assignmentRepo, 'save').mockResolvedValueOnce(mockAssignment);
      jest.spyOn(cycleRepo, 'save').mockResolvedValueOnce(mockCycle);

      // Act
      await service.completeExercise(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
        0.0,
      );

      // Assert
      expect(assignmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          student_score: 0.0,
        }),
      );
    });

    it('should throw NotFoundException if cycle not found', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.completeExercise(
          mockUserId,
          mockIslandId,
          mockCycleNumber,
          1.0,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCycleProgress', () => {
    it('should return detailed progress information', async () => {
      // Arrange
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(mockCycle);
      jest
        .spyOn(assignmentRepo, 'find')
        .mockResolvedValueOnce([mockAssignment]);

      // Act
      const result = await service.getCycleProgress(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
      );

      expect(result).toBeDefined();
      expect(result.cycle).toEqual(mockCycle);
      expect(result.progress.completed).toBe(2);
      expect(result.progress.percentage).toBe(20); // 2/10 = 20%
    });
  });

  describe('Cycle state transitions', () => {
    it('should track progression from active to completed', async () => {
      // Arrange: Start with position 9 (last exercise)
      const penultimate = { ...mockCycle, current_position: 9, exercises_completed_count: 8 };
      jest.spyOn(cycleRepo, 'findOne').mockResolvedValueOnce(penultimate);
      jest
        .spyOn(assignmentRepo, 'findOne')
        .mockResolvedValueOnce(mockAssignment);
      jest.spyOn(assignmentRepo, 'save').mockResolvedValueOnce(mockAssignment);

      const completed = {
        ...penultimate,
        current_position: 10,
        exercises_completed_count: 9,
        status: 'completed' as const,
        completed_at: new Date(),
      };
      jest.spyOn(cycleRepo, 'save').mockResolvedValueOnce(completed);

      // Act
      await service.completeExercise(
        mockUserId,
        mockIslandId,
        mockCycleNumber,
        1.0,
      );

      // Assert: Final save should mark as completed
      expect(cycleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        }),
      );
    });
  });
});
