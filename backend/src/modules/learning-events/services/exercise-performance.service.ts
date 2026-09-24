import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExercisePerformance } from '../entities/exercise-performance.entity';

export interface ExercisePerformanceInput {
  userId: string;
  activityId: string;
  islandId?: string;
  sessionId?: string;
  attemptNumber?: number;
  isCorrect: boolean;
  score: number;
  responseTimeMs?: number;
  hintsUsed?: number;
  tutorialOpenedCount?: number;
  instructionReplayCount?: number;
  skipped?: boolean;
  timeBeforeSkipMs?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageResponseTimeMs: number;
  totalHintsUsed: number;
  averageHintsPerAttempt: number;
  tutorialOpenedCount: number;
  instructionReplayCount: number;
  skippedCount: number;
  averageScore: number;
}

@Injectable()
export class ExercisePerformanceService {
  constructor(
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
  ) {}

  async recordPerformance(
    input: ExercisePerformanceInput,
  ): Promise<ExercisePerformance> {
    const performance = this.performanceRepository.create(input);
    return this.performanceRepository.save(performance);
  }

  async getPerformanceByUserAndActivity(
    userId: string,
    activityId: string,
  ): Promise<ExercisePerformance[]> {
    return this.performanceRepository.find({
      where: { userId, activityId },
      order: { createdAt: 'ASC' },
    });
  }

  async getPerformanceByUserAndIsland(
    userId: string,
    islandId: string,
  ): Promise<ExercisePerformance[]> {
    return this.performanceRepository.find({
      where: { userId, islandId },
      order: { createdAt: 'ASC' },
    });
  }

  async getMetricsByUserAndActivity(
    userId: string,
    activityId: string,
  ): Promise<PerformanceMetrics> {
    const performances = await this.getPerformanceByUserAndActivity(
      userId,
      activityId,
    );

    if (performances.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
        totalHintsUsed: 0,
        averageHintsPerAttempt: 0,
        tutorialOpenedCount: 0,
        instructionReplayCount: 0,
        skippedCount: 0,
        averageScore: 0,
      };
    }

    const correctAttempts = performances.filter((p) => p.isCorrect).length;
    const totalAttempts = performances.length;
    const totalHintsUsed = performances.reduce((sum, p) => sum + p.hintsUsed, 0);
    const responseTimes = performances
      .filter((p) => p.responseTimeMs !== null)
      .map((p) => p.responseTimeMs!);
    const averageResponseTimeMs =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const tutorialOpenedCount = performances.reduce(
      (sum, p) => sum + p.tutorialOpenedCount,
      0,
    );
    const instructionReplayCount = performances.reduce(
      (sum, p) => sum + p.instructionReplayCount,
      0,
    );
    const skippedCount = performances.filter((p) => p.skipped).length;
    const averageScore =
      performances.reduce((sum, p) => sum + p.score, 0) / totalAttempts;

    return {
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      averageResponseTimeMs,
      totalHintsUsed,
      averageHintsPerAttempt:
        totalAttempts > 0 ? totalHintsUsed / totalAttempts : 0,
      tutorialOpenedCount,
      instructionReplayCount,
      skippedCount,
      averageScore,
    };
  }

  async getMetricsByUserAndIsland(
    userId: string,
    islandId: string,
  ): Promise<PerformanceMetrics> {
    const performances = await this.getPerformanceByUserAndIsland(
      userId,
      islandId,
    );

    if (performances.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageResponseTimeMs: 0,
        totalHintsUsed: 0,
        averageHintsPerAttempt: 0,
        tutorialOpenedCount: 0,
        instructionReplayCount: 0,
        skippedCount: 0,
        averageScore: 0,
      };
    }

    const correctAttempts = performances.filter((p) => p.isCorrect).length;
    const totalAttempts = performances.length;
    const totalHintsUsed = performances.reduce((sum, p) => sum + p.hintsUsed, 0);
    const responseTimes = performances
      .filter((p) => p.responseTimeMs !== null)
      .map((p) => p.responseTimeMs!);
    const averageResponseTimeMs =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const tutorialOpenedCount = performances.reduce(
      (sum, p) => sum + p.tutorialOpenedCount,
      0,
    );
    const instructionReplayCount = performances.reduce(
      (sum, p) => sum + p.instructionReplayCount,
      0,
    );
    const skippedCount = performances.filter((p) => p.skipped).length;
    const averageScore =
      performances.reduce((sum, p) => sum + p.score, 0) / totalAttempts;

    return {
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      averageResponseTimeMs,
      totalHintsUsed,
      averageHintsPerAttempt:
        totalAttempts > 0 ? totalHintsUsed / totalAttempts : 0,
      tutorialOpenedCount,
      instructionReplayCount,
      skippedCount,
      averageScore,
    };
  }

  async getCompletedActivitiesInSession(
    userId: string,
    sessionId: string,
  ): Promise<string[]> {
    const performances = await this.performanceRepository.find({
      where: { userId, sessionId },
      select: ['activityId'],
    });

    return [...new Set(performances.map((p) => p.activityId))];
  }

  async getCompletedActivitiesInIsland(
    userId: string,
    islandId: string,
  ): Promise<string[]> {
    const performances = await this.performanceRepository.find({
      where: { userId, islandId },
      select: ['activityId'],
    });

    return [...new Set(performances.map((p) => p.activityId))];
  }
}
