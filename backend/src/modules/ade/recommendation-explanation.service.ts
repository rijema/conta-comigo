import { Injectable } from '@nestjs/common';
import { AdeDecision } from './entities/ade-decision.entity';

export interface RecommendationOutcome {
  selectedActivityId?: string | null;
  selectedActivityType?: string | null;
  completed?: boolean | null;
  correct?: boolean | null;
}

export interface RecommendationLearnerState {
  masteryProbability?: number | null;
  recentAccuracy?: number | null;
  recentActivityHistory?: string[];
  supportConsiderations?: string[];
}

export interface RecommendationSemanticTrace {
  candidateRanking?: unknown[];
  candidateTrace?: unknown[];
  exclusionTrace?: unknown[];
  semanticInferences?: string[];
  weights?: Record<string, number>;
  ontologyVersion?: string;
  rankingVersion?: string;
  reasonerVersion?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
  challengeFit?: number;
  interactionFit?: number;
  semanticFit?: number;
  novelty?: number;
  rejectionRisk?: number;
  sensoryFit?: number;
  formatFit?: number;
  repetitionRisk?: number;
  frustrationRisk?: number;
  finalScore?: number;
}

export interface RecommendationExplanationInput {
  decision: AdeDecision;
  outcome?: RecommendationOutcome;
  learnerState?: RecommendationLearnerState;
  semanticTrace?: RecommendationSemanticTrace;
}

export interface TraceValue<T> {
  status: 'recorded' | 'not_recorded';
  value: T | null;
}

export interface ProfessionalRecommendationExplanation {
  summary: string;
  bnccSkill: string | null;
  estimatedMastery: string;
  learningNeed: string;
  interactionEvidence: string[];
  supportConsiderations: string[];
  recentActivityHistory: string[];
  activityFormatReason: string;
  details: {
    recommendedDifficulty: string;
    recommendedModality: string;
    recommendedActivityType: string | null;
  };
}

export interface ResearchRecommendationExplanation {
  recommendationId: string;
  targetBnccSkill: string | null;
  studentSkillState: TraceValue<{ masteryProbability: number }>;
  learningNeed: string;
  challengeFit: TraceValue<number>;
  interactionFit: TraceValue<number>;
  semanticFit: TraceValue<number>;
  novelty: TraceValue<number>;
  rejectionRisk: TraceValue<number>;
  sensoryFit: TraceValue<number>;
  formatFit: TraceValue<number>;
  repetitionRisk: TraceValue<number>;
  frustrationRisk: TraceValue<number>;
  selectionStrategy: TraceValue<unknown>;
  rankingEvidence: TraceValue<unknown>;
  finalScore: TraceValue<number>;
  candidateRanking: TraceValue<unknown[]>;
  ontologyCandidateTrace: TraceValue<unknown[]>;
  ontologyExclusionTrace: TraceValue<unknown[]>;
  semanticInferences: TraceValue<string[]>;
  evidenceUsed: Record<string, number | boolean | null>;
  weights: TraceValue<Record<string, number>>;
  ontologyVersion: TraceValue<string>;
  rankingVersion: TraceValue<string>;
  reasonerVersion: TraceValue<string>;
  semanticFilteringFallback: TraceValue<{
    used: boolean;
    reason: string | null;
  }>;
  recommendationOutcome: TraceValue<RecommendationOutcome>;
}

export interface RecommendationExplanations {
  childExplanation: string;
  guardianExplanation: string;
  professionalExplanation: ProfessionalRecommendationExplanation;
  researchExplanation: ResearchRecommendationExplanation;
}

@Injectable()
export class RecommendationExplanationService {
  explain(input: RecommendationExplanationInput): RecommendationExplanations {
    const { decision } = input;
    const mastery = this.resolveMastery(input);
    const skill = decision.recommendedBnccSkill || null;
    const learningNeed = skill
      ? `continuar desenvolvendo a habilidade ${skill}`
      : 'continuar desenvolvendo a habilidade matemática em foco';
    const formatReason = this.describeFormat(decision.recommendedModality);
    const supportConsiderations = this.resolveSupportConsiderations(input);
    const interactionEvidence = this.resolveInteractionEvidence(input);
    const recentActivityHistory = input.learnerState?.recentActivityHistory?.length
      ? input.learnerState.recentActivityHistory
      : ['Nenhum histórico recente foi fornecido ao explicador.'];

    return {
      childExplanation: this.childExplanation(decision),
      guardianExplanation:
        `O ContaComigo escolheu esta atividade para ${learningNeed} ` +
        `e porque ${formatReason}.`,
      professionalExplanation: {
        summary:
          `A atividade foi selecionada para ${learningNeed}. ` +
          `${this.describeMasteryForProfessional(mastery)} ${this.capitalize(formatReason)}.`,
        bnccSkill: skill,
        estimatedMastery: this.describeMasteryForProfessional(mastery),
        learningNeed,
        interactionEvidence,
        supportConsiderations,
        recentActivityHistory,
        activityFormatReason: this.capitalize(formatReason),
        details: {
          recommendedDifficulty: decision.recommendedDifficulty,
          recommendedModality: decision.recommendedModality,
          recommendedActivityType: decision.recommendedActivityType || null,
        },
      },
      researchExplanation: this.buildResearchExplanation(
        input,
        mastery,
        learningNeed,
      ),
    };
  }

  toChildDecision(decision: AdeDecision, outcome?: RecommendationOutcome) {
    const explanation = this.explain({ decision, outcome });
    return {
      id: decision.id,
      createdAt: decision.createdAt,
      recommendedDifficulty: decision.recommendedDifficulty,
      recommendedModality: decision.recommendedModality,
      recommendedActivityType: decision.recommendedActivityType,
      recommendedBnccSkill: decision.recommendedBnccSkill,
      childExplanation: explanation.childExplanation,
    };
  }

  toGuardianDecision(decision: AdeDecision) {
    const explanation = this.explain({ decision });
    return {
      id: decision.id,
      createdAt: decision.createdAt,
      recommendedDifficulty: decision.recommendedDifficulty,
      recommendedModality: decision.recommendedModality,
      recommendedActivityType: decision.recommendedActivityType,
      recommendedBnccSkill: decision.recommendedBnccSkill,
      guardianExplanation: explanation.guardianExplanation,
    };
  }

  toProfessionalDecision(
    decision: AdeDecision,
    learnerState?: RecommendationLearnerState,
  ) {
    const explanation = this.explain({ decision, learnerState });
    return {
      id: decision.id,
      createdAt: decision.createdAt,
      recommendedDifficulty: decision.recommendedDifficulty,
      recommendedModality: decision.recommendedModality,
      recommendedActivityType: decision.recommendedActivityType,
      recommendedBnccSkill: decision.recommendedBnccSkill,
      professionalExplanation: explanation.professionalExplanation,
    };
  }

  private childExplanation(decision: AdeDecision): string {
    if (decision.recommendedActivityType) {
      return 'Vamos tentar uma atividade diferente!';
    }
    return 'Vamos continuar treinando juntos!';
  }

  private resolveMastery(input: RecommendationExplanationInput): number | null {
    const supplied = input.learnerState?.masteryProbability;
    if (typeof supplied === 'number') return supplied;
    const persisted = input.decision.xaiLog?.mlPredictions?.masteryProbability;
    if (typeof persisted === 'number') return persisted;
    const snapshot = input.decision.inputSnapshot?.currentMastery;
    return typeof snapshot === 'number' ? snapshot : null;
  }

  private describeMasteryForProfessional(mastery: number | null): string {
    if (mastery === null) return 'A estimativa de domínio não foi registrada nesta decisão.';
    return `A estimativa de domínio registrada é de ${Math.round(mastery * 100)}%.`;
  }

  private describeFormat(modality: string): string {
    const descriptions: Record<string, string> = {
      visual: 'o formato visual oferece apoio à compreensão',
      auditive: 'o formato com apoio auditivo oferece outra forma de acesso',
      text: 'o formato textual é compatível com a interação selecionada',
      mixed: 'o formato combina diferentes formas de interação',
    };
    return descriptions[modality] ?? 'o formato oferece uma alternativa de interação';
  }

  private resolveSupportConsiderations(
    input: RecommendationExplanationInput,
  ): string[] {
    if (input.learnerState?.supportConsiderations) {
      return input.learnerState.supportConsiderations;
    }
    const considerations: string[] = [];
    if (input.decision.inputSnapshot?.shouldReduceStimulation === true) {
      considerations.push('Reduzir estímulos durante a atividade.');
    }
    if (input.decision.inputSnapshot?.shouldAddBreak === true) {
      considerations.push('Considerar uma pausa entre atividades.');
    }
    return considerations.length > 0
      ? considerations
      : ['Nenhuma consideração adicional de apoio foi registrada nesta decisão.'];
  }

  private resolveInteractionEvidence(
    input: RecommendationExplanationInput,
  ): string[] {
    const evidence: string[] = [];
    const accuracy = input.learnerState?.recentAccuracy ??
      input.decision.inputSnapshot?.recentAccuracy;
    if (typeof accuracy === 'number') {
      evidence.push(`Precisão recente agregada: ${Math.round(accuracy * 100)}%.`);
    }
    if (input.decision.xaiLog?.rulesFired?.length) {
      evidence.push(
        `${input.decision.xaiLog.rulesFired.length} regra(s) pedagógica(s) contribuíram para a decisão.`,
      );
    }
    return evidence.length > 0
      ? evidence
      : ['Nenhuma evidência agregada adicional foi registrada nesta decisão.'];
  }

  private buildResearchExplanation(
    input: RecommendationExplanationInput,
    mastery: number | null,
    learningNeed: string,
  ): ResearchRecommendationExplanation {
    const trace = input.semanticTrace ?? this.persistedSemanticTrace(input.decision);
    const decision = input.decision;
    const semanticInferences = trace.semanticInferences ??
      decision.xaiLog?.ontologyInferences;
    const accuracy = input.learnerState?.recentAccuracy ??
      decision.inputSnapshot?.recentAccuracy;

    return {
      recommendationId: decision.id,
      targetBnccSkill: decision.recommendedBnccSkill || null,
      studentSkillState: mastery === null
        ? this.notRecorded()
        : this.recorded({ masteryProbability: mastery }),
      learningNeed,
      challengeFit: this.optionalMetric(trace.challengeFit),
      interactionFit: this.optionalMetric(trace.interactionFit),
      semanticFit: this.optionalMetric(trace.semanticFit),
      novelty: this.optionalMetric(trace.novelty),
      rejectionRisk: this.optionalMetric(trace.rejectionRisk),
      sensoryFit: this.optionalMetric(trace.sensoryFit),
      formatFit: this.optionalMetric(trace.formatFit),
      repetitionRisk: this.optionalMetric(trace.repetitionRisk),
      frustrationRisk: this.optionalMetric(trace.frustrationRisk),
      selectionStrategy: this.optionalValue(decision.hybridRanking?.selectionStrategy ??
        decision.inputSnapshot?.selectionStrategy),
      rankingEvidence: this.optionalValue(decision.hybridRanking?.evidenceUsed),
      finalScore: this.optionalMetric(trace.finalScore),
      candidateRanking: this.optionalValue(trace.candidateRanking),
      ontologyCandidateTrace: this.optionalValue(trace.candidateTrace),
      ontologyExclusionTrace: this.optionalValue(trace.exclusionTrace),
      semanticInferences: this.optionalValue(semanticInferences),
      evidenceUsed: {
        masteryProbability: mastery,
        recentAccuracy: typeof accuracy === 'number' ? accuracy : null,
        shouldReduceStimulation:
          decision.inputSnapshot?.shouldReduceStimulation === true,
        shouldAddBreak: decision.inputSnapshot?.shouldAddBreak === true,
      },
      weights: this.optionalValue(trace.weights),
      ontologyVersion: this.optionalValue(trace.ontologyVersion),
      rankingVersion: this.optionalValue(trace.rankingVersion),
      reasonerVersion: this.optionalValue(trace.reasonerVersion),
      semanticFilteringFallback: typeof trace.fallbackUsed === 'boolean'
        ? this.recorded({
            used: trace.fallbackUsed,
            reason: trace.fallbackReason ?? null,
          })
        : this.notRecorded(),
      recommendationOutcome: input.outcome
        ? this.recorded(input.outcome)
        : decision.selectedActivityId
          ? this.recorded({ selectedActivityId: decision.selectedActivityId })
        : this.notRecorded(),
    };
  }

  private optionalMetric(value: number | undefined): TraceValue<number> {
    return typeof value === 'number' ? this.recorded(value) : this.notRecorded();
  }

  private persistedSemanticTrace(decision: AdeDecision): RecommendationSemanticTrace {
    const trace = decision.xaiLog?.semanticFiltering;
    const ranking = decision.hybridRanking;
    const selected = ranking?.candidates.find(
      (candidate) => candidate.activityId === ranking.selectedActivityId,
    );
    if (!trace && !ranking) return {};
    return {
      candidateRanking: ranking?.candidates,
      candidateTrace: trace?.candidateDecisions,
      exclusionTrace: trace?.candidateDecisions.filter((candidate) => !candidate.included),
      semanticInferences: trace?.semanticRelations.map((relation) =>
        `${relation.subject} ${relation.predicate} ${relation.object}`,
      ),
      weights: ranking?.weights,
      ontologyVersion: ranking?.ontologyVersion ?? trace?.ontologyVersion,
      rankingVersion: ranking?.rankingVersion,
      reasonerVersion: trace?.reasonerVersion,
      fallbackUsed: ranking?.fallbackUsed ?? trace?.fallbackUsed,
      fallbackReason: ranking?.fallbackReason ?? trace?.fallbackReason,
      challengeFit: selected?.challengeFit,
      interactionFit: selected?.interactionFit,
      semanticFit: selected?.semanticFit,
      novelty: selected?.novelty,
      rejectionRisk: selected?.rejectionRisk,
      sensoryFit: selected?.sensoryFit,
      formatFit: selected?.formatFit,
      repetitionRisk: selected?.repetitionRisk,
      frustrationRisk: selected?.frustrationRisk,
      finalScore: selected?.finalScore,
    };
  }

  private optionalValue<T>(value: T | undefined): TraceValue<T> {
    return value === undefined ? this.notRecorded() : this.recorded(value);
  }

  private recorded<T>(value: T): TraceValue<T> {
    return { status: 'recorded', value };
  }

  private notRecorded<T>(): TraceValue<T> {
    return { status: 'not_recorded', value: null };
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
