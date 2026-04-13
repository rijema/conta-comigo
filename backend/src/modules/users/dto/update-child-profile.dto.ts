import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsObject } from 'class-validator';

export class UpdateChildProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  schoolYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asdSupportLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  strengths?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  weaknesses?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  uiPreferences?: Record<string, any>;
}