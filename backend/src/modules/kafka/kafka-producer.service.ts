import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface PlatformEvent {
  eventId: string;
  eventType: string;
  learnerId: string;
  sessionId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @InjectQueue('session-events') private sessionEventsQueue: Queue,
    @InjectQueue('activity-events') private activityEventsQueue: Queue,
    @InjectQueue('analytics-updates') private analyticsUpdatesQueue: Queue,
    @InjectQueue('ade-decisions') private adeDecisionsQueue: Queue,
    @InjectQueue('alerts') private alertsQueue: Queue,
  ) {}

  async publishSessionEvent(event: PlatformEvent): Promise<void> {
    this.logger.log(`Publishing session event: ${event.eventType} for learner ${event.learnerId}`);
    await this.sessionEventsQueue.add('session-event', event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  async publishActivityEvent(event: PlatformEvent): Promise<void> {
    this.logger.log(`Publishing activity event: ${event.eventType} for learner ${event.learnerId}`);
    await this.activityEventsQueue.add('activity-event', event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  async publishAnalyticsUpdate(event: PlatformEvent): Promise<void> {
    await this.analyticsUpdatesQueue.add('analytics-update', event, {
      attempts: 3,
      removeOnComplete: true,
    });
  }

  async publishAdeDecision(event: PlatformEvent): Promise<void> {
    await this.adeDecisionsQueue.add('ade-decision', event, {
      attempts: 3,
      removeOnComplete: true,
    });
  }

  async publishAlert(event: PlatformEvent): Promise<void> {
    await this.alertsQueue.add('alert', event, {
      attempts: 5,
      removeOnComplete: false,
    });
  }
}