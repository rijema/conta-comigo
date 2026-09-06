import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const ontologyUrl = new URL('../../ontology/contacomigo/contacomigo.owl', import.meta.url);
const activitiesSeedUrl = new URL('../../backend/src/database/seeds/activities.seed.ts', import.meta.url);

function bnccSkillBlocks(ontology) {
  return [...ontology.matchAll(
    /<owl:NamedIndividual rdf:about="https:\/\/contacomigo\.org\/ontology#BNCC_(EF\d{2}MA\d{2})">([\s\S]*?)<\/owl:NamedIndividual>/g,
  )].map((match) => ({ code: match[1], body: match[2] }));
}

function mappedConcepts(skillBody) {
  return [...skillBody.matchAll(/<cc:addressesMathematicalConcept rdf:resource="[^"]+#([^"]+)"\/>/g)]
    .map((match) => match[1]);
}

test('ContaComigo ontology establishes the requested knowledge layers and concepts', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  for (const concept of [
    'MathematicalKnowledge',
    'CurricularKnowledge',
    'LearnerKnowledge',
    'ActivityKnowledge',
    'LearningAnalyticsEvidence',
    'MathematicalConcept',
    'CurriculumSkill',
    'DidacticRelation',
    'PrerequisiteRelation',
  ]) {
    assert.match(ontology, new RegExp(`#${concept}\\b`));
  }
});

test('OntoMathEdu alignments have explicit provenance without imports or equivalence claims', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');
  const alignedEntities = ontology.match(/<cc:alignmentRelation>/g) ?? [];

  assert.doesNotMatch(ontology, /<owl:imports\b/);
  assert.doesNotMatch(ontology, /<owl:equivalentClass\b/);
  assert.match(ontology, /sourceOntology/);
  assert.match(ontology, /sourceIRI/);
  assert.match(ontology, /alignmentRelation/);
  assert.match(ontology, /#hasPrerequisite/);
  assert.ok(alignedEntities.length >= 9);
});

test('LASDONT remains outside the mathematical class hierarchy', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  assert.doesNotMatch(ontology, /<owl:Class[^>]+(?:Strength_and_Weakness_Class|Visual_Strength|Treatments_Class)/);
  assert.match(ontology, /LASDONT\.owl/);
});

test('learner characteristics are contextual evidence entities and not fixed learning styles', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  for (const concept of [
    'LearnerCharacteristic',
    'ObservedLearnerCharacteristic',
    'ObservedStrength',
    'ObservedPreference',
    'SupportNeed',
    'InteractionEvidence',
    'EvidenceWindow',
    'InsufficientEvidence',
  ]) {
    assert.match(ontology, new RegExp(`#${concept}\\b`));
  }
  assert.doesNotMatch(ontology, /VisualLearner|AuditoryLearner|VisualLearningStyle|AuditoryLearningStyle/);
  assert.doesNotMatch(ontology, /<owl:imports\b|<owl:equivalentClass\b/);
});

test('learner evidence supports temporal provenance and separates insufficient evidence', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  for (const relation of [
    'derivedFromEvidence',
    'wasGeneratedBySession',
    'concernsLearner',
    'concernsActivity',
    'concernsActivityType',
    'concernsModality',
    'concernsSkill',
    'observedDuring',
    'hasEvidenceWindow',
    'supportsCharacteristic',
    'contradictsCharacteristic',
  ]) {
    assert.match(ontology, new RegExp(`#${relation}\\b`));
  }
  assert.match(ontology, /prov#wasDerivedFrom/);
  assert.match(ontology, /prov#wasGeneratedBy/);
  assert.match(ontology, /#InsufficientEvidence[\s\S]*#EvidenceSufficiencyAssessment/);
  assert.doesNotMatch(ontology, /#InsufficientEvidence[\s\S]{0,180}#SupportNeed/);
});

test('historical LASDONT dimensions are reinterpreted without becoming active legacy classes', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  for (const concept of [
    'ObservedVisualStrength',
    'ObservedAuditoryStrength',
    'MotorSupportNeed',
    'SensorySupportNeed',
    'ObservedLogicalReasoningStrength',
  ]) {
    assert.match(ontology, new RegExp(`#${concept}\\b`));
  }
  assert.match(ontology, /historicalSourceConcept/);
  assert.match(ontology, /historicalMappingType/);
  assert.doesNotMatch(ontology, /OntoPizza01/);
});

test('BKT mastery remains distinct and OWL contains no classification thresholds', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  assert.match(ontology, /#LearnerSkillState/);
  assert.match(ontology, /calculation remains owned by Bayesian Knowledge Tracing/);
  assert.doesNotMatch(ontology, /minInclusive|minExclusive|maxInclusive|maxExclusive/);
  assert.doesNotMatch(ontology, /interactionFit\s*[=+]|learningNeed\s*[=+]/);
});

test('every learner-model class records its scientific or engineering origin', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');
  const concepts = [
    'Learner',
    'LearnerCharacteristic',
    'ObservedLearnerCharacteristic',
    'ObservedStrength',
    'ObservedPreference',
    'SupportNeed',
    'InteractionEvidence',
    'LearningEvidence',
    'EvidenceWindow',
    'Observation',
    'EvidenceSufficiencyAssessment',
    'InsufficientEvidence',
    'LearningSession',
    'ActivityCharacteristic',
    'ActivityType',
    'Modality',
    'VisualInteractionEvidence',
    'ObservedVisualStrength',
    'ObservedVisualPreference',
    'AuditoryInteractionEvidence',
    'ObservedAuditoryStrength',
    'ObservedAuditoryPreference',
    'MotorInteractionEvidence',
    'MotorSupportNeed',
    'MotorInteractionPreference',
    'InteractionCompatibilityAssessment',
    'MotorDemandCompatibility',
    'SensoryInteractionEvidence',
    'SensorySupportNeed',
    'SensoryLoadTolerance',
    'LogicalReasoningEvidence',
    'ObservedLogicalReasoningStrength',
    'ReasoningSupportNeed',
    'MathematicalDifficultyEvidence',
    'InteractionDifficultyEvidence',
  ];

  for (const concept of concepts) {
    const classBlock = ontology.match(
      new RegExp(`<owl:Class rdf:about="https://contacomigo\\.org/ontology#${concept}">([\\s\\S]*?)</owl:Class>`),
    );
    assert.ok(classBlock, `Missing class ${concept}`);
    assert.match(classBlock[1], /<cc:conceptOrigin>/, `Missing conceptOrigin for ${concept}`);
  }
});

test('represented BNCC skills are unique, official-source attributed, and concept mapped', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');
  const skills = bnccSkillBlocks(ontology);
  const codes = skills.map(({ code }) => code);

  assert.deepEqual(codes, ['EF01MA01', 'EF01MA03', 'EF01MA06', 'EF01MA07', 'EF01MA08', 'EF01MA14']);
  assert.equal(new Set(codes).size, codes.length);

  for (const { code, body } of skills) {
    assert.match(body, new RegExp(`<cc:hasCurriculumCode>${code}</cc:hasCurriculumCode>`));
    assert.match(body, /<cc:hasOfficialDescription xml:lang="pt-BR">[^<]+<\/cc:hasOfficialDescription>/);
    assert.match(body, /basenacionalcomum\.mec\.gov\.br/);
    assert.ok(
      mappedConcepts(body).length > 0 || body.includes('<cc:conceptMappingStatus>pending_review</cc:conceptMappingStatus>'),
      `${code} must have a concept mapping or be pending review`,
    );
  }
});

test('BNCC skills remain curriculum individuals without numeric prerequisite assertions', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');
  const skills = bnccSkillBlocks(ontology);

  assert.match(ontology, /#BNCCSkill[\s\S]*#CurriculumSkill/);
  assert.doesNotMatch(ontology, /<owl:equivalentClass\b/);
  for (const { code, body } of skills) {
    assert.doesNotMatch(body, /prerequisiteConcept|requiresPrerequisite/, `${code} has an unsafe prerequisite assertion`);
    assert.doesNotMatch(body, /LearnerCharacteristic|LearnerSkillState/);
  }
});

test('BNCC competency-query fixtures return the expected curriculum answers', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');
  const activitiesSeed = await readFile(activitiesSeedUrl, 'utf8');
  const skills = bnccSkillBlocks(ontology);
  const byCode = new Map(skills.map((skill) => [skill.code, skill]));

  assert.deepEqual(mappedConcepts(byCode.get('EF01MA08').body), [
    'AdditionConcept',
    'SubtractionConcept',
    'EarlyProblemSolvingConcept',
  ]);
  assert.deepEqual(
    skills.filter(({ body }) => mappedConcepts(body).includes('AdditionConcept')).map(({ code }) => code),
    ['EF01MA06', 'EF01MA07', 'EF01MA08'],
  );
  assert.equal((activitiesSeed.match(/bnccSkills: \['EF01MA06'\]/g) ?? []).length, 4);
  assert.deepEqual(
    skills
      .filter(({ body }) => body.includes('<cc:currentActivityCoverageStatus>NOT_COVERED</cc:currentActivityCoverageStatus>'))
      .map(({ code }) => code),
    ['EF01MA08', 'EF01MA14'],
  );
  assert.deepEqual(
    skills
      .filter(({ body }) => body.includes('<cc:currentActivityCoverageStatus>NEEDS_REVIEW</cc:currentActivityCoverageStatus>'))
      .map(({ code }) => code),
    ['EF01MA03', 'EF01MA07'],
  );
  assert.equal((activitiesSeed.match(/bnccSkills: \['EF01MA15'\]/g) ?? []).length, 2);
  assert.equal(byCode.has('EF01MA15'), false);
  const activitySkillCodes = [
    ...new Set([...activitiesSeed.matchAll(/bnccSkills: \['(EF\d{2}MA\d{2})'\]/g)].map((match) => match[1])),
  ];
  assert.deepEqual(
    activitySkillCodes.filter((code) => !byCode.has(code)).sort(),
    ['EF01MA15', 'EF02MA01', 'EF02MA05', 'EF03MA07'],
  );
});
