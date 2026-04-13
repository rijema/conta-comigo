import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { MlEngineService } from './ml/ml-engine.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

export interface AdeInput {
  userId: string;
  profile: ChildProfile;
  recentAttempts: ActivityAttempt[];
  sessionId?: string;
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
    const skillMastery = profile.skillMastery || {};

    // === STEP 1: Ontology Reasoning ===
    const ontologyResult = this.ontologyReasoner.inferRecommendedModalities(
      strengths,
      weaknesses,
    );
    const supportLevelResult = this.ontologyReasoner.inferSupportLevel(
      profile.asdSupportLevel || 'moderate',
    );

    // === STEP 2: ML Predictions ===
    const currentSkillCode = this.pickCurrentSkillCode(profile, recentAttempts);
    const currentMastery = skillMastery[currentSkillCode] || 0.3;

    const mlPredictions = await this.mlEngine.predict({
      userId: input.userId,
      recentAttempts: recentAttempts.map((a) => ({
        isCorrect: a.isCorrect,
        timeSpentSeconds: a.timeSpentSeconds || 0,
        hintsUsed: a.hintsUsed || 0,
        interactionSignals: a.interactionSignals || {},
      })),
      currentSkillCode,
      bnccSkills: Object.keys(profile.bnccProgress || {}),
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      strengths,
      weaknesses,
    });

    // === STEP 3: Rule Engine ===
    const recentAccuracy = this.calculateAccuracy(recentAttempts);
    const avgTime = this.calculateAvgTime(recentAttempts);
    const totalHints = recentAttempts.reduce((s, a) => s + (a.hintsUsed || 0), 0);

    const ruleResult = this.ruleEngine.evaluate({
      recentAccuracy,
      averageTimeSeconds: avgTime,
      hintsUsed: totalHints,
      currentSkillMastery: mlPredictions.masteryProbability,
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      streakCount: profile.currentStreak || 0,
      engagementScore: mlPredictions.engagementScore,
    });

    // === STEP 4: Synthesize Decision ===
    const primaryModality =
      mlPredictions.modalityRecommendation ||
      ontologyResult.modalities[0] ||
      'visual';

    const xaiLog = {
      ontologyInferences: ontologyResult.inferences,
      rulesFired: ruleResult.rulesFired,
      mlPredictions: {
        masteryProbability: mlPredictions.masteryProbability,
        engagementScore: mlPredictions.engagementScore,
        confidence: mlPredictions.confidence,
        fallback: mlPredictions.fallback || false,
      },
      finalReason: `Ontology(${ontologyResult.inferences.length} inferences) + Rules(${ruleResult.rulesFired.length} fired) + ML(mastery=${mlPredictions.masteryProbability.toFixed(2)})`,
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
        supportLevel: profile.asdSupportLevel,
        shouldReduceStimulation: ruleResult.shouldReduceStimulation,
        shouldAddBreak: ruleResult.shouldAddBreak,
      },
    });

    const saved = await this.decisionRepo.save(decision);

    // Publish async
    this.kafkaProducer
      .publish('platform.ade.decisions', {
        type: 'ADE_DECISION_MADE',
        decisionId: saved.id,
        userId: input.userId,
        recommendedDifficulty: ruleResult.recommendedDifficulty,
        recommendedModality: primaryModality,
        xaiSummary: xaiLog.finalReason,
        timestamp: new Date().toISOString(),
      })
      .catch((err) => this.logger.error('Kafka ADE publish failed', err));

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