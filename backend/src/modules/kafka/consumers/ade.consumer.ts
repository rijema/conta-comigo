import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PlatformEvent } from '../kafka-producer.service';

@Processor('ade-decisions')
export class AdeConsumer {
  private readonly logger = new Logger(AdeConsumer.name);

  @Process('ade-decision')
  async handleAdeDecision(job: Job<PlatformEvent>): Promise<void> {
    const event = job.data;
    this.logger.log(
      `[ADE Consumer] Processing decision for learner: ${event.learnerId} | ` +
      `Type: ${event.eventType}`,
    );

    // Log XAI decision for audit trail
    this.logger.log(
      `[XAI] ADE Decision Recorded: ${JSON.stringify({
        learnerId: event.learnerId,
        sessionId: event.sessionId,
        decision: event.payload,
        timestamp: event.timestamp,
      })}`,
    );
  }
}