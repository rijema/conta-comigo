import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewSelectionService } from '../review-selection.service';
import { Activity } from '../../../activities/entities/activity.entity';
import { LearningEvent } from '../../entities/learning-event.entity';
import { StudentSkillState } from '../../../knowledge-tracing/entities/student-skill-state.entity';
import { OntologyService } from '../../../ontology/ontology.service';
import { HybridRecommendationService } from '../../../ade/hybrid-recommendation.service';
import { ReviewType } from '../../entities/review-assignment.entity';

describe('ReviewSelectionService', () => {
  let service: ReviewSelectionService;
  let mockActivityRepository: any;
  let mockEventRepository: any;
  let mockSkillStateRepository: any;
  let mockOntologyService: any;
  let mockHybridRecommendationService: any;

  beforeEach(async () => {
    mockActivityRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockEventRepository = {
      find: jest.fn(),
    };

    mockSkillStateRepository = {
      find: jest.fn(),
    };

    mockOntologyService = {
      getValidActivityCandidates: jest.fn(),
    };

    mockHybridRecommendationService = {
      rank: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewSelectionService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepository,
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
          provide: OntologyService,
          useValue: mockOntologyService,
        },
        {
          provide: HybridRecommendationService,
          useValue: mockHybridRecommendationService,
        },
      ],
    }).compile();

    service = module.get<ReviewSelectionService>(ReviewSelectionService);
  });

  describe('Semantic Filtering', () => {
    it('should apply semantic filtering before selection', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      const activity = {
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
        accessibility: { sensoryLoad: 'low' },
      };

      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      const profile: any = {
        studentId,
        accessibilityNeeds: { sensoryLoad: 'low' as const },
      };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.activity).toBeDefined();
      expect(selection.templateId).toBe('activity-1');
    });
  });

  describe('Review Type Filtering', () => {
    it('should select activity for REMEDIATION review', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      const activity1 = {
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
        difficulty: 'easy',
      };

      const activity2 = {
        id: 'activity-2',
        bnccSkills: [skillId],
        isActive: true,
        difficulty: 'hard',
      };

      mockActivityRepository.find.mockResolvedValue([activity1, activity2]);
      mockActivityRepository.findOne.mockResolvedValue(activity1);
      mockEventRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      // REMEDIATION should prefer easier activities
      expect(selection.activity.difficulty).toBe('easy');
    });

    it('should select activity for RETENTION review', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      const activity = {
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
        difficulty: 'medium',
      };

      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.RETENTION, profile);

      expect(selection.reviewType).toBe(ReviewType.RETENTION);
    });

    it('should select activity for GENERALIZATION review', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      const activity = {
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
        difficulty: 'medium',
      };

      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.GENERALIZATION, profile);

      expect(selection.reviewType).toBe(ReviewType.GENERALIZATION);
    });
  });

  describe('Instance Selection', () => {
    it('should mark instance as EQUIVALENT_INSTANCE when different from recent', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [skillId],
          isActive: true,
          difficulty: 'medium',
        },
      ]);

      mockActivityRepository.findOne.mockResolvedValue({
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
        difficulty: 'medium',
      });

      mockEventRepository.find.mockResolvedValue([
        {
          id: 'event-1',
          activityId: 'activity-1',
          timestamp: new Date(),
        },
      ]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.instanceComparison).toBe('EQUIVALENT_INSTANCE');
    });

    it('should generate unique instance ID', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [skillId],
          isActive: true,
        },
      ]);

      mockActivityRepository.findOne.mockResolvedValue({
        id: 'activity-1',
        bnccSkills: [skillId],
        isActive: true,
      });

      mockEventRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.instanceId).toBeDefined();
      expect(selection.instanceId).not.toBe(selection.templateId);
      expect((selection.activity as any).templateId).toBe(selection.templateId);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no eligible activities found', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockActivityRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      await expect(service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile)).rejects.toThrow(
        'No eligible activities found',
      );
    });

    it('should throw error when no semantically valid activities', async () => {
      const skillId = 'skill-1';
      const studentId = 'student-1';

      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [skillId],
          isActive: true,
          accessibility: { sensoryLoad: 'high' },
        },
      ]);

      const profile: any = {
        studentId,
        accessibilityNeeds: { sensoryLoad: 'low' as const },
      };

      await expect(service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile)).rejects.toThrow(
        'No semantically valid activities',
      );
    });
  });
});
