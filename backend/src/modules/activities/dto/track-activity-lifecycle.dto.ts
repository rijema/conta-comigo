import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LearningEventType } from '../../learning-events/entities/learning-event.entity';

export const ACTIVITY_LIFECYCLE_EVENT_TYPES = {
  ACTIVITY_PRESENTED: LearningEventType.ACTIVITY_PRESENTED,
  ACTIVITY_STARTED: LearningEventType.ACTIVITY_STARTED,
} as const;

export class TrackActivityLifecycleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ enum: Object.values(ACTIVITY_LIFECYCLE_EVENT_TYPES) })
  @IsEnum(ACTIVITY_LIFECYCLE_EVENT_TYPES)
  eventType: typeof ACTIVITY_LIFECYCLE_EVENT_TYPES[keyof typeof ACTIVITY_LIFECYCLE_EVENT_TYPES];
}
