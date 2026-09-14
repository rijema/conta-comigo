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
