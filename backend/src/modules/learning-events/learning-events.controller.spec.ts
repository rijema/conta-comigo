import { validate } from 'class-validator';
import {
  TrackVisualCommunicationEventDto,
  VISUAL_COMMUNICATION_EVENT_TYPES,
} from './dto/track-visual-communication-event.dto';
import { LearningEventType } from './entities/learning-event.entity';
import { LearningEventsController } from './learning-events.controller';
import { SPEECH_EVENT_TYPES, TrackSpeechEventDto } from './dto/track-speech-event.dto';

describe('LearningEventsController visual communication tracking', () => {
  it.each(VISUAL_COMMUNICATION_EVENT_TYPES)('accepts the supported %s event', async (eventType) => {
    const dto = Object.assign(new TrackVisualCommunicationEventDto(), {
      sessionId: 'learning-session-1',
      eventType,
      pictogramConceptId: 'navigation.help',
      category: 'NAVIGATION',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects unrelated learning event types', async () => {
    const dto = Object.assign(new TrackVisualCommunicationEventDto(), {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.ANSWER_SUBMITTED,
    });
    await expect(validate(dto)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'eventType' }),
    ]));
  });

  it('rejects free text in visual metadata fields', async () => {
    const dto = Object.assign(new TrackVisualCommunicationEventDto(), {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.PICTOGRAM_OPENED,
      pictogramConceptId: 'child wrote an unrestricted sentence',
      category: 'an arbitrary category',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'pictogramConceptId', 'category',
    ]));
  });

  it('accepts bounded catalog identifiers and the new curated sections', async () => {
    const dto = Object.assign(new TrackVisualCommunicationEventDto(), {
      sessionId: 'learning-session-1', eventType: LearningEventType.PICTOGRAM_OPENED,
      pictogramConceptId: 'arasaac.2731', category: 'Jogos',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    dto.pictogramConceptId = 'arasaac.child free text';
    await expect(validate(dto)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'pictogramConceptId' }),
    ]));
  });

  it('tracks only enumerated metadata and uses the authenticated student', async () => {
    const track = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = new LearningEventsController({ track } as any);

    await expect(controller.trackVisualCommunication('student-1', {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.PICTOGRAM_OPENED,
      pictogramConceptId: 'navigation.help',
      category: 'NAVIGATION',
    })).resolves.toEqual({ tracked: true });

    expect(track).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student-1',
      sessionId: 'learning-session-1',
      eventType: LearningEventType.PICTOGRAM_OPENED,
      metadata: {
        pictogramConceptId: 'navigation.help',
        category: 'NAVIGATION',
      },
    }));
  });

  it('reports an analytics failure without throwing', async () => {
    const controller = new LearningEventsController({
      track: jest.fn().mockResolvedValue(null),
    } as any);
    await expect(controller.trackVisualCommunication('student-1', {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.VISUAL_LIBRARY_OPENED,
    })).resolves.toEqual({ tracked: false });
  });
});

describe('LearningEventsController speech tracking', () => {
  it('accepts a catalog pictogram identifier without spoken text', async () => {
    const dto = Object.assign(new TrackSpeechEventDto(), {
      sessionId: 'learning-session-1', eventType: LearningEventType.PICTOGRAM_SPOKEN,
      pictogramConceptId: 'arasaac.2731',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
  it.each(SPEECH_EVENT_TYPES)('accepts the supported %s event', async (eventType) => {
    const dto = Object.assign(new TrackSpeechEventDto(), {
      sessionId: 'learning-session-1',
      eventType,
      activityId: '85797b0f-0292-4d91-986f-995bc86b8506',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects spoken text and invalid pictogram identifiers as metadata', async () => {
    const dto = Object.assign(new TrackSpeechEventDto(), {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.PICTOGRAM_SPOKEN,
      pictogramConceptId: 'the child said unrestricted words',
    });
    await expect(validate(dto)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'pictogramConceptId' }),
    ]));
  });

  it('stores only activity and bounded speech metadata', async () => {
    const track = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = new LearningEventsController({ track } as any);
    const activityId = '85797b0f-0292-4d91-986f-995bc86b8506';

    await controller.trackSpeech('student-1', {
      sessionId: 'learning-session-1',
      eventType: LearningEventType.INSTRUCTION_SPOKEN,
      activityId,
      stepCount: 4,
    });

    expect(track).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student-1',
      activityId,
      eventType: LearningEventType.INSTRUCTION_SPOKEN,
      metadata: { stepCount: 4 },
    }));
  });
});
