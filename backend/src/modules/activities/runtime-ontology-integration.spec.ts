import { ActivitiesService } from './activities.service';
import { createActivitiesService } from './testing/create-activities-service';

describe('ActivitiesService formal ontology integration', () => {
  it('calls semantic materialization and filtering in the production selection path', async () => {
    const activity = {
      id: 'activity-1',
      title: 'Addition quiz',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA08'],
      targetModalities: ['visual'],
      content: {
        instructionsPt: 'Quanto é 2 + 1?',
        options: [{ text: '3' }],
        correctAnswer: '3',
      },
      accessibility: { sensoryLoad: 'low' },
      isActive: true,
    };
    const invalidActivity = { ...activity, id: 'activity-invalid', bnccSkills: ['EF01MA01'] };
    const trace = {
      targetSkill: 'EF01MA08',
      runtimeFactsUsed: {
        studentId: 'student-1',
        masterySource: 'StudentSkillState',
        masteryProbability: 0.4,
        recentAccuracy: 0.5,
        observedEvidenceTypes: [],
        hardConstraints: { disallowDragging: false, requireAudio: false },
      },
      candidateActivities: [activity.id],
      validCandidateIds: [activity.id],
      excludedCandidateIds: [],
      candidateDecisions: [],
      semanticRelations: [],
      ontologyVersion: '0.4.0',
      reasonerVersion: 'test-reasoner',
      fallbackUsed: false,
      fallbackReason: null,
    };
    const decision = {
      id: 'decision-1',
      userId: 'student-1',
      recommendedDifficulty: 'easy',
      recommendedModality: 'visual',
      recommendedActivityType: 'quiz',
      recommendedBnccSkill: 'EF01MA08',
      xaiLog: { mlPredictions: { masteryProbability: 0.4 } },
      inputSnapshot: { recentAccuracy: 0.5 },
      createdAt: new Date(),
    };
    const activityRepo = {
      find: jest.fn().mockResolvedValue([activity, invalidActivity]),
    };
    const adeService = {
      decide: jest.fn().mockResolvedValue(decision),
      recordSemanticFilteringTrace: jest.fn().mockResolvedValue(decision),
      recordHybridRanking: jest.fn().mockResolvedValue(decision),
    };
    const adapter = {
      materialize: jest.fn().mockReturnValue({
        activities: [{ activityId: activity.id }],
        mastery: { source: 'StudentSkillState', probability: 0.4 },
        observedEvidenceTypes: [],
      }),
    };
    const ontology = {
      getMathematicalConceptMappings: jest.fn().mockReturnValue({
        EF01MA08: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
      }),
      getValidActivityCandidates: jest.fn().mockReturnValue({
        validCandidateIds: [activity.id],
        excludedCandidateIds: [],
        trace,
      }),
    };
    const ranking = {
      selectedActivityId: activity.id,
      candidateIds: [activity.id],
      candidates: [{ activityId: activity.id, finalScore: 1 }],
      weights: {},
      configurationVersion: 'test-config',
      rankingVersion: 'test-ranking',
      ontologyVersion: '0.4.0',
      decisionSource: 'HYBRID_RANKING',
      fallbackUsed: false,
      fallbackReason: null,
      selectionExplanation: { selectedActivityId: activity.id, comparedWith: [], scoreMargin: null },
    };
    const hybrid = { rank: jest.fn().mockReturnValue(ranking) };
    const attemptRepo = { find: jest.fn().mockResolvedValue([]) };
    const learningEvents = { getRecentSkippedActivityIds: jest.fn().mockResolvedValue([]) };
    const service = createActivitiesService({
      activityRepo,
      attemptRepo,
      adeService,
      usersService: { getChildProfile: jest.fn().mockResolvedValue({ ontologyInstanceData: {} }) },
      learningEventService: learningEvents,
      dataSource: { query: jest.fn().mockResolvedValue([{ id: 'skill-id' }]) },
      recommendationExplanationService: { toChildDecision: jest.fn().mockReturnValue({ id: decision.id }) },
      ontologyService: ontology,
      runtimeSemanticAdapter: adapter,
      hybridRecommendationService: hybrid,
    });

    const random = jest.spyOn(Math, 'random');
    const result = await service.getNextActivity('student-1');

    expect(adapter.materialize).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student-1',
      targetSkill: 'EF01MA08',
    }));
    expect(ontology.getValidActivityCandidates).toHaveBeenCalled();
    expect(ontology.getMathematicalConceptMappings).toHaveBeenCalledWith(['EF01MA08']);
    expect(adeService.recordSemanticFilteringTrace).toHaveBeenCalledWith(decision, trace);
    expect(hybrid.rank).toHaveBeenCalledWith(expect.objectContaining({
      candidates: [expect.objectContaining({ id: activity.id })],
    }));
    expect(hybrid.rank.mock.calls[0][0].candidates).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: invalidActivity.id })]),
    );
    expect(adeService.recordHybridRanking).toHaveBeenCalledWith(decision, ranking);
    expect(random).not.toHaveBeenCalled();
    expect(result.activity.id).toBe(activity.id);
    random.mockRestore();
  });
});
