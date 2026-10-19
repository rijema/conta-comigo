import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsNotEmpty,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty()
  @IsString()
  activityId: string;

  @ApiProperty()
  @IsOptional()
  answer: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recommendationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reviewAssignmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  islandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cycleNumber?: number;

  @ApiPropertyOptional({ description: 'Island the child opened on the map; next pick stays inside it' })
  @IsOptional()
  @Matches(/^[a-z0-9-]{1,50}$/)
  focusIslandId?: string;

  @ApiPropertyOptional({ description: 'Template key (year, level, seed) of the generated exercise the child answered' })
  @IsOptional()
  @IsObject()
  templateInstance?: { year?: number; level?: number; seed?: number };

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  responseTimeMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  firstInteractionMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalTimeMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousDifficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hintsUsed?: number;

  @ApiPropertyOptional({
    description:
      'Número sequencial (1-based) desta tentativa na mesma atividade, rastreado no cliente. ' +
      'Usado para revelar a resposta correta após 5 tentativas erradas seguidas (GAIA: ' +
      'gaia.wiki.br/visibilidade-do-estado-do-sistema/numeros-de-tentativas).',
  })
  @IsOptional()
  @IsNumber()
  attemptNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  interactionSignals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  adeDecisionContext?: Record<string, any>;
}
