import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('professional controls keep sensory dimensions separate and reuse child profile storage', () => {
  const editor = read('../src/app/[locale]/dashboard/educator/page.tsx');
  for (const field of ['soundEnabled', 'voiceEnabled', 'soundEffectsEnabled', 'volume', 'speechRate',
    'animationSpeed', 'animationsReduced', 'visualStimulus', 'audioStimulus', 'feedbackVisual',
    'maxSimultaneousElements', 'celebrationFrequency', 'autoHints', 'helpDelaySeconds',
    'allowChangeActivity', 'disabledActivityTypes', 'prioritizedBnccSkills',
    'manualDifficulty', 'adaptiveDifficulty', 'predictability', 'reinforcementPreference']) {
    assert.ok(editor.includes(field), `Missing ${field}`);
  }
  assert.match(editor, /uiPreferences: uiPrefs/);
});

test('child experience applies professional controls to sound, speech, hints and activity change', () => {
  const context = read('../src/contexts/AccessibilityContext.tsx');
  const page = read('../src/app/[locale]/learn/page.tsx');
  const speech = read('../src/hooks/use-titia-speech.ts');
  assert.match(context, /soundEffectsEnabled: settings\.soundEffectsEnabled && appliedPreferences\?\.soundEffectsEnabled !== false/);
  assert.match(context, /allowChangeActivity: settings\.allowChangeActivity && appliedPreferences\?\.allowChangeActivity !== false/);
  assert.match(page, /settings\.autoHints/);
  assert.match(page, /settings\.helpDelaySeconds/);
  assert.match(page, /if \(!settings\.allowChangeActivity\) return/);
  assert.match(page, /settings\.audioStimulus === 'low'/);
  assert.match(speech, /volume: Math\.min\(settings\.volume/);
  assert.doesNotMatch(speech, /titiaSpeechService\.configure\(\{ enabled \}\)/);
});

test('guardian receives a simple history and linked child access editor', () => {
  const page = read('../src/app/[locale]/dashboard/guardian/page.tsx');
  for (const label of ['Atividades recentes', 'Formatos mais usados', 'Ideia para praticar juntos', 'Dados de acesso da criança', 'Minha senha']) {
    assert.ok(page.includes(label));
  }
  assert.match(page, /\/guardian\/children\/\$\{selected\.id\}\/access/);
  assert.match(page, /\/guardian\/password/);
});
