import { IsEnum, IsOptional, IsObject } from 'class-validator';

export enum ASDSupportLevel {
  NIVEL_1 = 'TEA_NIVEL_1',
  NIVEL_2 = 'TEA_NIVEL_2',
  NIVEL_3 = 'TEA_NIVEL_3',
  SEM_DIAGNOSTICO = 'SEM_DIAGNOSTICO',
}

export class UpdateChildSupportLevelDto {
  @IsEnum(ASDSupportLevel)
  supportLevel: ASDSupportLevel;
}

export class UpdateChildModalityPreferencesDto {
  @IsOptional()
  @IsObject()
  visualPreferences?: {
    brightness?: number;
    contrastMode?: boolean;
    fontSize?: number;
  };

  @IsOptional()
  @IsObject()
  auditoryPreferences?: {
    volumeLevel?: number;
    speechRate?: number;
    backgroundNoise?: boolean;
  };

  @IsOptional()
  @IsObject()
  motorPreferences?: {
    gestureSize?: 'small' | 'medium' | 'large';
    touchSensitivity?: number;
    dragDropDuration?: number;
  };

  @IsOptional()
  @IsObject()
  cognitivePreferences?: {
    instructionComplexity?: 'simple' | 'medium' | 'complex';
    pauseDuration?: number;
    feedbackDetail?: 'minimal' | 'detailed';
  };
}
