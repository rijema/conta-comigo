import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DifficultyLevel } from '../../activities/entities/activity.entity';

export interface RuleContext {
  recentAccuracy: number;        // 0..1
  averageTimeSeconds: number;
  hintsUsed: number;
  currentSkillMastery: number;   // BKT output 0..1
  asdSupportLevel: string;
  streakCount: number;
  engagementScore: number;       // ML output 0..1
  recentAttempts?: Array<{ isCorrect: boolean; hintsUsed?: number; timeSpentSeconds?: number; activityId?: string; difficulty?: DifficultyLevel }>;
  recentSkips?: number;
}

export interface RuleResult {
  recommendedDifficulty: DifficultyLevel;
  shouldReduceStimulation: boolean;
  shouldAddBreak: boolean;
  rulesFired: string[];
}

/**
 * SWRL-equivalent rule engine implemented in TypeScript.
 * Rules are pedagogically grounded and aligned with ASD support research.
 */
@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(private readonly configService: ConfigService) {}

  private threshold(name: string, fallback: number): number {
    return Number(this.configService.get<string | number>(name, fallback));
  }

  evaluate(ctx: RuleContext): RuleResult {
    const rulesFired: string[] = [];
    const levels = [DifficultyLevel.VERY_EASY, DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD, DifficultyLevel.EXTREME];
    const historyWindow = this.threshold('ADE_DIFFICULTY_HISTORY_WINDOW', 5);
    const recent = (ctx.recentAttempts ?? []).slice(0, historyWindow);
    const current = recent[0]?.difficulty ?? DifficultyLevel.EASY;
    let index = Math.max(0, levels.indexOf(current));
    let difficulty = levels[index];
    let shouldReduceStimulation = false;
    let shouldAddBreak = false;
    const masteryMedium = this.threshold('ADE_MASTERY_MEDIUM_THRESHOLD', 0.5);
    const accuracyHigh = this.threshold('ADE_ACCURACY_HIGH_THRESHOLD', 0.75);
    const accuracyLow = this.threshold('ADE_ACCURACY_LOW_THRESHOLD', 0.4);
    const engagementLow = this.threshold('ADE_ENGAGEMENT_LOW_THRESHOLD', 0.35);
    const breakTime = this.threshold('ADE_BREAK_TIME_SECONDS_THRESHOLD', 120);
    const breakHints = this.threshold('ADE_BREAK_HINTS_THRESHOLD', 3);
    const promotionSuccesses = this.threshold('ADE_PROMOTION_MIN_SUCCESSES', 3);
    const struggleMinimum = this.threshold('ADE_DIFFICULTY_MIN_STRUGGLES', 2);
    const skipMinimum = this.threshold('ADE_DIFFICULTY_MIN_SKIPS', 2);

    // === DIFFICULTY RULES ===

    // Require repeated evidence at the current level; retries, hints and skips
    // prevent promotion even when the final answer was correct.
    const sameLevel = recent.filter((attempt) => attempt.difficulty === current);
    const independent = sameLevel.filter((attempt) => attempt.isCorrect &&
      !attempt.hintsUsed && Number.isFinite(attempt.timeSpentSeconds) &&
      (attempt.timeSpentSeconds ?? 0) > 0 && (attempt.timeSpentSeconds ?? 0) <= breakTime);
    const struggle = sameLevel.filter((attempt) => !attempt.isCorrect ||
      (attempt.hintsUsed ?? 0) >= breakHints || (attempt.timeSpentSeconds ?? 0) > breakTime);
    const retryCount = sameLevel.length - new Set(sameLevel.map((attempt) => attempt.activityId)).size;
    if (sameLevel.length >= promotionSuccesses && independent.length >= promotionSuccesses && retryCount === 0 &&
        !ctx.recentSkips && ctx.currentSkillMastery >= masteryMedium &&
        ctx.recentAccuracy >= accuracyHigh && ctx.engagementScore >= engagementLow) {
      index = Math.min(4, index + 1);
      rulesFired.push('D1: repeated independent success with mastery → advance one level');
    } else if ((sameLevel.length >= struggleMinimum && struggle.length >= struggleMinimum) ||
        (ctx.recentSkips ?? 0) >= skipMinimum ||
        (recent.length >= struggleMinimum && ctx.recentAccuracy < accuracyLow)) {
      index = Math.max(0, index - 1);
      rulesFired.push('D2: repeated difficulty or skips → reduce one level');
    } else {
      rulesFired.push('D3: insufficient consistent evidence → hold level');
    }
    difficulty = levels[index];

    // === ENGAGEMENT / WELLBEING RULES ===

    // Rule E1: Low engagement → reduce stimulation
    if (ctx.engagementScore < engagementLow) {
      shouldReduceStimulation = true;
      rulesFired.push(`E1: engagement<${engagementLow} → reduce_stimulation`);
    }

    // Rule E2: High time spent + many hints → add break suggestion
    if (
      ctx.averageTimeSeconds > breakTime &&
      ctx.hintsUsed > breakHints
    ) {
      shouldAddBreak = true;
      rulesFired.push(`E2: time>${breakTime}s AND hints>${breakHints} → suggest_break`);
    }

    // Support level affects presentation and scaffolding, not an ability ceiling.

    this.logger.debug(
      `Rules fired: [${rulesFired.join(' | ')}] → difficulty: ${difficulty}`,
    );

    return {
      recommendedDifficulty: difficulty,
      shouldReduceStimulation,
      shouldAddBreak,
      rulesFired,
    };
  }
}
