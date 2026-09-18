import { AdeService } from './ade.service';

describe('AdeService hybrid decision persistence', () => {
  it('persists the selected activity, candidate scores, versions, and source', async () => {
    const repository = { save: jest.fn(async (value) => value) };
    const service = new AdeService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const decision = { id: 'recommendation-1', xaiLog: {} } as any;
    const ranking = {
      selectedActivityId: 'activity-2',
      candidateIds: ['activity-2', 'activity-1'],
      candidates: [{ activityId: 'activity-2', finalScore: 3.2 }],
      weights: { learning: 1, challenge: 1, interaction: 1, semantic: 1, novelty: 0.5, rejection: 1 },
      configurationVersion: 'experimental-v1',
      rankingVersion: 'contacomigo-hybrid-ranking/1.0.0',
      ontologyVersion: '0.4.0',
      decisionSource: 'HYBRID_RANKING' as const,
      fallbackUsed: false,
      fallbackReason: null,
      selectionExplanation: { selectedActivityId: 'activity-2', comparedWith: ['activity-1'], scoreMargin: 0.4 },
    };

    await service.recordHybridRanking(decision, ranking as any);

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      selectedActivityId: 'activity-2',
      hybridRanking: expect.objectContaining({
        candidates: [expect.objectContaining({ finalScore: 3.2 })],
        rankingVersion: 'contacomigo-hybrid-ranking/1.0.0',
      }),
      decisionSource: 'HYBRID_RANKING',
      fallbackUsed: false,
    }));
  });

  it('publishes the finalized selection with the persisted skill and score', async () => {
    const publishAdeDecision = jest.fn().mockResolvedValue(undefined);
    const service = new AdeService(
      { save: jest.fn(async (value) => value) } as any,
      {} as any, {} as any, {} as any,
      { publishAdeDecision } as any,
      {} as any,
    );
    await service.recordHybridRanking({ id: 'recommendation-2', userId: 'student-1',
      sessionId: 'session-1', recommendedBnccSkill: 'EF01MA08',
      recommendedDifficulty: 'easy' } as any, {
      selectedActivityId: 'activity-2', candidateIds: ['activity-2'],
      candidates: [{ activityId: 'activity-2', finalScore: 3.2 }],
      decisionSource: 'HYBRID_RANKING', fallbackUsed: false, fallbackReason: null,
      rankingVersion: 'contacomigo-hybrid-ranking/2.0.0',
      selectionStrategy: { mode: 'explore', originalSkill: 'EF01MA06',
        selectedSkill: 'EF01MA08', evidence: [] },
    } as any);
    expect(publishAdeDecision).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'ADE_SELECTION_FINALIZED',
      payload: expect.objectContaining({ recommendedBnccSkill: 'EF01MA08',
        selectedActivityId: 'activity-2', finalScore: 3.2, strategy: 'explore' }),
    }));
  });
});
