import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { LearningEvent, LearningEventType } from './entities/learning-event.entity';

export interface LearningAnalyticsMetrics {
  accuracy: number;
  completionRate: number;
  skipRate: number;
  averageAttempts: number;
  averageResponseTimeMs: number;
  hintRate: number;
  instructionReplayRate: number;
  activitiesCompleted: number;
  activitiesPresented: number;
}

export interface LearningAnalyticsMetricsScope {
  studentId?: string;
  sessionId?: string;
  bnccSkillId?: string;
  activityType?: string;
}

@Injectable()
export class LearningAnalyticsMetricsService {
  constructor(
    @InjectRepository(LearningEvent)
    private readonly learningEventRepository: Repository<LearningEvent>,
  ) {}

  getForStudent(studentId: string): Promise<LearningAnalyticsMetrics> {
    return this.getMetrics({ studentId });
  }

  getForSession(sessionId: string): Promise<LearningAnalyticsMetrics> {
    return this.getMetrics({ sessionId });
  }

  getForBnccSkill(bnccSkillId: string): Promise<LearningAnalyticsMetrics> {
    return this.getMetrics({ bnccSkillId });
  }

  getForActivityType(activityType: string): Promise<LearningAnalyticsMetrics> {
    return this.getMetrics({ activityType });
  }

  async getMetrics(scope: LearningAnalyticsMetricsScope): Promise<LearningAnalyticsMetrics> {
    const query = this.learningEventRepository
      .createQueryBuilder('event')
      .orderBy('event.timestamp', 'ASC')
      .addOrderBy('event.id', 'ASC');

    if (scope.studentId) {
      query.andWhere('event.studentId = :studentId', { studentId: scope.studentId });
    }
    if (scope.sessionId) {
      query.andWhere('event.sessionId = :sessionId', { sessionId: scope.sessionId });
    }
    if (scope.bnccSkillId) {
      query.andWhere('event.bnccSkillId = :bnccSkillId', { bnccSkillId: scope.bnccSkillId });
    }
    if (scope.activityType) {
      query
        .innerJoin(Activity, 'activity', 'activity.id = event.activityId')
        .andWhere('activity.type = :activityType', { activityType: scope.activityType });
    }

    return this.calculateFromEvents(await query.getMany());
  }

  calculateFromEvents(events: ReadonlyArray<LearningEvent>): LearningAnalyticsMetrics {
    const presented = this.activityInstances(events, LearningEventType.ACTIVITY_PRESENTED);
    const started = this.activityInstances(events, LearningEventType.ACTIVITY_STARTED);
    const completed = this.activityInstances(events, LearningEventType.ACTIVITY_COMPLETED);
    const skipped = this.activityInstances(events, LearningEventType.ACTIVITY_SKIPPED);
    const hinted = this.activityInstances(events, LearningEventType.HINT_REQUESTED);
    const replayed = this.activityInstances(events, LearningEventType.INSTRUCTION_REPLAYED);
    const submitted = events.filter((event) => event.eventType === LearningEventType.ANSWER_SUBMITTED);
    const submittedActivityInstances = new Set(
      submitted.map((event) => this.activityInstanceKey(event)).filter((key): key is string => key !== null),
    );
    const responseTimes = submitted
      .map((event) => event.responseTimeMs)
      .filter((value): value is number => value !== null && value !== undefined);

    return {
      accuracy: this.divide(submitted.filter((event) => event.correct === true).length, submitted.length),
      completionRate: this.divide(completed.size, started.size),
      skipRate: this.divide(skipped.size, presented.size),
      averageAttempts: this.divide(
        submitted.filter((event) => this.activityInstanceKey(event) !== null).length,
        submittedActivityInstances.size,
      ),
      averageResponseTimeMs: this.divide(
        responseTimes.reduce((sum, value) => sum + value, 0),
        responseTimes.length,
      ),
      hintRate: this.divide(hinted.size, started.size),
      instructionReplayRate: this.divide(replayed.size, started.size),
      activitiesCompleted: completed.size,
      activitiesPresented: presented.size,
    };
  }

  private activityInstances(
    events: ReadonlyArray<LearningEvent>,
    eventType: LearningEventType,
  ): Set<string> {
    return new Set(
      events
        .filter((event) => event.eventType === eventType)
        .map((event) => this.activityInstanceKey(event))
        .filter((key): key is string => key !== null),
    );
  }

  private activityInstanceKey(event: LearningEvent): string | null {
    if (!event.activityId) return null;
    return `${event.studentId}:${event.sessionId}:${event.activityId}`;
  }

  private divide(numerator: number, denominator: number): number {
    return denominator === 0 ? 0 : numerator / denominator;
  }
}
