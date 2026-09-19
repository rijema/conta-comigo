import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AutbotBridgeDto {
  @ApiProperty({ required: false, description: 'Conta Comigo child id when a guardian chooses a child context' })
  @IsOptional()
  @IsString()
  childId?: string;
}
