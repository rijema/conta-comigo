import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { MlEngineService } from './ml/ml-engine.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';
import { SemanticFilteringTrace } from '../ontology/semantic-runtime.types';
import { HybridRankingResult } from './hybrid-recommendation.service';

export interface AdeInput {
  userId: string;
  profile: ChildProfile;
  recentAttempts: ActivityAttempt[];
  sessionId?: string;
  targetSkillCode?: string;
  recentSkips?: number;
}

@Injectable()
export class AdeService {
  private readonly logger = new Logger(AdeService.name);

  constructor(
    @InjectRepository(AdeDecision)
    private readonly decisionRepo: Repository<AdeDecision>,
    private readonly ontologyReasoner: OntologyReasonerService,
    private readonly ruleEngine: RuleEngineService,
    private readonly mlEngine: MlEngineService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly knowledgeTracingService: KnowledgeTracingService,
  ) {}

  /**
   * Core ADE pipeline:
   * 1. Ontology reasoning → infer modalities
   * 2. ML service → skill mastery + engagement
   * 3. Rule engine → difficulty + wellbeing
   * 4. Synthesize decision
   * 5. Persist + publish Kafka event
   */
  async decide(input: AdeInput): Promise<AdeDecision> {
    this.logger.log(`ADE decision for user ${input.userId}`);

    const { profile, recentAttempts } = input;
    const strengths = profile.strengths || {};
    const weaknesses = profile.weaknesses || {};

    // === STEP 1: Ontology Reasoning ===
    const ontologyResult = this.ontologyReasoner.inferRecommendedModalities(
      strengths,
      weaknesses,
    );
    const supportLevelResult = this.ontologyReasoner.inferSupportLevel(
      profile.asdSupportLevel || 'moderate',
    );

    // === STEP 2: ML Predictions ===
    const currentSkillCode = input.targetSkillCode ?? this.pickCurrentSkillCode(profile, recentAttempts);
    const currentMastery = await this.knowledgeTracingService.getMasteryBySkillCode(
      input.userId,
      currentSkillCode,
    );

    const mlPredictions = await this.mlEngine.predict({
      userId: input.userId,
      recentAttempts: recentAttempts.map((a) => ({
        isCorrect: a.isCorrect,
        timeSpentSeconds: a.timeSpentSeconds || 0,
        hintsUsed: a.hintsUsed || 0,
        interactionSignals: a.interactionSignals || {},
      })),
      currentSkillCode,
      currentMastery,
      bnccSkills: Object.keys(profile.bnccProgress || {}),
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      strengths,
      weaknesses,
    });

    // === STEP 3: Rule Engine ===
    const skillAttempts = recentAttempts.filter((attempt) =>
      attempt.activity?.bnccSkills?.includes(currentSkillCode));
    const recentAccuracy = this.calculateAccuracy(skillAttempts);
    const avgTime = this.calculateAvgTime(skillAttempts);
    const totalHints = skillAttempts.reduce((s, a) => s + (a.hintsUsed || 0), 0);

    const ruleResult = this.ruleEngine.evaluate({
      recentAccuracy,
      averageTimeSeconds: avgTime,
      hintsUsed: totalHints,
      currentSkillMastery: currentMastery,
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      streakCount: profile.currentStreak || 0,
      engagementScore: mlPredictions.engagementScore,
      recentAttempts: skillAttempts.map((attempt) => ({
        isCorrect: attempt.isCorrect,
        hintsUsed: attempt.hintsUsed,
        timeSpentSeconds: attempt.timeSpentSeconds,
        activityId: attempt.activityId,
        difficulty: attempt.activity?.difficulty,
      })),
      recentSkips: input.recentSkips,
    });

    // === STEP 4: Synthesize Decision ===
    const primaryModality =
      mlPredictions.modalityRecommendation ||
      ontologyResult.modalities[0] ||
      'visual';

    const xaiLog = {
      ontologyInferences: [],
      legacyProceduralSignals: ontologyResult.inferences,
      rulesFired: ruleResult.rulesFired,
      mlPredictions: {
        masteryProbability: currentMastery,
        engagementScore: mlPredictions.engagementScore,
        confidence: mlPredictions.confidence,
        fallback: mlPredictions.fallback || false,
      },
      finalReason: `Legacy procedural modality(${ontologyResult.inferences.length} signals) + Rules(${ruleResult.rulesFired.length} fired) + BKT(mastery=${currentMastery.toFixed(2)})`,
      confidence: mlPredictions.confidence,
    };

    // === STEP 5: Persist ===
    const decision = this.decisionRepo.create({
      userId: input.userId,
      sessionId: input.sessionId,
      recommendedDifficulty: ruleResult.recommendedDifficulty,
      recommendedModality: primaryModality,
      recommendedActivityType: this.mapModalityToActivityType(primaryModality),
      recommendedBnccSkill: currentSkillCode,
      xaiLog,
      inputSnapshot: {
        strengths,
        weaknesses,
        recentAccuracy,
        currentMastery,
        targetSkillExplicit: Boolean(input.targetSkillCode),
        recentSkips: input.recentSkips ?? 0,
        supportLevel: profile.asdSupportLevel,
        shouldReduceStimulation: ruleResult.shouldReduceStimulation,
        shouldAddBreak: ruleResult.shouldAddBreak,
      },
    });

    const saved = await this.decisionRepo.save(decision);

    // Publish async
    this.kafkaProducer
      .publishAdeDecision({
        eventId: `ade-${saved.id}`,
        eventType: 'ADE_DECISION_MADE',
        learnerId: input.userId,
        sessionId: input.sessionId || '',
        timestamp: new Date().toISOString(),
        payload: {
          decisionId: saved.id,
          recommendedDifficulty: ruleResult.recommendedDifficulty,
          recommendedModality: primaryModality,
          xaiSummary: xaiLog.finalReason,
        },
      })
      .catch((err: any) => this.logger.error('Kafka ADE publish failed', err));

    this.logger.log(
      `ADE decision ${saved.id}: difficulty=${ruleResult.recommendedDifficulty}, modality=${primaryModality}`,
    );

    return saved;
  }

  async getDecisionsByUser(userId: string): Promise<AdeDecision[]> {
    return this.decisionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async recordSemanticFilteringTrace(
    decision: AdeDecision,
    trace: SemanticFilteringTrace,
  ): Promise<AdeDecision> {
    decision.xaiLog = {
      ...decision.xaiLog,
      ontologyInferences: trace.fallbackUsed
        ? []
        : trace.semanticRelations.map((relation) =>
            `${relation.subject} ${relation.predicate} ${relation.object}`,
          ),
      semanticFiltering: trace,
    };
    return this.decisionRepo.save(decision);
  }

  async recordHybridRanking(
    decision: AdeDecision,
    ranking: HybridRankingResult,
  ): Promise<AdeDecision> {
    decision.selectedActivityId = ranking.selectedActivityId;
    decision.hybridRanking = ranking;
    decision.decisionSource = ranking.decisionSource;
    decision.fallbackUsed = ranking.fallbackUsed;
    decision.fallbackReason = ranking.fallbackReason;
    const saved = await this.decisionRepo.save(decision);
    if (ranking.selectedActivityId && typeof this.kafkaProducer.publishAdeDecision === 'function') {
      this.kafkaProducer.publishAdeDecision({
        eventId: `ade-selection-${saved.id}`,
        eventType: 'ADE_SELECTION_FINALIZED',
        learnerId: saved.userId,
        sessionId: saved.sessionId || '',
        timestamp: new Date().toISOString(),
        payload: {
          decisionId: saved.id,
          selectedActivityId: ranking.selectedActivityId,
          recommendedBnccSkill: saved.recommendedBnccSkill,
          recommendedDifficulty: saved.recommendedDifficulty,
          strategy: ranking.selectionStrategy?.mode ?? null,
          finalScore: ranking.candidates.find((candidate) =>
            candidate.activityId === ranking.selectedActivityId)?.finalScore ?? null,
          rankingVersion: ranking.rankingVersion,
        },
      }).catch((error: any) => this.logger.error('Kafka selection publish failed', error));
    }
    return saved;
  }

  private pickCurrentSkillCode(
    profile: ChildProfile,
    attempts: ActivityAttempt[],
  ): string {
    if (attempts.length > 0 && attempts[0].activity?.bnccSkills?.length > 0) {
      return attempts[0].activity.bnccSkills[0];
    }
    // Default based on school year
    const year = profile.schoolYear || 1;
    return `EF0${year}MA01`;
  }

  private calculateAccuracy(attempts: ActivityAttempt[]): number {
    if (!attempts || attempts.length === 0) return 0.5;
    const correct = attempts.filter((a) => a.isCorrect).length;
    return correct / attempts.length;
  }

  private calculateAvgTime(attempts: ActivityAttempt[]): number {
    if (!attempts || attempts.length === 0) return 60;
    const total = attempts.reduce((s, a) => s + (a.timeSpentSeconds || 60), 0);
    return total / attempts.length;
  }

  inferOntologyModalities(strengths: Record<string, boolean>, weaknesses: Record<string, boolean>) {
    return this.ontologyReasoner.inferRecommendedModalities(strengths, weaknesses);
  }

  private mapModalityToActivityType(modality: string): string {
    const map: Record<string, string> = {
      visual: 'visual_puzzle',
      auditive: 'video_question',
      text: 'quiz',
      mixed: 'drag_drop',
    };
    return map[modality] || 'quiz';
  }
}
