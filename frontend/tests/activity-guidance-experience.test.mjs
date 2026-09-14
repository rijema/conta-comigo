import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("guided instruction starts automatically without duplicating the prompt", () => {
  const guided = read("../src/components/activity/guided-instructions.tsx");
  const renderer = read("../src/components/activity/activity-renderer.tsx");
  const settings = read("../src/contexts/AccessibilityContext.tsx");

  assert.match(guided, /automaticInstructionSpeech/);
  assert.match(guided, /speech\.speakInstruction\(instruction\)/);
  assert.doesNotMatch(guided, /<span>Ouvir<\/span>/);
  assert.doesNotMatch(guided, /<ol[^>]*aria-label="Passos da atividade"/);
  assert.doesNotMatch(renderer, /activity\.content\?\.instructionsPt/);
  assert.match(settings, /automaticInstructionSpeech: true/);
});

test("activity help is a visual interaction tutorial with one entry point", () => {
  const page = read("../src/app/[locale]/learn/page.tsx");
  assert.equal((page.match(/onClick=\{handleOpenTutorial\}/g) ?? []).length, 1);
  assert.match(page, /Tutorial visual da atividade/);
  assert.match(page, /getTutorialSteps\(activity\)/);
  assert.match(page, /activity\.move/);
  assert.doesNotMatch(page, /\{activity\.content\?\.instructionsPt \|\| activity\.description/);
});

test("drag overlay does not also translate a duplicate source item", () => {
  const dragDrop = read("../src/components/activity/drag-drop-activity.tsx");
  assert.doesNotMatch(dragDrop, /CSS\.Translate/);
  assert.match(dragDrop, /isDragging \? "opacity-0"/);
  assert.match(dragDrop, /modifiers=\{\[centerOverlayOnPointer\]\}/);
});

test("TitiA stays inside guidance and feedback without decorative side duplicates", () => {
  const page = read("../src/app/[locale]/learn/page.tsx");
  assert.equal((page.match(/alt="TitiA acompanhando a atividade"/g) ?? []).length, 0);
  assert.match(page, /className="h-72 w-auto object-contain sm:h-96"/);
  assert.match(page, /className="h-64 w-auto object-contain sm:h-80"/);
});

test("activity chrome is centered and avoids competing star difficulty counters", () => {
  const page = read("../src/app/[locale]/learn/page.tsx");
  const renderer = read("../src/components/activity/activity-renderer.tsx");
  assert.match(page, /mx-auto w-full max-w-3xl/);
  assert.doesNotMatch(renderer, /DifficultyIndicator/);
  assert.doesNotMatch(page, /setStars/);
});
