import { IsIn, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class NeuralSpeechDto {
  @IsString()
  @MaxLength(500)
  text: string;

  @IsIn(['pt-BR'])
  language: string = 'pt-BR';

  @IsNumber()
  @Min(0.5)
  @Max(2)
  rate: number = 0.85;
}
