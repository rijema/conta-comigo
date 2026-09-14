import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hook = readFileSync(new URL('../src/hooks/use-voice-command.ts', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/app/[locale]/learn/page.tsx', import.meta.url), 'utf8');
const neural = readFileSync(new URL('../src/lib/neural-titia-speech-engine.ts', import.meta.url), 'utf8');
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');

test('Docker build receives every public voice feature flag', () => {
  assert.match(dockerfile, /ARG NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=false/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_ENABLE_NEURAL_TTS=false/);
  assert.match(dockerfile, /ENV NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=/);
  assert.match(dockerfile, /ENV NEXT_PUBLIC_ENABLE_NEURAL_TTS=/);
});

test('ML Docker build uses the monorepo root context and Railway selects it', () => {
  const mlDockerfile = readFileSync(new URL('../../ml-service/Dockerfile', import.meta.url), 'utf8');
  const mlRailway = readFileSync(new URL('../../ml-service/railway.json', import.meta.url), 'utf8');
  assert.match(mlDockerfile, /COPY ml-service\/requirements\.txt \./);
  assert.match(mlDockerfile, /COPY ml-service\/ \./);
  assert.match(mlRailway, /"builder": "DOCKERFILE"/);
  assert.match(mlRailway, /"dockerfilePath": "\/ml-service\/Dockerfile"/);
});

test('microphone is push-to-talk, feature flagged, and stops every media track', () => {
  assert.match(hook, /NEXT_PUBLIC_ENABLE_VOICE_COMMANDS === "true"/);
  assert.match(hook, /getUserMedia\(\{ audio: true, video: false \}\)/);
  assert.match(hook, /recorder\.start\(\)/);
  assert.match(hook, /stream\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.doesNotMatch(hook, /setInterval|continuous\s*[:=]\s*true/);
});

test('voice commands reuse existing activity actions and retain canonical behavior', () => {
  assert.match(page, /onHelp: handleOpenTutorial/);
  assert.match(page, /onRepeat: speech\.repeatLastInstruction/);
  assert.match(page, /handleChangeActivity/);
  assert.match(hook, /VOICE_ACTIVITY_CHANGE_REQUESTED/);
});

test('child audio is discarded and never added to analytics metadata or caches', () => {
  assert.match(hook, /chunks = \[\]/);
  assert.doesNotMatch(hook, /localStorage.*audio|indexedDB|upload|transcript/);
  assert.doesNotMatch(neural, /MediaRecorder|getUserMedia/);
});

test('neural speech falls back to the browser engine', () => {
  assert.match(neural, /BrowserSpeechEngine/);
  assert.match(neural, /catch[\s\S]*this\.fallback\.speak\(request\)/);
});

test('one neural engine lifecycle is initialized and browser speech remains fallback only', () => {
  const hookSource = readFileSync(new URL('../src/hooks/use-titia-speech.ts', import.meta.url), 'utf8');
  assert.match(hookSource, /let runtimeEngineInitialized = false/);
  assert.match(hookSource, /if \(runtimeEngineInitialized/);
  assert.match(hookSource, /replaceEngine\(new NeuralTitiaSpeechEngine\(\)\)/);
  assert.match(neural, /constructor\(private readonly fallback = new BrowserSpeechEngine\(\)\)/);
});

test('neural request cancellation reaches fetch and stale audio cannot start', () => {
  const apiClient = readFileSync(new URL('../src/lib/api-client.tsx', import.meta.url), 'utf8');
  assert.match(neural, /this\.abort\.signal/);
  assert.match(neural, /generation !== this\.generation/);
  assert.match(neural, /this\.abort\?\.abort\(\)/);
  assert.match(apiClient, /signal\?: AbortSignal/);
  assert.match(apiClient, /signal,/);
});

test('spoken analytics are emitted from playback start without raw text', () => {
  const hookSource = readFileSync(new URL('../src/hooks/use-titia-speech.ts', import.meta.url), 'utf8');
  assert.match(hookSource, /speakInstruction\(instruction, \(\) =>/);
  assert.match(hookSource, /speakHint\(text, \(\) => track\("hint_spoken"\)\)/);
  assert.doesNotMatch(hookSource, /api\.post[\s\S]{0,250}\btext\b/);
});

test('development voice lab is blocked in production and stores no child data', () => {
  const pageSource = readFileSync(new URL('../src/app/[locale]/dev/titia-voice/page.tsx', import.meta.url), 'utf8');
  const labSource = readFileSync(new URL('../src/app/[locale]/dev/titia-voice/titia-voice-lab.tsx', import.meta.url), 'utf8');
  assert.match(pageSource, /NODE_ENV === "production"/);
  assert.match(pageSource, /notFound\(\)/);
  assert.match(labSource, /Testar instrução/);
  assert.doesNotMatch(labSource, /api\.post|learning-events|localStorage/);
});

test('female neural voice attribution and non-commercial license are visible', () => {
  const settingsSource = readFileSync(new URL('../src/app/[locale]/settings/page.tsx', import.meta.url), 'utf8');
  const mlDockerfile = readFileSync(new URL('../../ml-service/Dockerfile', import.meta.url), 'utf8');
  assert.match(settingsSource, /TigreGotico Lda/);
  assert.match(settingsSource, /CC BY-NC-ND 4\.0/);
  assert.match(mlDockerfile, /dii_pt-BR\.onnx/);
  assert.match(mlDockerfile, /PIPER_CONFIG_PATH/);
});
