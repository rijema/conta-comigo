import { ActivitiesService } from './activities.service';
import { LearningEventType } from '../learning-events/entities/learning-event.entity';
import { ACTIVITY_LIFECYCLE_EVENT_TYPES } from './dto/track-activity-lifecycle.dto';
import { TrackActivityLifecycleDto } from './dto/track-activity-lifecycle.dto';
import { validate } from 'class-validator';

describe('ActivitiesService learning event instrumentation', () => {
  const activity = {
    id: '85797b0f-0292-4d91-986f-995bc86b8506',
    bnccSkills: ['EF01MA01'],
  };
  const skillId = '485c682a-03bb-4f01-8e9c-2a5fedf5fb0c';
  const learningEventService = { track: jest.fn().mockResolvedValue({}) };
  const activityRepo = {
    findOne: jest.fn().mockResolvedValue(activity),
  };
  const attemptRepo = {
    count: jest.fn().mockResolvedValue(2),
  };
  const dataSource = {
    query: jest.fn().mockResolvedValue([{ id: skillId }]),
  };
  const service = new ActivitiesService(
    activityRepo as any,
    attemptRepo as any,
    {} as any,
    {} as any,
    {} as any,
    learningEventService as any,
    dataSource as any,
    { observe: jest.fn().mockResolvedValue({}) } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    learningEventService.track.mockResolvedValue({});
    activityRepo.findOne.mockResolvedValue(activity);
    attemptRepo.count.mockResolvedValue(2);
    dataSource.query.mockResolvedValue([{ id: skillId }]);
  });

  it('rejects answer events whose correctness must be calculated by the backend', async () => {
    const dto = Object.assign(new TrackActivityLifecycleDto(), {
      sessionId: 'session-1',
      eventType: LearningEventType.ANSWER_SUBMITTED,
    });

    await expect(validate(dto)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'eventType' }),
    ]));
  });

  it('stores available pre-skip observations without labeling their meaning', async () => {
    await service.trackLifecycleEvent('student-1', activity.id, {
      sessionId: 'session-1',
      eventType: LearningEventType.ACTIVITY_SKIPPED,
      timeBeforeSkipMs: 4200,
      attemptsBeforeSkip: 2,
      hintsBeforeSkip: 1,
    });

    expect(learningEventService.track).toHaveBeenCalledWith(expect.objectContaining({
      eventType: LearningEventType.ACTIVITY_SKIPPED,
      hintsUsed: 1,
      metadata: {
        timeBeforeSkipMs: 4200,
        attemptsBeforeSkip: 2,
        hintsBeforeSkip: 1,
      },
    }));
  });

  it.each(Object.values(ACTIVITY_LIFECYCLE_EVENT_TYPES))(
    'tracks %s with activity, session, and resolved BNCC skill ids',
    async (eventType) => {
    await service.trackLifecycleEvent('student-1', activity.id, {
      sessionId: 'session-1',
      eventType,
    });

    expect(learningEventService.track).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student-1',
      sessionId: 'session-1',
      eventType,
      activityId: activity.id,
      bnccSkillId: skillId,
    }));
    },
  );

  it('tracks submitted and completed answers without copying the raw answer', async () => {
    await (service as any).trackAnswerEvents(
      'student-1',
      {
        activityId: activity.id,
        sessionId: 'session-1',
        answer: 'child free text must not be copied',
        timeSpentSeconds: 3,
        responseTimeMs: 2750,
        hintsUsed: 1,
      },
      activity,
      true,
    );

    expect(learningEventService.track).toHaveBeenCalledTimes(2);
    expect(learningEventService.track).toHaveBeenNthCalledWith(1, expect.objectContaining({
      eventType: LearningEventType.ANSWER_SUBMITTED,
      correct: true,
      attempt: 2,
      responseTimeMs: 2750,
      activityId: activity.id,
      bnccSkillId: skillId,
    }));
    expect(learningEventService.track).toHaveBeenNthCalledWith(2, expect.objectContaining({
      eventType: LearningEventType.ACTIVITY_COMPLETED,
    }));

    for (const [event] of learningEventService.track.mock.calls) {
      expect(event).not.toHaveProperty('answer');
      expect(event).not.toHaveProperty('metadata');
    }
  });

  it.each([
    'composition_decomposition',
    'missing_number',
    'pattern_completion',
    'representation_matching',
    'error_detection',
    'contextual_problem_solving',
  ])('tracks answer analytics for the %s family', async (type) => {
    await (service as any).trackAnswerEvents(
      'student-1',
      {
        activityId: activity.id,
        sessionId: 'session-parametric',
        answer: { value: false, reason: 'child response' },
        timeSpentSeconds: 2,
        responseTimeMs: 1800,
      },
      { ...activity, type },
      true,
    );

    expect(learningEventService.track).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        eventType: LearningEventType.ANSWER_SUBMITTED,
        activityId: activity.id,
        responseTimeMs: 1800,
        correct: true,
      }),
    );
    const [submitted] = learningEventService.track.mock.calls[0];
    expect(submitted).not.toHaveProperty('answer');
    expect(submitted).not.toHaveProperty('metadata');
  });

  it('does not wait for answer analytics after preserving the activity attempt', async () => {
    jest.useFakeTimers();
    const savedAttempt = { id: 'attempt-1', isCorrect: true };
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(undefined),
    };
    const activityRepository = {
      findOne: jest.fn().mockResolvedValue({
        ...activity,
        type: 'quiz',
        content: { correctAnswer: '4' },
        pointsReward: 10,
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const attemptRepository = {
      create: jest.fn().mockReturnValue(savedAttempt),
      save: jest.fn().mockResolvedValue(savedAttempt),
      find: jest.fn().mockResolvedValue([]),
    };
    const serviceWithAttempt = new ActivitiesService(
      activityRepository as any,
      attemptRepository as any,
      { publishActivityEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { decide: jest.fn().mockRejectedValue(new Error('ADE unavailable')) } as any,
      { getChildProfile: jest.fn().mockResolvedValue({}) } as any,
      learningEventService as any,
      dataSource as any,
      { observe: jest.fn().mockResolvedValue({}) } as any,
    );
    const trackAnswerEvents = jest
      .spyOn(serviceWithAttempt as any, 'trackAnswerEvents')
      .mockReturnValue(new Promise<void>(() => undefined));

    await expect(serviceWithAttempt.submitAttempt('student-1', {
      activityId: activity.id,
      sessionId: 'session-1',
      answer: '4',
      timeSpentSeconds: 1,
      responseTimeMs: 900,
    })).resolves.toEqual(expect.objectContaining({ attempt: savedAttempt }));

    expect(attemptRepository.save).toHaveBeenCalledWith(savedAttempt);
    expect(trackAnswerEvents).toHaveBeenCalled();
    expect(attemptRepository.save.mock.invocationCallOrder[0])
      .toBeLessThan(trackAnswerEvents.mock.invocationCallOrder[0]);
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});
