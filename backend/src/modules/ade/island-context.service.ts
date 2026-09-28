import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

/**
 * [PROPOSTA CONTA COMIGO] Island Context Service
 * 
 * Enhances ADE decisions with island-based learning context:
 * 1. Tracks current island and sequence position
 * 2. Calculates time since last attempt
 * 3. Measures success rate by activity type
 * 4. Recommends next island based on progress
 */

export interface IslandContext {
  currentIslandId?: string;
  sequencePosition?: number;
  totalInIsland?: number;
  islandProgress?: number; // 0-100%
  timeSinceLastAttempt?: number; // milliseconds
  successRateByType?: Record<string, number>;
  recommendNextIsland?: boolean;
}

export interface IslandAdeEnhancement {
  islandId?: string;
  sequenceInIsland?: number;
  shouldStayInIsland?: boolean;
  shouldProgressToNextIsland?: boolean;
  successRateByType?: Record<string, number>;
}

@Injectable()
export class IslandContextService {
  private readonly logger = new Logger(IslandContextService.name);

  constructor(
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
  ) {}

  /**
   * Analyze user's island progress and context
   * [PARÂMETRO EXPERIMENTAL] Thresholds for island progression
   */
  async analyzeIslandContext(
    userId: string,
    currentActivityId?: string,
  ): Promise<IslandContext> {
    const recentAttempts = await this.attemptRepo.find({
      where: { userId },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    if (!recentAttempts.length) {
      return {};
    }

    // Calculate success rate by activity type
    const successRateByType = this.calculateSuccessRateByType(recentAttempts);

    // Get time since last attempt
    const timeSinceLastAttempt = Date.now() - recentAttempts[0].createdAt.getTime();

    // Get current island from recent attempts
    const currentIslandId = this.extractCurrentIsland(recentAttempts);

    // Calculate island progress
    const islandProgress = this.calculateIslandProgress(recentAttempts, currentIslandId);

    return {
      currentIslandId,
      timeSinceLastAttempt,
      successRateByType,
      islandProgress,
    };
  }

  /**
   * Enhance ADE decision with island context
   * [DECISÃO DE ENGENHARIA] Island context overrides generic recommendations
   */
  async enhanceAdeDecision(
    userId: string,
    adeRecommendedDifficulty: string,
    adeRecommendedModality: string,
  ): Promise<IslandAdeEnhancement> {
    const context = await this.analyzeIslandContext(userId);

    if (!context.currentIslandId) {
      // No island context yet - start with first island
      return {
        islandId: 'island-numbers',
        sequenceInIsland: 1,
        shouldStayInIsland: true,
        shouldProgressToNextIsland: false,
      };
    }

    // [PARÂMETRO EXPERIMENTAL] Thresholds for island progression
    const ISLAND_COMPLETION_THRESHOLD = 80; // 80% of island completed
    const SUCCESS_RATE_THRESHOLD = 0.75; // 75% success rate

    const progressMeetsThreshold =
      (context.islandProgress ?? 0) >= ISLAND_COMPLETION_THRESHOLD;
    const successMeetsThreshold =
      context.successRateByType &&
      Object.values(context.successRateByType).some(
        (rate) => rate >= SUCCESS_RATE_THRESHOLD,
      );

    const shouldProgressToNextIsland: boolean =
      progressMeetsThreshold && !!successMeetsThreshold;

    return {
      islandId: context.currentIslandId,
      shouldStayInIsland: !shouldProgressToNextIsland,
      shouldProgressToNextIsland,
      successRateByType: context.successRateByType,
    };
  }

  /**
   * Calculate success rate for each activity type
   * [HIPÓTESE A VALIDAR] Activity type affects learning outcomes
   */
  private calculateSuccessRateByType(
    attempts: ActivityAttempt[],
  ): Record<string, number> {
    const typeStats: Record<string, { correct: number; total: number }> = {};

    attempts.forEach((attempt) => {
      const type = attempt.activity?.type || 'unknown';
      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0 };
      }
      typeStats[type].total++;
      if (attempt.isCorrect) {
        typeStats[type].correct++;
      }
    });

    const successRates: Record<string, number> = {};
    Object.entries(typeStats).forEach(([type, stats]) => {
      successRates[type] = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return successRates;
  }

  /**
   * Extract current island from recent attempts
   * [DECISÃO DE ENGENHARIA] Use most recent island context
   */
  private extractCurrentIsland(attempts: ActivityAttempt[]): string | undefined {
    // Look for island context in recent attempts
    // ActivityAttempt has islandId column directly
    for (const attempt of attempts) {
      if (attempt.islandId) {
        return attempt.islandId;
      }
    }
    return undefined;
  }

  /**
   * Calculate progress through current island
   * [PARÂMETRO EXPERIMENTAL] Progress = completed exercises / total in island
   */
  private calculateIslandProgress(
    attempts: ActivityAttempt[],
    islandId?: string,
  ): number {
    if (!islandId) return 0;

    const islandAttempts = attempts.filter(
      (a) => a.islandId === islandId,
    );

    if (!islandAttempts.length) return 0;

    // Count unique activities completed in island
    const uniqueActivities = new Set(islandAttempts.map((a) => a.activityId));

    // [PARÂMETRO EXPERIMENTAL] Assume 10 exercises per island
    const EXERCISES_PER_ISLAND = 10;

    return Math.min(
      (uniqueActivities.size / EXERCISES_PER_ISLAND) * 100,
      100,
    );
  }

  /**
   * Recommend next island based on current progress
   * [PROPOSTA CONTA COMIGO] Sequential island progression
   */
  getNextIsland(currentIslandId: string): string | undefined {
    const islandSequence = [
      'island-numbers',
      'island-colors',
      'island-beach',
      'island-body',
      'island-planets',
      'island-school',
    ];

    const currentIndex = islandSequence.indexOf(currentIslandId);
    if (currentIndex === -1 || currentIndex >= islandSequence.length - 1) {
      return undefined;
    }

    return islandSequence[currentIndex + 1];
  }

  /**
   * Calculate recommended sequence position within island
   * [DECISÃO DE ENGENHARIA] Sequence respects difficulty progression
   */
  async getRecommendedSequencePosition(
    userId: string,
    islandId: string,
  ): Promise<number> {
    const attempts = await this.attemptRepo.find({
      where: { userId },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const islandAttempts = attempts.filter(
      (a) => a.islandId === islandId,
    );

    if (!islandAttempts.length) {
      return 1; // Start at first exercise
    }

    // Get highest sequence position completed
    // Note: cycleNumber could be used as sequence position, or we track it separately
    const maxSequence = Math.max(
      ...islandAttempts
        .map((a) => a.cycleNumber || 0)
        .filter((s) => s > 0),
      0,
    );

    // [PARÂMETRO EXPERIMENTAL] Success rate threshold to advance
    const recentSuccess = islandAttempts
      .slice(0, 5)
      .filter((a) => a.isCorrect).length;

    // Advance if 4+ of last 5 correct
    if (recentSuccess >= 4 && maxSequence < 10) {
      return maxSequence + 1;
    }

    return maxSequence || 1;
  }
}
