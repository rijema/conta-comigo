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
    let difficulty = DifficultyLevel.EASY;
    let shouldReduceStimulation = false;
    let shouldAddBreak = false;
    const masteryHigh = this.threshold('ADE_MASTERY_HIGH_THRESHOLD', 0.8);
    const masteryMedium = this.threshold('ADE_MASTERY_MEDIUM_THRESHOLD', 0.5);
    const masteryLow = this.threshold('ADE_MASTERY_LOW_THRESHOLD', 0.3);
    const accuracyHigh = this.threshold('ADE_ACCURACY_HIGH_THRESHOLD', 0.75);
    const accuracyMedium = this.threshold('ADE_ACCURACY_MEDIUM_THRESHOLD', 0.6);
    const accuracyLow = this.threshold('ADE_ACCURACY_LOW_THRESHOLD', 0.4);
    const engagementLow = this.threshold('ADE_ENGAGEMENT_LOW_THRESHOLD', 0.35);
    const breakTime = this.threshold('ADE_BREAK_TIME_SECONDS_THRESHOLD', 120);
    const breakHints = this.threshold('ADE_BREAK_HINTS_THRESHOLD', 3);
    const streakThreshold = this.threshold('ADE_STREAK_THRESHOLD', 5);
    const strongSupportMastery = this.threshold('ADE_STRONG_SUPPORT_MASTERY_THRESHOLD', 0.5);

    // === DIFFICULTY RULES ===

    // Rule D1: High mastery → increase difficulty
    if (
      ctx.currentSkillMastery > masteryHigh &&
      ctx.recentAccuracy > accuracyHigh
    ) {
      difficulty = DifficultyLevel.HARD;
      rulesFired.push(`D1: mastery>${masteryHigh} AND accuracy>${accuracyHigh} → HARD`);
    }
    // Rule D2: Good performance → medium difficulty
    else if (
      ctx.currentSkillMastery > masteryMedium &&
      ctx.recentAccuracy > accuracyMedium
    ) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push(`D2: mastery>${masteryMedium} AND accuracy>${accuracyMedium} → MEDIUM`);
    }
    // Rule D3: Struggling → easy difficulty
    else if (
      ctx.recentAccuracy < accuracyLow ||
      ctx.currentSkillMastery < masteryLow
    ) {
      difficulty = DifficultyLevel.EASY;
      rulesFired.push(`D3: accuracy<${accuracyLow} OR mastery<${masteryLow} → EASY`);
    }
    // Rule D4: Strong support level → cap at MEDIUM
    else if (ctx.asdSupportLevel === 'strong' && difficulty !== DifficultyLevel.EASY && difficulty !== DifficultyLevel.MEDIUM) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('D4: strong_support_level → cap_at_MEDIUM');
    }

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

    // Rule E3: Long streak → prevent frustration by alternating easy
    if (
      ctx.streakCount > streakThreshold &&
      difficulty === DifficultyLevel.EASY
    ) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push(`E3: streak>${streakThreshold} AND easy → promote_to_MEDIUM`);
    }

    // Rule E4: BNCC gate — strong support should always start easy
    if (
      ctx.asdSupportLevel === 'strong' &&
      ctx.currentSkillMastery < strongSupportMastery
    ) {
      difficulty = DifficultyLevel.EASY;
      rulesFired.push('E4: BNCC_gate — strong_support AND low_mastery → EASY');
    }

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
