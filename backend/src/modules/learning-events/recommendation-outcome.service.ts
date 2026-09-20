import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Activity } from '../activities/entities/activity.entity';
import { AdaptationTransition } from './entities/adaptation-transition.entity';
import { InteractionEvidence } from './entities/interaction-evidence.entity';
import { LearningEvent, LearningEventType } from './entities/learning-event.entity';
import {
  RecommendationOutcome,
  RecommendationOutcomeStatus,
} from './entities/recommendation-outcome.entity';

export interface ReplacementTransitionInput {
  replacementRecommendationId: string;
  replacementActivityId: string;
  sameBNCCSkill?: boolean | null;
  sameMathematicalConcept?: boolean | null;
  interactionTypeChanged?: boolean | null;
  representationChanged?: boolean | null;
  motorDemandDelta?: number | null;
  sensoryLoadDelta?: number | null;
  languageLoadDelta?: number | null;
  scaffoldingDelta?: number | null;
  difficultyDelta?: number | null;
}

@Injectable()
export class RecommendationOutcomeService {
  constructor(
    @InjectRepository(RecommendationOutcome)
    private readonly outcomeRepository: Repository<RecommendationOutcome>,
    @InjectRepository(AdaptationTransition)
    private readonly transitionRepository: Repository<AdaptationTransition>,
    @InjectRepository(InteractionEvidence)
    private readonly evidenceRepository: Repository<InteractionEvidence>,
  ) {}

  async synchronize(event: LearningEvent, activity: Activity): Promise<void> {
    if (!event.activityId || await this.evidenceRepository.findOne({ where: { sourceEventId: event.id } })) return;
    if (!event.recommendationId) {
      await this.persistEvidence(event, activity);
      return;
    }

    const outcome = await this.findOrCreateOutcome(event);
    this.applyEvent(outcome, event);
    await this.outcomeRepository.save(outcome);

    if (event.eventType === LearningEventType.ACTIVITY_SKIPPED) {
      await this.createPendingTransition(event);
    }
    await this.persistEvidence(event, activity);
  }

  async attachReplacement(
    previousRecommendationId: string,
    replacement: ReplacementTransitionInput,
  ): Promise<AdaptationTransition> {
    const transition = await this.transitionRepository.findOneByOrFail({ previousRecommendationId });
    Object.assign(transition, replacement);
    return this.transitionRepository.save(transition);
  }

  private async findOrCreateOutcome(event: LearningEvent): Promise<RecommendationOutcome> {
    const existing = await this.outcomeRepository.findOne({
      where: { recommendationId: event.recommendationId! },
    });
    if (existing) return existing;
    const created = this.outcomeRepository.create({
      recommendationId: event.recommendationId!,
      studentId: event.studentId,
      sessionId: event.sessionId,
      activityId: event.activityId!,
      status: this.statusFor(event.eventType) ?? RecommendationOutcomeStatus.PRESENTED,
      presentedAt: null,
      startedAt: null,
      completedAt: null,
      skippedAt: null,
      abandonedAt: null,
      attempts: 0,
      hintsUsed: 0,
      instructionReplays: 0,
      responseTimeMs: null,
      correct: null,
    });
    return this.outcomeRepository.save(created);
  }

  private applyEvent(outcome: RecommendationOutcome, event: LearningEvent): void {
    const status = this.statusFor(event.eventType);
    if (status && !this.isTerminal(outcome.status) && this.statusPriority(status) > this.statusPriority(outcome.status)) {
      outcome.status = status;
    }
    if (event.eventType === LearningEventType.ACTIVITY_PRESENTED) outcome.presentedAt ??= event.timestamp;
    if (event.eventType === LearningEventType.ACTIVITY_STARTED) outcome.startedAt ??= event.timestamp;
    if (event.eventType === LearningEventType.ANSWER_SUBMITTED) outcome.attempts += 1;
    if (event.eventType === LearningEventType.HINT_REQUESTED) outcome.hintsUsed += 1;
    if (event.eventType === LearningEventType.INSTRUCTION_REPLAYED) outcome.instructionReplays += 1;
    if (event.eventType === LearningEventType.ACTIVITY_COMPLETED) {
      outcome.completedAt ??= event.timestamp;
      outcome.responseTimeMs = event.responseTimeMs ?? outcome.responseTimeMs;
      outcome.correct = event.correct ?? outcome.correct;
    }
    if (event.eventType === LearningEventType.ACTIVITY_SKIPPED) outcome.skippedAt ??= event.timestamp;
    if (event.eventType === LearningEventType.ACTIVITY_ABANDONED) outcome.abandonedAt ??= event.timestamp;
  }

  private statusFor(eventType: LearningEventType): RecommendationOutcomeStatus | null {
    if (eventType === LearningEventType.ACTIVITY_COMPLETED) return RecommendationOutcomeStatus.COMPLETED;
    if (eventType === LearningEventType.ACTIVITY_SKIPPED) return RecommendationOutcomeStatus.SKIPPED;
    if (eventType === LearningEventType.ACTIVITY_ABANDONED) return RecommendationOutcomeStatus.ABANDONED;
    if (eventType === LearningEventType.ACTIVITY_STARTED) return RecommendationOutcomeStatus.STARTED;
    if (eventType === LearningEventType.ACTIVITY_PRESENTED) return RecommendationOutcomeStatus.PRESENTED;
    return null;
  }

  private statusPriority(status: RecommendationOutcomeStatus): number {
    if (status === RecommendationOutcomeStatus.PRESENTED) return 1;
    if (status === RecommendationOutcomeStatus.STARTED) return 2;
    return 3;
  }

  private isTerminal(status: RecommendationOutcomeStatus): boolean {
    return status === RecommendationOutcomeStatus.COMPLETED ||
      status === RecommendationOutcomeStatus.SKIPPED ||
      status === RecommendationOutcomeStatus.ABANDONED;
  }

  private async createPendingTransition(event: LearningEvent): Promise<void> {
    const existing = await this.transitionRepository.findOne({
      where: { previousRecommendationId: event.recommendationId! },
    });
    if (existing) return;
    await this.transitionRepository.save(this.transitionRepository.create({
      studentId: event.studentId,
      sessionId: event.sessionId,
      previousRecommendationId: event.recommendationId!,
      previousActivityId: event.activityId!,
      triggerEventId: event.id,
      triggerType: event.eventType,
      changeRequested: event.metadata?.changeRequested === true,
      replacementRecommendationId: null,
      replacementActivityId: null,
      sameBNCCSkill: null,
      sameMathematicalConcept: null,
      interactionTypeChanged: null,
      representationChanged: null,
      motorDemandDelta: null,
      sensoryLoadDelta: null,
      languageLoadDelta: null,
      scaffoldingDelta: null,
      difficultyDelta: null,
    }));
  }

  private async persistEvidence(event: LearningEvent, activity: Activity): Promise<void> {
    if (!event.activityId) return;
    const profile = activity.difficultyProfile;
    const safeMetadata = event.eventType === LearningEventType.ACTIVITY_SKIPPED
      ? {
          timeBeforeSkipMs: this.numberOrNull(event.metadata?.timeBeforeSkipMs),
          attemptsBeforeSkip: this.numberOrNull(event.metadata?.attemptsBeforeSkip),
          hintsBeforeSkip: this.numberOrNull(event.metadata?.hintsBeforeSkip),
          changeRequested: event.metadata?.changeRequested === true,
        }
      : event.eventType === LearningEventType.ACTIVITY_ABANDONED
      ? {
          timeBeforeExitMs: this.numberOrNull(event.metadata?.timeBeforeExitMs),
          attemptsBeforeExit: this.numberOrNull(event.metadata?.attemptsBeforeExit),
          hintsBeforeExit: this.numberOrNull(event.metadata?.hintsBeforeExit),
        }
      : null;
    await this.evidenceRepository.save(this.evidenceRepository.create({
      sourceEventId: event.id,
      studentId: event.studentId,
      sessionId: event.sessionId,
      activityId: event.activityId,
      recommendationId: event.recommendationId,
      eventType: event.eventType,
      interactionType: activity.interactionType ?? null,
      representation: activity.representation ?? null,
      motorDemand: this.textOrNull(profile?.motorDemand),
      sensoryLoad: this.textOrNull(profile?.sensoryLoad),
      languageLoad: this.textOrNull(profile?.languageLoad),
      outcome: event.eventType === LearningEventType.ACTIVITY_COMPLETED
        ? event.correct === true ? 'CORRECT' : event.correct === false ? 'INCORRECT' : 'COMPLETED'
        : event.eventType,
      timestamp: event.timestamp,
      metadata: safeMetadata,
    }));
  }

  private numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private textOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}
