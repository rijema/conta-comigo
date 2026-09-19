import { IsIn, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class MessageDTO {
  @IsIn(['system', 'user', 'assistant'])
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsDateString()
  createdAt!: string; 
}