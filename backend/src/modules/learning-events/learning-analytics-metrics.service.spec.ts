import { LearningAnalyticsMetricsService } from './learning-analytics-metrics.service';
import { LearningEvent, LearningEventType } from './entities/learning-event.entity';

describe('LearningAnalyticsMetricsService', () => {
  const service = new LearningAnalyticsMetricsService({} as any);

  const event = (
    eventType: LearningEventType,
    overrides: Partial<LearningEvent> = {},
  ): LearningEvent => ({
    id: crypto.randomUUID(),
    studentId: 'student-1',
    sessionId: 'session-1',
    eventType,
    timestamp: new Date('2026-09-06T12:00:00.000Z'),
    activityId: 'activity-1',
    bnccSkillId: 'skill-1',
    attempt: null,
    responseTimeMs: null,
    correct: null,
    hintsUsed: null,
    recommendationId: null,
    metadata: null,
    ...overrides,
  });

  it('returns zero for every metric when all denominators are zero', () => {
    expect(service.calculateFromEvents([])).toEqual({
      accuracy: 0,
      completionRate: 0,
      skipRate: 0,
      averageAttempts: 0,
      averageResponseTimeMs: 0,
      hintRate: 0,
      instructionReplayRate: 0,
      activitiesCompleted: 0,
      activitiesPresented: 0,
    });
  });

  it('calculates deterministic rates from distinct activity instances', () => {
    const events = [
      event(LearningEventType.ACTIVITY_PRESENTED),
      event(LearningEventType.ACTIVITY_PRESENTED),
      event(LearningEventType.ACTIVITY_STARTED),
      event(LearningEventType.ANSWER_SUBMITTED, { correct: true, attempt: 1, responseTimeMs: 100 }),
      event(LearningEventType.ANSWER_SUBMITTED, { correct: false, attempt: 2, responseTimeMs: 300 }),
      event(LearningEventType.ACTIVITY_COMPLETED),
      event(LearningEventType.ACTIVITY_COMPLETED),
      event(LearningEventType.HINT_REQUESTED),
      event(LearningEventType.HINT_REQUESTED),
      event(LearningEventType.INSTRUCTION_REPLAYED),
      event(LearningEventType.ACTIVITY_PRESENTED, { activityId: 'activity-2' }),
      event(LearningEventType.ACTIVITY_STARTED, { activityId: 'activity-2' }),
      event(LearningEventType.ACTIVITY_SKIPPED, { activityId: 'activity-2' }),
    ];

    expect(service.calculateFromEvents(events)).toEqual({
      accuracy: 0.5,
      completionRate: 0.5,
      skipRate: 0.5,
      averageAttempts: 2,
      averageResponseTimeMs: 200,
      hintRate: 0.5,
      instructionReplayRate: 0.5,
      activitiesCompleted: 1,
      activitiesPresented: 2,
    });
  });

  it('handles missing activity identifiers and response times without fabricating data', () => {
    const events = [
      event(LearningEventType.ANSWER_SUBMITTED, {
        activityId: null,
        correct: true,
        responseTimeMs: null,
      }),
      event(LearningEventType.ACTIVITY_COMPLETED, { activityId: null }),
      event(LearningEventType.HINT_REQUESTED, { activityId: null }),
    ];

    expect(service.calculateFromEvents(events)).toEqual({
      accuracy: 1,
      completionRate: 0,
      skipRate: 0,
      averageAttempts: 0,
      averageResponseTimeMs: 0,
      hintRate: 0,
      instructionReplayRate: 0,
      activitiesCompleted: 0,
      activitiesPresented: 0,
    });
  });
});
