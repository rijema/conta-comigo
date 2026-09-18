import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { LearningEventType } from '../entities/learning-event.entity';

export const VISUAL_COMMUNICATION_EVENT_TYPES = [
  LearningEventType.PICTOGRAM_OPENED,
  LearningEventType.VISUAL_LIBRARY_OPENED,
  LearningEventType.VISUAL_LIBRARY_ITEM_SELECTED,
] as const;

export const VISUAL_COMMUNICATION_CATEGORIES = [
  'NAVIGATION', 'STATE', 'MATHEMATICS', 'ACTIVITY_ACTION', 'COMMUNICATION',
  'NUMBER', 'Números', 'Operações Matemáticas', 'Formas Geométricas', 'Cores',
  'Verbos de Aprender', 'Jogos e Atividades', 'Matemática',
  'Pessoas', 'Animais', 'Alimentos', 'Objetos', 'Ações', 'Emoções',
  'Lugares', 'Formas', 'Cotidiano', 'Aprender', 'Jogos', 'Software',
  'Símbolos', 'Educação',
] as const;

export class TrackVisualCommunicationEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sessionId: string;

  @ApiProperty({ enum: VISUAL_COMMUNICATION_EVENT_TYPES })
  @IsIn(VISUAL_COMMUNICATION_EVENT_TYPES)
  eventType: typeof VISUAL_COMMUNICATION_EVENT_TYPES[number];

  @ApiPropertyOptional({ description: 'Stable registry concept identifier; never raw child content' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^(?:(navigation|state|mathematics|activity|communication|number|library|action|character|math|object|shape)\.[a-z0-9_]+|arasaac\.[1-9][0-9]*)$/)
  pictogramConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsIn(VISUAL_COMMUNICATION_CATEGORIES)
  category?: string;
}
