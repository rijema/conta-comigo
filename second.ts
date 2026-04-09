I'll continue from where the previous generation stopped, providing the remaining files. Based on the context, I need to continue generating the full system files.

Continuing from previous generation...

backend/src/modules/ade/ade.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { AdeController } from './ade.controller';
import { AdeService } from './ade.service';
import { OntologyReasonerService } from './ontology-reasoner.service';
import { RuleEngineService } from './rule-engine.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdeDecision } from './entities/ade-decision.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdeDecision]),
    HttpModule,
  ],
  controllers: [AdeController],
  providers: [AdeService, OntologyReasonerService, RuleEngineService],
  exports: [AdeService],
})
export class AdeModule {}

backend/src/modules/ade/ade.controller.ts
typescriptCopyimport {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdeService } from './ade.service';
import { AdeDecisionRequestDto } from './dto/ade-decision-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('ade')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdeController {
  constructor(private readonly adeService: AdeService) {}

  @Post('decision')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CHILD, UserRole.EDUCATOR, UserRole.GUARDIAN)
  async makeDecision(@Body() dto: AdeDecisionRequestDto) {
    return this.adeService.makeDecision(dto);
  }

  @Get('decisions/:learnerId')
  @Roles(UserRole.EDUCATOR, UserRole.GUARDIAN)
  async getDecisionHistory(@Param('learnerId') learnerId: string) {
    return this.adeService.getDecisionHistory(learnerId);
  }

  @Get('decisions/:learnerId/latest')
  @Roles(UserRole.CHILD, UserRole.EDUCATOR, UserRole.GUARDIAN)
  async getLatestDecision(@Param('learnerId') learnerId: string) {
    return this.adeService.getLatestDecision(learnerId);
  }
}

backend/src/modules/ade/ade.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdeDecision } from './entities/ade-decision.entity';
import { AdeDecisionRequestDto } from './dto/ade-decision-request.dto';
import { OntologyReasonerService } from './ontology-reasoner.service';
import { RuleEngineService } from './rule-engine.service';
import { AdeDecisionOutput } from './interfaces/ade-decision-output.interface';

@Injectable()
export class AdeService {
  private readonly logger = new Logger(AdeService.name);

  constructor(
    @InjectRepository(AdeDecision)
    private readonly adeDecisionRepo: Repository<AdeDecision>,
    private readonly ontologyReasoner: OntologyReasonerService,
    private readonly ruleEngine: RuleEngineService,
    private readonly httpService: HttpService,
  ) {}

  async makeDecision(dto: AdeDecisionRequestDto): Promise<AdeDecisionOutput> {
    const startTime = Date.now();
    this.logger.log(`[ADE] Starting decision for learner: ${dto.learnerId}`);

    // Step 1: Load ontology profile
    const ontologyProfile = await this.ontologyReasoner.loadLearnerProfile(
      dto.learnerId,
      dto.ontologyContext,
    );
    this.logger.debug(`[ADE][ONTOLOGY] Profile loaded: ${JSON.stringify(ontologyProfile)}`);

    // Step 2: Apply rule engine
    const ruleResult = this.ruleEngine.applyRules({
      performanceMetrics: dto.performanceMetrics,
      engagementData: dto.engagementData,
      ontologyProfile,
      bnccContext: dto.bnccContext,
    });
    this.logger.debug(`[ADE][RULES] Rule engine result: ${JSON.stringify(ruleResult)}`);

    // Step 3: Call ML service
    const mlPrediction = await this.callMlService(dto, ontologyProfile);
    this.logger.debug(`[ADE][ML] ML prediction: ${JSON.stringify(mlPrediction)}`);

    // Step 4: Synthesize decision
    const decision = this.synthesizeDecision(ruleResult, mlPrediction, ontologyProfile, dto);

    // Step 5: Build XAI record
    const xaiRecord = this.buildXaiRecord({
      dto,
      ontologyProfile,
      ruleResult,
      mlPrediction,
      decision,
      durationMs: Date.now() - startTime,
    });

    // Step 6: Persist decision
    const savedDecision = await this.persistDecision(dto.learnerId, decision, xaiRecord);

    this.logger.log(`[ADE] Decision completed in ${Date.now() - startTime}ms for learner: ${dto.learnerId}`);

    return {
      decisionId: savedDecision.id,
      learnerId: dto.learnerId,
      nextActivity: decision.nextActivity,
      difficultyAdjustment: decision.difficultyAdjustment,
      recommendedModality: decision.recommendedModality,
      feedbackMessage: decision.feedbackMessage,
      bnccSkillTargeted: decision.bnccSkillTargeted,
      xaiExplanation: xaiRecord.explanation,
      confidence: decision.confidence,
      timestamp: savedDecision.createdAt,
    };
  }

  private async callMlService(
    dto: AdeDecisionRequestDto,
    ontologyProfile: any,
  ): Promise<any> {
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
      const response = await firstValueFrom(
        this.httpService.post(`${mlServiceUrl}/predict`, {
          learner_id: dto.learnerId,
          performance_metrics: dto.performanceMetrics,
          engagement_data: dto.engagementData,
          ontology_profile: ontologyProfile,
          bncc_context: dto.bnccContext,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`[ADE][ML] ML service call failed, using fallback: ${error.message}`);
      return this.mlFallback(dto);
    }
  }

  private mlFallback(dto: AdeDecisionRequestDto): any {
    const avgScore = dto.performanceMetrics?.averageScore ?? 0.5;
    return {
      bkt_mastery: avgScore,
      engagement_class: avgScore > 0.6 ? 'high' : avgScore > 0.3 ? 'medium' : 'low',
      recommended_modality: 'visual',
      difficulty_delta: avgScore > 0.7 ? 1 : avgScore < 0.4 ? -1 : 0,
      confidence: 0.6,
    };
  }

  private synthesizeDecision(
    ruleResult: any,
    mlPrediction: any,
    ontologyProfile: any,
    dto: AdeDecisionRequestDto,
  ): any {
    // Combine rule engine and ML outputs
    const difficultyDelta = ruleResult.overrideDifficulty ?? mlPrediction.difficulty_delta ?? 0;
    const currentDifficulty = dto.performanceMetrics?.currentDifficulty ?? 1;
    const newDifficulty = Math.max(1, Math.min(5, currentDifficulty + difficultyDelta));

    const modality = ruleResult.forcedModality
      || ontologyProfile.preferredModality
      || mlPrediction.recommended_modality
      || 'visual';

    const engagementClass = mlPrediction.engagement_class || 'medium';
    const masteryLevel = mlPrediction.bkt_mastery || 0.5;

    // Select next activity based on BNCC context
    const nextActivity = this.selectNextActivity({
      bnccContext: dto.bnccContext,
      difficulty: newDifficulty,
      modality,
      masteryLevel,
      ruleResult,
    });

    // Generate feedback message
    const feedbackMessage = this.generateFeedback(
      masteryLevel,
      engagementClass,
      dto.performanceMetrics?.lastActivityCorrect,
    );

    const confidence = (mlPrediction.confidence || 0.7) * (ruleResult.confidenceMultiplier || 1.0);

    return {
      nextActivity,
      difficultyAdjustment: newDifficulty,
      recommendedModality: modality,
      feedbackMessage,
      bnccSkillTargeted: nextActivity.bnccSkillCode,
      confidence: Math.min(1.0, confidence),
    };
  }

  private selectNextActivity(params: {
    bnccContext: any;
    difficulty: number;
    modality: string;
    masteryLevel: number;
    ruleResult: any;
  }): any {
    const { bnccContext, difficulty, modality } = params;
    
    // Activity selection logic based on BNCC skill and difficulty
    const activityTypes = {
      visual: ['visual_puzzle', 'visual_quiz', 'shape_recognition'],
      auditory: ['audio_counting', 'verbal_problem', 'song_math'],
      kinesthetic: ['drag_drop', 'sorting', 'interactive_game'],
    };

    const selectedType = activityTypes[modality] || activityTypes['visual'];
    const activityType = selectedType[Math.floor(Math.random() * selectedType.length)];

    return {
      activityType,
      difficulty,
      bnccSkillCode: bnccContext?.currentSkill || 'EF01MA01',
      bnccSkillDescription: bnccContext?.skillDescription || 'Contagem de números naturais',
      estimatedDurationMinutes: difficulty <= 2 ? 10 : difficulty <= 4 ? 15 : 20,
      modalityType: modality,
    };
  }

  private generateFeedback(
    masteryLevel: number,
    engagementClass: string,
    lastCorrect?: boolean,
  ): string {
    if (lastCorrect === false) {
      if (masteryLevel < 0.4) {
        return 'Vamos tentar de um jeito diferente! Você está aprendendo muito bem. 🌟';
      }
      return 'Quase lá! Tente mais uma vez, você consegue! 💪';
    }
    if (masteryLevel > 0.8) {
      return 'Incrível! Você está dominando este conteúdo! Vamos avançar! 🚀';
    }
    if (engagementClass === 'low') {
      return 'Que tal uma atividade diferente e divertida? 🎮';
    }
    return 'Muito bem! Continue assim! ⭐';
  }

  private buildXaiRecord(params: {
    dto: AdeDecisionRequestDto;
    ontologyProfile: any;
    ruleResult: any;
    mlPrediction: any;
    decision: any;
    durationMs: number;
  }): any {
    return {
      explanation: {
        factors: [
          {
            source: 'ontology_reasoner',
            weight: 0.3,
            contribution: `Learner profile: support_level=${params.ontologyProfile.supportLevel}, preferred_modality=${params.ontologyProfile.preferredModality}`,
          },
          {
            source: 'rule_engine',
            weight: 0.35,
            contribution: `Rules applied: ${params.ruleResult.appliedRules?.join(', ') || 'none'}`,
          },
          {
            source: 'ml_model',
            weight: 0.35,
            contribution: `BKT mastery=${params.mlPrediction.bkt_mastery?.toFixed(2)}, engagement=${params.mlPrediction.engagement_class}`,
          },
        ],
        final_reasoning: `Activity selected based on BNCC skill ${params.decision.bnccSkillTargeted} with difficulty ${params.decision.difficultyAdjustment} using ${params.decision.recommendedModality} modality`,
        processing_time_ms: params.durationMs,
      },
      raw_inputs: {
        performance: params.dto.performanceMetrics,
        engagement: params.dto.engagementData,
        bncc_context: params.dto.bnccContext,
      },
      model_outputs: {
        rule_engine: params.ruleResult,
        ml_prediction: params.mlPrediction,
      },
    };
  }

  private async persistDecision(
    learnerId: string,
    decision: any,
    xaiRecord: any,
  ): Promise<AdeDecision> {
    const entity = this.adeDecisionRepo.create({
      learnerId,
      decisionType: 'activity_selection',
      inputContext: xaiRecord.raw_inputs,
      outputDecision: decision,
      xaiRecord: xaiRecord,
      confidence: decision.confidence,
      appliedRules: xaiRecord.explanation.factors.map((f: any) => f.source),
      bnccSkillCode: decision.bnccSkillTargeted,
    });
    return this.adeDecisionRepo.save(entity);
  }

  async getDecisionHistory(learnerId: string): Promise<AdeDecision[]> {
    return this.adeDecisionRepo.find({
      where: { learnerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getLatestDecision(learnerId: string): Promise<AdeDecision | null> {
    return this.adeDecisionRepo.findOne({
      where: { learnerId },
      order: { createdAt: 'DESC' },
    });
  }
}

backend/src/modules/ade/ontology-reasoner.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * OntologyReasonerService
 *
 * Implements JSON-LD inspired reasoning based on the LASDONT ontology.
 * Maps learner characteristics to ontology classes:
 * - Support levels (Mild, Moderate, Strong)
 * - Strengths/Weaknesses (Visual, Auditory, Motor, Logical, Sensory)
 * - Recommended treatments (DIY, Puzzles, Videos, Quizzes)
 *
 * Reference: LASDONT.owl (provided ontology)
 */
@Injectable()
export class OntologyReasonerService {
  private readonly logger = new Logger(OntologyReasonerService.name);
  private ontologyGraph: any;

  constructor() {
    this.loadOntology();
  }

  private loadOntology(): void {
    try {
      const ontologyPath = path.join(process.cwd(), 'src', 'ontology', 'lasdont.json');
      if (fs.existsSync(ontologyPath)) {
        const raw = fs.readFileSync(ontologyPath, 'utf-8');
        this.ontologyGraph = JSON.parse(raw);
        this.logger.log('[ONTOLOGY] Loaded from file');
      } else {
        this.ontologyGraph = this.getDefaultOntologyGraph();
        this.logger.log('[ONTOLOGY] Using embedded default graph');
      }
    } catch (error) {
      this.logger.warn(`[ONTOLOGY] Load error: ${error.message}, using defaults`);
      this.ontologyGraph = this.getDefaultOntologyGraph();
    }
  }

  async loadLearnerProfile(learnerId: string, ontologyContext?: any): Promise<any> {
    const context = ontologyContext || {};

    // Infer support level from context
    const supportLevel = this.inferSupportLevel(context);

    // Infer strengths/weaknesses
    const strengths = this.inferStrengths(context);
    const weaknesses = this.inferWeaknesses(context);

    // Infer preferred modality
    const preferredModality = this.inferModality(strengths, weaknesses);

    // Infer recommended treatments using ontology rules
    const recommendedTreatments = this.inferTreatments(strengths, weaknesses, supportLevel);

    // Map to LASDONT classes
    const ontologyClass = this.mapToOntologyClass(supportLevel, strengths);

    const profile = {
      learnerId,
      supportLevel,
      strengths,
      weaknesses,
      preferredModality,
      recommendedTreatments,
      ontologyClass,
      inferenceTimestamp: new Date().toISOString(),
    };

    this.logger.debug(`[ONTOLOGY] Inferred profile: ${JSON.stringify(profile)}`);
    return profile;
  }

  private inferSupportLevel(context: any): string {
    const score = context.overallScore ?? 0.5;
    const independenceLevel = context.independenceLevel ?? 'moderate';

    if (score < 0.35 || independenceLevel === 'low') return 'strong'; // needs most support
    if (score < 0.65 || independenceLevel === 'moderate') return 'moderate';
    return 'mild'; // needs least support
  }

  private inferStrengths(context: any): string[] {
    const strengths: string[] = [];
    const s = context.strengthsProfile || {};

    if (s.visual > 0.6 || context.preferredModality === 'visual') strengths.push('Visual_Strength');
    if (s.auditory > 0.6) strengths.push('Auditive_Strength');
    if (s.logical > 0.6) strengths.push('Logical_Strength');
    if (s.motor > 0.6) strengths.push('Motor_Strength');
    if (s.sensory > 0.6) strengths.push('Sensory_Strength');

    // Default: visual strength for ASD learners if nothing specified
    if (strengths.length === 0) strengths.push('Visual_Strength');

    return strengths;
  }

  private inferWeaknesses(context: any): string[] {
    const weaknesses: string[] = [];
    const w = context.weaknessesProfile || {};

    if (w.visual > 0.5) weaknesses.push('Visual_Weakness');
    if (w.auditory > 0.5) weaknesses.push('Auditive_Weakness');
    if (w.logical > 0.5) weaknesses.push('Logical_Weakness');
    if (w.motor > 0.5) weaknesses.push('Motor_Weakness');
    if (w.sensory > 0.5) weaknesses.push('Sensory_Weakness');

    return weaknesses;
  }

  private inferModality(strengths: string[], weaknesses: string[]): string {
    // Ontology rule: if Visual_Strength AND Sensory_Strength -> IA_Sandbox_DIY (visual/interactive)
    if (strengths.includes('Visual_Strength') && strengths.includes('Sensory_Strength')) {
      return 'visual_interactive';
    }
    // Rule: if Visual_Strength -> visual
    if (strengths.includes('Visual_Strength')) return 'visual';
    // Rule: if Auditive_Strength -> auditory
    if (strengths.includes('Auditive_Strength')) return 'auditory';
    // Rule: if Logical_Strength -> logical/textual
    if (strengths.includes('Logical_Strength')) return 'logical';
    // Default
    return 'visual';
  }

  /**
   * Implements LASDONT treatment recommendation rules:
   * - Visual_Puzzles: hasStrength(Logical) AND hasStrength(Sensory) AND hasStrength(Visual)
   * - Question_Videos: (hasStrength(Visual) AND hasWeakness(Motor)) OR hasWeakness(Logical)
   * - Yes_No_Videos: hasWeakness(Logical) OR hasWeakness(Motor)
   * - Textual_Quizzes: hasStrength(Logical)
   * - Visual_Quizzes: hasStrength(Visual)
   * - IA_Sandbox_DIY: hasStrength(Sensory) AND hasStrength(Visual)
   */
  private inferTreatments(
    strengths: string[],
    weaknesses: string[],
    supportLevel: string,
  ): string[] {
    const treatments: string[] = [];

    const hasStr = (s: string) => strengths.includes(s);
    const hasWeak = (w: string) => weaknesses.includes(w);

    // IA_Sandbox_DIY rule
    if (hasStr('Sensory_Strength') && hasStr('Visual_Strength')) {
      treatments.push('IA_Sandbox_DIY');
    }

    // Visual_Puzzles rule
    if (hasStr('Logical_Strength') && hasStr('Sensory_Strength') && hasStr('Visual_Strength')) {
      treatments.push('Visual_Puzzles');
    }

    // Question_Videos rule
    if ((hasStr('Visual_Strength') && hasWeak('Motor_Weakness')) || hasWeak('Logical_Weakness')) {
      treatments.push('Question_Videos');
    }

    // Yes_No_Videos rule
    if (hasWeak('Logical_Weakness') || hasWeak('Motor_Weakness')) {
      treatments.push('Yes_No_Videos');
    }

    // Textual_Quizzes rule
    if (hasStr('Logical_Strength')) {
      treatments.push('Textual_Quizzes');
    }

    // Visual_Quizzes rule
    if (hasStr('Visual_Strength')) {
      treatments.push('Visual_Quizzes');
    }

    // If strong support level, prefer simpler treatments
    if (supportLevel === 'strong') {
      return treatments.filter(t => ['Yes_No_Videos', 'Visual_Quizzes', 'IA_Sandbox_DIY'].includes(t));
    }

    // Default treatment
    if (treatments.length === 0) treatments.push('Visual_Quizzes');

    return [...new Set(treatments)];
  }

  private mapToOntologyClass(supportLevel: string, strengths: string[]): string {
    const levelMap: Record<string, string> = {
      mild: 'Mild_Support_Level_User',
      moderate: 'Moderated_Support_Level_User',
      strong: 'Strong_Support_Level_User',
    };
    return levelMap[supportLevel] || 'Moderated_Support_Level_User';
  }

  private getDefaultOntologyGraph(): any {
    return {
      '@context': 'http://www.semanticweb.org/ricma/ontologies/2024/11/LASDONT.owl',
      classes: [
        'Evaluation_Class', 'Activity_Feedback', 'Learned_Topic',
        'Formal_Form', 'Formal_Child_Form', 'Formal_Professional_Form',
        'Learning_Partition_Class', 'Percentage',
        'Mild_Learning_Percentage', 'Moderated_Percentage', 'Strong_Percentage',
        'Strength_and_Weakness_Class', 'Strengths', 'Weaknesses',
        'Auditive_Strength', 'Logical_Strength', 'Motor_Strength',
        'Sensory_Strength', 'Visual_Strength',
        'Auditive_Weakness', 'Logical_Weakness', 'Motor_Weakness',
        'Sensory_Weakness', 'Visual_Weakness',
        'Treatments_Class', 'DIY', 'IA_Sandbox_DIY',
        'Puzzles', 'Visual_Puzzles', 'Quizzes',
        'Textual_Quizzes', 'Visual_Quizzes', 'Videos',
        'Question_Videos', 'Yes_No_Videos',
      ],
      objectProperties: [
        'hasStrength', 'hasWeakness', 'hasContentConnection',
        'hasContentValidation', 'isAdaptiveContent',
        'isRelatedToStrength', 'isRelatedToWeakness', 'hasActorsResponses',
      ],
      supportLevels: ['Mild_Support_Level_User', 'Moderated_Support_Level_User', 'Strong_Support_Level_User'],
    };
  }
}

backend/src/modules/ade/rule-engine.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';

interface RuleEngineInput {
  performanceMetrics: any;
  engagementData: any;
  ontologyProfile: any;
  bnccContext: any;
}

interface RuleEngineResult {
  appliedRules: string[];
  overrideDifficulty?: number;
  forcedModality?: string;
  confidenceMultiplier: number;
  pedagogicalFlags: string[];
  bnccGateBlocked: boolean;
}

/**
 * RuleEngineService
 *
 * Implements SWRL-equivalent pedagogical rules in TypeScript.
 * Rules are based on:
 * - LASDONT ontology constraints
 * - BNCC curriculum gates
 * - ASD-specific pedagogical guidelines
 */
@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  applyRules(input: RuleEngineInput): RuleEngineResult {
    const result: RuleEngineResult = {
      appliedRules: [],
      confidenceMultiplier: 1.0,
      pedagogicalFlags: [],
      bnccGateBlocked: false,
    };

    this.applyPerformanceRules(input, result);
    this.applyEngagementRules(input, result);
    this.applyBnccGateRules(input, result);
    this.applyAsdSpecificRules(input, result);
    this.applySensoryRules(input, result);

    this.logger.debug(`[RULES] Applied: ${result.appliedRules.join(', ')}`);
    return result;
  }

  /**
   * Rule P1: If score < 40% for 3 consecutive attempts → reduce difficulty
   * Rule P2: If score > 85% for 3 consecutive attempts → increase difficulty
   * Rule P3: If response_time > 120s → suggest break or modality change
   */
  private applyPerformanceRules(input: RuleEngineInput, result: RuleEngineResult): void {
    const perf = input.performanceMetrics || {};
    const consecutiveFailures = perf.consecutiveFailures ?? 0;
    const consecutiveSuccesses = perf.consecutiveSuccesses ?? 0;
    const avgResponseTime = perf.avgResponseTimeSeconds ?? 30;
    const avgScore = perf.averageScore ?? 0.5;

    // Rule P1
    if (consecutiveFailures >= 3 || avgScore < 0.35) {
      result.overrideDifficulty = Math.max(1, (perf.currentDifficulty ?? 2) - 1);
      result.appliedRules.push('P1_REDUCE_DIFFICULTY');
      result.confidenceMultiplier *= 1.1;
    }

    // Rule P2
    if (consecutiveSuccesses >= 3 && avgScore > 0.85) {
      result.overrideDifficulty = Math.min(5, (perf.currentDifficulty ?? 2) + 1);
      result.appliedRules.push('P2_INCREASE_DIFFICULTY');
      result.confidenceMultiplier *= 1.1;
    }

    // Rule P3
    if (avgResponseTime > 120) {
      result.pedagogicalFlags.push('SUGGEST_BREAK');
      result.appliedRules.push('P3_RESPONSE_TIME_HIGH');
    }
  }

  /**
   * Rule E1: If engagement_index < 30% → change modality
   * Rule E2: If session_duration > 20min without break → trigger pause suggestion
   * Rule E3: If error_rate > 60% + low engagement → switch to easier modality
   */
  private applyEngagementRules(input: RuleEngineInput, result: RuleEngineResult): void {
    const eng = input.engagementData || {};
    const engagementIndex = eng.engagementIndex ?? 0.5;
    const sessionDurationMin = eng.sessionDurationMinutes ?? 10;
    const errorRate = eng.errorRate ?? 0.3;

    // Rule E1
    if (engagementIndex < 0.3) {
      result.forcedModality = 'visual_interactive';
      result.appliedRules.push('E1_LOW_ENGAGEMENT_MODALITY_CHANGE');
      result.confidenceMultiplier *= 0.9;
    }

    // Rule E2
    if (sessionDurationMin > 20) {
      result.pedagogicalFlags.push('SESSION_BREAK_RECOMMENDED');
      result.appliedRules.push('E2_SESSION_TOO_LONG');
    }

    // Rule E3
    if (errorRate > 0.6 && engagementIndex < 0.4) {
      result.forcedModality = 'visual';
      if (!result.overrideDifficulty) {
        result.overrideDifficulty = 1;
      }
      result.appliedRules.push('E3_HIGH_ERROR_LOW_ENGAGEMENT');
      result.confidenceMultiplier *= 1.15;
    }
  }

  /**
   * BNCC Gate Rules:
   * Rule B1: Prerequisite skill must be mastered (>70%) before advancing
   * Rule B2: Cannot skip year-level skills
   * Rule B3: Spiral learning - revisit skills periodically
   */
  private applyBnccGateRules(input: RuleEngineInput, result: RuleEngineResult): void {
    const bncc = input.bnccContext || {};
    const perf = input.performanceMetrics || {};
    const prerequisiteMastery = bncc.prerequisiteMastery ?? 1.0;
    const currentYearLevel = bncc.yearLevel ?? 1;
    const requestedYearLevel = bncc.requestedYearLevel ?? currentYearLevel;

    // Rule B1: Prerequisite gate
    if (prerequisiteMastery < 0.7) {
      result.bnccGateBlocked = true;
      result.pedagogicalFlags.push('BNCC_PREREQUISITE_NOT_MET');
      result.appliedRules.push('B1_PREREQUISITE_GATE');
      result.confidenceMultiplier *= 1.2;
    }

    // Rule B2: Year level gate
    if (requestedYearLevel > currentYearLevel + 1) {
      result.bnccGateBlocked = true;
      result.pedagogicalFlags.push('BNCC_YEAR_LEVEL_SKIP_BLOCKED');
      result.appliedRules.push('B2_YEAR_LEVEL_GATE');
    }

    // Rule B3: Spiral revisit (every 5 sessions)
    const sessionCount = perf.totalSessions ?? 0;
    if (sessionCount > 0 && sessionCount % 5 === 0) {
      result.pedagogicalFlags.push('BNCC_SPIRAL_REVIEW');
      result.appliedRules.push('B3_SPIRAL_LEARNING');
    }
  }

  /**
   * ASD-Specific Rules:
   * Rule A1: Visual-first modality for strong support level learners
   * Rule A2: Avoid auditory overload when sensory_weakness detected
   * Rule A3: Predictable activity structure for routine preference
   * Rule A4: Short activity chunks for attention management
   */
  private applyAsdSpecificRules(input: RuleEngineInput, result: RuleEngineResult): void {
    const profile = input.ontologyProfile || {};
    const weaknesses = profile.weaknesses || [];
    const supportLevel = profile.supportLevel || 'moderate';

    // Rule A1
    if (supportLevel === 'strong' && !result.forcedModality) {
      result.forcedModality = 'visual';
      result.appliedRules.push('A1_STRONG_SUPPORT_VISUAL_FIRST');
    }

    // Rule A2
    if (weaknesses.includes('Sensory_Weakness') || weaknesses.includes('Auditive_Weakness')) {
      if (result.forcedModality === 'auditory') {
        result.forcedModality = 'visual';
      }
      result.pedagogicalFlags.push('AVOID_AUDITORY_OVERLOAD');
      result.appliedRules.push('A2_SENSORY_OVERRIDE');
    }

    // Rule A3: Ensure predictable structure
    result.pedagogicalFlags.push('USE_PREDICTABLE_STRUCTURE');
    result.appliedRules.push('A3_ROUTINE_PREFERENCE');

    // Rule A4: Short chunks
    result.pedagogicalFlags.push('SHORT_ACTIVITY_CHUNKS');
    result.appliedRules.push('A4_ATTENTION_MANAGEMENT');
  }

  /**
   * Sensory Rules based on LASDONT ontology:
   * Rule S1: If Visual_Strength → prefer visual activities
   * Rule S2: If Logical_Strength → TextualQuizzes eligible
   * Rule S3: If Motor_Weakness → avoid activities requiring fine motor
   */
  private applySensoryRules(input: RuleEngineInput, result: RuleEngineResult): void {
    const profile = input.ontologyProfile || {};
    const strengths = profile.strengths || [];
    const weaknesses = profile.weaknesses || [];

    // Rule S1
    if (strengths.includes('Visual_Strength') && !result.forcedModality) {
      result.forcedModality = 'visual';
      result.appliedRules.push('S1_VISUAL_STRENGTH');
    }

    // Rule S2
    if (strengths.includes('Logical_Strength')) {
      result.pedagogicalFlags.push('TEXTUAL_QUIZZES_ELIGIBLE');
      result.appliedRules.push('S2_LOGICAL_STRENGTH');
    }

    // Rule S3
    if (weaknesses.includes('Motor_Weakness')) {
      result.pedagogicalFlags.push('AVOID_FINE_MOTOR_ACTIVITIES');
      result.appliedRules.push('S3_MOTOR_WEAKNESS');
      result.confidenceMultiplier *= 1.05;
    }
  }
}

backend/src/modules/ade/dto/ade-decision-request.dto.ts
typescriptCopyimport { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceMetricsDto {
  @ApiPropertyOptional() averageScore?: number;
  @ApiPropertyOptional() consecutiveFailures?: number;
  @ApiPropertyOptional() consecutiveSuccesses?: number;
  @ApiPropertyOptional() currentDifficulty?: number;
  @ApiPropertyOptional() avgResponseTimeSeconds?: number;
  @ApiPropertyOptional() totalSessions?: number;
  @ApiPropertyOptional() lastActivityCorrect?: boolean;
}

export class EngagementDataDto {
  @ApiPropertyOptional() engagementIndex?: number;
  @ApiPropertyOptional() sessionDurationMinutes?: number;
  @ApiPropertyOptional() errorRate?: number;
  @ApiPropertyOptional() clicksPerMinute?: number;
  @ApiPropertyOptional() pauseCount?: number;
}

export class OntologyContextDto {
  @ApiPropertyOptional() supportLevel?: string;
  @ApiPropertyOptional() preferredModality?: string;
  @ApiPropertyOptional() overallScore?: number;
  @ApiPropertyOptional() strengthsProfile?: Record<string, number>;
  @ApiPropertyOptional() weaknessesProfile?: Record<string, number>;
  @ApiPropertyOptional() independenceLevel?: string;
}

export class BnccContextDto {
  @ApiPropertyOptional() currentSkill?: string;
  @ApiPropertyOptional() skillDescription?: string;
  @ApiPropertyOptional() yearLevel?: number;
  @ApiPropertyOptional() requestedYearLevel?: number;
  @ApiPropertyOptional() prerequisiteMastery?: number;
  @ApiPropertyOptional() thematicUnit?: string;
}

export class AdeDecisionRequestDto {
  @ApiProperty()
  @IsString()
  learnerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PerformanceMetricsDto)
  performanceMetrics?: PerformanceMetricsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EngagementDataDto)
  engagementData?: EngagementDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OntologyContextDto)
  ontologyContext?: OntologyContextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BnccContextDto)
  bnccContext?: BnccContextDto;
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
@Index(['learnerId', 'createdAt'])
export class AdeDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id' })
  @Index()
  learnerId: string;

  @Column({ name: 'decision_type', default: 'activity_selection' })
  decisionType: string;

  @Column({ name: 'input_context', type: 'jsonb' })
  inputContext: Record<string, any>;

  @Column({ name: 'output_decision', type: 'jsonb' })
  outputDecision: Record<string, any>;

  @Column({ name: 'xai_record', type: 'jsonb' })
  xaiRecord: Record<string, any>;

  @Column({ type: 'float', default: 0.7 })
  confidence: number;

  @Column({ name: 'applied_rules', type: 'jsonb', default: [] })
  appliedRules: string[];

  @Column({ name: 'bncc_skill_code', nullable: true })
  bnccSkillCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

backend/src/modules/ade/interfaces/ade-decision-output.interface.ts
typescriptCopyexport interface AdeDecisionOutput {
  decisionId: string;
  learnerId: string;
  nextActivity: {
    activityType: string;
    difficulty: number;
    bnccSkillCode: string;
    bnccSkillDescription: string;
    estimatedDurationMinutes: number;
    modalityType: string;
  };
  difficultyAdjustment: number;
  recommendedModality: string;
  feedbackMessage: string;
  bnccSkillTargeted: string;
  xaiExplanation: {
    factors: Array<{ source: string; weight: number; contribution: string }>;
    final_reasoning: string;
    processing_time_ms: number;
  };
  confidence: number;
  timestamp: Date;
}

backend/src/modules/analytics/analytics.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BktService } from './bkt.service';
import { EngagementService } from './engagement.service';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsSnapshot, ActivityAttempt]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, BktService, EngagementService],
  exports: [AnalyticsService, BktService, EngagementService],
})
export class AnalyticsModule {}

backend/src/modules/analytics/analytics.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { BktService } from './bkt.service';
import { EngagementService } from './engagement.service';
import { ActivityEventDto } from './dto/activity-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly bktService: BktService,
    private readonly engagementService: EngagementService,
  ) {}

  /**
   * Process an activity event from Kafka consumer.
   * This is the core analytics pipeline:
   * 1. Persist the event
   * 2. Update BKT skill mastery
   * 3. Calculate engagement index
   * 4. Detect behavioral patterns
   * 5. Update BNCC trajectory
   * 6. Create/update analytics snapshot
   */
  async processActivityEvent(event: ActivityEventDto): Promise<AnalyticsSnapshot> {
    this.logger.log(`[ANALYTICS] Processing event: ${event.eventType} for learner: ${event.learnerId}`);

    // Step 1: Persist attempt
    const attempt = await this.persistAttempt(event);

    // Step 2: Update BKT
    const bktUpdate = await this.bktService.updateSkillMastery(
      event.learnerId,
      event.bnccSkillCode,
      event.isCorrect,
    );

    // Step 3: Calculate engagement
    const engagementMetrics = await this.engagementService.calculateEngagement(
      event.learnerId,
      event,
    );

    // Step 4: Detect behavioral patterns
    const patterns = await this.detectBehavioralPatterns(event.learnerId);

    // Step 5: Track BNCC trajectory
    const bnccTrajectory = await this.updateBnccTrajectory(event.learnerId, event.bnccSkillCode, bktUpdate);

    // Step 6: Create analytics snapshot
    const snapshot = await this.createSnapshot({
      learnerId: event.learnerId,
      bktUpdate,
      engagementMetrics,
      patterns,
      bnccTrajectory,
      event,
    });

    this.logger.log(`[ANALYTICS] Snapshot created: ${snapshot.id}`);
    return snapshot;
  }

  private async persistAttempt(event: ActivityEventDto): Promise<ActivityAttempt> {
    const attempt = this.attemptRepo.create({
      learnerId: event.learnerId,
      activityId: event.activityId,
      sessionId: event.sessionId,
      isCorrect: event.isCorrect,
      responseTimeSeconds: event.responseTimeSeconds,
      score: event.score,
      bnccSkillCode: event.bnccSkillCode,
      interactionSignals: event.interactionSignals || {},
      completedAt: new Date(event.timestamp),
    });
    return this.attemptRepo.save(attempt);
  }

  private async detectBehavioralPatterns(learnerId: string): Promise<any> {
    // Get recent attempts
    const recentAttempts = await this.attemptRepo.find({
      where: { learnerId },
      order: { completedAt: 'DESC' },
      take: 20,
    });

    const patterns: any = {};

    if (recentAttempts.length === 0) return patterns;

    // Pattern: consecutive failures
    let consecutiveFailures = 0;
    for (const attempt of recentAttempts) {
      if (!attempt.isCorrect) consecutiveFailures++;
      else break;
    }
    patterns.consecutiveFailures = consecutiveFailures;

    // Pattern: consecutive successes
    let consecutiveSuccesses = 0;
    for (const attempt of recentAttempts) {
      if (attempt.isCorrect) consecutiveSuccesses++;
      else break;
    }
    patterns.consecutiveSuccesses = consecutiveSuccesses;

    // Pattern: average response time
    const avgResponseTime =
      recentAttempts.reduce((sum, a) => sum + (a.responseTimeSeconds || 0), 0) /
      recentAttempts.length;
    patterns.avgResponseTimeSeconds = avgResponseTime;

    // Pattern: overall accuracy
    const correctCount = recentAttempts.filter(a => a.isCorrect).length;
    patterns.recentAccuracy = correctCount / recentAttempts.length;

    // Pattern: fatigue detection (increasing response time over session)
    if (recentAttempts.length >= 5) {
      const earlyAvg =
        recentAttempts.slice(-5).reduce((s, a) => s + (a.responseTimeSeconds || 0), 0) / 5;
      const lateAvg =
        recentAttempts.slice(0, 5).reduce((s, a) => s + (a.responseTimeSeconds || 0), 0) / 5;
      patterns.fatiguePossible = lateAvg > earlyAvg * 1.5;
    }

    return patterns;
  }

  private async updateBnccTrajectory(
    learnerId: string,
    skillCode: string,
    bktUpdate: any,
  ): Promise<any> {
    // Get existing trajectory or create new
    const existingSnapshot = await this.snapshotRepo.findOne({
      where: { learnerId },
      order: { createdAt: 'DESC' },
    });

    const trajectory = existingSnapshot?.metrics?.bnccTrajectory || {};

    trajectory[skillCode] = {
      mastery: bktUpdate.mastery,
      status: bktUpdate.mastery > 0.8 ? 'mastered' : bktUpdate.mastery > 0.5 ? 'developing' : 'introduced',
      lastUpdated: new Date().toISOString(),
      attemptsCount: (trajectory[skillCode]?.attemptsCount || 0) + 1,
    };

    return trajectory;
  }

  private async createSnapshot(params: {
    learnerId: string;
    bktUpdate: any;
    engagementMetrics: any;
    patterns: any;
    bnccTrajectory: any;
    event: ActivityEventDto;
  }): Promise<AnalyticsSnapshot> {
    const snapshot = this.snapshotRepo.create({
      learnerId: params.learnerId,
      snapshotType: 'activity_completion',
      metrics: {
        bkt: params.bktUpdate,
        engagement: params.engagementMetrics,
        patterns: params.patterns,
        bnccTrajectory: params.bnccTrajectory,
        lastActivity: {
          activityId: params.event.activityId,
          bnccSkillCode: params.event.bnccSkillCode,
          isCorrect: params.event.isCorrect,
          score: params.event.score,
        },
      },
      bnccSkillCode: params.event.bnccSkillCode,
      masteryScore: params.bktUpdate.mastery,
      engagementIndex: params.engagementMetrics.engagementIndex,
    });

    return this.snapshotRepo.save(snapshot);
  }

  async getLearnerAnalytics(learnerId: string): Promise<any> {
    const latestSnapshot = await this.snapshotRepo.findOne({
      where: { learnerId },
      order: { createdAt: 'DESC' },
    });

    const recentAttempts = await this.attemptRepo.find({
      where: { learnerId },
      order: { completedAt: 'DESC' },
      take: 50,
    });

    const skillMasteries = await this.bktService.getAllSkillMasteries(learnerId);

    return {
      learnerId,
      latestSnapshot,
      skillMasteries,
      recentAttempts: recentAttempts.length,
      overallAccuracy:
        recentAttempts.length > 0
          ? recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length
          : 0,
    };
  }

  async getBnccCoverage(learnerId: string): Promise<any> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { learnerId },
      order: { createdAt: 'DESC' },
    });

    return snapshot?.metrics?.bnccTrajectory || {};
  }
}

backend/src/modules/analytics/bkt.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';

/**
 * BKT (Bayesian Knowledge Tracing) Service
 *
 * Implements the standard BKT model with 4 parameters:
 * - P(L0): Initial probability of knowing the skill
 * - P(T): Probability of transitioning from not-knowing to knowing (learning)
 * - P(G): Probability of guessing correctly without knowing
 * - P(S): Probability of slipping (answering incorrectly despite knowing)
 *
 * Update formula:
 * P(L_n | correct) = P(L_{n-1}) * (1 - P(S)) / [P(L_{n-1}) * (1 - P(S)) + (1 - P(L_{n-1})) * P(G)]
 * P(L_n | incorrect) = P(L_{n-1}) * P(S) / [P(L_{n-1}) * P(S) + (1 - P(L_{n-1})) * (1 - P(G))]
 * P(L_n+1) = P(L_n | evidence) + (1 - P(L_n | evidence)) * P(T)
 *
 * Reference: Corbett & Anderson (1994)
 */
@Injectable()
export class BktService {
  private readonly logger = new Logger(BktService.name);

  // Default BKT parameters (calibrated for early math skills)
  private readonly BKT_PARAMS: Record<string, { pL0: number; pT: number; pG: number; pS: number }> = {
    default: { pL0: 0.1, pT: 0.15, pG: 0.25, pS: 0.1 },
    counting: { pL0: 0.2, pT: 0.2, pG: 0.3, pS: 0.1 },
    addition: { pL0: 0.1, pT: 0.12, pG: 0.2, pS: 0.1 },
    subtraction: { pL0: 0.1, pT: 0.12, pG: 0.2, pS: 0.1 },
    multiplication: { pL0: 0.05, pT: 0.1, pG: 0.15, pS: 0.08 },
    geometry: { pL0: 0.15, pT: 0.18, pG: 0.25, pS: 0.12 },
  };

  // In-memory BKT state cache (in production, persist to DB)
  private bktStateCache: Map<string, Record<string, number>> = new Map();

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
  ) {}

  async updateSkillMastery(
    learnerId: string,
    skillCode: string,
    isCorrect: boolean,
  ): Promise<{ mastery: number; previous: number; delta: number; skillCode: string }> {
    const skillCategory = this.getSkillCategory(skillCode);
    const params = this.BKT_PARAMS[skillCategory] || this.BKT_PARAMS.default;

    // Get current mastery
    const currentMastery = await this.getCurrentMastery(learnerId, skillCode, params.pL0);
    const previous = currentMastery;

    // Update based on observation
    const posterior = this.updatePosterior(currentMastery, isCorrect, params);

    // Apply learning transition
    const newMastery = this.applyLearningTransition(posterior, params.pT);

    // Cache update
    const learnerCache = this.bktStateCache.get(learnerId) || {};
    learnerCache[skillCode] = newMastery;
    this.bktStateCache.set(learnerId, learnerCache);

    this.logger.debug(
      `[BKT] ${learnerId} | ${skillCode} | ${previous.toFixed(3)} → ${newMastery.toFixed(3)} | correct=${isCorrect}`,
    );

    return {
      mastery: newMastery,
      previous,
      delta: newMastery - previous,
      skillCode,
    };
  }

  /**
   * BKT Update: P(L_n | evidence)
   */
  private updatePosterior(
    pL: number,
    isCorrect: boolean,
    params: { pG: number; pS: number },
  ): number {
    if (isCorrect) {
      const numerator = pL * (1 - params.pS);
      const denominator = pL * (1 - params.pS) + (1 - pL) * params.pG;
      return denominator > 0 ? numerator / denominator : pL;
    } else {
      const numerator = pL * params.pS;
      const denominator = pL * params.pS + (1 - pL) * (1 - params.pG);
      return denominator > 0 ? numerator / denominator : pL;
    }
  }

  /**
   * BKT Learning Transition: P(L_{n+1}) = P(L_n|evidence) + (1-P(L_n|evidence)) * P(T)
   */
  private applyLearningTransition(posterior: number, pT: number): number {
    return posterior + (1 - posterior) * pT;
  }

  private async getCurrentMastery(
    learnerId: string,
    skillCode: string,
    defaultPL0: number,
  ): Promise<number> {
    // Check cache first
    const cached = this.bktStateCache.get(learnerId)?.[skillCode];
    if (cached !== undefined) return cached;

    // Check database
    const snapshot = await this.snapshotRepo.findOne({
      where: { learnerId, bnccSkillCode: skillCode },
      order: { createdAt: 'DESC' },
    });

    if (snapshot?.masteryScore) {
      // Warm up cache
      const learnerCache = this.bktStateCache.get(learnerId) || {};
      learnerCache[skillCode] = snapshot.masteryScore;
      this.bktStateCache.set(learnerId, learnerCache);
      return snapshot.masteryScore;
    }

    return defaultPL0;
  }

  async getAllSkillMasteries(learnerId: string): Promise<Record<string, number>> {
    return this.bktStateCache.get(learnerId) || {};
  }

  private getSkillCategory(skillCode: string): string {
    // Map BNCC skill codes to BKT parameter categories
    if (/EF0[1-5]MA(01|02|03|04|05)/.test(skillCode)) return 'counting';
    if (/EF0[1-5]MA(06|07|08)/.test(skillCode)) return 'addition';
    if (/EF0[3-5]MA(07|08|09)/.test(skillCode)) return 'subtraction';
    if (/EF0[3-5]MA(10|11|12)/.test(skillCode)) return 'multiplication';
    if (/EF0[1-5]MA(13|14|15|16)/.test(skillCode)) return 'geometry';
    return 'default';
  }
}

backend/src/modules/analytics/engagement.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { ActivityEventDto } from './dto/activity-event.dto';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  // Rolling window cache per learner
  private engagementCache: Map<string, any[]> = new Map();

  async calculateEngagement(
    learnerId: string,
    event: ActivityEventDto,
  ): Promise<{
    engagementIndex: number;
    components: Record<string, number>;
    classification: string;
  }> {
    // Maintain rolling window of events
    const window = this.engagementCache.get(learnerId) || [];
    window.push(event);
    if (window.length > 20) window.shift();
    this.engagementCache.set(learnerId, window);

    // Calculate engagement components
    const accuracy = this.calculateAccuracy(window);
    const responsiveness = this.calculateResponsiveness(window);
    const persistence = this.calculatePersistence(window);
    const progressRate = this.calculateProgressRate(window);

    // Weighted engagement index
    const engagementIndex =
      accuracy * 0.35 +
      responsiveness * 0.25 +
      persistence * 0.25 +
      progressRate * 0.15;

    const classification =
      engagementIndex > 0.7 ? 'high' : engagementIndex > 0.4 ? 'medium' : 'low';

    this.logger.debug(
      `[ENGAGEMENT] ${learnerId}: index=${engagementIndex.toFixed(3)}, class=${classification}`,
    );

    return {
      engagementIndex: Math.round(engagementIndex * 1000) / 1000,
      components: {
        accuracy: Math.round(accuracy * 100) / 100,
        responsiveness: Math.round(responsiveness * 100) / 100,
        persistence: Math.round(persistence * 100) / 100,
        progressRate: Math.round(progressRate * 100) / 100,
      },
      classification,
    };
  }

  private calculateAccuracy(window: ActivityEventDto[]): number {
    if (window.length === 0) return 0.5;
    const correct = window.filter(e => e.isCorrect).length;
    return correct / window.length;
  }

  private calculateResponsiveness(window: ActivityEventDto[]): number {
    if (window.length === 0) return 0.5;
    const avgResponseTime =
      window.reduce((sum, e) => sum + (e.responseTimeSeconds || 30), 0) / window.length;
    // Normalize: < 10s = 1.0, > 120s = 0.0
    return Math.max(0, Math.min(1, 1 - (avgResponseTime - 10) / 110));
  }

  private calculatePersistence(window: ActivityEventDto[]): number {
    if (window.length < 3) return 0.5;
    // Check if learner continues after failures
    let persistenceScore = 0;
    for (let i = 1; i < window.length; i++) {
      if (!window[i - 1].isCorrect) {
        // Learner attempted again after failure
        persistenceScore += 1;
      }
    }
    return Math.min(1, persistenceScore / (window.length - 1) + 0.3);
  }

  private calculateProgressRate(window: ActivityEventDto[]): number {
    if (window.length < 5) return 0.5;
    // Compare accuracy of last 3 vs first 3 in window
    const early = window.slice(0, 3);
    const recent = window.slice(-3);
    const earlyAccuracy = early.filter(e => e.isCorrect).length / 3;
    const recentAccuracy = recent.filter(e => e.isCorrect).length / 3;
    return Math.max(0, Math.min(1, 0.5 + (recentAccuracy - earlyAccuracy)));
  }
}

backend/src/modules/analytics/dto/activity-event.dto.ts
typescriptCopyexport class ActivityEventDto {
  eventType: string;
  learnerId: string;
  activityId: string;
  sessionId: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  score: number;
  bnccSkillCode: string;
  interactionSignals?: Record<string, any>;
  timestamp: string;
}

backend/src/modules/analytics/analytics.controller.ts
typescriptCopyimport { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('learner/:learnerId')
  @Roles(UserRole.EDUCATOR, UserRole.GUARDIAN)
  async getLearnerAnalytics(@Param('learnerId') learnerId: string) {
    return this.analyticsService.getLearnerAnalytics(learnerId);
  }

  @Get('learner/:learnerId/bncc-coverage')
  @Roles(UserRole.EDUCATOR, UserRole.GUARDIAN)
  async getBnccCoverage(@Param('learnerId') learnerId: string) {
    return this.analyticsService.getBnccCoverage(learnerId);
  }
}

backend/src/modules/analytics/entities/analytics-snapshot.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_snapshots')
@Index(['learnerId', 'createdAt'])
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'learner_id' })
  @Index()
  learnerId: string;

  @Column({ name: 'snapshot_type', default: 'activity_completion' })
  snapshotType: string;

  @Column({ type: 'jsonb' })
  metrics: Record<string, any>;

  @Column({ name: 'bncc_skill_code', nullable: true })
  bnccSkillCode: string;

  @Column({ name: 'mastery_score', type: 'float', default: 0 })
  masteryScore: number;

  @Column({ name: 'engagement_index', type: 'float', default: 0.5 })
  engagementIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

backend/src/modules/kafka/kafka.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AdeModule } from '../ade/ade.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'asd-platform-backend',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'asd-platform-consumer-group',
          },
        },
      },
    ]),
    AnalyticsModule,
    AdeModule,
  ],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}

backend/src/modules/kafka/kafka-producer.service.ts
typescriptCopyimport { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export const KAFKA_TOPICS = {
  SESSION_EVENTS: 'platform.session.events',
  ACTIVITY_EVENTS: 'platform.activity.events',
  ADE_DECISIONS: 'platform.ade.decisions',
  ANALYTICS_UPDATES: 'platform.analytics.updates',
  ALERTS: 'platform.alerts',
};

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaClient.connect();
    this.logger.log('[KAFKA] Producer connected');
  }

  async publishActivityEvent(payload: {
    eventType: string;
    learnerId: string;
    activityId: string;
    sessionId: string;
    isCorrect: boolean;
    responseTimeSeconds: number;
    score: number;
    bnccSkillCode: string;
    interactionSignals?: Record<string, any>;
  }): Promise<void> {
    const message = {
      key: payload.learnerId,
      value: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'backend',
      }),
      headers: {
        'event-type': payload.eventType,
        'schema-version': '1.0',
      },
    };

    try {
      this.kafkaClient.emit(KAFKA_TOPICS.ACTIVITY_EVENTS, message);
      this.logger.debug(`[KAFKA] Published ${payload.eventType} for learner ${payload.learnerId}`);
    } catch (error) {
      this.logger.error(`[KAFKA] Publish failed: ${error.message}`);
    }
  }

  async publishSessionEvent(payload: {
    eventType: string;
    learnerId: string;
    sessionId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.kafkaClient.emit(KAFKA_TOPICS.SESSION_EVENTS, {
      key: payload.learnerId,
      value: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async publishAlert(payload: {
    alertType: string;
    learnerId: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.kafkaClient.emit(KAFKA_TOPICS.ALERTS, {
      key: payload.learnerId,
      value: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

backend/src/modules/kafka/kafka-consumer.service.ts
typescriptCopyimport { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { AnalyticsService } from '../analytics/analytics.service';
import { AdeService } from '../ade/ade.service';
import { ActivityEventDto } from '../analytics/dto/activity-event.dto';
import { KAFKA_TOPICS } from './kafka-producer.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly adeService: AdeService,
  ) {
    this.kafka = new Kafka({
      clientId: 'asd-platform-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.consumer = this.kafka.consumer({
      groupId: 'asd-analytics-consumer',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      await this.subscribeToTopics();
      await this.startConsuming();
      this.logger.log('[KAFKA-CONSUMER] Connected and consuming');
    } catch (error) {
      this.logger.warn(`[KAFKA-CONSUMER] Connection failed: ${error.message}. Running without Kafka.`);
    }
  }

  private async subscribeToTopics(): Promise<void> {
    await this.consumer.subscribe({
      topics: [
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        KAFKA_TOPICS.SESSION_EVENTS,
      ],
      fromBeginning: false,
    });
  }

  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const event = JSON.parse(value);

          switch (topic) {
            case KAFKA_TOPICS.ACTIVITY_EVENTS:
              await this.handleActivityEvent(event);
              break;
            case KAFKA_TOPICS.SESSION_EVENTS:
              await this.handleSessionEvent(event);
              break;
          }
        } catch (error) {
          this.logger.error(`[KAFKA-CONSUMER] Error processing message: ${error.message}`);
        }
      },
    });
  }

  /**
   * Activity event handler — core analytics pipeline trigger
   *
   * Flow:
   * 1. Receive activity.completed event from topic
   * 2. Process through analytics engine (BKT + engagement)
   * 3. Trigger ADE for next decision (async)
   * 4. Persist snapshot
   */
  private async handleActivityEvent(event: ActivityEventDto): Promise<void> {
    this.logger.debug(`[CONSUMER] Activity event: ${event.eventType} | learner: ${event.learnerId}`);

    // Core analytics processing
    const snapshot = await this.analyticsService.processActivityEvent(event);

    this.logger.debug(`[CONSUMER] Analytics processed, snapshot: ${snapshot.id}`);
  }

  private async handleSessionEvent(event: any): Promise<void> {
    this.logger.debug(`[CONSUMER] Session event: ${event.eventType} | learner: ${event.learnerId}`);
    // Session-level analytics (e.g., session start/end tracking)
  }
}

backend/src/modules/activities/activities.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityAttempt]),
    KafkaModule,
    AdeModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

backend/src/modules/activities/activities.service.ts
typescriptCopyimport { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { AdeService } from '../ade/ade.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { v4 as uuidv4 } from 'uuid';

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
  ) {}

  /**
   * Full request flow for activity submission:
   * 1. User submits answer
   * 2. Backend validates and scores
   * 3. Event published to Kafka
   * 4. Analytics processed (via Kafka consumer)
   * 5. ADE triggered for next activity
   * 6. Response returned to frontend
   */
  async submitAttempt(learnerId: string, dto: SubmitAttemptDto): Promise<any> {
    const activity = await this.activityRepo.findOne({ where: { id: dto.activityId } });
    if (!activity) throw new NotFoundException(`Activity ${dto.activityId} not found`);

    // Score the attempt
    const isCorrect = this.scoreAttempt(activity, dto.answer);
    const score = isCorrect ? 1.0 : 0.0;
    const responseTime = dto.responseTimeSeconds || 30;

    // Persist attempt
    const attempt = await this.persistAttempt({
      learnerId,
      activityId: dto.activityId,
      sessionId: dto.sessionId || uuidv4(),
      isCorrect,
      score,
      responseTimeSeconds: responseTime,
      bnccSkillCode: activity.bnccSkillCode,
      interactionSignals: dto.interactionSignals,
    });

    // Publish to Kafka (async - analytics processing)
    await this.kafkaProducer.publishActivityEvent({
      eventType: 'activity.completed',
      learnerId,
      activityId: dto.activityId,
      sessionId: attempt.sessionId,
      isCorrect,
      responseTimeSeconds: responseTime,
      score,
      bnccSkillCode: activity.bnccSkillCode,
      interactionSignals: dto.interactionSignals,
    });

    // Get next activity recommendation from ADE
    const adeDecision = await this.adeService.makeDecision({
      learnerId,
      performanceMetrics: {
        averageScore: score,
        currentDifficulty: activity.difficulty,
        last