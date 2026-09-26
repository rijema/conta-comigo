import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewSelectionService } from '../review-selection.service';
import { Activity } from '../../../activities/entities/activity.entity';
import { LearningEvent } from '../../entities/learning-event.entity';
import { StudentSkillState } from '../../../knowledge-tracing/entities/student-skill-state.entity';
import { BnccSkill } from '../../../ontology/entities/bncc-skill.entity';
import { OntologyService } from '../../../ontology/ontology.service';
import { RuntimeSemanticAdapter } from '../../../ontology/runtime-semantic.adapter';
import { HybridRecommendationService } from '../../../ade/hybrid-recommendation.service';
import { ReviewType } from '../../entities/review-assignment.entity';

describe('ReviewSelectionService', () => {
  let service: ReviewSelectionService;
  let mockActivityRepository: any;
  let mockEventRepository: any;
  let mockSkillStateRepository: any;
  let mockBnccSkillRepository: any;
  let mockOntologyService: any;
  let mockRuntimeSemanticAdapter: any;
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

    mockBnccSkillRepository = {
      findOne: jest.fn(),
    };

    mockOntologyService = {
      getValidActivityCandidates: jest.fn(),
    };

    mockRuntimeSemanticAdapter = {
      materialize: jest.fn(),
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
          provide: getRepositoryToken(BnccSkill),
          useValue: mockBnccSkillRepository,
        },
        {
          provide: OntologyService,
          useValue: mockOntologyService,
        },
        {
          provide: RuntimeSemanticAdapter,
          useValue: mockRuntimeSemanticAdapter,
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
    it('should invoke OntologyService for semantic validation', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = {
        id: skillId,
        code: bnccCode,
      };

      const activity = {
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'medium',
        affordances: {},
        difficultyProfile: {},
      };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      // Mock semantic adapter and ontology service
      mockRuntimeSemanticAdapter.materialize.mockReturnValue({
        studentId,
        targetSkill: bnccCode,
        mastery: { source: 'StudentSkillState', probability: null },
        learningAnalytics: { recentAccuracy: null },
        observedEvidenceTypes: [],
        hardConstraints: { disallowDragging: false, requireAudio: false },
        activities: [{
          activityId: 'activity-1',
          bnccSkills: [bnccCode],
          mathematicalConcepts: [],
          representations: [],
          interactionTypes: [],
          affordances: {},
          difficultyProfile: {},
          mappingStatus: 'UNMAPPED',
        }],
      });

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: ['activity-1'],
        excludedCandidateIds: [],
        trace: {
          targetSkill: bnccCode,
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: 'activity-1',
        candidateIds: ['activity-1'],
        candidates: [{
          activityId: 'activity-1',
          finalScore: 0.8,
          bnccSkills: [bnccCode],
          difficulty: 'medium',
          activityType: 'exercise',
          structureId: null,
          learningNeed: 0.5,
          challengeFit: 0.5,
          interactionFit: 0.5,
          semanticFit: 0.5,
          novelty: 0.5,
          rejectionRisk: 0.0,
          sensoryFit: 0.5,
          formatFit: 0.5,
          repetitionRisk: 0.0,
          frustrationRisk: 0.0,
          predictedSuccess: 0.7,
          progressDerivative: 0.0,
          performanceIntegral: 0.0,
          dominanceNormalization: 0.0,
          recencyPenalty: 0.0,
          insufficientEvidence: [],
          explanation: {
            semanticValidityReasons: [],
            positiveContributions: {},
            penalties: {},
          },
        }],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: 'activity-1',
          comparedWith: [],
          scoreMargin: null,
        },
      });

      const profile: any = {
        studentId,
        accessibilityNeeds: { sensoryLoad: 'low' as const },
      };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.activity).toBeDefined();
      expect(selection.templateId).toBe('activity-1');
      expect(mockOntologyService.getValidActivityCandidates).toHaveBeenCalled();
      expect(mockHybridRecommendationService.rank).toHaveBeenCalled();
    });
  });

  describe('Review Type Filtering', () => {
    beforeEach(() => {
      // Setup default mocks for all tests
      mockRuntimeSemanticAdapter.materialize.mockReturnValue({
        studentId: 'student-1',
        targetSkill: 'EF01MA01',
        mastery: { source: 'StudentSkillState', probability: null },
        learningAnalytics: { recentAccuracy: null },
        observedEvidenceTypes: [],
        hardConstraints: { disallowDragging: false, requireAudio: false },
        activities: [],
      });

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: [],
        excludedCandidateIds: [],
        trace: {
          targetSkill: 'EF01MA01',
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: null,
        candidateIds: [],
        candidates: [],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: null,
          comparedWith: [],
          scoreMargin: null,
        },
      });
    });

    it('should select activity for REMEDIATION review', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      const activity1 = {
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'easy',
        affordances: {},
        difficultyProfile: {},
      };

      const activity2 = {
        id: 'activity-2',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'hard',
        affordances: {},
        difficultyProfile: {},
      };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([activity1, activity2]);
      mockActivityRepository.findOne.mockResolvedValue(activity1);
      mockEventRepository.find.mockResolvedValue([]);

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: ['activity-1', 'activity-2'],
        excludedCandidateIds: [],
        trace: {
          targetSkill: bnccCode,
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: 'activity-1',
        candidateIds: ['activity-1', 'activity-2'],
        candidates: [
          {
            activityId: 'activity-1',
            finalScore: 0.8,
            bnccSkills: [bnccCode],
            difficulty: 'easy',
            activityType: 'exercise',
            structureId: null,
            learningNeed: 0.5,
            challengeFit: 0.5,
            interactionFit: 0.5,
            semanticFit: 0.5,
            novelty: 0.5,
            rejectionRisk: 0.0,
            sensoryFit: 0.5,
            formatFit: 0.5,
            repetitionRisk: 0.0,
            frustrationRisk: 0.0,
            predictedSuccess: 0.7,
            progressDerivative: 0.0,
            performanceIntegral: 0.0,
            dominanceNormalization: 0.0,
            recencyPenalty: 0.0,
            insufficientEvidence: [],
            explanation: {
              semanticValidityReasons: [],
              positiveContributions: {},
              penalties: {},
            },
          },
        ],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: 'activity-1',
          comparedWith: ['activity-2'],
          scoreMargin: 0.2,
        },
      });

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.activity.id).toBe('activity-1');
    });

    it('should select activity for RETENTION review', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      const activity = {
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'medium',
        affordances: {},
        difficultyProfile: {},
      };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: ['activity-1'],
        excludedCandidateIds: [],
        trace: {
          targetSkill: bnccCode,
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: 'activity-1',
        candidateIds: ['activity-1'],
        candidates: [{
          activityId: 'activity-1',
          finalScore: 0.75,
          bnccSkills: [bnccCode],
          difficulty: 'medium',
          activityType: 'exercise',
          structureId: null,
          learningNeed: 0.5,
          challengeFit: 0.5,
          interactionFit: 0.5,
          semanticFit: 0.5,
          novelty: 0.5,
          rejectionRisk: 0.0,
          sensoryFit: 0.5,
          formatFit: 0.5,
          repetitionRisk: 0.0,
          frustrationRisk: 0.0,
          predictedSuccess: 0.7,
          progressDerivative: 0.0,
          performanceIntegral: 0.0,
          dominanceNormalization: 0.0,
          recencyPenalty: 0.0,
          insufficientEvidence: [],
          explanation: {
            semanticValidityReasons: [],
            positiveContributions: {},
            penalties: {},
          },
        }],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: 'activity-1',
          comparedWith: [],
          scoreMargin: null,
        },
      });

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.RETENTION, profile);

      expect(selection.reviewType).toBe(ReviewType.RETENTION);
    });

    it('should select activity for GENERALIZATION review', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      const activity = {
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'medium',
        affordances: {},
        difficultyProfile: {},
      };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([activity]);
      mockActivityRepository.findOne.mockResolvedValue(activity);
      mockEventRepository.find.mockResolvedValue([]);

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: ['activity-1'],
        excludedCandidateIds: [],
        trace: {
          targetSkill: bnccCode,
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: 'activity-1',
        candidateIds: ['activity-1'],
        candidates: [{
          activityId: 'activity-1',
          finalScore: 0.75,
          bnccSkills: [bnccCode],
          difficulty: 'medium',
          activityType: 'exercise',
          structureId: null,
          learningNeed: 0.5,
          challengeFit: 0.5,
          interactionFit: 0.5,
          semanticFit: 0.5,
          novelty: 0.5,
          rejectionRisk: 0.0,
          sensoryFit: 0.5,
          formatFit: 0.5,
          repetitionRisk: 0.0,
          frustrationRisk: 0.0,
          predictedSuccess: 0.7,
          progressDerivative: 0.0,
          performanceIntegral: 0.0,
          dominanceNormalization: 0.0,
          recencyPenalty: 0.0,
          insufficientEvidence: [],
          explanation: {
            semanticValidityReasons: [],
            positiveContributions: {},
            penalties: {},
          },
        }],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: 'activity-1',
          comparedWith: [],
          scoreMargin: null,
        },
      });

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.GENERALIZATION, profile);

      expect(selection.reviewType).toBe(ReviewType.GENERALIZATION);
    });
  });

  describe('Instance Selection', () => {
    beforeEach(() => {
      // Setup default mocks for instance selection tests
      mockRuntimeSemanticAdapter.materialize.mockReturnValue({
        studentId: 'student-1',
        targetSkill: 'EF01MA01',
        mastery: { source: 'StudentSkillState', probability: null },
        learningAnalytics: { recentAccuracy: null },
        observedEvidenceTypes: [],
        hardConstraints: { disallowDragging: false, requireAudio: false },
        activities: [],
      });

      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: ['activity-1'],
        excludedCandidateIds: [],
        trace: {
          targetSkill: 'EF01MA01',
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

      mockHybridRecommendationService.rank.mockReturnValue({
        selectedActivityId: 'activity-1',
        candidateIds: ['activity-1'],
        candidates: [{
          activityId: 'activity-1',
          finalScore: 0.75,
          bnccSkills: ['EF01MA01'],
          difficulty: 'medium',
          activityType: 'exercise',
          structureId: null,
          learningNeed: 0.5,
          challengeFit: 0.5,
          interactionFit: 0.5,
          semanticFit: 0.5,
          novelty: 0.5,
          rejectionRisk: 0.0,
          sensoryFit: 0.5,
          formatFit: 0.5,
          repetitionRisk: 0.0,
          frustrationRisk: 0.0,
          predictedSuccess: 0.7,
          progressDerivative: 0.0,
          performanceIntegral: 0.0,
          dominanceNormalization: 0.0,
          recencyPenalty: 0.0,
          insufficientEvidence: [],
          explanation: {
            semanticValidityReasons: [],
            positiveContributions: {},
            penalties: {},
          },
        }],
        weights: {},
        configurationVersion: 'test',
        rankingVersion: 'test',
        ontologyVersion: 'test',
        decisionSource: 'HYBRID_RANKING',
        fallbackUsed: false,
        fallbackReason: null,
        selectionExplanation: {
          selectedActivityId: 'activity-1',
          comparedWith: [],
          scoreMargin: null,
        },
      });
    });

    it('should mark instance as EXACT_REPEAT when same activity seen recently', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [bnccCode],
          isActive: true,
          difficulty: 'medium',
          affordances: {},
          difficultyProfile: {},
        },
      ]);

      mockActivityRepository.findOne.mockResolvedValue({
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'medium',
        affordances: {},
        difficultyProfile: {},
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

      expect(selection.instanceComparison).toBe('EXACT_REPEAT');
    });

    it('should return real persisted activity ID', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [bnccCode],
          isActive: true,
          difficulty: 'medium',
          affordances: {},
          difficultyProfile: {},
        },
      ]);

      mockActivityRepository.findOne.mockResolvedValue({
        id: 'activity-1',
        bnccSkills: [bnccCode],
        isActive: true,
        difficulty: 'medium',
        affordances: {},
        difficultyProfile: {},
      });

      mockEventRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      const selection = await service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile);

      expect(selection.instanceId).toBeDefined();
      expect(selection.instanceId).toBe(selection.templateId);
      expect(selection.instanceId).toBe('activity-1');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no eligible activities found', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';

      const bnccSkill = { id: skillId, code: 'EF01MA01' };
      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([]);

      const profile = { studentId };

      await expect(service.selectReviewActivity(skillId, skillId, ReviewType.REMEDIATION, profile)).rejects.toThrow(
        'No eligible activities found',
      );
    });

    it('should throw error when no semantically valid activities', async () => {
      const skillId = 'skill-uuid-1';
      const studentId = 'student-1';
      const bnccCode = 'EF01MA01';

      const bnccSkill = { id: skillId, code: bnccCode };

      mockBnccSkillRepository.findOne.mockResolvedValue(bnccSkill);
      mockActivityRepository.find.mockResolvedValue([
        {
          id: 'activity-1',
          bnccSkills: [bnccCode],
          isActive: true,
          difficulty: 'medium',
          affordances: {},
          difficultyProfile: {},
        },
      ]);

      // Mock OntologyService to reject the activity
      mockOntologyService.getValidActivityCandidates.mockReturnValue({
        validCandidateIds: [],
        excludedCandidateIds: ['activity-1'],
        trace: {
          targetSkill: bnccCode,
          fallbackUsed: false,
          fallbackReason: null,
          ontologyVersion: 'test',
          reasonerVersion: 'test',
        },
      });

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
