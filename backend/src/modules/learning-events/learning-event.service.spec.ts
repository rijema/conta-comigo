import { Logger } from '@nestjs/common';
import { LearningEventType } from './entities/learning-event.entity';
import { LearningEventService, TrackLearningEventInput } from './learning-event.service';

describe('LearningEventService', () => {
  const input: TrackLearningEventInput = {
    studentId: 'c155f8d7-17dc-438c-b0eb-43ebff01e765',
    sessionId: 'session-1',
    eventType: LearningEventType.ANSWER_SUBMITTED,
    timestamp: new Date('2026-09-06T12:00:00.000Z'),
    activityId: '85797b0f-0292-4d91-986f-995bc86b8506',
    correct: true,
    responseTimeMs: 1500,
  };

  it('appends a new event', async () => {
    const event = { id: 'event-1', ...input };
    const repository = {
      create: jest.fn().mockReturnValue(event),
      save: jest.fn().mockResolvedValue(event),
    };
    const service = new LearningEventService(repository as any);

    await expect(service.track(input)).resolves.toBe(event);
    expect(repository.create).toHaveBeenCalledWith(input);
    expect(repository.save).toHaveBeenCalledWith(event);
  });

  it('contains persistence failures and logs them', async () => {
    const failure = new Error('database unavailable');
    const repository = {
      create: jest.fn().mockReturnValue(input),
      save: jest.fn().mockRejectedValue(failure),
    };
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const service = new LearningEventService(repository as any);

    await expect(service.track(input)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(LearningEventType.ANSWER_SUBMITTED),
      failure.stack,
    );

    errorSpy.mockRestore();
  });

  it('keeps missing skip evidence neutral when analytics reads fail', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const service = new LearningEventService({
      find: jest.fn().mockRejectedValue(new Error('database unavailable')),
    } as any);

    await expect(service.getRecentSkippedActivityIds(input.studentId)).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('rejection evidence remains neutral'),
      expect.any(String),
    );
    errorSpy.mockRestore();
  });

  it('stores voice evidence without audio, transcript, or BKT fields', async () => {
    const evidenceRepository = { create: jest.fn((value) => value), save: jest.fn().mockResolvedValue({}) };
    const service = new LearningEventService({} as any, evidenceRepository as any);
    await service.trackVoiceEvidence({ id: 'event-1', ...input,
      eventType: LearningEventType.VOICE_HELP_REQUESTED, recommendationId: null } as any,
    'REQUEST_HELP', 320, true);
    const evidence = evidenceRepository.create.mock.calls[0][0];
    expect(evidence.interactionType).toEqual(['VOICE']);
    expect(evidence.outcome).toBe('REQUEST_HELP');
    expect(JSON.stringify(evidence)).not.toMatch(/audio|transcript|mastery/i);
  });
});
