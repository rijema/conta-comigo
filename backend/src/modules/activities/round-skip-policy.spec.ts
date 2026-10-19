import { ActivitiesService } from './activities.service';
import { createActivitiesService } from './testing/create-activities-service';
import { LearningEventType } from '../learning-events/entities/learning-event.entity';

const activity = (id: string, skill: string, type: string) =>
  ({ id, bnccSkills: [skill], type }) as any;

const buildService = (learningEventService: any = {}) => createActivitiesService({ learningEventService });

describe('ActivitiesService round skip policy ("Quero outro")', () => {
  const a1 = activity('a1', 'EF01MA01', 'counting');
  const a2 = activity('a2', 'EF01MA01', 'multiple_choice');
  const a3 = activity('a3', 'EF01MA01', 'counting');
  const b1 = activity('b1', 'EF01MA02', 'drag_drop');

  it('keeps candidates untouched when nothing was skipped in the round', () => {
    expect(buildService().applyRoundSkipPolicy([a1, a2, b1], [], 'EF01MA01')).toEqual([a1, a2, b1]);
  });

  it('never returns an activity already skipped in the round', () => {
    const pool = buildService().applyRoundSkipPolicy([a1, a2, a3, b1], ['a1'], 'EF01MA01');
    expect(pool.map((item) => item.id)).not.toContain('a1');
    expect(pool.map((item) => item.id)).toEqual(expect.arrayContaining(['a2', 'a3']));
  });

  it('prefers another format of the same skill after a change request', () => {
    const pool = buildService().applyRoundSkipPolicy([a2, a3, b1], ['a1'], 'EF01MA01', { type: 'counting' } as any);
    expect(pool.map((item) => item.id)).toEqual(['a2', 'b1']);
  });

  it('keeps the same format when the skill has no other format left', () => {
    const pool = buildService().applyRoundSkipPolicy([a3, b1], ['a1'], 'EF01MA01', { type: 'counting' } as any);
    expect(pool.map((item) => item.id)).toContain('a3');
  });

  it('brings back the oldest skipped activity of the skill instead of leaving the skill', () => {
    // newest first: a2 was skipped after a1
    const pool = buildService().applyRoundSkipPolicy([a1, a2, b1], ['a2', 'a1'], 'EF01MA01');
    expect(pool.map((item) => item.id)).toEqual(['b1', 'a1']);
  });

  it('prefers a different format when bringing a skipped activity back', () => {
    const pool = buildService().applyRoundSkipPolicy(
      [a1, a2, b1], ['a2', 'a1'], 'EF01MA01', { type: 'counting' } as any);
    expect(pool.map((item) => item.id)).toEqual(['b1', 'a2']);
  });
});

describe('ActivitiesService pause suggestion after repeated change requests', () => {
  const previous = { id: '10000000-0000-0000-0000-000000000001', bnccSkills: ['EF01MA08'] };

  const run = async (skipCount: number) => {
    const learningEvents = {
      countSkipsInSession: jest.fn().mockResolvedValue(skipCount),
      track: jest.fn().mockResolvedValue({}),
    };
    const service = buildService(learningEvents);
    jest.spyOn(service, 'findById').mockResolvedValue(previous as any);
    jest.spyOn(service, 'trackLifecycleEvent').mockResolvedValue(null);
    jest.spyOn(service, 'getNextActivity').mockResolvedValue({
      activity: { id: 'next' } as any, adeDecision: null, preferredModality: null,
    });
    const result = await service.changeActivity('student-1', {
      currentActivityId: previous.id,
      recommendationId: '20000000-0000-0000-0000-000000000001',
      sessionId: 'session-1',
    });
    return { result, learningEvents };
  };

  it('does not suggest a pause before the third change in the round', async () => {
    const { result, learningEvents } = await run(2);
    expect(result).toEqual(expect.objectContaining({ pauseSuggested: false, roundSkipCount: 2 }));
    expect(learningEvents.track).not.toHaveBeenCalled();
  });

  it('suggests a pause and records it for professionals on the third change', async () => {
    const { result, learningEvents } = await run(3);
    expect(result).toEqual(expect.objectContaining({ pauseSuggested: true, roundSkipCount: 3 }));
    expect(learningEvents.track).toHaveBeenCalledWith(expect.objectContaining({
      eventType: LearningEventType.PAUSE_SUGGESTED,
      sessionId: 'session-1',
      metadata: expect.objectContaining({ roundSkipCount: 3 }),
    }));
  });
});
