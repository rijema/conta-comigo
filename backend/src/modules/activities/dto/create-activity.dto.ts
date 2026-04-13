IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ActivityType, DifficultyLevel } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsArray()
  bnccSkills: string[];

  @IsArray()
  targetModalities: string[];

  @IsObject()
  content: Record<string, any>;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  pointsReward?: number;

  @IsOptional()
  @IsString()
  prerequisiteSkillCode?: string;
}