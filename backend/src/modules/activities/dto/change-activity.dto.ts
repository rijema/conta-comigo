import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class ChangeActivityDto {
  @IsUUID() currentActivityId: string;
  @IsUUID() recommendationId: string;
  @IsString() @IsNotEmpty() sessionId: string;
  @IsOptional() @IsInt() @Min(0) timeBeforeSkipMs?: number;
  @IsOptional() @IsInt() @Min(0) attemptsBeforeSkip?: number;
  @IsOptional() @IsInt() @Min(0) hintsBeforeSkip?: number;
  @IsOptional() @Matches(/^[a-z0-9-]{1,50}$/) focusIslandId?: string;
}
