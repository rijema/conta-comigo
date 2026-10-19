import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer = fs.readFileSync(new URL('../src/components/activity/activity-renderer.tsx', import.meta.url), 'utf8');
const errorDetection = fs.readFileSync(new URL('../src/components/minigames/error-detection-minigame.tsx', import.meta.url), 'utf8');

test('representation_matching without left/right pairs falls back to multiple choice', () => {
  const branch = renderer.slice(renderer.indexOf('case "representation_matching"'));
  assert.match(branch, /!hasMatchingPairs\(activity\)[\s\S]*?<MultipleChoiceActivity[\s\S]*?<MatchingMinigame/);
  assert.match(renderer, /"left" in item && "right" in item/);
});

test('error detection shows the exercise question when there is no error statement', () => {
  assert.match(errorDetection, /errorStatement \|\|\s*activity\?\.content\?\.instructionsPt \|\|/);
});
