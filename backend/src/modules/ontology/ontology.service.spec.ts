import { OntologyService } from './ontology.service';
import { RuntimeSemanticFacts } from './semantic-runtime.types';

describe('OntologyService', () => {
  const config = (path?: string) => ({
    get: jest.fn((name: string) =>
      name === 'CONTACOMIGO_ONTOLOGY_PATH' ? path : undefined,
    ),
  }) as any;

  const activity = (
    activityId: string,
    bnccSkills: string[],
    mathematicalConcepts: string[],
  ) => ({
    activityId,
    activityType: 'quiz' as const,
    bnccSkills,
    mathematicalConcepts,
    representations: ['symbolic' as const],
    interactionTypes: ['option_selection' as const],
    difficultyProfile: {
      conceptualComplexity: null,
      numericalMagnitude: null,
      abstractionLevel: null,
      stepCount: null,
      distractorSimilarity: null,
      languageLoad: null,
      motorDemand: null,
      sensoryLoad: null,
      scaffoldingLevel: null,
      annotationProvenance: 'UNANNOTATED' as const,
      unannotatedDimensions: [],
    },
    affordances: {
      requiresDragging: false,
      requiresReading: false,
      usesAudio: false,
      usesPictograms: false,
    },
    mappingStatus: 'MAPPED' as const,
  });

  const facts = (activities: RuntimeSemanticFacts['activities']): RuntimeSemanticFacts => ({
    studentId: 'student-1',
    targetSkill: 'EF01MA08',
    mastery: { source: 'StudentSkillState', probability: 0.4 },
    learningAnalytics: { recentAccuracy: 0.5 },
    observedEvidenceTypes: ['InteractionEvidence'],
    hardConstraints: { disallowDragging: false, requireAudio: false },
    activities,
  });

  it('loads and caches the formal ContaComigo ontology', () => {
    const service = new OntologyService(config());

    service.loadOnce();
    const firstCache = (service as any).ontology;
    service.loadOnce();

    expect(service.getStatus()).toEqual(expect.objectContaining({
      loaded: true,
      ontologyIri: 'https://contacomigo.org/ontology',
      ontologyVersion: '0.4.0',
      cachedBnccSkills: 6,
    }));
    expect((service as any).ontology).toBe(firstCache);
  });

  it('derives shared-concept links without asserting unsupported prerequisites', () => {
    const service = new OntologyService(config());
    service.loadOnce();
    const relations = service.getSkillRelations('EF01MA06');
    expect(relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ skillCode: 'EF01MA08', relation: 'relatedSkill',
        source: 'SHARED_CONCEPT_DERIVED', concepts: expect.arrayContaining(['AdditionConcept']) }),
    ]));
    expect(relations.some((relation) => relation.relation === 'prerequisiteSkill')).toBe(false);
  });

  it('includes a semantically aligned candidate and excludes an invalid one', () => {
    const service = new OntologyService(config());
    service.loadOnce();

    const result = service.getValidActivityCandidates(facts([
      activity('valid', ['EF01MA08'], ['AdditionConcept']),
      activity('invalid', ['EF01MA06'], ['AdditionConcept']),
    ]));

    expect(result.validCandidateIds).toEqual(['valid']);
    expect(result.excludedCandidateIds).toEqual(['invalid']);
    expect(result.trace.candidateDecisions[1].reasons)
      .toContain('TARGET_SKILL_NOT_DECLARED_BY_ACTIVITY');
    expect(result.trace.ontologyVersion).toBe('0.4.0');
    expect(result.trace.fallbackUsed).toBe(false);
  });

  it('checks an explicitly authored activity prerequisite against BKT evidence', () => {
    const service = new OntologyService(config());
    service.loadOnce();
    const candidate = { ...activity('requires-skill', ['EF01MA08'], ['AdditionConcept']),
      prerequisiteSkillCode: 'EF01MA06' };
    const result = service.getValidActivityCandidates({
      ...facts([candidate]), masteryBySkillCode: { EF01MA06: 0.2 },
    });
    expect(result.trace.candidateDecisions[0].reasons)
      .toContain('ACTIVITY_PREREQUISITE_NOT_MASTERED');
    expect(result.trace.runtimeFactsUsed.prerequisiteMasteryBySkillCode)
      .toEqual({ EF01MA06: 0.2 });
    expect(result.trace.fallbackUsed).toBe(true);
  });

  it('identifies the legacy fallback when formal semantic data is missing', () => {
    const service = new OntologyService(config());
    service.loadOnce();

    const result = service.getValidActivityCandidates({
      ...facts([activity('legacy', ['EF02MA01'], [])]),
      targetSkill: 'EF02MA01',
    });

    expect(result.validCandidateIds).toEqual([]);
    expect(result.trace.fallbackUsed).toBe(true);
    expect(result.trace.fallbackReason).toContain('not represented');
    expect(result.trace.semanticRelations).toEqual([]);
  });

  it('fails clearly when the configured ontology file is missing', () => {
    const service = new OntologyService(
      config('/definitely/missing/contacomigo.owl'),
    );

    expect(() => service.onModuleInit()).toThrow(
      /ContaComigo ontology file configured at .* does not exist/,
    );
  });
});
