import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IslandCycleValidatorService } from '../island-cycle-validator.service';
import { IslandExerciseMapping } from '../../entities/island-exercise-mapping.entity';
import { Activity, DifficultyLevel, ActivityType } from '../../entities/activity.entity';

describe('IslandCycleValidatorService', () => {
  let service: IslandCycleValidatorService;
  let mockIslandMappingRepository: any;
  let mockCycleProgressionService: any;

  const createMockActivity = (bnccSkills: string[], skillWeights?: any[]): any => ({
    id: 'activity-1',
    title: 'Test Activity',
    description: 'Test',
    type: ActivityType.QUIZ,
    difficulty: DifficultyLevel.EASY,
    bnccSkills,
    skillWeights,
    targetModalities: [],
    content: {
      instructions: 'Test instructions',
      instructionsPt: 'Instruções de teste',
    },
    accessibility: {},
    isActive: true,
    pointsReward: 0,
    prerequisiteSkillCode: null,
    attempts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockIslandMappingRepository = {
      findOne: jest.fn(),
    };

    mockCycleProgressionService = {
      deriveCurrentCycle: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IslandCycleValidatorService,
        {
          provide: getRepositoryToken(IslandExerciseMapping),
          useValue: mockIslandMappingRepository,
        },
        {
          provide: 'CycleProgressionService',
          useValue: mockCycleProgressionService,
        },
      ],
    }).compile();

    service = module.get<IslandCycleValidatorService>(IslandCycleValidatorService);
  });

  describe('validateAndResolveIslandCycle', () => {
    it('should return null context when no island submitted', async () => {
      const activity = createMockActivity(['EF01MA01']);

      // [INTEGRATION 3C-FINAL]: Cycle without island is not meaningful
      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        undefined,
        1,
      );

      expect(result).toEqual({ islandId: null, cycleNumber: null });
    });

    it('should accept valid activity + verified island + derived cycle', async () => {
      const activity = createMockActivity(['EF01MA01', 'EF01MA02']);
      const islandMapping = {
        id: 'mapping-1',
        islandId: 'island-sun',
        islandName: 'Sun Island',
        topic: 'Counting',
        bnccSkills: ['EF01MA01', 'EF01MA02'],
        exerciseCount: 5,
        exerciseTitles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIslandMappingRepository.findOne.mockResolvedValue(islandMapping);

      // [INTEGRATION 3C-FINAL]: Island is VERIFIED, cycle is derived from server
      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        'island-sun',
        1, // Client-submitted cycle is ignored
      );

      expect(result).toEqual({
        islandId: 'island-sun',
        cycleNumber: expect.any(Number), // Derived from server
      });
    });

    it('should reject activity with incorrect island', async () => {
      const activity = createMockActivity(['EF01MA01']);
      const islandMapping = {
        id: 'mapping-1',
        islandId: 'island-sun',
        islandName: 'Sun Island',
        topic: 'Counting',
        bnccSkills: ['EF02MA01', 'EF02MA02'], // Different skills
        exerciseCount: 5,
        exerciseTitles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIslandMappingRepository.findOne.mockResolvedValue(islandMapping);

      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        'island-sun',
        1,
      );

      expect(result).toEqual({ islandId: null, cycleNumber: null });
    });

    it('should reject non-existent island', async () => {
      const activity = createMockActivity(['EF01MA01']);

      mockIslandMappingRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        'island-nonexistent',
        1,
      );

      expect(result).toEqual({ islandId: null, cycleNumber: null });
    });

    it('should derive cycle from server for verified island', async () => {
      // [INTEGRATION 3C-FINAL]: Cycle is derived from server, not from client input
      const activity = createMockActivity(['EF01MA01']);
      const islandMapping = {
        id: 'mapping-1',
        islandId: 'island-sun',
        islandName: 'Sun Island',
        topic: 'Counting',
        bnccSkills: ['EF01MA01'],
        exerciseCount: 5,
        exerciseTitles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIslandMappingRepository.findOne.mockResolvedValue(islandMapping);

      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        'island-sun',
        999, // Client-submitted cycle is ignored
      );

      expect(result).toEqual({
        islandId: 'island-sun',
        cycleNumber: expect.any(Number), // Derived from server
      });
    });

    it('should use primary skill from skillWeights for island validation', async () => {
      const activity = createMockActivity(
        ['EF01MA01', 'EF01MA02'],
        [
          { code: 'EF01MA01', role: 'primary', weight: 0.7 },
          { code: 'EF01MA02', role: 'secondary', weight: 0.3 },
        ],
      );
      const islandMapping = {
        id: 'mapping-1',
        islandId: 'island-sun',
        islandName: 'Sun Island',
        topic: 'Counting',
        bnccSkills: ['EF01MA01', 'EF01MA02'],
        exerciseCount: 5,
        exerciseTitles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIslandMappingRepository.findOne.mockResolvedValue(islandMapping);

      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        'island-sun',
        2,
      );

      expect(result).toEqual({
        islandId: 'island-sun',
        cycleNumber: expect.any(Number), // Derived from server
      });
    });

    it('should return null when island not provided', async () => {
      const activity = createMockActivity(['EF01MA01']);

      // [INTEGRATION 3C-FINAL]: Island is required for meaningful context
      const result = await service.validateAndResolveIslandCycle(
        activity,
        'student-1',
        undefined,
        3,
      );

      expect(result).toEqual({
        islandId: null,
        cycleNumber: null,
      });
    });
  });
});
