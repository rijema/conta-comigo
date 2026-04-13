import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { UsersService } from '../users/users.service';

export interface ActivityEvent {
  type: string;
  userId: string;
  activityId: string;
  sessionId?: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  interactionSignals: any;
  bnccSkills: string[];
  timestamp: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Process a Kafka activity event.
   * Called by the Kafka consumer after every activity completion.
   */
  async processActivityEvent(event: ActivityEvent): Promise<void> {
    this.logger.log(
      `Processing activity event for user ${event.userId}: correct=${event.isCorrect}`,
    );

    // Compute engagement index using behavioral signals
    const engagementIndex = this.calculateEngagementIndex(event);

    // Get or compute cumulative metrics
    const existing = await this.getLatestSnapshot(event.userId);
    const total = (existing?.totalActivitiesCompleted || 0) + 1;
    const totalCorrect = (existing?.totalCorrect || 0) + (event.isCorrect ? 1 : 0);
    const overallAccuracy = totalCorrect / total;

    // Update BNCC coverage
    const bnccCoverage = { ...(existing?.bnccCoverage || {}) };
    for (const skill of event.bnccSkills || []) {
      if (event.isCorrect) {
        bnccCoverage[skill] = true;
      } else {
        bnccCoverage[skill] = bnccCoverage[skill] || false;
      }
    }

    // Update skill mastery (simplified BKT update — full BKT is in ML service)
    const skillMastery = { ...(existing?.skillMasterySnapshot || {}) };
    for (const skill of event.bnccSkills || []) {
      const current = skillMastery[skill] || 0.3;
      // Bayesian update approximation
      const updated = event.isCorrect
        ? current + (1 - current) * 0.3
        : current * 0.7;
      skillMastery[skill] = Math.min(0.99, Math.max(0.01, updated));
    }

    // Save snapshot
    const snapshot = this.snapshotRepo.create({
      userId: event.userId,
      sessionId: event.sessionId,
      overallAccuracy,
      engagementIndex,
      averageTimePerActivity: event.timeSpentSeconds,
      totalActivitiesCompleted: total,
      totalCorrect,
      skillMasterySnapshot: skillMastery,
      bnccCoverage,
      behavioralPatterns: this.extractPatterns(event),
      rawEventData: event,
    });

    await this.snapshotRepo.save(snapshot);

    // Update user's skill mastery in profile
    for (const skill of event.bnccSkills || []) {
      await this.usersService
        .updateSkillMastery(event.userId, skill, skillMastery[skill])
        .catch((err) => this.logger.error('Failed to update skill mastery', err));

      await this.usersService
        .updateBnccProgress(event.userId, skill, event.isCorrect)
        .catch((err) => this.logger.error('Failed to update BNCC progress', err));
    }

    this.logger.log(
      `Analytics snapshot saved for ${event.userId}: accuracy=${overallAccuracy.toFixed(2)}, engagement=${engagementIndex.toFixed(2)}`,
    );
  }

  async getLatestSnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    return this.snapshotRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserAnalytics(userId: string): Promise<{
    latest: AnalyticsSnapshot | null;
    history: AnalyticsSnapshot[];
    summary: any;
  }> {
    const [latest, history] = await Promise.all([
      this.getLatestSnapshot(userId),
      this.snapshotRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    const summary = latest
      ? {
          totalActivities: latest.totalActivitiesCompleted,
          overallAccuracy: latest.overallAccuracy,
          engagementIndex: latest.engagementIndex,
          masteredSkills: Object.values(latest.bnccCoverage || {}).filter(
            Boolean,
          ).length,
          totalSkillsAttempted: Object.keys(latest.bnccCoverage || {}).length,
        }
      : null;

    return { latest, history, summary };
  }

  private calculateEngagementIndex(event: ActivityEvent): number {
    const signals = event.interactionSignals || {};
    let score = 0.5; // base

    // Penalize high backtracking
    if (signals.backtrackCount > 5) score -= 0.1;

    // Penalize high pause count
    if (signals.pauseCount > 3) score -= 0.1;

    // Reward fast first answer
    if (signals.firstAnswerTime < 10) score += 0.1;

    // Penalize excessive time
    if (event.timeSpentSeconds > 180) score -= 0.15;

    // Reward correct answers
    if (event.isCorrect) score += 0.2;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private extractPatterns(event: ActivityEvent) {
    const signals = event.interactionSignals || {};
    return {
      avgHintsPerActivity: event.timeSpentSeconds > 60 ? 1 : 0,
      avgClicksPerActivity: signals.clickCount || 0,
      pauseFrequency: signals.pauseCount || 0,
    };
  }
}