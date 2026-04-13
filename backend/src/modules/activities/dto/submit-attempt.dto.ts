import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty()
  @IsString()
  activityId: string;

  @ApiProperty()
  @IsNotEmpty()
  answer: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hintsUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  interactionSignals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  adeDecisionContext?: Record<string, any>;
}