import { IsBase64, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class TranscribeVoiceDto {
  @IsString() @IsBase64() @MaxLength(2_700_000) audioBase64: string;
  @IsOptional() @IsIn(['pt', 'pt-BR']) language?: 'pt' | 'pt-BR';
  @IsOptional() @IsString() @MaxLength(128) sessionId?: string;
  @IsOptional() @IsString() @MaxLength(64) activityId?: string;
  @IsOptional() @IsString() @MaxLength(64) recommendationId?: string;
}
