import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { ExercisePerformance } from '../../learning-events/entities/exercise-performance.entity';
import { ExercisePerformanceService } from '../../learning-events/services/exercise-performance.service';

export interface ProgressionSuggestion {
  activityId: string;
  title: string;
  difficulty: string;
  reason: string;
  score: number;
}

@Injectable()
export class ExerciseProgressionService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ExercisePerformance)
    private readonly performanceRepository: Repository<ExercisePerformance>,
    private readonly performanceService: ExercisePerformanceService,
  ) {}

  async suggestNextExercise(
    userId: string,
    islandId: string,
    sessionId: string,
  ): Promise<ProgressionSuggestion | null> {
    const completedInSession = await this.performanceService.getCompletedActivitiesInSession(
      userId,
      sessionId,
    );

    const completedInIsland = await this.performanceService.getCompletedActivitiesInIsland(
      userId,
      islandId,
    );

    const metrics = await this.performanceService.getMetricsByUserAndIsland(
      userId,
      islandId,
    );

    const availableActivities = await this.getActivitiesByIsland(islandId);

    const untriedActivities = availableActivities.filter(
      (a) => !completedInIsland.includes(a.id),
    );

    if (untriedActivities.length === 0) {
      return this.suggestRepeatWithVariation(
        userId,
        islandId,
        availableActivities,
        metrics,
      );
    }

    const nextDifficulty = this.calculateNextDifficulty(metrics);

    const candidates = untriedActivities.filter(
      (a) => a.difficulty === nextDifficulty,
    );

    if (candidates.length === 0) {
      const fallback = untriedActivities[0];
      return {
        activityId: fallback.id,
        title: fallback.title,
        difficulty: fallback.difficulty,
        reason: 'Próximo exercício disponível na ilha',
        score: 0.5,
      };
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      activityId: selected.id,
      title: selected.title,
      difficulty: selected.difficulty,
      reason: this.getProgressionReason(metrics, nextDifficulty),
      score: this.calculateFitScore(metrics, selected),
    };
  }

  private calculateNextDifficulty(metrics: any): string {
    const { accuracy, totalAttempts } = metrics;

    if (totalAttempts < 3) {
      return 'very_easy';
    }

    if (accuracy >= 0.85) {
      return 'hard';
    }

    if (accuracy >= 0.7) {
      return 'medium';
    }

    if (accuracy >= 0.5) {
      return 'easy';
    }

    return 'very_easy';
  }

  private getProgressionReason(metrics: any, difficulty: string): string {
    const { accuracy, totalAttempts } = metrics;

    if (totalAttempts < 3) {
      return 'Começando a explorar a ilha';
    }

    if (accuracy >= 0.85) {
      return 'Você está indo muito bem! Vamos aumentar a dificuldade';
    }

    if (accuracy >= 0.7) {
      return 'Bom desempenho! Próximo nível de dificuldade';
    }

    if (accuracy >= 0.5) {
      return 'Continue praticando com exercícios semelhantes';
    }

    return 'Vamos reforçar o aprendizado com exercícios mais fáceis';
  }

  private calculateFitScore(metrics: any, activity: Activity): number {
    const { accuracy, averageHintsPerAttempt } = metrics;

    let score = 0.5;

    if (accuracy > 0.7) {
      score += 0.2;
    }

    if (averageHintsPerAttempt < 1) {
      score += 0.15;
    }

    if (activity.difficulty === 'medium') {
      score += 0.15;
    }

    return Math.min(score, 1);
  }

  private async suggestRepeatWithVariation(
    userId: string,
    islandId: string,
    availableActivities: Activity[],
    metrics: any,
  ): Promise<ProgressionSuggestion | null> {
    if (availableActivities.length === 0) {
      return null;
    }

    const { accuracy } = metrics;

    let selectedActivity: Activity;

    if (accuracy >= 0.8) {
      const hardActivities = availableActivities.filter(
        (a) => a.difficulty === 'hard' || a.difficulty === 'extreme',
      );
      selectedActivity =
        hardActivities[Math.floor(Math.random() * hardActivities.length)] ||
        availableActivities[0];
    } else if (accuracy >= 0.6) {
      const mediumActivities = availableActivities.filter(
        (a) => a.difficulty === 'medium',
      );
      selectedActivity =
        mediumActivities[Math.floor(Math.random() * mediumActivities.length)] ||
        availableActivities[0];
    } else {
      const easyActivities = availableActivities.filter(
        (a) => a.difficulty === 'easy' || a.difficulty === 'very_easy',
      );
      selectedActivity =
        easyActivities[Math.floor(Math.random() * easyActivities.length)] ||
        availableActivities[0];
    }

    return {
      activityId: selectedActivity.id,
      title: selectedActivity.title,
      difficulty: selectedActivity.difficulty,
      reason: 'Reforçando aprendizado com variação de exercícios',
      score: 0.7,
    };
  }

  private async getActivitiesByIsland(islandId: string): Promise<Activity[]> {
    const islandTopicMap: Record<string, string[]> = {
      'island-sun': ['EF01MA01', 'EF01MA02'],
      'island-sea': ['EF01MA06', 'EF01MA07'],
      'island-forest': ['EF01MA08', 'EF01MA09'],
      'island-flowers': ['EF01MA03', 'EF01MA04'],
      'island-apples': ['EF01MA14', 'EF01MA15'],
      'island-animals': ['EF01MA16', 'EF01MA17'],
      'island-magic': ['EF01MA10', 'EF01MA11'],
      'island-love': ['EF01MA05', 'EF01MA12'],
    };

    const skills = islandTopicMap[islandId] || [];

    if (skills.length === 0) {
      return [];
    }

    return this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.isActive = :isActive', { isActive: true })
      .andWhere(
        `activity.bnccSkills && :skills`,
        { skills },
      )
      .orderBy('activity.difficulty', 'ASC')
      .addOrderBy('RANDOM()')
      .limit(50)
      .getMany();
  }

  async getIslandProgress(
    userId: string,
    islandId: string,
  ): Promise<{
    completedCount: number;
    totalCount: number;
    accuracy: number;
    averageTimeSeconds: number;
    nextSuggestion: ProgressionSuggestion | null;
  }> {
    const completed = await this.performanceService.getCompletedActivitiesInIsland(
      userId,
      islandId,
    );

    const metrics = await this.performanceService.getMetricsByUserAndIsland(
      userId,
      islandId,
    );

    const availableActivities = await this.getActivitiesByIsland(islandId);

    const nextSuggestion = await this.suggestNextExercise(
      userId,
      islandId,
      `session-${Date.now()}`,
    );

    return {
      completedCount: completed.length,
      totalCount: availableActivities.length,
      accuracy: metrics.accuracy,
      averageTimeSeconds: Math.round(metrics.averageResponseTimeMs / 1000),
      nextSuggestion,
    };
  }
}
