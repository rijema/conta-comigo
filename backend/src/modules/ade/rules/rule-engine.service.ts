import { Injectable, Logger } from '@nestjs/common';
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

  evaluate(ctx: RuleContext): RuleResult {
    const rulesFired: string[] = [];
    let difficulty = DifficultyLevel.EASY;
    let shouldReduceStimulation = false;
    let shouldAddBreak = false;

    // === DIFFICULTY RULES ===

    // Rule D1: High mastery → increase difficulty
    if (ctx.currentSkillMastery > 0.8 && ctx.recentAccuracy > 0.75) {
      difficulty = DifficultyLevel.HARD;
      rulesFired.push('D1: mastery>0.8 AND accuracy>0.75 → HARD');
    }
    // Rule D2: Good performance → medium difficulty
    else if (ctx.currentSkillMastery > 0.5 && ctx.recentAccuracy > 0.6) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('D2: mastery>0.5 AND accuracy>0.6 → MEDIUM');
    }
    // Rule D3: Struggling → easy difficulty
    else if (ctx.recentAccuracy < 0.4 || ctx.currentSkillMastery < 0.3) {
      difficulty = DifficultyLevel.EASY;
      rulesFired.push('D3: accuracy<0.4 OR mastery<0.3 → EASY');
    }
    // Rule D4: Strong support level → cap at MEDIUM
    else if (ctx.asdSupportLevel === 'strong' && difficulty === DifficultyLevel.HARD) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('D4: strong_support_level → cap_at_MEDIUM');
    }

    // === ENGAGEMENT / WELLBEING RULES ===

    // Rule E1: Low engagement → reduce stimulation
    if (ctx.engagementScore < 0.35) {
      shouldReduceStimulation = true;
      rulesFired.push('E1: engagement<0.35 → reduce_stimulation');
    }

    // Rule E2: High time spent + many hints → add break suggestion
    if (ctx.averageTimeSeconds > 120 && ctx.hintsUsed > 3) {
      shouldAddBreak = true;
      rulesFired.push('E2: time>120s AND hints>3 → suggest_break');
    }

    // Rule E3: Long streak → prevent frustration by alternating easy
    if (ctx.streakCount > 5 && difficulty === DifficultyLevel.EASY) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('E3: streak>5 AND easy → promote_to_MEDIUM');
    }

    // Rule E4: BNCC gate — strong support should always start easy
    if (ctx.asdSupportLevel === 'strong' && ctx.currentSkillMastery < 0.5) {
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