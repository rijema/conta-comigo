import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../activities/entities/activity.entity';
import { SemanticFilteringTrace } from '../ontology/semantic-runtime.types';

export interface HybridCandidateScore {
  activityId: string;
  learningNeed: number;
  challengeFit: number;
  interactionFit: number;
  semanticFit: number;
  novelty: number;
  rejectionRisk: number;
  finalScore: number;
  predictedSuccess: number;
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
  selectionExplanation: {
    selectedActivityId: string | null;
    comparedWith: string[];
    scoreMargin: number | null;
  };
}

interface HybridRankingConfiguration {
  targetSuccessProbability: number;
  challengeSigma: number;
  noveltyWindow: number;
  rejectionDecay: number;
  maximumNumericalMagnitude: number;
  maximumStepCount: number;
  weights: {
    learning: number;
    challenge: number;
    interaction: number;
    semantic: number;
    novelty: number;
    rejection: number;
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
      weights: {
        learning: this.number(config, 'HYBRID_WEIGHT_LEARNING', 1),
        challenge: this.number(config, 'HYBRID_WEIGHT_CHALLENGE', 1),
        interaction: this.number(config, 'HYBRID_WEIGHT_INTERACTION', 1),
        semantic: this.number(config, 'HYBRID_WEIGHT_SEMANTIC', 1),
        novelty: this.number(config, 'HYBRID_WEIGHT_NOVELTY', 0.5),
        rejection: this.number(config, 'HYBRID_WEIGHT_REJECTION', 1),
      },
      configurationVersion: config.get('HYBRID_CONFIGURATION_VERSION', 'experimental-v1'),
      rankingVersion: 'contacomigo-hybrid-ranking/1.0.0',
    };
    if (this.configuration.targetSuccessProbability < 0 || this.configuration.targetSuccessProbability > 1) {
      throw new Error('HYBRID_TARGET_SUCCESS_PROBABILITY must be between 0 and 1');
    }
  }

  rank(input: HybridRankingInput): HybridRankingResult {
    const semanticDecisions = new Map(
      input.semanticTrace.candidateDecisions.map((decision) => [decision.activityId, decision]),
    );
    const maxMatches = Math.max(1, ...input.candidates.map((candidate) =>
      semanticDecisions.get(candidate.id)?.matchedConcepts.length ?? 0));

    const candidates = input.candidates.map((candidate) => {
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
      const semanticFit = (semanticDecision?.matchedConcepts.length ?? 0) / maxMatches;
      const novelty = this.novelty(candidate.id, input.recentActivityIds);
      const rejectionRisk = this.rejectionRisk(candidate.id, input.recentlyRejectedActivityIds);
      const w = this.configuration.weights;
      const positiveContributions = {
        learningNeed: w.learning * learningNeed,
        challengeFit: w.challenge * challengeFit,
        interactionFit: w.interaction * interaction.value,
        semanticFit: w.semantic * semanticFit,
        novelty: w.novelty * novelty,
      };
      const penalties = { rejectionRisk: w.rejection * rejectionRisk };
      const finalScore = Object.values(positiveContributions).reduce((sum, value) => sum + value, 0)
        - penalties.rejectionRisk;
      return {
        activityId: candidate.id,
        learningNeed,
        challengeFit,
        interactionFit: interaction.value,
        semanticFit,
        novelty,
        rejectionRisk,
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
      selectionExplanation: {
        selectedActivityId: candidates[0]?.activityId ?? null,
        comparedWith: candidates.slice(1).map((candidate) => candidate.activityId),
        scoreMargin: candidates.length > 1 ? candidates[0].finalScore - candidates[1].finalScore : null,
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
    if (values.length) return values.reduce((sum, value) => sum + value, 0) / values.length;
    return activity.difficulty === DifficultyLevel.HARD ? 0.8
      : activity.difficulty === DifficultyLevel.MEDIUM ? 0.5 : 0.2;
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

  private novelty(activityId: string, history: string[]): number {
    const index = history.indexOf(activityId);
    return index < 0 ? 1 : 1 - Math.exp(-index / this.configuration.noveltyWindow);
  }

  private rejectionRisk(activityId: string, history: string[]): number {
    const index = history.indexOf(activityId);
    return index < 0 ? 0 : Math.exp(-index / this.configuration.rejectionDecay);
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
