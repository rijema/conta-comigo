import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { LearningEventType } from '../entities/learning-event.entity';

export const SPEECH_EVENT_TYPES = [
  LearningEventType.INSTRUCTION_SPOKEN,
  LearningEventType.INSTRUCTION_REPLAYED_SPEECH,
  LearningEventType.HINT_SPOKEN,
  LearningEventType.PICTOGRAM_SPOKEN,
  LearningEventType.SPEECH_DISABLED,
] as const;

export class TrackSpeechEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId: string;

  @ApiProperty({ enum: SPEECH_EVENT_TYPES })
  @IsIn(SPEECH_EVENT_TYPES)
  eventType: typeof SPEECH_EVENT_TYPES[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  activityId?: string;

  @ApiPropertyOptional({ description: 'Stable registry concept identifier; never spoken or child-entered text' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^(?:(navigation|state|mathematics|activity|communication|number|library|action|character|math|object|shape)\.[a-z0-9_]+|arasaac\.[1-9][0-9]*)$/)
  pictogramConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  stepCount?: number;
}
