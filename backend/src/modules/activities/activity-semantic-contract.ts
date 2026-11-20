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
    source:
      | 'FORMAL_CONTACOMIGO_ONTOLOGY_AND_ACTIVITY_CONTENT'
      | 'CURRENT_ACTIVITY_CONTENT_AND_REPOSITORY_ONTOLOGY';
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
/**
 * Mirrors cc:addressesMathematicalConcept in ontology/contacomigo/contacomigo.owl
 * (kept in sync by activity-semantic-contract.spec.ts). The six original 1º ano
 * entries are unchanged; the 2º–5º ano entries came with ontology v0.5.0 and the
 * remaining 51 skills of the 1º–5º ano with v0.6.0.
 */
export const BNCC_CONCEPT_MAPPINGS: Record<string, string[]> = {
  EF01MA01: ['NumberConcept'],
  EF01MA03: ['CountingConcept', 'ComparisonConcept'],
  EF01MA06: ['AdditionConcept', 'EarlyProblemSolvingConcept'],
  EF01MA07: ['NumberConcept', 'AdditionConcept'],
  EF01MA08: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF01MA14: ['BasicGeometryConcept', 'SquareConcept', 'RectangleConcept'],
  // 2º–5º ano (ontology v0.5.0): mapped as "partial" pending professional review.
  EF02MA01: ['PlaceValueConcept', 'ComparisonConcept'],
  EF02MA03: ['ComparisonConcept', 'SubtractionConcept'],
  EF02MA04: ['PlaceValueConcept', 'AdditionConcept'],
  EF02MA05: ['AdditionConcept', 'SubtractionConcept'],
  EF02MA06: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF02MA07: ['MultiplicationConcept', 'AdditionConcept'],
  EF02MA08: ['MultiplicationConcept', 'DivisionConcept'],
  EF02MA09: ['SequencePatternConcept'],
  EF02MA11: ['SequencePatternConcept'],
  EF02MA14: ['SpatialFigureConcept'],
  EF02MA15: ['BasicGeometryConcept'],
  EF02MA18: ['TimeMeasurementConcept'],
  EF03MA01: ['PlaceValueConcept', 'ComparisonConcept'],
  EF03MA02: ['PlaceValueConcept'],
  EF03MA03: ['AdditionConcept', 'MultiplicationConcept'],
  EF03MA04: ['NumberConcept', 'AdditionConcept', 'SubtractionConcept'],
  EF03MA06: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF03MA07: ['MultiplicationConcept'],
  EF03MA08: ['DivisionConcept'],
  EF03MA09: ['DivisionConcept', 'FractionConcept'],
  EF03MA10: ['SequencePatternConcept'],
  EF03MA11: ['EqualityConcept'],
  EF03MA13: ['SpatialFigureConcept'],
  EF03MA14: ['SpatialFigureConcept'],
  EF03MA15: ['PolygonConcept'],
  EF03MA18: ['MeasurementConcept'],
  EF03MA22: ['TimeMeasurementConcept'],
  EF03MA23: ['TimeMeasurementConcept'],
  EF03MA24: ['MoneyConcept'],
  EF04MA01: ['PlaceValueConcept', 'ComparisonConcept'],
  EF04MA02: ['PlaceValueConcept'],
  EF04MA03: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF04MA06: ['MultiplicationConcept'],
  EF04MA07: ['DivisionConcept'],
  EF04MA08: ['CombinatoricsConcept'],
  EF04MA09: ['FractionConcept'],
  EF04MA10: ['DecimalNumberConcept', 'MoneyConcept'],
  EF04MA11: ['SequencePatternConcept', 'MultiplicationConcept'],
  EF04MA12: ['SequencePatternConcept', 'DivisionConcept'],
  EF04MA14: ['EqualityConcept'],
  EF04MA15: ['EqualityConcept'],
  EF04MA17: ['SpatialFigureConcept'],
  EF04MA18: ['AngleConcept'],
  EF04MA19: ['SymmetryConcept'],
  EF04MA20: ['MeasurementConcept'],
  EF04MA21: ['AreaPerimeterConcept'],
  EF04MA22: ['TimeMeasurementConcept'],
  EF04MA23: ['MeasurementConcept'],
  EF04MA25: ['MoneyConcept', 'SubtractionConcept'],
  EF04MA27: ['DataInterpretationConcept'],
  EF05MA01: ['PlaceValueConcept', 'ComparisonConcept'],
  EF05MA02: ['DecimalNumberConcept'],
  EF05MA03: ['FractionConcept', 'DivisionConcept'],
  EF05MA04: ['FractionConcept'],
  EF05MA05: ['FractionConcept', 'DecimalNumberConcept', 'ComparisonConcept'],
  EF05MA06: ['PercentageConcept'],
  EF05MA07: ['AdditionConcept', 'SubtractionConcept', 'DecimalNumberConcept'],
  EF05MA08: ['MultiplicationConcept', 'DivisionConcept', 'DecimalNumberConcept'],
  EF05MA09: ['CombinatoricsConcept'],
  EF05MA10: ['EqualityConcept'],
  EF05MA11: ['EqualityConcept'],
  EF05MA12: ['ProportionalityConcept'],
  EF05MA13: ['ProportionalityConcept'],
  EF05MA15: ['CoordinateLocationConcept'],
  EF05MA16: ['SpatialFigureConcept'],
  EF05MA17: ['PolygonConcept', 'AngleConcept'],
  EF05MA19: ['MeasurementConcept'],
  EF05MA20: ['AreaPerimeterConcept'],
  EF05MA24: ['DataInterpretationConcept'],
  // Remaining 1º–5º ano skills (ontology v0.6.0): mapped as "partial" pending
  // professional review.
  EF01MA02: ['CountingConcept'],
  EF01MA04: ['CountingConcept', 'NumberConcept'],
  EF01MA05: ['NumberConcept', 'ComparisonConcept'],
  EF01MA09: ['SequencePatternConcept', 'ComparisonConcept'],
  EF01MA10: ['SequencePatternConcept'],
  EF01MA11: ['SpatialLocationConcept'],
  EF01MA12: ['SpatialLocationConcept'],
  EF01MA13: ['SpatialFigureConcept'],
  EF01MA15: ['MeasurementConcept', 'ComparisonConcept'],
  EF01MA16: ['TimeMeasurementConcept'],
  EF01MA17: ['TimeMeasurementConcept'],
  EF01MA18: ['TimeMeasurementConcept'],
  EF01MA19: ['MoneyConcept'],
  EF01MA20: ['ProbabilityConcept'],
  EF01MA21: ['DataInterpretationConcept'],
  EF01MA22: ['DataInterpretationConcept'],
  EF02MA02: ['CountingConcept'],
  EF02MA10: ['SequencePatternConcept'],
  EF02MA12: ['SpatialLocationConcept'],
  EF02MA13: ['SpatialLocationConcept'],
  EF02MA16: ['MeasurementConcept'],
  EF02MA17: ['MeasurementConcept'],
  EF02MA19: ['TimeMeasurementConcept'],
  EF02MA20: ['MoneyConcept'],
  EF02MA21: ['ProbabilityConcept'],
  EF02MA22: ['DataInterpretationConcept'],
  EF02MA23: ['DataInterpretationConcept'],
  EF03MA05: ['AdditionConcept', 'SubtractionConcept', 'EarlyProblemSolvingConcept'],
  EF03MA12: ['SpatialLocationConcept'],
  EF03MA16: ['CongruenceConcept'],
  EF03MA17: ['MeasurementConcept'],
  EF03MA19: ['MeasurementConcept'],
  EF03MA20: ['MeasurementConcept'],
  EF03MA21: ['AreaPerimeterConcept'],
  EF03MA25: ['ProbabilityConcept'],
  EF03MA26: ['DataInterpretationConcept', 'EarlyProblemSolvingConcept'],
  EF03MA27: ['DataInterpretationConcept'],
  EF03MA28: ['DataInterpretationConcept'],
  EF04MA04: ['AdditionConcept', 'SubtractionConcept', 'MultiplicationConcept', 'DivisionConcept'],
  EF04MA05: ['AdditionConcept', 'MultiplicationConcept'],
  EF04MA13: ['AdditionConcept', 'SubtractionConcept', 'MultiplicationConcept', 'DivisionConcept'],
  EF04MA16: ['SpatialLocationConcept'],
  EF04MA24: ['MeasurementConcept', 'DataInterpretationConcept'],
  EF04MA26: ['ProbabilityConcept'],
  EF04MA28: ['DataInterpretationConcept'],
  EF05MA14: ['CoordinateLocationConcept', 'SpatialLocationConcept'],
  EF05MA18: ['SimilarityConcept', 'PolygonConcept', 'AngleConcept', 'ProportionalityConcept'],
  EF05MA21: ['MeasurementConcept', 'SpatialFigureConcept'],
  EF05MA22: ['ProbabilityConcept'],
  EF05MA23: ['ProbabilityConcept'],
  EF05MA25: ['DataInterpretationConcept'],
};

/** The six 1º ano skills represented since ontology v0.1; their statuses are unchanged. */
const ORIGINAL_FIRST_YEAR_CODES = new Set(['EF01MA01', 'EF01MA03', 'EF01MA06', 'EF01MA07', 'EF01MA08', 'EF01MA14']);
const NEEDS_REVIEW_CODES = new Set(['EF01MA03', 'EF01MA07']);
const PARTIAL_CODES = new Set(['EF01MA01', 'EF01MA06', 'EF01MA14',
  ...Object.keys(BNCC_CONCEPT_MAPPINGS).filter((code) => !ORIGINAL_FIRST_YEAR_CODES.has(code))]);

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
  formalConceptMappings?: Record<string, string[]>,
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
    bnccCodes.flatMap((code) =>
      formalConceptMappings?.[code] ?? BNCC_CONCEPT_MAPPINGS[code] ?? [],
    ),
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
      source: formalConceptMappings
        ? 'FORMAL_CONTACOMIGO_ONTOLOGY_AND_ACTIVITY_CONTENT'
        : 'CURRENT_ACTIVITY_CONTENT_AND_REPOSITORY_ONTOLOGY',
      conceptMappingStatus: explicitConceptStatus(explicitSemantic?.conceptMappingStatus) ??
        (explicitConcepts ? 'MAPPED' : conceptStatus(bnccCodes)),
    },
  };
}
