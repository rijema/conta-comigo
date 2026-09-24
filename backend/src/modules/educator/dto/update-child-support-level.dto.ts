import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';

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

export class ModalityPreferenceDto {
  @IsOptional()
  @IsString()
  strength?: boolean;

  @IsOptional()
  @IsString()
  difficulty?: 'strength' | 'difficulty' | 'neutral';
}

export class UpdateChildModalityPreferencesDto {
  @IsOptional()
  @IsObject()
  visual?: ModalityPreferenceDto;

  @IsOptional()
  @IsObject()
  auditive?: ModalityPreferenceDto;

  @IsOptional()
  @IsObject()
  logical?: ModalityPreferenceDto;

  @IsOptional()
  @IsObject()
  motor?: ModalityPreferenceDto;

  @IsOptional()
  @IsObject()
  sensory?: ModalityPreferenceDto;
}
