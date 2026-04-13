import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@escola.edu.br', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'Luiz', required: false, description: 'Child name for child login' })
  @IsOptional()
  @IsString()
  childName?: string;

  @ApiProperty({ example: 'pai@email.com', required: false, description: 'Guardian email for child login' })
  @IsOptional()
  @IsEmail()
  guardianEmail?: string;
}