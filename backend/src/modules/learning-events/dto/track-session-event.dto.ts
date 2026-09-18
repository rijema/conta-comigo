import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LearningEventType } from '../entities/learning-event.entity';

export const SESSION_EVENT_TYPES = {
  SESSION_STARTED: LearningEventType.SESSION_STARTED,
  SESSION_COMPLETED: LearningEventType.SESSION_COMPLETED,
} as const;

export class TrackSessionEventDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(SESSION_EVENT_TYPES)
  eventType: typeof SESSION_EVENT_TYPES[keyof typeof SESSION_EVENT_TYPES];
}
