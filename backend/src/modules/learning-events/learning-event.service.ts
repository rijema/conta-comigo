import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LearningEvent,
  LearningEventType,
} from './entities/learning-event.entity';

export interface TrackLearningEventInput {
  studentId: string;
  sessionId: string;
  eventType: LearningEventType;
  timestamp: Date;
  activityId?: string | null;
  bnccSkillId?: string | null;
  attempt?: number | null;
  responseTimeMs?: number | null;
  correct?: boolean | null;
  hintsUsed?: number | null;
  recommendationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class LearningEventService {
  private readonly logger = new Logger(LearningEventService.name);

  constructor(
    @InjectRepository(LearningEvent)
    private readonly learningEventRepository: Repository<LearningEvent>,
  ) {}

  /**
   * Appends one immutable analytics event. Persistence errors are deliberately
   * contained so analytics availability never fails the learner interaction.
   */
  async track(input: TrackLearningEventInput): Promise<LearningEvent | null> {
    try {
      const event = this.learningEventRepository.create(input);
      return await this.learningEventRepository.save(event);
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to persist learning event ${input.eventType} for session ${input.sessionId}`,
        details,
      );
      return null;
    }
  }
}
