import { IsUUID, IsInt, IsString, Min, Max, IsOptional, IsNumber } from 'class-validator';

export class InitializeCycleDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  islandId: string;

  @IsInt()
  @Min(1)
  cycleNumber: number;

  @IsString()
  skillFocus: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalExercises?: number;
}

export class GetNextExerciseDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  islandId: string;

  @IsInt()
  @Min(1)
  cycleNumber: number;

  // From student profile
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  yearLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  teaSupportLevel?: number;

  @IsOptional()
  @IsString()
  preferredModality?: string;
}

export class CompleteExerciseDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  islandId: string;

  @IsInt()
  @Min(1)
  cycleNumber: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  studentScore: number; // 0.0-1.0
}

export class GetCycleStateDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  islandId: string;

  @IsInt()
  @Min(1)
  cycleNumber: number;
}
