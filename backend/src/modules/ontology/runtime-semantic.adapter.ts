import { Injectable } from '@nestjs/common';
import { Activity } from '../activities/entities/activity.entity';
import { RuntimeSemanticFacts } from './semantic-runtime.types';

export interface RuntimeMaterializationInput {
  studentId: string;
  targetSkill: string;
  activities: Activity[];
  masteryProbability?: number | null;
  recentAccuracy?: number | null;
  observedLearnerEvidence?: Record<string, unknown> | null;
  hardConstraints?: Partial<RuntimeSemanticFacts['hardConstraints']>;
  masteryBySkillCode?: Record<string, number>;
}

@Injectable()
export class RuntimeSemanticAdapter {
  materialize(input: RuntimeMaterializationInput): RuntimeSemanticFacts {
    return {
      studentId: input.studentId,
      targetSkill: input.targetSkill,
      mastery: {
        source: 'StudentSkillState',
        probability: this.optionalProbability(input.masteryProbability),
      },
      masteryBySkillCode: input.masteryBySkillCode,
      learningAnalytics: {
        recentAccuracy: this.optionalProbability(input.recentAccuracy),
      },
      observedEvidenceTypes: Object.entries(input.observedLearnerEvidence ?? {})
        .filter(([, value]) => value === true)
        .map(([key]) => key)
        .sort(),
      hardConstraints: {
        disallowDragging: input.hardConstraints?.disallowDragging === true,
        requireAudio: input.hardConstraints?.requireAudio === true,
      },
      activities: input.activities.map((activity) => ({
        activityId: activity.id,
        activityType: activity.activityType ?? 'unmapped',
        bnccSkills: activity.bnccSkills ?? [],
        prerequisiteSkillCode: activity.prerequisiteSkillCode,
        mathematicalConcepts: activity.mathematicalConcepts ?? [],
        representations: activity.representation ?? [],
        interactionTypes: activity.interactionType ?? [],
        difficultyProfile: activity.difficultyProfile ?? {
          conceptualComplexity: null,
          numericalMagnitude: null,
          abstractionLevel: null,
          stepCount: null,
          distractorSimilarity: null,
          languageLoad: null,
          motorDemand: null,
          sensoryLoad: null,
          scaffoldingLevel: null,
          annotationProvenance: 'UNANNOTATED',
          unannotatedDimensions: [],
        },
        affordances: activity.affordances ?? {
          requiresDragging: false,
          requiresReading: false,
          usesAudio: false,
          usesPictograms: false,
        },
        mappingStatus: activity.semanticAnnotation?.conceptMappingStatus ?? 'UNMAPPED',
      })),
    };
  }

  private optionalProbability(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
