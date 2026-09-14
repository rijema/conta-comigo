import type {
  ActivityAffordance,
  ActivityDifficultyProfile,
  InteractionType,
  Representation,
  SemanticActivityType,
} from '../activities/activity-semantic-contract';

export interface RuntimeActivityFact {
  activityId: string;
  activityType: SemanticActivityType;
  bnccSkills: string[];
  mathematicalConcepts: string[];
  representations: Representation[];
  interactionTypes: InteractionType[];
  difficultyProfile: ActivityDifficultyProfile;
  affordances: ActivityAffordance;
  mappingStatus: 'MAPPED' | 'PARTIAL' | 'NEEDS_REVIEW' | 'UNMAPPED';
}

export interface RuntimeSemanticFacts {
  studentId: string;
  targetSkill: string;
  mastery: {
    source: 'StudentSkillState';
    probability: number | null;
  };
  learningAnalytics: {
    recentAccuracy: number | null;
  };
  observedEvidenceTypes: string[];
  hardConstraints: {
    disallowDragging: boolean;
    requireAudio: boolean;
  };
  activities: RuntimeActivityFact[];
}

export interface CandidateDecisionTrace {
  activityId: string;
  included: boolean;
  reasons: string[];
  matchedConcepts: string[];
}

export interface SemanticFilteringTrace {
  targetSkill: string;
  runtimeFactsUsed: {
    studentId: string;
    masterySource: 'StudentSkillState';
    masteryProbability: number | null;
    recentAccuracy: number | null;
    observedEvidenceTypes: string[];
    hardConstraints: RuntimeSemanticFacts['hardConstraints'];
  };
  candidateActivities: string[];
  validCandidateIds: string[];
  excludedCandidateIds: string[];
  candidateDecisions: CandidateDecisionTrace[];
  semanticRelations: Array<{
    subject: string;
    predicate: string;
    object: string;
  }>;
  ontologyVersion: string;
  reasonerVersion: string;
  fallbackUsed: boolean;
  fallbackReason: string | null;
}

export interface SemanticCandidateResult {
  validCandidateIds: string[];
  excludedCandidateIds: string[];
  trace: SemanticFilteringTrace;
}
