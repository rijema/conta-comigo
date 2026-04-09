
Message 1 of N — Backend Core Modules (Continued)

backend/src/modules/analytics/analytics.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsSnapshot, ActivityAttempt]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

backend/src/modules/analytics/analytics.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { BktService } from '../ade/bkt/bkt.service';

export interface EngagementMetrics {
  sessionDurationSeconds: number;
  attemptsCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageResponseTimeMs: number;
  hintsUsed: number;
  focusLostCount: number;
}

export interface BnccTrajectory {
  skillId: string;
  bnccCode: string;
  masteryProbability: number;
  lastAttemptAt: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly bktService: BktService,
  ) {}

  /**
   * Processes a completed activity attempt and updates analytics.
   * Called by Kafka consumer after activity.completed event.
   */
  async processActivityCompletion(payload: {
    learnerId: string;
    activityId: string;
    attemptId: string;
    bnccSkillId: string;
    correct: boolean;
    responseTimeMs: number;
    hintsUsed: number;
    sessionId: string;
  }): Promise<void> {
    this.logger.log(
      `Processing activity completion for learner=${payload.learnerId}, activity=${payload.activityId}`,
    );

    // 1. Fetch or create snapshot for this learner+skill
    let snapshot = await this.snapshotRepo.findOne({
      where: {
        learnerId: payload.learnerId,
        bnccSkillId: payload.bnccSkillId,
      },
    });

    const previousMastery = snapshot?.metrics?.masteryProbability ?? 0.1;

    // 2. Run BKT update
    const bktResult = await this.bktService.updateMastery({
      priorMastery: previousMastery,
      correct: payload.correct,
      slipRate: 0.1,
      guessRate: 0.2,
      learningRate: 0.3,
    });

    // 3. Calculate engagement index
    const engagementIndex = this.calculateEngagementIndex({
      responseTimeMs: payload.responseTimeMs,
      hintsUsed: payload.hintsUsed,
      correct: payload.correct,
    });

    // 4. Upsert snapshot
    const now = new Date();
    if (!snapshot) {
      snapshot = this.snapshotRepo.create({
        learnerId: payload.learnerId,
        bnccSkillId: payload.bnccSkillId,
        sessionId: payload.sessionId,
        metrics: {
          masteryProbability: bktResult.posteriorMastery,
          engagementIndex,
          totalAttempts: 1,
          correctAttempts: payload.correct ? 1 : 0,
          lastResponseTimeMs: payload.responseTimeMs,
          bktHistory: [bktResult],
        },
        computedAt: now,
      });
    } else {
      const prevMetrics = snapshot.metrics;
      snapshot.metrics = {
        masteryProbability: bktResult.posteriorMastery,
        engagementIndex,
        totalAttempts: (prevMetrics.totalAttempts ?? 0) + 1,
        correctAttempts:
          (prevMetrics.correctAttempts ?? 0) + (payload.correct ? 1 : 0),
        lastResponseTimeMs: payload.responseTimeMs,
        bktHistory: [
          ...(prevMetrics.bktHistory ?? []).slice(-19), // keep last 20
          bktResult,
        ],
      };
      snapshot.computedAt = now;
    }

    await this.snapshotRepo.save(snapshot);

    this.logger.log(
      `BKT updated: skill=${payload.bnccSkillId}, mastery=${bktResult.posteriorMastery.toFixed(3)}`,
    );
  }

  /**
   * Returns learner's BNCC trajectory across all skills.
   */
  async getLearnerTrajectory(learnerId: string): Promise<BnccTrajectory[]> {
    const snapshots = await this.snapshotRepo.find({
      where: { learnerId },
      relations: ['bnccSkill'],
    });

    return snapshots.map((s) => ({
      skillId: s.bnccSkillId,
      bnccCode: s.bnccSkill?.code ?? 'UNKNOWN',
      masteryProbability: s.metrics?.masteryProbability ?? 0,
      lastAttemptAt: s.computedAt,
    }));
  }

  /**
   * Returns aggregated session metrics for a learner.
   */
  async getSessionMetrics(
    learnerId: string,
    sessionId: string,
  ): Promise<EngagementMetrics> {
    const attempts = await this.attemptRepo.find({
      where: { learnerId, sessionId },
    });

    if (attempts.length === 0) {
      return {
        sessionDurationSeconds: 0,
        attemptsCount: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageResponseTimeMs: 0,
        hintsUsed: 0,
        focusLostCount: 0,
      };
    }

    const correct = attempts.filter((a) => a.isCorrect).length;
    const totalResponseTime = attempts.reduce(
      (acc, a) => acc + (a.signals?.responseTimeMs ?? 0),
      0,
    );
    const totalHints = attempts.reduce(
      (acc, a) => acc + (a.signals?.hintsUsed ?? 0),
      0,
    );
    const totalFocusLost = attempts.reduce(
      (acc, a) => acc + (a.signals?.focusLostCount ?? 0),
      0,
    );

    return {
      sessionDurationSeconds: 0, // computed from session entity
      attemptsCount: attempts.length,
      correctAnswers: correct,
      incorrectAnswers: attempts.length - correct,
      averageResponseTimeMs:
        attempts.length > 0 ? totalResponseTime / attempts.length : 0,
      hintsUsed: totalHints,
      focusLostCount: totalFocusLost,
    };
  }

  /**
   * Detects behavioral patterns that may indicate cognitive overload or frustration.
   */
  detectBehavioralPatterns(attempts: ActivityAttempt[]): {
    overloadDetected: boolean;
    frustrationDetected: boolean;
    reason: string;
  } {
    if (attempts.length < 3) {
      return {
        overloadDetected: false,
        frustrationDetected: false,
        reason: 'insufficient_data',
      };
    }

    const recent = attempts.slice(-5);
    const recentIncorrect = recent.filter((a) => !a.isCorrect).length;
    const avgResponseTime =
      recent.reduce((acc, a) => acc + (a.signals?.responseTimeMs ?? 0), 0) /
      recent.length;

    const overloadDetected = recentIncorrect >= 4;
    const frustrationDetected =
      avgResponseTime < 1000 && recentIncorrect >= 3; // answering too fast + wrong

    return {
      overloadDetected,
      frustrationDetected,
      reason: overloadDetected
        ? 'consecutive_errors'
        : frustrationDetected
          ? 'rapid_incorrect_responses'
          : 'none',
    };
  }

  private calculateEngagementIndex(params: {
    responseTimeMs: number;
    hintsUsed: number;
    correct: boolean;
  }): number {
    // Simple heuristic: normalize response time, penalize hints, reward correctness
    const timeFactor = Math.min(1, 5000 / Math.max(params.responseTimeMs, 500));
    const hintPenalty = Math.max(0, 1 - params.hintsUsed * 0.15);
    const correctBonus = params.correct ? 1.0 : 0.6;
    return parseFloat((timeFactor * hintPenalty * correctBonus).toFixed(3));
  }
}

backend/src/modules/analytics/analytics.controller.ts
typescriptCopyimport {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('learner/:learnerId/trajectory')
  @Roles('guardian', 'professional', 'admin')
  @ApiOperation({ summary: 'Get BNCC skill trajectory for a learner' })
  async getTrajectory(
    @Param('learnerId', ParseUUIDPipe) learnerId: string,
  ) {
    return this.analyticsService.getLearnerTrajectory(learnerId);
  }

  @Get('learner/:learnerId/session/:sessionId')
  @Roles('guardian', 'professional', 'admin')
  @ApiOperation({ summary: 'Get session metrics for a learner' })
  async getSessionMetrics(
    @Param('learnerId', ParseUUIDPipe) learnerId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.analyticsService.getSessionMetrics(learnerId, sessionId);
  }
}

backend/src/modules/analytics/entities/analytics-snapshot.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BnccSkill } from '../../bncc/entities/bncc-skill.entity';

@Entity('analytics_snapshots')
@Index(['learnerId', 'bnccSkillId'], { unique: true })
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id' })
  @Index()
  learnerId: string;

  @Column({ name: 'bncc_skill_id' })
  bnccSkillId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'jsonb', default: {} })
  metrics: {
    masteryProbability: number;
    engagementIndex: number;
    totalAttempts: number;
    correctAttempts: number;
    lastResponseTimeMs: number;
    bktHistory: Array<{
      priorMastery: number;
      posteriorMastery: number;
      correct: boolean;
      timestamp?: string;
    }>;
  };

  @Column({ name: 'computed_at', type: 'timestamptz' })
  computedAt: Date;

  @ManyToOne(() => BnccSkill, { nullable: true, eager: false })
  @JoinColumn({ name: 'bncc_skill_id' })
  bnccSkill: BnccSkill;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

backend/src/modules/ade/bkt/bkt.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';

export interface BktInput {
  priorMastery: number;   // P(L_0): probability learner knows skill
  correct: boolean;       // observed response
  slipRate: number;       // P(S): probability of slip (knows but wrong)
  guessRate: number;      // P(G): probability of guess (doesn't know but correct)
  learningRate: number;   // P(T): probability of learning from attempt
}

export interface BktOutput {
  priorMastery: number;
  posteriorMastery: number;
  correct: boolean;
  evidenceCorrect: number;
  evidenceIncorrect: number;
  masteryReached: boolean;
  masteryThreshold: number;
}

/**
 * Bayesian Knowledge Tracing (BKT) Service
 * 
 * Implements the standard BKT model (Corbett & Anderson, 1994).
 * 
 * Academic reference:
 * Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing:
 * Modeling the acquisition of procedural knowledge.
 * User Modeling and User-Adapted Interaction, 4(4), 253–278.
 */
@Injectable()
export class BktService {
  private readonly logger = new Logger(BktService.name);
  private readonly MASTERY_THRESHOLD = 0.95;

  /**
   * Updates mastery probability using BKT forward algorithm.
   * 
   * Step 1: Compute P(correct | L_n-1) using slip/guess parameters
   * Step 2: Update posterior using Bayes' theorem
   * Step 3: Apply learning transition
   */
  updateMastery(input: BktInput): BktOutput {
    const { priorMastery, correct, slipRate, guessRate, learningRate } = input;

    // Step 1: Evidence computation
    // P(correct | knows) = 1 - P(S) [slip]
    // P(correct | doesn't know) = P(G) [guess]
    const pCorrectGivenKnows = 1 - slipRate;
    const pCorrectGivenNotKnows = guessRate;

    // Step 2: Bayesian update (posterior given observation)
    let posteriorMastery: number;

    if (correct) {
      // P(knows | correct) via Bayes
      const numerator = pCorrectGivenKnows * priorMastery;
      const denominator =
        pCorrectGivenKnows * priorMastery +
        pCorrectGivenNotKnows * (1 - priorMastery);
      posteriorMastery = denominator > 0 ? numerator / denominator : priorMastery;
    } else {
      // P(knows | incorrect) via Bayes
      const numerator = (1 - pCorrectGivenKnows) * priorMastery;
      const denominator =
        (1 - pCorrectGivenKnows) * priorMastery +
        (1 - pCorrectGivenNotKnows) * (1 - priorMastery);
      posteriorMastery = denominator > 0 ? numerator / denominator : priorMastery;
    }

    // Step 3: Learning transition
    // P(L_n) = P(L_n | correct/incorrect) + (1 - P(L_n | ...)) * P(T)
    const updatedMastery =
      posteriorMastery + (1 - posteriorMastery) * learningRate;

    // Clamp to [0, 1]
    const finalMastery = Math.max(0, Math.min(1, updatedMastery));

    this.logger.debug(
      `BKT: prior=${priorMastery.toFixed(3)} correct=${correct} posterior=${finalMastery.toFixed(3)}`,
    );

    return {
      priorMastery,
      posteriorMastery: parseFloat(finalMastery.toFixed(6)),
      correct,
      evidenceCorrect: parseFloat(pCorrectGivenKnows.toFixed(3)),
      evidenceIncorrect: parseFloat((1 - pCorrectGivenKnows).toFixed(3)),
      masteryReached: finalMastery >= this.MASTERY_THRESHOLD,
      masteryThreshold: this.MASTERY_THRESHOLD,
    };
  }

  /**
   * Batch BKT update for a sequence of responses (e.g., session replay).
   */
  updateMasterySequence(
    initialMastery: number,
    responses: boolean[],
    params: Omit<BktInput, 'priorMastery' | 'correct'>,
  ): BktOutput[] {
    const results: BktOutput[] = [];
    let currentMastery = initialMastery;

    for (const correct of responses) {
      const result = this.updateMastery({
        ...params,
        priorMastery: currentMastery,
        correct,
      });
      results.push(result);
      currentMastery = result.posteriorMastery;
    }

    return results;
  }

  /**
   * Predicts probability of correct response given current mastery.
   */
  predictCorrectProbability(
    mastery: number,
    slipRate: number,
    guessRate: number,
  ): number {
    return (1 - slipRate) * mastery + guessRate * (1 - mastery);
  }
}

backend/src/modules/ade/ontology/ontology-reasoner.service.ts
typescriptCopyimport { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * JSON-LD representation of the LASDONT ontology concepts.
 * Mirrors the OWL ontology structure from the provided PDF.
 */
export interface OntologyInstance {
  learnerId: string;
  supportLevel: 'mild' | 'moderated' | 'strong';
  strengths: OntologyStrength[];
  weaknesses: OntologyWeakness[];
  learningPercentage: number;
  adaptiveContentType: string | null;
}

export type OntologyStrength =
  | 'Visual_Strength'
  | 'Auditive_Strength'
  | 'Logical_Strength'
  | 'Sensory_Strength'
  | 'Motor_Strength';

export type OntologyWeakness =
  | 'Visual_Weakness'
  | 'Auditive_Weakness'
  | 'Logical_Weakness'
  | 'Sensory_Weakness'
  | 'Motor_Weakness';

export type TreatmentClass =
  | 'Visual_Puzzles'
  | 'Textual_Quizzes'
  | 'Visual_Quizzes'
  | 'Question_Videos'
  | 'Yes_No_Videos'
  | 'IA_Sandbox_DIY';

export interface ReasoningResult {
  recommendedTreatments: TreatmentClass[];
  inferredSupportLevel: 'mild' | 'moderated' | 'strong';
  inferenceTrace: string[];
  contentDifficulty: 'easy' | 'mid' | 'hard';
}

/**
 * OntologyReasonerService
 * 
 * Implements SWRL-equivalent reasoning rules based on the LASDONT ontology
 * (LasdOnt - Ontologia para aprendizagem de criança com TEA).
 * 
 * Rules are derived from OWL SubClassOf restrictions in LASDONT.owl:
 * - Visual_Puzzles requires: Logical_Strength AND Sensory_Strength AND Visual_Strength
 * - Question_Videos requires: (Visual_Strength AND Motor_Weakness) OR Logical_Weakness
 * - Yes_No_Videos requires: Logical_Weakness OR Motor_Weakness
 * - IA_Sandbox_DIY requires: Sensory_Strength AND Visual_Strength
 * - Textual_Quizzes requires: Logical_Strength
 * - Visual_Quizzes requires: Visual_Strength
 */
@Injectable()
export class OntologyReasonerService implements OnModuleInit {
  private readonly logger = new Logger(OntologyReasonerService.name);
  private ontologyGraph: Map<string, any> = new Map();

  onModuleInit() {
    this.loadOntologyGraph();
  }

  private loadOntologyGraph(): void {
    // Load precomputed JSON-LD graph from file (derived from LASDONT.owl)
    const ontologyPath = path.join(
      __dirname,
      '../../../../assets/ontology/lasdont-graph.json',
    );

    if (fs.existsSync(ontologyPath)) {
      const raw = fs.readFileSync(ontologyPath, 'utf-8');
      const graph = JSON.parse(raw);
      for (const node of graph['@graph'] ?? []) {
        this.ontologyGraph.set(node['@id'], node);
      }
      this.logger.log(
        `Ontology graph loaded: ${this.ontologyGraph.size} nodes`,
      );
    } else {
      this.logger.warn(
        'Ontology JSON-LD file not found, using in-memory rule definitions',
      );
    }
  }

  /**
   * Main reasoning entry point.
   * Maps learner profile → recommended treatments via ontology rules.
   */
  reason(instance: OntologyInstance): ReasoningResult {
    const trace: string[] = [];
    const recommended: TreatmentClass[] = [];

    trace.push(`[OntologyReasoner] Processing learner=${instance.learnerId}`);
    trace.push(
      `[OntologyReasoner] Strengths: ${instance.strengths.join(', ')}`,
    );
    trace.push(
      `[OntologyReasoner] Weaknesses: ${instance.weaknesses.join(', ')}`,
    );

    const has = (s: OntologyStrength) => instance.strengths.includes(s);
    const weak = (w: OntologyWeakness) => instance.weaknesses.includes(w);

    // Rule 1: Visual_Puzzles → Logical_Strength AND Sensory_Strength AND Visual_Strength
    if (
      has('Logical_Strength') &&
      has('Sensory_Strength') &&
      has('Visual_Strength')
    ) {
      recommended.push('Visual_Puzzles');
      trace.push('[Rule 1] FIRED: Visual_Puzzles (logical+sensory+visual strength)');
    }

    // Rule 2: Question_Videos → (Visual_Strength AND Motor_Weakness) OR Logical_Weakness
    if (
      (has('Visual_Strength') && weak('Motor_Weakness')) ||
      weak('Logical_Weakness')
    ) {
      recommended.push('Question_Videos');
      trace.push('[Rule 2] FIRED: Question_Videos');
    }

    // Rule 3: Yes_No_Videos → Logical_Weakness OR Motor_Weakness
    if (weak('Logical_Weakness') || weak('Motor_Weakness')) {
      recommended.push('Yes_No_Videos');
      trace.push('[Rule 3] FIRED: Yes_No_Videos');
    }

    // Rule 4: IA_Sandbox_DIY → Sensory_Strength AND Visual_Strength
    if (has('Sensory_Strength') && has('Visual_Strength')) {
      recommended.push('IA_Sandbox_DIY');
      trace.push('[Rule 4] FIRED: IA_Sandbox_DIY');
    }

    // Rule 5: Textual_Quizzes → Logical_Strength
    if (has('Logical_Strength')) {
      recommended.push('Textual_Quizzes');
      trace.push('[Rule 5] FIRED: Textual_Quizzes');
    }

    // Rule 6: Visual_Quizzes → Visual_Strength
    if (has('Visual_Strength')) {
      recommended.push('Visual_Quizzes');
      trace.push('[Rule 6] FIRED: Visual_Quizzes');
    }

    // Fallback: at least one treatment always
    if (recommended.length === 0) {
      recommended.push('Visual_Quizzes');
      trace.push('[Fallback] No rules fired, defaulting to Visual_Quizzes');
    }

    // Content difficulty based on support level
    const contentDifficulty = this.inferContentDifficulty(
      instance.supportLevel,
      instance.learningPercentage,
    );
    trace.push(`[OntologyReasoner] Content difficulty: ${contentDifficulty}`);

    return {
      recommendedTreatments: [...new Set(recommended)],
      inferredSupportLevel: instance.supportLevel,
      inferenceTrace: trace,
      contentDifficulty,
    };
  }

  private inferContentDifficulty(
    supportLevel: string,
    learningPercentage: number,
  ): 'easy' | 'mid' | 'hard' {
    if (supportLevel === 'strong' || learningPercentage < 0.3) return 'easy';
    if (supportLevel === 'mild' && learningPercentage > 0.7) return 'hard';
    return 'mid';
  }

  /**
   * Infers support level from DSM-5 inspired classification
   * based on behavioral patterns in the learner profile.
   */
  inferSupportLevel(profile: {
    communicationScore: number;    // 0–1
    socialInteractionScore: number; // 0–1
    sensoryScore: number;           // 0–1
    restrictedBehaviorScore: number; // 0–1
  }): 'mild' | 'moderated' | 'strong' {
    const avg =
      (profile.communicationScore +
        profile.socialInteractionScore +
        profile.sensoryScore +
        profile.restrictedBehaviorScore) /
      4;

    if (avg >= 0.66) return 'strong';
    if (avg >= 0.33) return 'moderated';
    return 'mild';
  }
}

backend/src/modules/ade/rules/rule-engine.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { ReasoningResult } from '../ontology/ontology-reasoner.service';

export interface RuleContext {
  masteryProbability: number;
  engagementIndex: number;
  consecutiveErrors: number;
  sessionDurationSeconds: number;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  bnccSkillCode: string;
  isFirstSession: boolean;
  overloadDetected: boolean;
  frustrationDetected: boolean;
  ontologyReasoningResult: ReasoningResult;
}

export interface RuleDecision {
  difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
  suggestedModality: string;
  shouldTakeBreak: boolean;
  feedbackType: 'positive' | 'neutral' | 'corrective' | 'encouraging';
  rulesFired: string[];
  pedagogicalNote: string;
}

/**
 * TypeScript Rule Engine (SWRL-equivalent pedagogical rules)
 * 
 * Implements evidence-based pedagogical constraints for ASD learners.
 * Rules are inspired by:
 * - Zone of Proximal Development (Vygotsky)
 * - Applied Behavior Analysis (ABA) principles for ASD
 * - LASDONT ontology treatment recommendations
 */
@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  evaluate(ctx: RuleContext): RuleDecision {
    const firedRules: string[] = [];
    let difficultyAdjustment: RuleDecision['difficultyAdjustment'] = 'maintain';
    let suggestedModality = ctx.ontologyReasoningResult.recommendedTreatments[0] ?? 'Visual_Quizzes';
    let shouldTakeBreak = false;
    let feedbackType: RuleDecision['feedbackType'] = 'neutral';
    const notes: string[] = [];

    // RULE R1: Cognitive overload → decrease difficulty + break
    if (ctx.overloadDetected || ctx.consecutiveErrors >= 3) {
      difficultyAdjustment = 'decrease';
      shouldTakeBreak = ctx.consecutiveErrors >= 4;
      feedbackType = 'encouraging';
      firedRules.push('R1_COGNITIVE_OVERLOAD');
      notes.push('Difficulty reduced due to consecutive errors');
    }

    // RULE R2: High mastery → increase difficulty
    if (
      ctx.masteryProbability >= 0.95 &&
      ctx.consecutiveErrors === 0 &&
      !ctx.overloadDetected
    ) {
      difficultyAdjustment = 'increase';
      feedbackType = 'positive';
      firedRules.push('R2_MASTERY_ACHIEVED');
      notes.push('Skill mastered, advancing difficulty');
    }

    // RULE R3: Low engagement → change modality
    if (ctx.engagementIndex < 0.4) {
      // Switch to more engaging treatment from ontology
      const treatments = ctx.ontologyReasoningResult.recommendedTreatments;
      const idx = treatments.indexOf(suggestedModality as any);
      suggestedModality = treatments[(idx + 1) % treatments.length] ?? suggestedModality;
      firedRules.push('R3_LOW_ENGAGEMENT_MODALITY_SWITCH');
      notes.push(`Modality switched to ${suggestedModality} due to low engagement`);
    }

    // RULE R4: Frustration detected → positive reinforcement + easier content
    if (ctx.frustrationDetected) {
      difficultyAdjustment = 'decrease';
      feedbackType = 'encouraging';
      firedRules.push('R4_FRUSTRATION_MITIGATION');
      notes.push('Frustration pattern detected, applying positive reinforcement');
    }

    // RULE R5: First session → always start easy
    if (ctx.isFirstSession) {
      difficultyAdjustment = 'maintain'; // stays at easy (set by ADE input)
      feedbackType = 'positive';
      firedRules.push('R5_FIRST_SESSION_SCAFFOLDING');
      notes.push('First session: scaffolding applied');
    }

    // RULE R6: Long session → suggest break
    if (ctx.sessionDurationSeconds > 1200) { // 20 minutes
      shouldTakeBreak = true;
      firedRules.push('R6_SESSION_DURATION_LIMIT');
      notes.push('Session exceeds 20 minutes, break recommended');
    }

    // RULE R7: BNCC gate — ensure prerequisite skills
    // If skill is 3rd year but mastery < 0.5 on prerequisite → maintain
    if (
      ctx.bnccSkillCode.startsWith('EF03') &&
      ctx.masteryProbability < 0.5 &&
      ctx.currentDifficulty === 'hard'
    ) {
      difficultyAdjustment = 'decrease';
      firedRules.push('R7_BNCC_PREREQUISITE_GATE');
      notes.push('BNCC prerequisite gate: mastery insufficient for this level');
    }

    this.logger.log(
      `RuleEngine fired: [${firedRules.join(', ')}] → difficulty=${difficultyAdjustment}`,
    );

    return {
      difficultyAdjustment,
      suggestedModality,
      shouldTakeBreak,
      feedbackType,
      rulesFired: firedRules,
      pedagogicalNote: notes.join('; '),
    };
  }
}

backend/src/modules/ade/ade.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdeService } from './ade.service';
import { AdeController } from './ade.controller';
import { BktService } from './bkt/bkt.service';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyInstance } from './entities/ontology-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdeDecision, OntologyInstance]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [AdeController],
  providers: [
    AdeService,
    BktService,
    OntologyReasonerService,
    RuleEngineService,
  ],
  exports: [AdeService, BktService],
})
export class AdeModule {}

backend/src/modules/ade/ade.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { OntologyReasonerService, OntologyInstance } from './ontology/ontology-reasoner.service';
import { RuleEngineService, RuleContext } from './rules/rule-engine.service';
import { BktService } from './bkt/bkt.service';
import { AdeDecision } from './entities/ade-decision.entity';

export interface AdeInput {
  learnerId: string;
  sessionId: string;
  currentActivityId: string;
  bnccSkillId: string;
  bnccSkillCode: string;
  performanceMetrics: {
    masteryProbability: number;
    consecutiveErrors: number;
    engagementIndex: number;
    sessionDurationSeconds: number;
  };
  ontologyProfile: OntologyInstance;
  isFirstSession: boolean;
  overloadDetected: boolean;
  frustrationDetected: boolean;
  currentDifficulty: 'easy' | 'medium' | 'hard';
}

export interface AdeOutput {
  decisionId: string;
  learnerId: string;
  nextActivitySuggestion: {
    bnccSkillId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    modality: string;
  };
  difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
  shouldTakeBreak: boolean;
  feedbackType: string;
  xaiRecord: {
    ontologyTrace: string[];
    rulesFired: string[];
    mlPrediction: any;
    pedagogicalNote: string;
    timestamp: string;
  };
}

/**
 * Adaptive Decision Engine (ADE)
 * 
 * Core module — never mocked.
 * 
 * Integrates:
 * 1. OntologyReasoner (LASDONT-based rules)
 * 2. TypeScript Rule Engine (pedagogical constraints)
 * 3. ML Service (Python FastAPI — BKT + engagement classification)
 * 
 * Produces explainable decisions (XAI) with full audit trail.
 */
@Injectable()
export class AdeService {
  private readonly logger = new Logger(AdeService.name);

  constructor(
    @InjectRepository(AdeDecision)
    private readonly decisionRepo: Repository<AdeDecision>,
    private readonly ontologyReasoner: OntologyReasonerService,
    private readonly ruleEngine: RuleEngineService,
    private readonly bktService: BktService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Main ADE decision pipeline.
   * 
   * Flow:
   * 1. Load ontology profile → OntologyReasoner → treatment recommendations
   * 2. RuleEngine evaluates context → pedagogical decision
   * 3. ML Service called for engagement prediction + modality recommendation
   * 4. DecisionSynthesizer merges all outputs
   * 5. XAI record built and persisted
   */
  async decide(input: AdeInput): Promise<AdeOutput> {
    const startTime = Date.now();
    this.logger.log(
      `ADE pipeline start: learner=${input.learnerId}, skill=${input.bnccSkillCode}`,
    );

    // Step 1: Ontology Reasoning
    const ontologyResult = this.ontologyReasoner.reason(input.ontologyProfile);
    this.logger.debug(
      `Ontology result: treatments=${ontologyResult.recommendedTreatments.join(',')}`,
    );

    // Step 2: Rule Engine
    const ruleContext: RuleContext = {
      masteryProbability: input.performanceMetrics.masteryProbability,
      engagementIndex: input.performanceMetrics.engagementIndex,
      consecutiveErrors: input.performanceMetrics.consecutiveErrors,
      sessionDurationSeconds: input.performanceMetrics.sessionDurationSeconds,
      currentDifficulty: input.currentDifficulty,
      bnccSkillCode: input.bnccSkillCode,
      isFirstSession: input.isFirstSession,
      overloadDetected: input.overloadDetected,
      frustrationDetected: input.frustrationDetected,
      ontologyReasoningResult: ontologyResult,
    };

    const ruleDecision = this.ruleEngine.evaluate(ruleContext);

    // Step 3: ML Service call (async, with fallback)
    let mlPrediction: any = null;
    try {
      mlPrediction = await this.callMlService({
        learner_id: input.learnerId,
        mastery_probability: input.performanceMetrics.masteryProbability,
        engagement_index: input.performanceMetrics.engagementIndex,
        consecutive_errors: input.performanceMetrics.consecutiveErrors,
        support_level: input.ontologyProfile.supportLevel,
        strengths: input.ontologyProfile.strengths,
        weaknesses: input.ontologyProfile.weaknesses,
        session_duration_seconds: input.performanceMetrics.sessionDurationSeconds,
      });
    } catch (err) {
      this.logger.warn(`ML service unavailable, using rule-based fallback: ${err.message}`);
      mlPrediction = { fallback: true, predicted_modality: ruleDecision.suggestedModality };
    }

    // Step 4: Decision Synthesis
    const finalDifficulty = this.synthesizeDifficulty(
      input.currentDifficulty,
      ruleDecision.difficultyAdjustment,
    );

    const finalModality =
      mlPrediction?.predicted_modality ?? ruleDecision.suggestedModality;

    // Step 5: XAI Record
    const xaiRecord = {
      ontologyTrace: ontologyResult.inferenceTrace,
      rulesFired: ruleDecision.rulesFired,
      mlPrediction,
      pedagogicalNote: ruleDecision.pedagogicalNote,
      timestamp: new Date().toISOString(),
    };

    // Step 6: Persist decision
    const decision = this.decisionRepo.create({
      learnerId: input.learnerId,
      sessionId: input.sessionId,
      activityId: input.currentActivityId,
      bnccSkillId: input.bnccSkillId,
      decisionType: 'next_activity',
      output: {
        difficulty: finalDifficulty,
        modality: finalModality,
        shouldTakeBreak: ruleDecision.shouldTakeBreak,
        feedbackType: ruleDecision.feedbackType,
      },
      xaiRecord,
      latencyMs: Date.now() - startTime,
    });

    const savedDecision = await this.decisionRepo.save(decision);

    this.logger.log(
      `ADE decision saved: id=${savedDecision.id}, latency=${savedDecision.latencyMs}ms`,
    );

    return {
      decisionId: savedDecision.id,
      learnerId: input.learnerId,
      nextActivitySuggestion: {
        bnccSkillId: input.bnccSkillId,
        difficulty: finalDifficulty,
        modality: finalModality,
      },
      difficultyAdjustment: ruleDecision.difficultyAdjustment,
      shouldTakeBreak: ruleDecision.shouldTakeBreak,
      feedbackType: ruleDecision.feedbackType,
      xaiRecord,
    };
  }

  private synthesizeDifficulty(
    current: 'easy' | 'medium' | 'hard',
    adjustment: 'increase' | 'decrease' | 'maintain',
  ): 'easy' | 'medium' | 'hard' {
    const levels: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const idx = levels.indexOf(current);
    if (adjustment === 'increase') return levels[Math.min(idx + 1, 2)];
    if (adjustment === 'decrease') return levels[Math.max(idx - 1, 0)];
    return current;
  }

  private async callMlService(payload: any): Promise<any> {
    const mlUrl = this.config.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    const response = await firstValueFrom(
      this.httpService.post(`${mlUrl}/predict`, payload, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    return response.data;
  }

  async getDecisionsByLearner(learnerId: string): Promise<AdeDecision[]> {
    return this.decisionRepo.find({
      where: { learnerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}

backend/src/modules/ade/entities/ade-decision.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ade_decisions')
export class AdeDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id' })
  @Index()
  learnerId: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'activity_id', nullable: true })
  activityId: string;

  @Column({ name: 'bncc_skill_id', nullable: true })
  bnccSkillId: string;

  @Column({ name: 'decision_type', default: 'next_activity' })
  decisionType: string;

  @Column({ type: 'jsonb', default: {} })
  output: {
    difficulty: string;
    modality: string;
    shouldTakeBreak: boolean;
    feedbackType: string;
  };

  @Column({ name: 'xai_record', type: 'jsonb', default: {} })
  xaiRecord: {
    ontologyTrace: string[];
    rulesFired: string[];
    mlPrediction: any;
    pedagogicalNote: string;
    timestamp: string;
  };

  @Column({ name: 'latency_ms', nullable: true })
  latencyMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

backend/src/modules/ade/entities/ontology-instance.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ontology_instances')
export class OntologyInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id', unique: true })
  @Index()
  learnerId: string;

  @Column({
    name: 'support_level',
    type: 'enum',
    enum: ['mild', 'moderated', 'strong'],
    default: 'mild',
  })
  supportLevel: 'mild' | 'moderated' | 'strong';

  @Column({ type: 'jsonb', default: [] })
  strengths: string[];

  @Column({ type: 'jsonb', default: [] })
  weaknesses: string[];

  @Column({
    name: 'learning_percentage',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0.1,
  })
  learningPercentage: number;

  @Column({ name: 'adaptive_content_type', nullable: true })
  adaptiveContentType: string;

  @Column({ type: 'jsonb', default: {} })
  graph: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

backend/src/modules/ade/ade.controller.ts
typescriptCopyimport {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdeService } from './ade.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('ADE - Adaptive Decision Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ade')
export class AdeController {
  constructor(private readonly adeService: AdeService) {}

  @Post('decide')
  @Roles('system', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger ADE decision pipeline' })
  @ApiResponse({ status: 200, description: 'ADE decision result' })
  async decide(@Body() input: any) {
    return this.adeService.decide(input);
  }

  @Get('decisions/:learnerId')
  @Roles('guardian', 'professional', 'admin')
  @ApiOperation({ summary: 'Get ADE decision history for a learner' })
  async getDecisions(
    @Param('learnerId', ParseUUIDPipe) learnerId: string,
  ) {
    return this.adeService.getDecisionsByLearner(learnerId);
  }
}

Message 2 — Activities, Users, Auth Modules

backend/src/modules/activities/entities/activity-attempt.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('activity_attempts')
export class ActivityAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id' })
  @Index()
  learnerId: string;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column({ name: 'activity_id' })
  activityId: string;

  @Column({ name: 'bncc_skill_id', nullable: true })
  bnccSkillId: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ name: 'answer_given', nullable: true })
  answerGiven: string;

  @Column({ type: 'jsonb', default: {} })
  signals: {
    responseTimeMs?: number;
    hintsUsed?: number;
    focusLostCount?: number;
    clickPattern?: string[];
    emotionalSignal?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

backend/src/modules/activities/activities.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityAttempt]),
    KafkaModule,
    AdeModule,
    AnalyticsModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

backend/src/modules/activities/entities/activity.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';
export type ActivityModality = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
export type ActivityType =
  | 'multiple_choice'
  | 'drag_drop'
  | 'fill_blank'
  | 'matching'
  | 'counting'
  | 'geometry';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'title_pt', nullable: true })
  titlePt: string;

  @Column({ name: 'bncc_skill_id', nullable: true })
  @Index()
  bnccSkillId: string;

  @Column({ name: 'bncc_code', nullable: true })
  bnccCode: string;

  @Column({ name: 'year_group', type: 'int', nullable: true })
  yearGroup: number; // 1-5 for Ensino Fundamental Anos Iniciais

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard'], default: 'easy' })
  difficulty: ActivityDifficulty;

  @Column({
    type: 'enum',
    enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
    default: 'visual',
  })
  modality: ActivityModality;

  @Column({
    name: 'activity_type',
    type: 'enum',
    enum: ['multiple_choice', 'drag_drop', 'fill_blank', 'matching', 'counting', 'geometry'],
    default: 'multiple_choice',
  })
  activityType: ActivityType;

  @Column({ type: 'jsonb', default: {} })
  content: {
    question?: string;
    questionPt?: string;
    options?: Array<{ id: string; text: string; textPt: string; imageUrl?: string }>;
    correctAnswer?: string | string[];
    explanation?: string;
    explanationPt?: string;
    imageUrl?: string;
    audioUrl?: string;
    animationData?: any;
    mathExpression?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  accessibility: {
    hasAudio: boolean;
    hasAnimation: boolean;
    lowStimulation: boolean;
    fontSize: 'normal' | 'large' | 'xlarge';
    contrastMode: 'normal' | 'high' | 'pastel';
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'estimated_duration_seconds', default: 60 })
  estimatedDurationSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

backend/src/modules/activities/activities.service.ts
typescriptCopyimport { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { AdeService } from '../ade/ade.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface SubmitAttemptDto {
  learnerId: string;
  sessionId: string;
  activityId: string;
  answerGiven: string;
  signals: {
    responseTimeMs: number;
    hintsUsed: number;
    focusLostCount: number;
  };
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly adeService: AdeService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async findByBnccSkill(
    bnccSkillId: string,
    difficulty?: string,
  ): Promise<Activity[]> {
    const query = this.activityRepo
      .createQueryBuilder('a')
      .where('a.bncc_skill_id = :bnccSkillId', { bnccSkillId })
      .andWhere('a.is_active = true');

    if (difficulty) {
      query.andWhere('a.difficulty = :difficulty', { difficulty });
    }

    return query.getMany();
  }

  /**
   * Full request lifecycle: submit attempt → Kafka event → ADE decision
   */
  async submitAttempt(dto: SubmitAttemptDto): Promise<{
    isCorrect: boolean;
    feedback: string;
    adeDecision: any;
    attemptId: string;
  }> {
    const activity = await this.findById(dto.activityId);

    // 1. Evaluate correctness
    const isCorrect = this.evaluateAnswer(activity, dto.answerGiven);

    // 2. Persist attempt
    const attempt = this.attemptRepo.create({
      learnerId: dto.learnerId,
      sessionId: dto.sessionId,
      activityId: dto.activityId,
      bnccSkillId: activity.bnccSkillId,
      isCorrect,
      answerGiven: dto.answerGiven,
      signals: dto.signals,
    });
    const savedAttempt = await this.attemptRepo.save(attempt);

    // 3. Publish Kafka event: platform.activity.events
    await this.kafkaProducer.publishActivityEvent({
      eventType: 'activity.completed',
      learnerId: dto.learnerId,
      sessionId: dto.sessionId,
      activityId: dto.activityId,
      attemptId: savedAttempt.id,
      bnccSkillId: activity.bnccSkillId,
      bnccCode: activity.bnccCode,
      isCorrect,
      responseTimeMs: dto.signals.responseTimeMs,
      hintsUsed: dto.signals.hintsUsed,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Activity event published: attemptId=${savedAttempt.id}, correct=${isCorrect}`,
    );

    // 4. Analytics processing (async — also triggered by Kafka consumer)
    // Direct call for immediate feedback
    await this.analyticsService.processActivityCompletion({
      learnerId: dto.learnerId,
      activityId: dto.activityId,
      attemptId: savedAttempt.id,
      bnccSkillId: activity.bnccSkillId ?? '',
      correct: isCorrect,
      responseTimeMs: dto.signals.responseTimeMs,
      hintsUsed: dto.signals.hintsUsed,
      sessionId: dto.sessionId,
    });

    // 5. Generate feedback message
    const feedback = this.generateFeedback(isCorrect, activity);

    return {
      isCorrect,
      feedback,
      adeDecision: null, // ADE decision fetched separately
      attemptId: savedAttempt.id,
    };
  }

  private evaluateAnswer(activity: Activity, answerGiven: string): boolean {
    const correct = activity.content?.correctAnswer;
    if (!correct) return false;
    if (Array.isArray(correct)) {
      return correct.map((c) => c.toLowerCase()).includes(answerGiven.toLowerCase());
    }
    return correct.toLowerCase() === answerGiven.toLowerCase();
  }

  private generateFeedback(isCorrect: boolean, activity: Activity): string {
    if (isCorrect) {
      return activity.content?.explanation ?? 'Muito bem! Resposta correta! 🌟';
    }
    return activity.content?.explanationPt ?? 'Tente novamente! Você consegue! 💪';
  }

  async findActivitiesForLearner(
    learnerId: string,
    bnccSkillId: string,
    difficulty: string,
  ): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { bnccSkillId, difficulty: difficulty as any, isActive: true },
      take: 5,
    });
  }
}

backend/src/modules/activities/activities.controller.ts
typescriptCopyimport {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':id')
  @Roles('child', 'guardian', 'professional', 'admin')
  @ApiOperation({ summary: 'Get activity by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findById(id);
  }

  @Get()
  @Roles('child', 'guardian', 'professional', 'admin')
  @ApiOperation({ summary: 'Get activities by BNCC skill' })
  @ApiQuery({ name: 'bnccSkillId', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  async findMany(
    @Query('bnccSkillId') bnccSkillId?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    if (bnccSkillId) {
      return this.activitiesService.findByBnccSkill(bnccSkillId, difficulty);
    }
    return [];
  }

  @Post('attempt')
  @Roles('child', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit activity attempt — triggers full event pipeline' })
  async submitAttempt(
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.submitAttempt({
      ...body,
      learnerId: body.learnerId ?? user.sub,
    });
  }
}

Message 3 — Kafka, Auth, BNCC, DB Config

backend/src/modules/kafka/kafka.module.ts
typescriptCopyimport { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'asd-platform-backend',
              brokers: [config.get('KAFKA_BROKER', 'localhost:9092')],
              ssl: config.get('KAFKA_SSL', 'false') === 'true',
              sasl:
                config.get('KAFKA_USERNAME')
                  ? {
                      mechanism: 'plain',
                      username: config.get('KAFKA_USERNAME'),
                      password: config.get('KAFKA_PASSWORD'),
                    }
                  : undefined,
            },
            producer: {
              allowAutoTopicCreation: true,
            },
            consumer: {
              groupId: 'asd-platform-consumer-group',
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}

backend/src/modules/kafka/kafka-producer.service.ts
typescriptCopyimport { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export interface ActivityEvent {
  eventType: 'activity.started' | 'activity.completed' | 'activity.abandoned';
  learnerId: string;
  sessionId: string;
  activityId: string;
  attemptId?: string;
  bnccSkillId?: string;
  bnccCode?: string;
  isCorrect?: boolean;
  responseTimeMs?: number;
  hintsUsed?: number;
  timestamp: string;
}

export interface SessionEvent {
  eventType: 'session.started' | 'session.ended';
  learnerId: string;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const KAFKA_TOPICS = {
  SESSION_EVENTS: 'platform.session.events',
  ACTIVITY_EVENTS: 'platform.activity.events',
  ADE_DECISIONS: 'platform.ade.decisions',
  ANALYTICS_UPDATES: 'platform.analytics.updates',
  ALERTS: 'platform.alerts',
} as const;

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private isConnected = false;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Kafka producer connection failed (non-fatal): ${err.message}`);
      this.isConnected = false;
    }
  }

  async publishActivityEvent(event: ActivityEvent): Promise<void> {
    await this.safeEmit(KAFKA_TOPICS.ACTIVITY_EVENTS, {
      key: event.learnerId,
      value: JSON.stringify(event),
    });
  }

  async publishSessionEvent(event: SessionEvent): Promise<void> {
    await this.safeEmit(KAFKA_TOPICS.SESSION_EVENTS, {
      key: event.learnerId,
      value: JSON.stringify(event),
    });
  }

  async publishAdeDecision(decision: any): Promise<void> {
    await this.safeEmit(KAFKA_TOPICS.ADE_DECISIONS, {
      key: decision.learnerId,
      value: JSON.stringify(decision),
    });
  }

  async publishAlert(alert: {
    type: string;
    learnerId: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }): Promise<void> {
    await this.safeEmit(KAFKA_TOPICS.ALERTS, {
      key: alert.learnerId,
      value: JSON.stringify({ ...alert, timestamp: new Date().toISOString() }),
    });
  }

  private async safeEmit(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.debug(`Kafka not connected, skipping emit to ${topic}`);
      return;
    }
    try {
      await this.kafkaClient.emit(topic, message).toPromise();
      this.logger.debug(`Event emitted to ${topic}`);
    } catch (err) {
      this.logger.error(`Failed to emit to ${topic}: ${err.message}`);
    }
  }
}

backend/src/modules/kafka/kafka-consumer.service.ts
typescriptCopyimport { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AnalyticsService } from '../analytics/analytics.service';
import { KAFKA_TOPICS } from './kafka-producer.service';

/**
 * Kafka Consumer — processes activity events asynchronously.
 * 
 * Event lifecycle:
 * platform.activity.events → AnalyticsService.processActivityCompletion
 * platform.session.events  → Session state updates
 * platform.alerts          → Notification dispatch
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async onModuleInit() {
    // Subscribe to topics
    const topics = Object.values(KAFKA_TOPICS);
    topics.forEach((topic) => {
      try {
        this.kafkaClient.subscribeToResponseOf(topic);
      } catch {
        // Non-fatal: topics may not exist yet
      }
    });

    this.logger.log('Kafka consumer initialized (topics subscribed via MessagePattern)');
  }

  /**
   * Message handlers are defined as @MessagePattern in dedicated controllers
   * or via EventPattern in NestJS microservice setup.
   * 
   * For simplicity in this POC, direct processing is done in ActivitiesService.
   * In production, separate consumer microservice recommended.
   */
  async handleActivityEvent(rawMessage: string): Promise<void> {
    try {
      const event = JSON.parse(rawMessage);

      if (event.eventType === 'activity.completed') {
        await this.analyticsService.processActivityCompletion({
          learnerId: event.learnerId,
          activityId: event.activityId,
          attemptId: event.attemptId,
          bnccSkillId: event.bnccSkillId ?? '',
          correct: event.isCorrect,
          responseTimeMs: event.responseTimeMs ?? 0,
          hintsUsed: event.hintsUsed ?? 0,
          sessionId: event.sessionId,
        });

        this.logger.debug(
          `Processed activity.completed for learner=${event.learnerId}`,
        );
      }
    } catch (err) {
      this.logger.error(`Error processing activity event: ${err.message}`);
    }
  }
}

backend/src/modules/auth/auth.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-in-prod'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

backend/src/modules/auth/auth.service.ts
typescriptCopyimport {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  lgpdConsentGiven: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (!dto.lgpdConsentGiven) {
      throw new UnauthorizedException('LGPD consent required');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role,
      lgpdConsentGiven: dto.lgpdConsentGiven,
      lgpdConsentAt: new Date(),
    });

    const savedUser = await this.userRepo.save(user);
    const accessToken = this.generateToken(savedUser);

    this.logger.log(`User registered: id=${savedUser.id}, role=${savedUser.role}`);

    return {
      accessToken,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user);
    this.logger.log(`User logged in: id=${user.id}, role=${user.role}`);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  /**
   * LGPD: Pseudonymize learner data for analytics export.
   * Replaces PII with deterministic hash.
   */
  pseudonymizeLearnerId(learnerId: string): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(learnerId + process.env.PSEUDONYM_SALT ?? 'default-salt')
      .digest('hex')
      .substring(0, 16);
  }
}

backend/src/modules/auth/auth.controller.ts
typescriptCopyimport {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, RegisterDto, LoginDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsString, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { UserRole } from '../users/entities/user.entity';

class RegisterBodyDto implements RegisterDto {
  @IsEmail()
  email: string;