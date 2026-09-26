import { LearningEventType } from './entities/learning-event.entity';
import { RecommendationOutcomeStatus } from './entities/recommendation-outcome.entity';
import { RecommendationOutcomeService } from './recommendation-outcome.service';

describe('RecommendationOutcomeService', () => {
  const outcomes: any[] = [];
  const transitions: any[] = [];
  const evidence: any[] = [];
  const repository = (items: any[], key: string) => ({
    findOne: jest.fn(async ({ where }) => items.find((item) => item[key] === where[key]) ?? null),
    findOneByOrFail: jest.fn(async (where) => {
      const item = items.find((candidate) => candidate[key] === where[key]);
      if (!item) throw new Error('not found');
      return item;
    }),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn(async (value) => {
      if (!value.id) value.id = `${key}-${items.length + 1}`;
      if (!items.includes(value)) items.push(value);
      return value;
    }),
    // [INTEGRATION 3C]: Add upsert to match TypeORM Repository behavior
    upsert: jest.fn(async (value: any, conflictKeys: string[]) => {
      if (!value.id) value.id = `${key}-${items.length + 1}`;
      const existingIndex = items.findIndex((item: any) => conflictKeys.some((k: string) => item[k] === value[k]));
      if (existingIndex >= 0) {
        items[existingIndex] = { ...items[existingIndex], ...value };
      } else {
        items.push(value);
      }
      return { generatedMaps: [], raw: [], affected: 1 };
    }),
  });
  const outcomeRepository = repository(outcomes, 'recommendationId');
  const transitionRepository = repository(transitions, 'previousRecommendationId');
  const evidenceRepository = repository(evidence, 'sourceEventId');
  const service = new RecommendationOutcomeService(
    outcomeRepository as any,
    transitionRepository as any,
    evidenceRepository as any,
  );
  const activity = {
    id: '10000000-0000-0000-0000-000000000001',
    interactionType: ['option_selection'],
    representation: ['pictorial'],
    difficultyProfile: { motorDemand: 'LOW', sensoryLoad: 'LOW', languageLoad: 'LOW' },
  } as any;
  const event = (id: string, eventType: LearningEventType, recommendationId: string | null = '20000000-0000-0000-0000-000000000001') => ({
    id,
    studentId: '30000000-0000-0000-0000-000000000001',
    sessionId: 'session-1',
    activityId: activity.id,
    recommendationId,
    eventType,
    timestamp: new Date(`2026-09-13T12:00:0${id.slice(-1)}Z`),
    metadata: null,
    responseTimeMs: null,
    correct: null,
  } as any);

  beforeEach(() => {
    outcomes.splice(0);
    transitions.splice(0);
    evidence.splice(0);
    jest.clearAllMocks();
  });

  it('creates one outcome and updates its lifecycle idempotently', async () => {
    const presented = event('40000000-0000-0000-0000-000000000001', LearningEventType.ACTIVITY_PRESENTED);
    await service.synchronize(presented, activity);
    await service.synchronize(presented, activity);
    await service.synchronize(event('40000000-0000-0000-0000-000000000002', LearningEventType.ACTIVITY_STARTED), activity);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].status).toBe(RecommendationOutcomeStatus.STARTED);
    expect(outcomes[0].presentedAt).toEqual(presented.timestamp);
    expect(outcomes[0].startedAt).toBeInstanceOf(Date);
  });

  it('does not create duplicate outcomes for the same recommendationId', async () => {
    const presented = event('40000000-0000-0000-0000-00000000000a', LearningEventType.ACTIVITY_PRESENTED);
    await service.synchronize(presented, activity);
    await service.synchronize(event('40000000-0000-0000-0000-00000000000b', LearningEventType.ACTIVITY_STARTED), activity);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual(expect.objectContaining({
      recommendationId: presented.recommendationId,
      status: RecommendationOutcomeStatus.STARTED,
    }));
  });

  it('links skip to its recommendation and creates a pending transition', async () => {
    const skipped = event('40000000-0000-0000-0000-000000000003', LearningEventType.ACTIVITY_SKIPPED);
    skipped.metadata = { attemptsBeforeSkip: 1, childText: 'must not persist' };
    await service.synchronize(skipped, activity);

    expect(outcomes[0].status).toBe(RecommendationOutcomeStatus.SKIPPED);
    expect(transitions[0]).toEqual(expect.objectContaining({
      previousRecommendationId: skipped.recommendationId,
      previousActivityId: activity.id,
      triggerEventId: skipped.id,
      replacementRecommendationId: null,
    }));
    expect(evidence[0].metadata).toEqual({
      timeBeforeSkipMs: null,
      attemptsBeforeSkip: 1,
      hintsBeforeSkip: null,
      changeRequested: false,
    });
    expect((service as any).knowledgeTracingService).toBeUndefined();
    expect(evidence[0]).not.toHaveProperty('observedPreference');
  });

  it('summarizes attempts, hints, replay, response time, and completion', async () => {
    await service.synchronize(event('40000000-0000-0000-0000-000000000006', LearningEventType.ANSWER_SUBMITTED), activity);
    await service.synchronize(event('40000000-0000-0000-0000-000000000007', LearningEventType.HINT_REQUESTED), activity);
    await service.synchronize(event('40000000-0000-0000-0000-000000000008', LearningEventType.INSTRUCTION_REPLAYED), activity);
    const completed = event('40000000-0000-0000-0000-000000000009', LearningEventType.ACTIVITY_COMPLETED);
    completed.responseTimeMs = 2400;
    completed.correct = true;
    await service.synchronize(completed, activity);

    expect(outcomes[0]).toEqual(expect.objectContaining({
      status: RecommendationOutcomeStatus.COMPLETED,
      attempts: 1,
      hintsUsed: 1,
      instructionReplays: 1,
      responseTimeMs: 2400,
      correct: true,
    }));
  });

  it('marks departure as abandoned without creating a replacement transition', async () => {
    const abandoned = event('40000000-0000-0000-0000-000000000005', LearningEventType.ACTIVITY_ABANDONED);
    await service.synchronize(abandoned, activity);
    expect(outcomes[0].status).toBe(RecommendationOutcomeStatus.ABANDONED);
    expect(outcomes[0].abandonedAt).toEqual(abandoned.timestamp);
    expect(transitions).toHaveLength(0);
  });

  it('can attach a later replacement without inferring comparison values', async () => {
    const skipped = event('40000000-0000-0000-0000-000000000004', LearningEventType.ACTIVITY_SKIPPED);
    await service.synchronize(skipped, activity);
    const updated = await service.attachReplacement(skipped.recommendationId, {
      replacementRecommendationId: '20000000-0000-0000-0000-000000000002',
      replacementActivityId: '10000000-0000-0000-0000-000000000002',
    });

    expect(updated.replacementRecommendationId).toBe('20000000-0000-0000-0000-000000000002');
    expect(updated.sameBNCCSkill).toBeNull();
  });

  it('keeps manual activity events compatible without creating an outcome', async () => {
    await service.synchronize(
      event('40000000-0000-0000-0000-000000000005', LearningEventType.ACTIVITY_STARTED, null),
      activity,
    );
    expect(outcomes).toHaveLength(0);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].recommendationId).toBeNull();
  });
});
