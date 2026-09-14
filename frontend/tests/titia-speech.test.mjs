import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const serviceSource = readFileSync(
  new URL("../src/lib/titia-speech-service.ts", import.meta.url), "utf8",
);
const compiled = ts.transpileModule(serviceSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const speechModule = { exports: {} };
new Function("exports", "module", compiled)(speechModule.exports, speechModule);
const { TitiaSpeechService } = speechModule.exports;

class FakeSpeechEngine {
  available = true;
  cancellations = 0;
  requests = [];
  isAvailable() { return this.available; }
  speak(request) { this.requests.push(request); request.onStart?.(); }
  cancel() { this.cancellations += 1; }
  finish(index) { this.requests[index].onEnd(); }
}

test("TitiaSpeechService speaks short instruction steps sequentially with configuration", () => {
  const engine = new FakeSpeechEngine();
  const service = new TitiaSpeechService(engine);
  service.configure({ rate: 0.75, language: "pt-BR" });

  assert.equal(service.speakInstruction({
    introduction: "Oi! A TitiA vai te explicar.",
    steps: ["Olhe aqui.", "Pegue o número 1.", "Coloque aqui."],
  }), true);
  assert.equal(engine.requests[0].text, "Oi! A TitiA vai te explicar.");
  assert.equal(engine.requests[0].rate, 0.75);
  assert.equal(engine.requests[0].language, "pt-BR");
  engine.finish(0);
  engine.finish(1);
  engine.finish(2);
  assert.deepEqual(engine.requests.map((request) => request.text), [
    "Oi! A TitiA vai te explicar.", "Olhe aqui.", "Pegue o número 1.", "Coloque aqui.",
  ]);
});

test("playback acceptance callback fires once for a multi-step instruction", () => {
  const engine = new FakeSpeechEngine();
  const service = new TitiaSpeechService(engine);
  let starts = 0;
  service.speakInstruction({ steps: ["Primeiro.", "Depois."] }, () => { starts += 1; });
  engine.finish(0);
  assert.equal(starts, 1);
});

test("cancellation invalidates the remaining sequence", () => {
  const engine = new FakeSpeechEngine();
  const service = new TitiaSpeechService(engine);
  service.speakInstruction({ steps: ["Primeiro.", "Depois."] });
  service.stopSpeech();
  engine.finish(0);
  assert.deepEqual(engine.requests.map((request) => request.text), ["Primeiro."]);
  assert.ok(engine.cancellations >= 2);
});

test("replay repeats the last instruction and not the last hint", () => {
  const engine = new FakeSpeechEngine();
  const service = new TitiaSpeechService(engine);
  service.speakInstruction({ steps: ["Olhe aqui."] });
  service.speakHint("Conte novamente.");
  assert.equal(service.repeatLastInstruction(), true);
  assert.equal(engine.requests.at(-1).text, "Olhe aqui.");
});

test("disabled speech cancels playback and emits no new engine request", () => {
  const engine = new FakeSpeechEngine();
  const service = new TitiaSpeechService(engine);
  service.configure({ enabled: false });
  assert.equal(service.speakPictogram("adição"), false);
  assert.equal(service.speakFeedback("Muito bem!"), false);
  assert.equal(engine.requests.length, 0);
  assert.ok(engine.cancellations >= 1);
});

test("guided activities expose authored step sequences and deduplicate automatic speech", () => {
  const guided = readFileSync(new URL("../src/components/activity/guided-instructions.tsx", import.meta.url), "utf8");
  const seeds = readFileSync(new URL("../../backend/src/database/seeds/activities.seed.ts", import.meta.url), "utf8");
  assert.match(guided, /content\.spokenSteps/);
  assert.match(guided, /auto-instruction-spoken:\$\{sessionId\}:\$\{activity\.id\}/);
  assert.match(guided, /sessionStorage\.getItem\(key\)/);
  assert.match(guided, /sessionStorage\.setItem\(key, "true"\)/);
  assert.match(seeds, /spokenSteps: \[/);
  assert.match(seeds, /spokenHint:/);
  assert.match(seeds, /spokenSuccessFeedback:/);
  assert.match(seeds, /spokenRetryFeedback:/);
  assert.match(seeds, /speechMetadataUpdated/);
  assert.match(seeds, /existing\.content = \{ \.\.\.existing\.content, \.\.\.authoredSpeech \}/);
});

test("browser speech APIs are isolated in TitiaSpeechService", () => {
  const relevantSources = [
    "../src/app/[locale]/arasaac/page.tsx",
    "../src/app/[locale]/learn/menu/page.tsx",
    "../src/components/learner/ActivityRenderer.tsx",
  ];
  for (const path of relevantSources) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /speechSynthesis|SpeechSynthesisUtterance/);
  }
  assert.match(serviceSource, /class BrowserSpeechEngine/);
  assert.match(serviceSource, /replaceEngine/);
});

test("speech preferences and requested analytics events are wired", () => {
  const settings = readFileSync(new URL("../src/contexts/AccessibilityContext.tsx", import.meta.url), "utf8");
  const hook = readFileSync(new URL("../src/hooks/use-titia-speech.ts", import.meta.url), "utf8");
  for (const preference of ["voiceEnabled", "speechRate", "automaticInstructionSpeech", "soundEnabled"]) {
    assert.ok(settings.includes(preference));
  }
  for (const eventType of ["instruction_spoken", "instruction_replayed", "hint_spoken", "pictogram_spoken", "speech_disabled"]) {
    assert.ok(hook.includes(eventType));
  }
  assert.match(hook, /void api\.post/);
});
