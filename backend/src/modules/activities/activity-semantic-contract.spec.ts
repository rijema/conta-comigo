import { buildActivitySemanticContract } from './activity-semantic-contract';

describe('activity semantic contract', () => {
  const families = [
    {
      type: 'counting',
      content: { instructionsPt: 'Conte as maçãs', items: ['🍎', '🍎', '🍎'] },
      expectedType: 'counting',
    },
    {
      type: 'multiple_choice',
      content: { question: 'Quanto é 2 + 2?', options: [{ text: '4' }] },
      expectedType: 'multiple_choice',
    },
    {
      type: 'quiz',
      content: { question: 'Qual grupo tem mais?', options: [{ emoji: '⭐' }] },
      expectedType: 'quiz',
    },
    {
      type: 'drag_drop',
      content: { instructionsPt: 'Coloque em ordem', items: ['1', '2', '3'] },
      expectedType: 'drag_drop',
    },
    {
      type: 'number_line',
      content: { instructionsPt: 'Marque o número 5', min: 0, max: 10 },
      expectedType: 'number_line',
    },
  ];

  it.each(families)('exposes the common contract for $type', (fixture) => {
    const result = buildActivitySemanticContract({
      title: 'Activity',
      type: fixture.type,
      bnccSkills: ['EF01MA06'],
      content: fixture.content,
      accessibility: { sensoryLoad: 'low' },
    }, 'skill-id');

    expect(result).toEqual(expect.objectContaining({
      activityType: fixture.expectedType,
      bnccSkillId: 'skill-id',
      mathematicalConcepts: ['AdditionConcept', 'EarlyProblemSolvingConcept'],
      representation: expect.any(Array),
      interactionType: expect.any(Array),
      difficultyProfile: expect.objectContaining({
        conceptualComplexity: expect.anything(),
        abstractionLevel: expect.anything(),
        distractorSimilarity: expect.anything(),
        languageLoad: expect.anything(),
        motorDemand: expect.anything(),
        sensoryLoad: 'low',
        scaffoldingLevel: expect.anything(),
      }),
      affordances: expect.objectContaining({
        requiresDragging: false,
        requiresReading: expect.any(Boolean),
        usesAudio: expect.any(Boolean),
        usesPictograms: expect.any(Boolean),
      }),
    }));
    expect(result.difficultyProfile).toHaveProperty('numericalMagnitude');
    expect(result.difficultyProfile).toHaveProperty('stepCount');
    expect(result.communication.textLabel).not.toBe('');
    expect(result.communication.spokenExplanationText)
      .toBe(result.communication.textLabel);
  });

  it('preserves counting while exposing its option-selection interaction', () => {
    const result = buildActivitySemanticContract({
      type: 'counting',
      content: { options: [{ text: '3' }] },
    }, null);

    expect(result.activityType).toBe('counting');
    expect(result.interactionType).toEqual(['option_selection']);
  });

  it('keeps unsupported annotations explicit instead of inventing values', () => {
    const result = buildActivitySemanticContract({
      title: 'Text-only activity',
      type: 'multiple_choice',
      bnccSkills: ['EF02MA05'],
      content: { instructionsPt: 'Escolha uma opção' },
    }, null);

    expect(result.mathematicalConcepts).toEqual([]);
    expect(result.semanticAnnotation.conceptMappingStatus).toBe('UNMAPPED');
    expect(result.difficultyProfile.stepCount).toBeNull();
    expect(result.difficultyProfile.sensoryLoad).toBeNull();
    expect(result.difficultyProfile.unannotatedDimensions).toEqual(
      expect.arrayContaining(['numericalMagnitude', 'stepCount', 'sensoryLoad']),
    );
  });

  it('does not treat identifiers or URLs as mathematical magnitude', () => {
    const result = buildActivitySemanticContract({
      title: 'Image activity',
      type: 'multiple_choice',
      content: { imageUrl: 'https://example.test/assets/v12/image-900.png' },
    }, null);

    expect(result.difficultyProfile.numericalMagnitude).toBeNull();
  });

  it('derives metadata from activity content without ASD support-level input', () => {
    const source = {
      title: 'Conte',
      type: 'counting',
      bnccSkills: ['EF01MA01'],
      content: { instructionsPt: 'Conte 4 estrelas', items: ['⭐', '⭐', '⭐', '⭐'] },
    };

    expect(buildActivitySemanticContract(source, null))
      .toEqual(buildActivitySemanticContract({ ...source }, null));
  });

  it('records child communication cues without enabling a speech engine', () => {
    const result = buildActivitySemanticContract({
      title: 'Conte as estrelas',
      type: 'counting',
      content: { instructionsPt: 'Conte as estrelas ⭐' },
      accessibility: { hasAudio: false },
    }, null);

    expect(result.communication).toEqual({
      textLabel: 'Conte as estrelas ⭐',
      pictogram: '⭐',
      spokenExplanationText: 'Conte as estrelas ⭐',
      nonReaderAlternatives: ['pictogram'],
    });
  });

  it.each([
    ['composition_decomposition', 'composition_building'],
    ['missing_number', 'missing_value_entry'],
    ['pattern_completion', 'pattern_completion'],
    ['representation_matching', 'representation_matching'],
    ['error_detection', 'error_evaluation'],
    ['contextual_problem_solving', 'contextual_response'],
  ])('supports explicit metadata for %s', (type, interaction) => {
    const difficultyProfile = {
      conceptualComplexity: null,
      numericalMagnitude: 10,
      abstractionLevel: null,
      stepCount: 2,
      distractorSimilarity: null,
      languageLoad: null,
      motorDemand: 'LOW',
      sensoryLoad: 'LOW',
      scaffoldingLevel: 'OPTIONAL',
    };
    const result = buildActivitySemanticContract({
      title: 'Parametric activity',
      type,
      bnccSkills: ['EF01MA08'],
      content: {
        instructionsPt: 'Escolha uma resposta',
        pictogramConceptIds: ['math.addition'],
        scaffolding: { hints: [{ textLabel: 'Use objetos.' }] },
        semantic: {
          mathematicalConcepts: ['AdditionConcept'],
          representation: ['pictorial', 'symbolic', 'contextual', 'object_based'],
          interactionType: [interaction],
          difficultyProfile,
          affordances: {
            requiresDragging: false,
            requiresReading: true,
            usesAudio: false,
            usesPictograms: true,
          },
        },
      },
    }, 'skill-id');

    expect(result).toEqual(expect.objectContaining({
      activityType: type,
      bnccSkillId: 'skill-id',
      mathematicalConcepts: ['AdditionConcept'],
      representation: ['pictorial', 'symbolic', 'contextual', 'object_based'],
      interactionType: [interaction],
      scaffoldingOptions: { hints: [{ textLabel: 'Use objetos.' }] },
      affordances: {
        requiresDragging: false,
        requiresReading: true,
        usesAudio: false,
        usesPictograms: true,
      },
    }));
    expect(result.difficultyProfile).toEqual(expect.objectContaining({
      ...difficultyProfile,
      annotationProvenance: 'EXPLICIT_ACTIVITY_METADATA',
    }));
  });
});
