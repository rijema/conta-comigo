import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { LearningEventType } from '../entities/learning-event.entity';

export const VOICE_EVENT_TYPES = [LearningEventType.VOICE_INTERACTION_STARTED,
  LearningEventType.VOICE_COMMAND_RECOGNIZED, LearningEventType.VOICE_COMMAND_UNKNOWN,
  LearningEventType.VOICE_HELP_REQUESTED, LearningEventType.VOICE_INSTRUCTION_REPLAY_REQUESTED,
  LearningEventType.VOICE_ACTIVITY_CHANGE_REQUESTED] as const;

export class TrackVoiceEventDto {
  @IsString() @IsNotEmpty() @MaxLength(128) sessionId: string;
  @IsIn(VOICE_EVENT_TYPES) eventType: typeof VOICE_EVENT_TYPES[number];
  @IsOptional() @IsUUID() activityId?: string;
  @IsOptional() @IsUUID() recommendationId?: string;
  @IsOptional() @IsIn(['REQUEST_HELP', 'REPEAT_INSTRUCTION', 'CHANGE_ACTIVITY', 'NEXT', 'CONFIRM', 'DENY', 'STOP_SPEECH', 'UNKNOWN']) command?: string;
  @IsOptional() @IsInt() @Min(0) @Max(120000) processingTimeMs?: number;
  @IsOptional() @IsBoolean() recognitionSucceeded?: boolean;
}
