import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const ontologyUrl = new URL('../../ontology/contacomigo/contacomigo.owl', import.meta.url);

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
