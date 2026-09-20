import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../activities/entities/activity.entity';
import { SemanticFilteringTrace } from '../ontology/semantic-runtime.types';

export interface HybridCandidateScore {
  activityId: string;
  bnccSkills: string[];
  difficulty: DifficultyLevel;
  activityType: string;
  structureId: string | null;
  learningNeed: number;
  challengeFit: number;
  interactionFit: number;
  semanticFit: number;
  novelty: number;
  rejectionRisk: number;
  sensoryFit: number;
  formatFit: number;
  repetitionRisk: number;
  frustrationRisk: number;
  finalScore: number;
  predictedSuccess: number;
  progressDerivative: number;
  performanceIntegral: number;
  dominanceNormalization: number;
  insufficientEvidence: string[];
  explanation: {
    semanticValidityReasons: string[];
    positiveContributions: Record<string, number>;
    penalties: Record<string, number>;
  };
}

export interface HybridRankingResult {
  selectedActivityId: string | null;
  candidateIds: string[];
  candidates: HybridCandidateScore[];
  weights: HybridRankingConfiguration['weights'];
  configurationVersion: string;
  rankingVersion: string;
  ontologyVersion: string;
  decisionSource: 'HYBRID_RANKING' | 'LEGACY_FALLBACK';
  fallbackUsed: boolean;
  fallbackReason: string | null;
  evidenceUsed?: {
    masteryProbability: number | null;
    recentAccuracy: number | null;
    preferredModality: string | null;
    lowStimulation: boolean | null;
    recentActivityIds: string[];
    recentlyRejectedActivityIds: string[];
    observedEvidenceTypes: string[];
  };
  selectionStrategy?: {
    mode: 'consolidate' | 'reinforce' | 'review' | 'challenge' | 'explore';
    originalSkill: string;
    selectedSkill: string;
    evidence: string[];
    relation?: { skillCode: string; relation: string; concepts: string[]; source: string };
  };
  selectionExplanation: {
    selectedActivityId: string | null;
    comparedWith: string[];
    scoreMargin: number | null;
    reason?: string;
  };
}

interface HybridRankingConfiguration {
  targetSuccessProbability: number;
  challengeSigma: number;
  noveltyWindow: number;
  rejectionDecay: number;
  maximumNumericalMagnitude: number;
  maximumStepCount: number;
  maximumResponseTimeSeconds: number;
  difficultyLevelWeight: number;
  frustrationHistoryWindow: number;
  sameFormatRepetitionRisk: number;
  sameRepresentationRisk: number;
  progressDerivativeWeight: number;
  performanceIntegralWeight: number;
  dominanceNormalizationWeight: number;
  weights: {
    learning: number;
    challenge: number;
    interaction: number;
    semantic: number;
    novelty: number;
    rejection: number;
    sensory: number;
    format: number;
    repetition: number;
    frustration: number;
  };
  configurationVersion: string;
  rankingVersion: string;
}

export interface HybridRankingInput {
  candidates: Activity[];
  masteryProbability: number | null;
  semanticTrace: SemanticFilteringTrace;
  recentActivityIds: string[];
  recentlyRejectedActivityIds: string[];
  observedEvidenceTypes: string[];
  preferences?: { lowStimulation?: boolean; preferredModality?: string } | null;
  recentActivities?: Array<{
    activityId: string;
    type?: string;
    structureId?: string;
    bnccSkills?: string[];
    representation?: string[];
    isCorrect?: boolean;
    timeSpentSeconds?: number | null;
    masteryAfter?: number | null;
  }>;
}

@Injectable()
export class HybridRecommendationService {
  private readonly configuration: HybridRankingConfiguration;

  constructor(config: ConfigService) {
    this.configuration = {
      targetSuccessProbability: this.number(config, 'HYBRID_TARGET_SUCCESS_PROBABILITY', 0.7),
      challengeSigma: this.positive(config, 'HYBRID_CHALLENGE_SIGMA', 0.15),
      noveltyWindow: this.positive(config, 'HYBRID_NOVELTY_WINDOW', 5),
      rejectionDecay: this.positive(config, 'HYBRID_REJECTION_DECAY', 3),
      maximumNumericalMagnitude: this.positive(config, 'HYBRID_MAX_NUMERICAL_MAGNITUDE', 20),
      maximumStepCount: this.positive(config, 'HYBRID_MAX_STEP_COUNT', 5),
      maximumResponseTimeSeconds: this.positive(config, 'ADE_SLOW_RESPONSE_SECONDS', 120),
      difficultyLevelWeight: this.number(config, 'HYBRID_DIFFICULTY_LEVEL_WEIGHT', 0.5),
      frustrationHistoryWindow: this.positive(config, 'HYBRID_FRUSTRATION_HISTORY_WINDOW', 3),
      sameFormatRepetitionRisk: this.number(config, 'HYBRID_SAME_FORMAT_REPETITION_RISK', 0.3),
      sameRepresentationRisk: this.number(config, 'HYBRID_SAME_REPRESENTATION_RISK', 0.4),
      progressDerivativeWeight: this.number(config, 'HYBRID_PROGRESS_DERIVATIVE_WEIGHT', 0.4),
      performanceIntegralWeight: this.number(config, 'HYBRID_PERFORMANCE_INTEGRAL_WEIGHT', 0.25),
      dominanceNormalizationWeight: this.number(config, 'HYBRID_DOMINANCE_NORMALIZATION_WEIGHT', 0.5),
      weights: {
        learning: this.number(config, 'HYBRID_WEIGHT_LEARNING', 1),
        challenge: this.number(config, 'HYBRID_WEIGHT_CHALLENGE', 1),
        interaction: this.number(config, 'HYBRID_WEIGHT_INTERACTION', 1),
        semantic: this.number(config, 'HYBRID_WEIGHT_SEMANTIC', 1),
        novelty: this.number(config, 'HYBRID_WEIGHT_NOVELTY', 0.5),
        rejection: this.number(config, 'HYBRID_WEIGHT_REJECTION', 1),
        sensory: this.number(config, 'HYBRID_WEIGHT_SENSORY', 0.5),
        format: this.number(config, 'HYBRID_WEIGHT_FORMAT', 0.3),
        repetition: this.number(config, 'HYBRID_WEIGHT_REPETITION', 0.7),
        frustration: this.number(config, 'HYBRID_WEIGHT_FRUSTRATION', 0.5),
      },
      configurationVersion: config.get('HYBRID_CONFIGURATION_VERSION', 'experimental-v1'),
      rankingVersion: 'contacomigo-hybrid-ranking/2.0.0',
    };
    if (this.configuration.targetSuccessProbability < 0 || this.configuration.targetSuccessProbability > 1) {
      throw new Error('HYBRID_TARGET_SUCCESS_PROBABILITY must be between 0 and 1');
    }
    if (this.configuration.difficultyLevelWeight < 0 || this.configuration.difficultyLevelWeight > 1) {
      throw new Error('HYBRID_DIFFICULTY_LEVEL_WEIGHT must be between 0 and 1');
    }
    if (this.configuration.sameFormatRepetitionRisk < 0 || this.configuration.sameFormatRepetitionRisk > 1) {
      throw new Error('HYBRID_SAME_FORMAT_REPETITION_RISK must be between 0 and 1');
    }
    if (this.configuration.sameRepresentationRisk < 0 || this.configuration.sameRepresentationRisk > 1) {
      throw new Error('HYBRID_SAME_REPRESENTATION_RISK must be between 0 and 1');
    }
    if (this.configuration.progressDerivativeWeight < 0) {
      throw new Error('HYBRID_PROGRESS_DERIVATIVE_WEIGHT must be non-negative');
    }
    if (this.configuration.performanceIntegralWeight < 0) {
      throw new Error('HYBRID_PERFORMANCE_INTEGRAL_WEIGHT must be non-negative');
    }
    if (this.configuration.dominanceNormalizationWeight < 0) {
      throw new Error('HYBRID_DOMINANCE_NORMALIZATION_WEIGHT must be non-negative');
    }
  }

  rank(input: HybridRankingInput): HybridRankingResult {
    const recentStructures = new Set(
      (input.recentActivities ?? [])
        .map((item) => item.structureId)
        .filter((structure): structure is string => typeof structure === 'string' && structure.length > 0),
    );
    const lastRecentActivity = input.recentActivities?.[0] ?? null;
    const lastRecentStructure = lastRecentActivity?.structureId ?? null;
    const semanticDecisions = new Map(
      input.semanticTrace.candidateDecisions.map((decision) => [decision.activityId, decision]),
    );
    const maxMatches = Math.max(1, ...input.candidates.map((candidate) =>
      semanticDecisions.get(candidate.id)?.matchedConcepts.length ?? 0));

    const filteredCandidates = input.candidates.filter((candidate) => {
      const structureId = candidate.content?.semantic?.structureId ?? null;
      if (!structureId || !lastRecentStructure) return true;
      return structureId !== lastRecentStructure;
    });

    const candidates = filteredCandidates.map((candidate) => {
      const mastery = input.masteryProbability ?? 0.5;
      const learningNeed = 1 - mastery;
      const difficulty = this.difficulty(candidate);
      const predictedSuccess = this.clamp(mastery + 0.5 - difficulty);
      const challengeFit = Math.exp(
        -Math.pow(predictedSuccess - this.configuration.targetSuccessProbability, 2) /
        (2 * Math.pow(this.configuration.challengeSigma, 2)),
      );
      const interaction = this.interactionFit(candidate, input.observedEvidenceTypes);
      const semanticDecision = semanticDecisions.get(candidate.id);
      const skillWeight = candidate.skillWeights?.find((skill) =>
        skill.code === input.semanticTrace.targetSkill)?.weight ?? 1;
      const semanticFit = ((semanticDecision?.matchedConcepts.length ?? 0) / maxMatches) * skillWeight;
      const novelty = this.novelty(candidate.id, input.recentActivityIds, recentStructures);
      const rejectionRisk = this.rejectionRisk(candidate.id, input.recentlyRejectedActivityIds);
      const sensoryFit = this.sensoryFit(candidate, input.preferences);
      const formatFit = this.formatFit(candidate, input.preferences);
      const repetitionRisk = this.repetitionRisk(candidate, input.recentActivities ?? []);
      const frustrationRisk = this.frustrationRisk(difficulty, (input.recentActivities ?? []).filter((item) =>
        !input.semanticTrace.targetSkill || item.bnccSkills?.includes(input.semanticTrace.targetSkill)));
      const progressDerivative = this.progressDerivative(input.recentActivities ?? []);
      const performanceIntegral = this.performanceIntegral(input.recentActivities ?? []);
      const dominanceNormalization = this.dominanceNormalization([
        learningNeed,
        challengeFit,
        interaction.value,
        semanticFit,
        novelty,
        sensoryFit,
        formatFit,
        rejectionRisk,
        repetitionRisk,
        frustrationRisk,
        progressDerivative,
        performanceIntegral,
      ]);
      const w = this.configuration.weights;
      const positiveContributions = {
        learningNeed: w.learning * learningNeed,
        challengeFit: w.challenge * challengeFit,
        interactionFit: w.interaction * interaction.value,
        semanticFit: w.semantic * semanticFit,
        novelty: w.novelty * novelty,
        sensoryFit: w.sensory * sensoryFit,
        formatFit: w.format * formatFit,
        progressDerivative: this.configuration.progressDerivativeWeight * progressDerivative,
        performanceIntegral: this.configuration.performanceIntegralWeight * performanceIntegral,
      };
      const penalties = {
        rejectionRisk: w.rejection * rejectionRisk,
        repetitionRisk: w.repetition * repetitionRisk,
        frustrationRisk: w.frustration * frustrationRisk,
        dominanceNormalization: this.configuration.dominanceNormalizationWeight * dominanceNormalization,
      };
      const rawScore = Object.values(positiveContributions).reduce((sum, value) => sum + value, 0)
        - Object.values(penalties).reduce((sum, value) => sum + value, 0);
      const finalScore = rawScore / (1 + dominanceNormalization);
      return {
        activityId: candidate.id,
        bnccSkills: candidate.bnccSkills ?? [],
        difficulty: candidate.difficulty,
        activityType: candidate.type,
        structureId: candidate.content?.semantic?.structureId ?? null,
        learningNeed,
        challengeFit,
        interactionFit: interaction.value,
        semanticFit,
        novelty,
        rejectionRisk,
        sensoryFit,
        formatFit,
        repetitionRisk,
        frustrationRisk,
        progressDerivative,
        performanceIntegral,
        dominanceNormalization,
        finalScore,
        predictedSuccess,
        insufficientEvidence: interaction.insufficientEvidence,
        explanation: {
          semanticValidityReasons: semanticDecision?.reasons ?? [],
          positiveContributions,
          penalties,
        },
      };
    }).sort((a, b) => b.finalScore - a.finalScore || a.activityId.localeCompare(b.activityId));

    return {
      selectedActivityId: candidates[0]?.activityId ?? null,
      candidateIds: candidates.map((candidate) => candidate.activityId),
      candidates,
      weights: this.configuration.weights,
      configurationVersion: this.configuration.configurationVersion,
      rankingVersion: this.configuration.rankingVersion,
      ontologyVersion: input.semanticTrace.ontologyVersion,
      decisionSource: candidates.length ? 'HYBRID_RANKING' : 'LEGACY_FALLBACK',
      fallbackUsed: candidates.length === 0,
      fallbackReason: candidates.length ? null : 'No semantically valid candidate could be ranked',
      evidenceUsed: {
        masteryProbability: input.masteryProbability,
        recentAccuracy: input.semanticTrace.runtimeFactsUsed?.recentAccuracy ?? null,
        preferredModality: input.preferences?.preferredModality ?? null,
        lowStimulation: input.preferences?.lowStimulation ?? null,
        recentActivityIds: input.recentActivityIds,
        recentlyRejectedActivityIds: input.recentlyRejectedActivityIds,
        observedEvidenceTypes: input.observedEvidenceTypes,
      },
      selectionExplanation: {
        selectedActivityId: candidates[0]?.activityId ?? null,
        comparedWith: candidates.slice(1).map((candidate) => candidate.activityId),
        scoreMargin: candidates.length > 1 ? candidates[0].finalScore - candidates[1].finalScore : null,
        reason: candidates.length ?
          `Highest valid weighted score (${candidates[0].finalScore.toFixed(3)}) after curriculum, challenge, interaction, sensory, format and history evidence` :
          'No semantically valid candidate was available',
      },
    };
  }

  private difficulty(activity: Activity): number {
    const profile = activity.difficultyProfile;
    const values: number[] = [];
    if (profile?.numericalMagnitude != null) {
      values.push(this.clamp(profile.numericalMagnitude / this.configuration.maximumNumericalMagnitude));
    }
    if (profile?.stepCount != null) {
      values.push(this.clamp(profile.stepCount / this.configuration.maximumStepCount));
    }
    for (const value of [profile?.conceptualComplexity, profile?.abstractionLevel]) {
      const normalized = this.level(value);
      if (normalized != null) values.push(normalized);
    }
    const levels: Record<DifficultyLevel, number> = {
      [DifficultyLevel.VERY_EASY]: 0.1,
      [DifficultyLevel.EASY]: 0.25,
      [DifficultyLevel.MEDIUM]: 0.5,
      [DifficultyLevel.HARD]: 0.75,
      [DifficultyLevel.EXTREME]: 0.9,
    };
    const declared = levels[activity.difficulty] ?? 0.25;
    if (!values.length) return declared;
    const profileValue = values.reduce((sum, value) => sum + value, 0) / values.length;
    return this.configuration.difficultyLevelWeight * declared +
      (1 - this.configuration.difficultyLevelWeight) * profileValue;
  }

  private interactionFit(activity: Activity, evidence: string[]): {
    value: number;
    insufficientEvidence: string[];
  } {
    if (!evidence.length) return { value: 0.5, insufficientEvidence: ['interactionEvidence'] };
    const normalized = evidence.map((item) => item.toLowerCase());
    const observations: number[] = [];
    if (normalized.some((item) => item.includes('visualstrength'))) {
      observations.push(activity.representation?.includes('pictorial') ? 1 : 0.5);
    }
    if (normalized.some((item) => item.includes('auditivestrength'))) {
      observations.push(activity.affordances?.usesAudio ? 1 : 0.5);
    }
    if (normalized.some((item) => item.includes('motorweakness'))) {
      observations.push(activity.affordances?.requiresDragging ? 0 : 1);
    }
    if (!observations.length) return { value: 0.5, insufficientEvidence: ['recognizedInteractionEvidence'] };
    return { value: observations.reduce((sum, value) => sum + value, 0) / observations.length, insufficientEvidence: [] };
  }

  private novelty(activityId: string, history: string[], recentStructures: Set<string>): number {
    const index = history.indexOf(activityId);
    const base = index < 0 ? 1 : 1 - Math.exp(-index / this.configuration.noveltyWindow);
    const structurePenalty = recentStructures.size ? Math.exp(-recentStructures.size / this.configuration.noveltyWindow) : 1;
    return base * structurePenalty;
  }

  private rejectionRisk(activityId: string, history: string[]): number {
    const index = history.indexOf(activityId);
    return index < 0 ? 0 : Math.exp(-index / this.configuration.rejectionDecay);
  }

  private sensoryFit(activity: Activity, preferences?: HybridRankingInput['preferences']): number {
    if (preferences?.lowStimulation !== true) return 0.5;
    const load = String(activity.difficultyProfile?.sensoryLoad ??
      activity.accessibility?.sensoryLoad ?? '').toLowerCase();
    if (load === 'low') return 1;
    if (load === 'medium') return 0.5;
    if (load === 'high') return 0;
    return 0.5;
  }

  private formatFit(activity: Activity, preferences?: HybridRankingInput['preferences']): number {
    const preference = preferences?.preferredModality;
    if (!preference) return 0.5;
    return activity.targetModalities?.includes(preference) ? 1 : 0.25;
  }

  private repetitionRisk(activity: Activity, recent: NonNullable<HybridRankingInput['recentActivities']>): number {
    const structure = activity.content?.semantic?.structureId;
    const index = recent.findIndex((item) =>
      item.activityId === activity.id || (structure && item.structureId === structure));
    if (index >= 0) return Math.exp(-index / this.configuration.rejectionDecay);
    const sameFormat = recent[0]?.type === activity.type
      ? this.configuration.sameFormatRepetitionRisk : 0;
    const previousRepresentations = recent[0]?.representation ?? [];
    const sameRepresentation = previousRepresentations.length &&
      activity.representation?.some((item) => previousRepresentations.includes(item))
      ? this.configuration.sameRepresentationRisk : 0;
    return Math.max(sameFormat, sameRepresentation);
  }

  private frustrationRisk(difficulty: number, recent: NonNullable<HybridRankingInput['recentActivities']>): number {
    const observations = recent.slice(0, this.configuration.frustrationHistoryWindow);
    if (!observations.length) return 0;
    const slowThreshold = this.configuration.maximumResponseTimeSeconds;
    const strain = observations.filter((item) => item.isCorrect === false ||
      (item.timeSpentSeconds != null && item.timeSpentSeconds > slowThreshold)).length / observations.length;
    return strain * difficulty;
  }

  private progressDerivative(recent: NonNullable<HybridRankingInput['recentActivities']>): number {
    const values = recent
      .map((item) => item.masteryAfter)
      .filter((value): value is number => typeof value === 'number');
    if (values.length < 2) return 0;
    return this.clamp((values[0] - values[values.length - 1]) * 0.5 + 0.5);
  }

  private performanceIntegral(recent: NonNullable<HybridRankingInput['recentActivities']>): number {
    if (!recent.length) return 0;
    const correctCount = recent.filter((item) => item.isCorrect === true).length;
    return this.clamp(correctCount / recent.length);
  }

  private dominanceNormalization(features: number[]): number {
    return this.clamp(Math.max(...features) - Math.min(...features));
  }

  private level(value: unknown): number | null {
    const normalized = String(value ?? '').toUpperCase();
    if (normalized === 'LOW') return 0.2;
    if (normalized === 'LOW_TO_MEDIUM') return 0.35;
    if (normalized === 'MEDIUM') return 0.5;
    if (normalized === 'HIGH') return 0.8;
    return null;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private number(config: ConfigService, key: string, fallback: number): number {
    const value = Number(config.get<string | number>(key, fallback));
    if (!Number.isFinite(value)) throw new Error(`${key} must be numeric`);
    return value;
  }

  private positive(config: ConfigService, key: string, fallback: number): number {
    const value = this.number(config, key, fallback);
    if (value <= 0) throw new Error(`${key} must be greater than zero`);
    return value;
  }
}
