import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const renderer = readFileSync(
  new URL('../src/components/activity/activity-renderer.tsx', import.meta.url),
  'utf8',
);
const component = readFileSync(
  new URL('../src/components/activity/parametric-math-activity.tsx', import.meta.url),
  'utf8',
);
const pictograms = readFileSync(
  new URL('../src/lib/pictograms.ts', import.meta.url),
  'utf8',
);
const learnPage = readFileSync(
  new URL('../src/app/[locale]/learn/page.tsx', import.meta.url),
  'utf8',
);
const activitySeeds = readFileSync(
  new URL('../../backend/src/database/seeds/activities.seed.ts', import.meta.url),
  'utf8',
);
const activityEntity = readFileSync(
  new URL('../../backend/src/modules/activities/entities/activity.entity.ts', import.meta.url),
  'utf8',
);
const sessionHook = readFileSync(
  new URL('../src/hooks/use-session.tsx', import.meta.url),
  'utf8',
);

const familyTypes = [
  'composition_decomposition',
  'missing_number',
  'pattern_completion',
  'representation_matching',
  'error_detection',
  'contextual_problem_solving',
];

test('all six parametric families share the common renderer', () => {
  for (const familyType of familyTypes) {
    assert.match(activityEntity, new RegExp(`= '${familyType}'`));
    assert.match(renderer, new RegExp(`case "${familyType}"`));
  }
  assert.match(renderer, /<ParametricMathActivity/);
});

test('the shared component supports scaffolding and two-stage error reasoning', () => {
  assert.match(component, /content\.scaffolding\?\.hints/);
  assert.match(component, /reasonOptions/);
  assert.match(component, /content\.inputMode === "numeric"/);
  assert.match(component, /Escolha uma justificativa/);
  assert.match(component, /onRequestHint\?\.\(\)/);
  assert.match(learnPage, /onRequestHint=\{\(\) => requestHint\(activity\.id\)\}/);
});

test('exercise seeds use centralized pictogram concept ids and prioritize coverage gaps', () => {
  assert.match(activitySeeds, /bnccSkills: \['EF01MA08'\]/);
  assert.match(activitySeeds, /bnccSkills: \['EF01MA14'\]/);
  assert.match(activitySeeds, /pictogramConceptIds:/);
  assert.doesNotMatch(
    activitySeeds.slice(activitySeeds.indexOf('PARAMETRIC FAMILIES')),
    /(?:imageUrl|audioUrl):\s*['"]\/assets\//,
  );
  assert.match(activitySeeds, /existingTitles\.has\(activity\.title\)/);
  for (const conceptId of [
    'character.titia',
    'math.addition',
    'math.number_line',
    'math.part',
    'math.whole',
    'object.apple',
    'shape.circle',
    'shape.square',
    'shape.triangle',
  ]) {
    assert.match(pictograms, new RegExp(`'${conceptId}'`));
  }
});

test('pattern completion is implemented but has no invented production BNCC instance', () => {
  assert.match(renderer, /case "pattern_completion"/);
  const parametricSeeds = activitySeeds.slice(
    activitySeeds.indexOf('PARAMETRIC FAMILIES'),
  );
  assert.doesNotMatch(parametricSeeds, /type: 'pattern_completion'/);
});

test('the shared answer path retains Learning Analytics instrumentation', () => {
  assert.match(component, /onAnswer\(/);
  assert.match(learnPage, /onAnswer=\{handleAnswer\}/);
  assert.match(learnPage, /submitAnswer\(\{/);
  assert.match(
    sessionHook,
    /const requestHint[\s\S]*?"HINT_REQUESTED"/,
  );
});
