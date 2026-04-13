import { ApiPropertyOptional } from '@nestjs/swagger';

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