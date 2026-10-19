import { createActivitiesService } from './testing/create-activities-service';

describe('ActivitiesService island choice from the map', () => {
  const chosen = {
    id: '30000000-0000-0000-0000-000000000001',
    title: 'Agrupar figuras por cor',
    type: 'representation_matching',
    bnccSkills: ['EF01MA03'],
    content: {},
  };
  const decision = {
    id: '20000000-0000-0000-0000-000000000001',
    userId: 'student-1',
    recommendedDifficulty: 'easy',
    recommendedModality: 'visual',
    recommendedBnccSkill: 'EF01MA03',
    xaiLog: {},
    createdAt: new Date(),
  };

  const build = () => {
    const adeService = {
      decide: jest.fn().mockResolvedValue(decision),
      recordChildChoice: jest.fn().mockResolvedValue(decision),
    };
    const reviewOrchestrationService = { getNextReviewActivity: jest.fn() };
    const service = createActivitiesService({
      activityRepo: { findOne: jest.fn().mockResolvedValue(chosen) },
      attemptRepo: { find: jest.fn().mockResolvedValue([]) },
      adeService,
      usersService: { getChildProfile: jest.fn().mockResolvedValue({ uiPreferences: {} }) },
      learningEventService: { getRecentSkippedActivityIds: jest.fn().mockResolvedValue([]) },
      dataSource: { query: jest.fn().mockResolvedValue([]) },
      recommendationExplanationService: { toChildDecision: jest.fn().mockReturnValue({ id: decision.id }) },
      reviewOrchestrationService,
    });
    jest.spyOn(service as any, 'attachSemanticContract').mockImplementation(async (a: any) => a);
    jest.spyOn(service as any, 'recentSkipCount').mockResolvedValue(0);
    return { service, adeService, reviewOrchestrationService };
  };

  it('serves the tapped exercise and keeps a recommendation id for "Quero outro"', async () => {
    const { service, adeService, reviewOrchestrationService } = build();

    const result = await service.getNextActivity('student-1', {
      chosenActivityId: chosen.id,
      focusIslandId: 'island-colors',
    });

    expect(result.activity.id).toBe(chosen.id);
    expect(result.adeDecision?.id).toBe(decision.id);
    expect(adeService.decide).toHaveBeenCalledWith(expect.objectContaining({ focusIslandId: 'island-colors' }));
    expect(adeService.recordChildChoice).toHaveBeenCalledWith(decision, chosen.id);
    expect(reviewOrchestrationService.getNextReviewActivity).not.toHaveBeenCalled();
  });

  it('keeps "Quero outro" inside the island the child opened', async () => {
    const service = createActivitiesService({
      recommendationOutcomeService: { attachReplacement: jest.fn() },
    });
    jest.spyOn(service, 'findById').mockResolvedValue(chosen as any);
    jest.spyOn(service, 'trackLifecycleEvent').mockResolvedValue(null);
    jest.spyOn(service, 'getNextActivity').mockResolvedValue({
      activity: chosen as any, adeDecision: null, preferredModality: null,
    });

    await service.changeActivity('student-1', {
      currentActivityId: chosen.id,
      recommendationId: decision.id,
      sessionId: 'session-1',
      focusIslandId: 'island-colors',
    });

    expect(service.getNextActivity).toHaveBeenCalledWith('student-1',
      expect.objectContaining({ focusIslandId: 'island-colors', excludedActivityId: chosen.id }));
  });
});
