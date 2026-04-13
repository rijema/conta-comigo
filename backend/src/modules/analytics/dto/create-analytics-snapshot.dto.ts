import { ApiProperty } from '@nestjs/swagger';

export class CreateAnalyticsSnapshotDto {
  @ApiProperty({ description: 'Learner UUID' })
  @IsUUID()
  learnerId: string;

  @ApiProperty({ description: 'Session UUID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Activity attempt UUID' })
  @IsUUID()
  @IsOptional()
  attemptId?: string;

  @ApiProperty({ description: 'BNCC skill code e.g. EF01MA01' })
  @IsString()
  bnccSkillCode: string;

  @ApiProperty({ description: 'BKT mastery probability 0-1', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  masteryProbability: number;

  @ApiProperty({ description: 'Engagement index 0-1', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  engagementIndex: number;

  @ApiProperty({ description: 'Additional JSONB metrics' })
  @IsObject()
  @IsOptional()
  metrics?: Record<string, unknown>;
}