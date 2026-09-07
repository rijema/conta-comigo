export type SemanticActivityType =
  | 'counting'
  | 'multiple_choice'
  | 'quiz'
  | 'drag_drop'
  | 'number_line'
  | 'composition_decomposition'
  | 'missing_number'
  | 'pattern_completion'
  | 'representation_matching'
  | 'error_detection'
  | 'contextual_problem_solving'
  | 'unmapped';

export type Representation =
  | 'pictorial'
  | 'symbolic'
  | 'textual'
  | 'number_line'
  | 'contextual'
  | 'object_based';

export type InteractionType =
  | 'repeated_selection'
  | 'option_selection'
  | 'drag_and_drop'
  | 'alternative_placement'
  | 'range_selection'
  | 'composition_building'
  | 'missing_value_entry'
  | 'pattern_completion'
  | 'representation_matching'
  | 'error_evaluation'
  | 'contextual_response'
  | 'unmapped';

export type AnnotationValue = string | number | null;

export interface ActivityDifficultyProfile {
  conceptualComplexity: AnnotationValue;
  numericalMagnitude: number | null;
  abstractionLevel: AnnotationValue;
  stepCount: number | null;
  distractorSimilarity: AnnotationValue;
  languageLoad: AnnotationValue;
  motorDemand: AnnotationValue;
  sensoryLoad: AnnotationValue;
  scaffoldingLevel: AnnotationValue;
  annotationProvenance:
    | 'EXPLICIT_ACTIVITY_METADATA'
    | 'DEVELOPER_INSPECTION'
    | 'UNANNOTATED';
  unannotatedDimensions: string[];
}

export interface ActivityAffordance {
  requiresDragging: boolean;
  requiresReading: boolean;
  usesAudio: boolean;
  usesPictograms: boolean;
}

export interface ChildCommunicationSupport {
  textLabel: string;
  pictogram: string | null;
  spokenExplanationText: string;
  nonReaderAlternatives: Array<'audio' | 'pictogram' | 'symbolic'>;
}

export interface ActivitySemanticContract {
  activityType: SemanticActivityType;
  bnccSkillId: string | null;
  mathematicalConcepts: string[];
  representation: Representation[];
  interactionType: InteractionType[];
  difficultyProfile: ActivityDifficultyProfile;
  affordances: ActivityAffordance;
  communication: ChildCommunicationSupport;
  scaffoldingOptions: Record<string, unknown> | null;
  semanticAnnotation: {
    source: 'CURRENT_ACTIVITY_CONTENT_AND_REPOSITORY_ONTOLOGY';
    conceptMappingStatus: 'MAPPED' | 'PARTIAL' | 'NEEDS_REVIEW' | 'UNMAPPED';
  };
}

export interface ActivitySemanticSource {
  title?: string | null;
  type?: string | null;
  bnccSkills?: string[] | null;
  content?: Record<string, unknown> | null;
  accessibility?: {
    hasAudio?: boolean;
    sensoryLoad?: string;
  } | null;
}

interface FamilyProfile {
  representations: Representation[];
  interactions: InteractionType[];
  difficulty: Omit<
    ActivityDifficultyProfile,
    'numericalMagnitude' | 'stepCount' | 'sensoryLoad' | 'unannotatedDimensions'
  >;
}

function contentDependentDifficulty(
  motorDemand: string,
): FamilyProfile['difficulty'] {
  return {
    conceptualComplexity: 'CONTENT_DEPENDENT',
    abstractionLevel: 'CONTENT_DEPENDENT',
    distractorSimilarity: 'CONTENT_DEPENDENT',
    languageLoad: 'CONTENT_DEPENDENT',
    motorDemand,
    scaffoldingLevel: 'CONTENT_DEPENDENT',
    annotationProvenance: 'DEVELOPER_INSPECTION',
  };
}

// These values mirror the developer-inspected family profiles already recorded in
// ontology/contacomigo/contacomigo.owl. They are not clinical classifications.
const FAMILY_PROFILES: Record<SemanticActivityType, FamilyProfile> = {
  counting: {
    representations: ['pictorial', 'symbolic'],
    interactions: ['repeated_selection', 'option_selection'],
    difficulty: {
      conceptualComplexity: 'CONTENT_DEPENDENT',
      abstractionLevel: 'LOW_TO_MEDIUM',
      distractorSimilarity: 'CONTENT_DEPENDENT',
      languageLoad: 'LOW_TO_MEDIUM',
      motorDemand: 'LOW',
      scaffoldingLevel: 'MEDIUM',
      annotationProvenance: 'DEVELOPER_INSPECTION',
    },
  },
  multiple_choice: {
    representations: ['textual', 'pictorial', 'symbolic'],
    interactions: ['option_selection'],
    difficulty: {
      conceptualComplexity: 'CONTENT_DEPENDENT',
      abstractionLevel: 'CONTENT_DEPENDENT',
      distractorSimilarity: 'CONTENT_DEPENDENT',
      languageLoad: 'CONTENT_DEPENDENT',
      motorDemand: 'LOW',
      scaffoldingLevel: 'CONTENT_DEPENDENT',
      annotationProvenance: 'DEVELOPER_INSPECTION',
    },
  },
  quiz: {
    representations: ['textual', 'pictorial', 'symbolic'],
    interactions: ['option_selection'],
    difficulty: {
      conceptualComplexity: 'CONTENT_DEPENDENT',
      abstractionLevel: 'CONTENT_DEPENDENT',
      distractorSimilarity: 'CONTENT_DEPENDENT',
      languageLoad: 'MEDIUM',
      motorDemand: 'LOW',
      scaffoldingLevel: 'LOW',
      annotationProvenance: 'DEVELOPER_INSPECTION',
    },
  },
  drag_drop: {
    representations: ['pictorial', 'symbolic'],
    interactions: ['drag_and_drop', 'alternative_placement'],
    difficulty: {
      conceptualComplexity: 'CONTENT_DEPENDENT',
      abstractionLevel: 'LOW_TO_MEDIUM',
      distractorSimilarity: 'CONTENT_DEPENDENT',
      languageLoad: 'LOW_TO_MEDIUM',
      motorDemand: 'MEDIUM_WITH_LOW_MOTOR_ALTERNATIVE',
      scaffoldingLevel: 'MEDIUM',
      annotationProvenance: 'DEVELOPER_INSPECTION',
    },
  },
  number_line: {
    representations: ['number_line', 'symbolic'],
    interactions: ['range_selection'],
    difficulty: {
      conceptualComplexity: 'CONTENT_DEPENDENT',
      abstractionLevel: 'MEDIUM',
      distractorSimilarity: 'NOT_APPLICABLE',
      languageLoad: 'LOW',
      motorDemand: 'MEDIUM_WITH_KEYBOARD_ALTERNATIVE',
      scaffoldingLevel: 'MEDIUM',
      annotationProvenance: 'DEVELOPER_INSPECTION',
    },
  },
  composition_decomposition: {
    representations: ['object_based', 'pictorial', 'symbolic'],
    interactions: ['composition_building'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  missing_number: {
    representations: ['symbolic', 'pictorial', 'object_based'],
    interactions: ['missing_value_entry'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  pattern_completion: {
    representations: ['pictorial', 'symbolic', 'object_based'],
    interactions: ['pattern_completion'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  representation_matching: {
    representations: ['pictorial', 'symbolic', 'object_based'],
    interactions: ['representation_matching'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  error_detection: {
    representations: ['contextual', 'symbolic', 'pictorial'],
    interactions: ['error_evaluation'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  contextual_problem_solving: {
    representations: ['contextual', 'object_based', 'pictorial', 'symbolic'],
    interactions: ['contextual_response'],
    difficulty: contentDependentDifficulty('LOW'),
  },
  unmapped: {
    representations: [],
    interactions: ['unmapped'],
    difficulty: {
      conceptualComplexity: null,
      abstractionLevel: null,
      distractorSimilarity: null,
      languageLoad: null,
      motorDemand: null,
      scaffoldingLevel: null,
      annotationProvenance: 'UNANNOTATED',
    },
  },
};

// Reuses only mappings already documented in Batch 02D. A BNCC claim describes
// curriculum intent; it does not prove that a concrete activity is correctly tagged.
const BNCC_CONCEPT_MAPPINGS: Record<string, string[]> = {
  EF01MA01: ['NumberConcept'],
  EF01MA03: ['CountingConcept', 'ComparisonConcept'],
  EF01MA06: ['AdditionConcept', 'EarlyProblemSolvingConcept'],
  EF01MA07: ['NumberConcept', 'AdditionConcept'],
  EF01MA08: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF01MA14: ['BasicGeometryConcept', 'SquareConcept', 'RectangleConcept'],
};

const NEEDS_REVIEW_CODES = new Set(['EF01MA03', 'EF01MA07']);
const PARTIAL_CODES = new Set(['EF01MA01', 'EF01MA06', 'EF01MA14']);

function normalizeActivityType(source: ActivitySemanticSource): SemanticActivityType {
  const type = String(source.type ?? '');
  if (
    type === 'counting' ||
    type === 'multiple_choice' ||
    type === 'quiz' ||
    type === 'drag_drop' ||
    type === 'number_line' ||
    type === 'composition_decomposition' ||
    type === 'missing_number' ||
    type === 'pattern_completion' ||
    type === 'representation_matching' ||
    type === 'error_detection' ||
    type === 'contextual_problem_solving'
  ) {
    return type;
  }
  return 'unmapped';
}

function serializedContent(source: ActivitySemanticSource): string {
  return JSON.stringify(source.content ?? {});
}

function firstPictogram(value: string): string | null {
  return value.match(/\p{Extended_Pictographic}/u)?.[0] ?? null;
}

function hasSymbolicContent(value: string): boolean {
  return /\d|[+\-=<>]/u.test(value);
}

function explicitNumericalMagnitude(source: ActivitySemanticSource): number | null {
  const content = source.content ?? {};
  const options = Array.isArray(content.options) ? content.options : [];
  const items = Array.isArray(content.items) ? content.items : [];
  const candidateContent = JSON.stringify([
    content.instructions,
    content.instructionsPt,
    content.question,
    content.correctAnswer,
    content.targetCount,
    content.min,
    content.max,
    ...items.filter((item) => typeof item === 'string' || typeof item === 'number'),
    ...options.flatMap((option) => {
      if (!option || typeof option !== 'object') return [];
      const record = option as Record<string, unknown>;
      return [record.text, record.value];
    }),
  ]);
  const values = candidateContent.match(/-?\d+(?:[.,]\d+)?/g)?.map((item) =>
    Math.abs(Number(item.replace(',', '.'))),
  ).filter(Number.isFinite) ?? [];
  return values.length > 0 ? Math.max(...values) : null;
}

function explicitStepCount(source: ActivitySemanticSource): number | null {
  const value = source.content?.stepCount;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : null;
}

function annotationValue(
  source: Record<string, unknown> | null,
  key: string,
  fallback: AnnotationValue,
): AnnotationValue {
  const value = source?.[key];
  return value === null || typeof value === 'string' || typeof value === 'number'
    ? value
    : fallback;
}

function conceptStatus(codes: string[]): ActivitySemanticContract['semanticAnnotation']['conceptMappingStatus'] {
  if (codes.length === 0 || codes.every((code) => !BNCC_CONCEPT_MAPPINGS[code])) {
    return 'UNMAPPED';
  }
  if (codes.some((code) => NEEDS_REVIEW_CODES.has(code))) return 'NEEDS_REVIEW';
  if (codes.some((code) => PARTIAL_CODES.has(code))) return 'PARTIAL';
  return 'MAPPED';
}

function explicitConceptStatus(
  value: unknown,
): ActivitySemanticContract['semanticAnnotation']['conceptMappingStatus'] | null {
  return value === 'MAPPED' || value === 'PARTIAL' ||
    value === 'NEEDS_REVIEW' || value === 'UNMAPPED'
    ? value
    : null;
}

export function buildActivitySemanticContract(
  source: ActivitySemanticSource,
  bnccSkillId: string | null,
): ActivitySemanticContract {
  const activityType = normalizeActivityType(source);
  const family = FAMILY_PROFILES[activityType];
  const content = serializedContent(source);
  const explicitSemantic = asRecord(source.content?.semantic);
  const pictogramConceptIds = stringArray(source.content?.pictogramConceptIds) ?? [];
  const pictogram = pictogramConceptIds[0] ?? firstPictogram(content);
  const usesAudio = source.accessibility?.hasAudio === true ||
    typeof source.content?.audioUrl === 'string';
  const usesPictograms = pictogram !== null || pictogramConceptIds.length > 0;
  const label = String(
    source.content?.instructionsPt ??
    source.content?.instructions ??
    source.content?.question ??
    source.title ??
    '',
  );
  const detectedRepresentations = family.representations.filter((representation) => {
    if (representation === 'pictorial') return usesPictograms || typeof source.content?.imageUrl === 'string';
    if (representation === 'symbolic') return hasSymbolicContent(content);
    if (representation === 'textual') return label.length > 0;
    if (representation === 'contextual') return Boolean(source.content?.context);
    if (representation === 'object_based') return pictogramConceptIds.length > 0;
    return true;
  });
  const explicitRepresentations = stringArray(explicitSemantic?.representation);
  const representations = (explicitRepresentations ?? detectedRepresentations) as Representation[];
  const bnccCodes = source.bnccSkills ?? [];
  const explicitConcepts = stringArray(explicitSemantic?.mathematicalConcepts);
  const mathematicalConcepts = explicitConcepts ?? Array.from(new Set(
    bnccCodes.flatMap((code) => BNCC_CONCEPT_MAPPINGS[code] ?? []),
  ));
  const explicitDifficulty = asRecord(explicitSemantic?.difficultyProfile);
  const numericalMagnitude = typeof explicitDifficulty?.numericalMagnitude === 'number'
    ? explicitDifficulty.numericalMagnitude
    : explicitNumericalMagnitude(source);
  const stepCount = typeof explicitDifficulty?.stepCount === 'number'
    ? explicitDifficulty.stepCount
    : explicitStepCount(source);
  const sensoryLoad = annotationValue(
    explicitDifficulty,
    'sensoryLoad',
    source.accessibility?.sensoryLoad ?? null,
  );
  const requiresReading = label.length > 0 && !usesAudio;
  const explicitInteractions = stringArray(explicitSemantic?.interactionType);
  const interactionType = explicitInteractions
    ? explicitInteractions as InteractionType[]
    : activityType === 'counting'
    ? (Array.isArray(source.content?.options)
      ? ['option_selection' as const]
      : ['repeated_selection' as const])
    : family.interactions;
  const explicitAffordances = asRecord(explicitSemantic?.affordances);
  const scaffoldingOptions = asRecord(source.content?.scaffolding);

  return {
    activityType,
    bnccSkillId,
    mathematicalConcepts,
    representation: representations,
    interactionType,
    difficultyProfile: {
      conceptualComplexity: annotationValue(
        explicitDifficulty,
        'conceptualComplexity',
        family.difficulty.conceptualComplexity,
      ),
      numericalMagnitude,
      abstractionLevel: annotationValue(
        explicitDifficulty,
        'abstractionLevel',
        family.difficulty.abstractionLevel,
      ),
      stepCount,
      distractorSimilarity: annotationValue(
        explicitDifficulty,
        'distractorSimilarity',
        family.difficulty.distractorSimilarity,
      ),
      languageLoad: annotationValue(
        explicitDifficulty,
        'languageLoad',
        family.difficulty.languageLoad,
      ),
      motorDemand: annotationValue(
        explicitDifficulty,
        'motorDemand',
        family.difficulty.motorDemand,
      ),
      sensoryLoad,
      scaffoldingLevel: annotationValue(
        explicitDifficulty,
        'scaffoldingLevel',
        family.difficulty.scaffoldingLevel,
      ),
      annotationProvenance: explicitDifficulty
        ? 'EXPLICIT_ACTIVITY_METADATA'
        : family.difficulty.annotationProvenance,
      unannotatedDimensions: [
        ...(numericalMagnitude === null ? ['numericalMagnitude'] : []),
        ...(stepCount === null ? ['stepCount'] : []),
        ...(sensoryLoad === null ? ['sensoryLoad'] : []),
      ],
    },
    affordances: {
      // Drag/drop has a tap/keyboard placement alternative in the current renderer.
      requiresDragging: typeof explicitAffordances?.requiresDragging === 'boolean'
        ? explicitAffordances.requiresDragging
        : false,
      requiresReading: typeof explicitAffordances?.requiresReading === 'boolean'
        ? explicitAffordances.requiresReading
        : requiresReading,
      usesAudio: typeof explicitAffordances?.usesAudio === 'boolean'
        ? explicitAffordances.usesAudio
        : usesAudio,
      usesPictograms: typeof explicitAffordances?.usesPictograms === 'boolean'
        ? explicitAffordances.usesPictograms
        : usesPictograms,
    },
    communication: {
      textLabel: label,
      pictogram,
      // Stores speakable text only; no speech engine is enabled by this batch.
      spokenExplanationText: label,
      nonReaderAlternatives: [
        ...(usesAudio ? ['audio' as const] : []),
        ...(usesPictograms ? ['pictogram' as const] : []),
        ...(representations.includes('symbolic') ? ['symbolic' as const] : []),
      ],
    },
    scaffoldingOptions,
    semanticAnnotation: {
      source: 'CURRENT_ACTIVITY_CONTENT_AND_REPOSITORY_ONTOLOGY',
      conceptMappingStatus: explicitConceptStatus(explicitSemantic?.conceptMappingStatus) ??
        (explicitConcepts ? 'MAPPED' : conceptStatus(bnccCodes)),
    },
  };
}
