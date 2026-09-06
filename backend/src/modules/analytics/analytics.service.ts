import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { UsersService } from '../users/users.service';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';

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
    private readonly knowledgeTracingService: KnowledgeTracingService,
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

    // @deprecated Snapshot field retained for compatibility; canonical values
    // are read from StudentSkillState and are never calculated here.
    const skillMastery = await this.knowledgeTracingService
      .getMasteryMapBySkillCode(event.userId);

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

    // Preserve the legacy BNCC progress field without writing mastery.
    for (const skill of event.bnccSkills || []) {
      await this.usersService
        .updateBnccProgress(event.userId, skill, event.isCorrect)
        .catch((err) => this.logger.error('Failed to update BNCC progress', err));
    }

    this.logger.log(
      `Analytics snapshot saved for ${event.userId}: accuracy=${overallAccuracy.toFixed(2)}, engagement=${engagementIndex.toFixed(2)}`,
    );
  }

  async getLatestSnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    const [snapshot, canonicalMastery] = await Promise.all([
      this.snapshotRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.knowledgeTracingService.getMasteryMapBySkillCode(userId),
    ]);
    if (snapshot) snapshot.skillMasterySnapshot = canonicalMastery;
    return snapshot;
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

  async getProgress(userId: string) {
    const [skillMastery, snapshots, profile] = await Promise.all([
      this.knowledgeTracingService.getMasteryMapBySkillCode(userId),
      this.snapshotRepo.find({
        where: { userId },
        order: { createdAt: 'ASC' },
        take: 30,
      }),
      this.usersService.getChildProfile(userId).catch(() => null),
    ]);

    return {
      weeklyAccuracy: snapshots.slice(-7).map((snapshot) => ({
        day: snapshot.createdAt.toISOString().split('T')[0],
        accuracy: Math.round(snapshot.overallAccuracy * 100),
        attempts: snapshot.totalActivitiesCompleted,
      })),
      skillMastery: Object.entries(skillMastery).map(([bnccCode, mastery]) => ({
        skill: bnccCode,
        mastery: Math.round(mastery * 100),
        bnccCode,
      })),
      totalSessions: new Set(snapshots.map((snapshot) => snapshot.sessionId).filter(Boolean)).size,
      totalMinutes: Math.round(
        snapshots.reduce((sum, snapshot) => sum + snapshot.averageTimePerActivity, 0) / 60,
      ),
      currentLevel: profile?.currentLevel ?? 1,
    };
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
