import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("drag overlay is centered on mouse or touch coordinates", () => {
  const source = read("../src/components/activity/drag-drop-activity.tsx");
  assert.match(source, /centerOverlayOnPointer/);
  assert.match(source, /pointer\.clientX - activeNodeRect\.left - overlayNodeRect\.width \/ 2/);
  assert.match(source, /pointer\.clientY - activeNodeRect\.top - overlayNodeRect\.height \/ 2/);
});

test("only the page owns answer feedback artwork", () => {
  const page = read("../src/app/[locale]/learn/page.tsx");
  for (const component of ["multiple-choice-activity.tsx", "drag-drop-activity.tsx"]) {
    const source = read(`../src/components/activity/${component}`);
    assert.doesNotMatch(source, /correctanswer\.png|tryagain\.png/);
  }
  assert.match(page, /correctanswer\.png/);
  assert.match(page, /feedbackFlash/);
});

test("speech stop is contextual and choices are spoken", () => {
  const guided = read("../src/components/activity/guided-instructions.tsx");
  const choice = read("../src/components/activity/multiple-choice-activity.tsx");
  assert.match(guided, /speech\.isSpeaking &&/);
  assert.match(choice, /speech\.speakPictogram\(option\.text/);
});

test("learning activity is restored only for the same student within a TTL", () => {
  const session = read("../src/hooks/use-session.tsx");
  assert.match(session, /SESSION_TTL_MS/);
  assert.match(session, /saved\.studentId === String\(studentId\)/);
  assert.match(session, /saved\.expiresAt > Date\.now\(\)/);
  assert.match(session, /localStorage\.removeItem\(SESSION_STORAGE_KEY\)/);
});

test("shape choices hide answer artwork while retaining a visual prompt", () => {
  const source = read("../src/components/activity/multiple-choice-activity.tsx");
  assert.match(source, /isShapeActivity/);
  assert.match(source, /!isShapeActivity && option\.emoji/);
  assert.match(source, /targetShape/);
});
