import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the final attempt remains tracked but the next activity is not presented before the map', () => {
  const source = read('../src/hooks/use-session.tsx');
  assert.match(source, /const roundComplete = completed >= 10/);
  assert.match(source, /if \(!roundComplete && nextActivity && session\?\.id\)/);
  assert.match(source, /currentActivity: roundComplete \? prev\.currentActivity/);
  assert.match(source, /starsEarned:.*\+ 1/);
});

test('completion celebrates, speaks, offers immediate navigation and redirects after ten seconds', () => {
  const source = read('../src/components/activity/exercise-celebration.tsx');
  assert.match(source, /Você terminou o exercício! Parabéns!/);
  assert.match(source, /Voltar para o mapa agora/);
  assert.match(source, /10 - Math\.floor/);
  assert.match(source, /remaining === 0.*returnRef\.current\(\)/);
  assert.match(source, /!lowStimulation &&/);
});

test('professional child preferences constrain sound, speech and motion on the exercise', () => {
  const context = read('../src/contexts/AccessibilityContext.tsx');
  const page = read('../src/app/[locale]/learn/page.tsx');
  assert.match(context, /\/users\/\$\{user\.id\}\/child-profile/);
  assert.match(context, /soundEnabled: settings\.soundEnabled && appliedPreferences\?\.soundEnabled !== false/);
  assert.match(context, /voiceEnabled: settings\.voiceEnabled && appliedPreferences\?\.voiceEnabled !== false/);
  assert.match(context, /lowStimulationMode: settings\.lowStimulationMode \|\| appliedPreferences\?\.lowStimulationMode === true/);
  assert.match(page, /if \(!childPreferencesReady\) return/);
  assert.match(page, /voice\.enabled && settings\.voiceEnabled/);
  assert.match(page, /sensoryProfile=\{\{/);
});

test('old auth routes lead to one login modal with three role choices', () => {
  assert.match(read('../src/app/[locale]/auth/login/page.tsx'), /auth=login/);
  assert.match(read('../src/app/[locale]/auth/register/page.tsx'), /auth=register/);
  const dialog = read('../src/components/home/auth-dialog.tsx');
  for (const role of ['child', 'guardian', 'professional']) assert.match(dialog, new RegExp(`role: "${role}"`));
});
