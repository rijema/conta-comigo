import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

export class ChildProfileDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(18)
  age: number;
}

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@escola.edu.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @MinLength(8)
  password: string;

  // Only these two roles can be self-assigned. CHILD accounts are created by
  // a guardian and ADMIN sees every child, so neither may come from sign-up.
  @ApiProperty({ enum: [UserRole.GUARDIAN, UserRole.PROFESSIONAL], example: UserRole.GUARDIAN })
  @IsIn([UserRole.GUARDIAN, UserRole.PROFESSIONAL], {
    message: 'Escolha se você é responsável ou profissional.',
  })
  role: UserRole;

  @ApiProperty({ required: false, description: 'Clinic name (professional sign-up only; must not be registered yet)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinicName?: string;

  @ApiProperty({ required: false, description: 'Clinic that follows the child (guardian sign-up only)' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  lgpdConsent?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  consentTimestamp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChildProfileDto)
  childProfile?: ChildProfileDto;

  @ApiProperty({ required: false, description: 'Password for the child account (guardian registration only)' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  childPassword?: string;

  @ApiProperty({ required: false, description: 'Client-side idempotency key to prevent duplicate sign-ups after a failed fetch' })
  @IsOptional()
  @IsString()
  registrationNonce?: string;
}