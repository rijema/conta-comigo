import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from '../../analytics/entities/analytics-snapshot.entity';
import { PlatformEvent } from '../kafka-producer.service';

@Processor('analytics-updates')
export class AnalyticsConsumer {
  private readonly logger = new Logger(AnalyticsConsumer.name);

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
  ) {}

  @Process('analytics-update')
  async handleAnalyticsUpdate(job: Job<PlatformEvent>): Promise<void> {
    const event = job.data;
    this.logger.log(`Processing analytics update for learner: ${event.learnerId}`);

    try {
      const { payload } = event;

      // Persist analytics snapshot from event
      if (payload.masteryProbability !== undefined) {
        const snapshot = this.snapshotRepo.create({
          learnerId: event.learnerId,
          sessionId: event.sessionId,
          bnccSkillCode: payload.bnccSkillCode as string,
          masteryProbability: payload.masteryProbability as number,
          engagementIndex: (payload.engagementIndex as number) ?? 0.5,
          metrics: payload.metrics as Record<string, unknown>,
        });

        await this.snapshotRepo.save(snapshot);
        this.logger.log(`Analytics snapshot saved for learner: ${event.learnerId}`);
      }

      // Check for distress signals
      await this.detectBehavioralPatterns(event);
    } catch (error) {
      this.logger.error(`Failed to process analytics update: ${error.message}`, error.stack);
      throw error; // Re-throw for Bull retry mechanism
    }
  }

  private async detectBehavioralPatterns(event: PlatformEvent): Promise<void> {
    const { payload } = event;

    // Detect if learner is struggling (engagement drops + low mastery)
    if (
      (payload.engagementIndex as number) < 0.3 &&
      (payload.masteryProbability as number) < 0.4
    ) {
      this.logger.warn(
        `[ALERT] Learner ${event.learnerId} shows distress signals. ` +
        `Engagement: ${payload.engagementIndex}, Mastery: ${payload.masteryProbability}`,
      );
      // In production: publish to alerts queue
    }
  }
}