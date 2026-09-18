import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import {
  LearningEvent,
  LearningEventType,
} from './entities/learning-event.entity';
import { InteractionEvidence } from './entities/interaction-evidence.entity';

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
    @InjectRepository(InteractionEvidence)
    private readonly interactionEvidenceRepository?: Repository<InteractionEvidence>,
  ) {}

  async trackVoiceEvidence(event: LearningEvent, command?: string, processingTimeMs?: number,
    recognitionSucceeded?: boolean): Promise<void> {
    if (!this.interactionEvidenceRepository || !event.activityId) return;
    try {
      await this.interactionEvidenceRepository.save(this.interactionEvidenceRepository.create({
        sourceEventId: event.id, studentId: event.studentId, sessionId: event.sessionId,
        activityId: event.activityId, recommendationId: event.recommendationId,
        eventType: event.eventType, interactionType: ['VOICE'], representation: null,
        motorDemand: null, sensoryLoad: null, languageLoad: null, outcome: command ?? null,
        timestamp: event.timestamp, metadata: {
          ...(processingTimeMs !== undefined ? { processingTimeMs } : {}),
          ...(recognitionSucceeded !== undefined ? { recognitionSucceeded } : {}),
        },
      }));
    } catch (error) {
      this.logger.error('Failed to persist sanitized voice interaction evidence',
        error instanceof Error ? error.stack : String(error));
    }
  }

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

  async getRecentSkippedActivityIds(studentId: string, limit = 20, since?: Date): Promise<string[]> {
    try {
      const events = await this.learningEventRepository.find({
        where: { studentId, eventType: LearningEventType.ACTIVITY_SKIPPED,
          ...(since ? { timestamp: MoreThanOrEqual(since) } : {}) },
        order: { timestamp: 'DESC' },
        take: limit,
      });
      return events.flatMap((event) => event.activityId ? [event.activityId] : []);
    } catch (error) {
      this.logger.error(
        `Failed to read recent skip signals for student ${studentId}; rejection evidence remains neutral`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }
}
