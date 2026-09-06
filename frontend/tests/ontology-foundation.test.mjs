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
  assert.equal(alignedEntities.length, 9);
});

test('LASDONT remains outside the mathematical class hierarchy', async () => {
  const ontology = await readFile(ontologyUrl, 'utf8');

  assert.doesNotMatch(ontology, /Strength_and_Weakness_Class|Visual_Strength|Treatments_Class/);
  assert.match(ontology, /LASDONT\.owl/);
});
