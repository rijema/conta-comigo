import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const registry = read("../src/lib/pictograms.ts");
const component = read("../src/components/arasaac/arasaac-pictogram.tsx");
const library = read("../src/lib/visual-learning-library.ts");
const page = read("../src/app/[locale]/arasaac/page.tsx");
const menu = read("../src/app/[locale]/learn/menu/page.tsx");
const activity = read("../src/components/activity/parametric-math-activity.tsx");
const analytics = read("../src/hooks/use-visual-communication-analytics.ts");
const learningSession = read("../src/lib/learning-session.ts");
const sessionHook = read("../src/hooks/use-session.tsx");
const section = read("../src/components/arasaac/arasaac-section.tsx");
const legacyActivities = ["counting", "multiple-choice", "number-line", "drag-drop"]
  .map((name) => read(`../src/components/activity/${name}-activity.tsx`));

test("the central registry covers required categories, actions, and numbers 0 through 20", () => {
  for (const category of ["NAVIGATION", "STATE", "MATHEMATICS", "ACTIVITY_ACTION", "COMMUNICATION", "NUMBER"]) {
    assert.match(registry, new RegExp(`"${category}"`));
  }
  for (let value = 0; value <= 20; value += 1) {
    assert.match(registry, new RegExp("number\\.\\$\\{value\\}"));
  }
  for (const concept of ["back", "next", "home", "start", "finish", "help", "repeat", "listen",
    "pause", "try_again", "change_activity", "i_dont_understand", "another_activity", "listen_again", "help_me"]) {
    assert.ok(registry.includes(concept), `${concept} must be registered`);
  }
});

test("ARASAAC URLs and numeric IDs are absent from React components", () => {
  for (const source of [component, page, menu, activity, section]) {
    assert.doesNotMatch(source, /static\.arasaac\.org\/pictograms/);
    assert.doesNotMatch(source, /arasaacId\s*:/);
  }
  assert.match(registry, /ARASAAC_PICTOGRAM_BASE_URL/);
});

test("the common component has accessible alt text and an image failure fallback", () => {
  assert.match(component, /alt=\{accessibleAlt\}/);
  assert.match(component, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.match(component, /data-pictogram-fallback="true"/);
  assert.match(component, /showLabel = true/);
});

test("the visual library restores all named sections and remains non-adaptive", () => {
  for (const category of ["Números", "Operações Matemáticas", "Formas Geométricas", "Cores", "Verbos de Aprender", "Jogos e Atividades"]) {
    assert.ok(library.includes(category));
  }
  assert.match(page, /Aprender com a TitiA/);
  assert.match(library, /VISUAL_LIBRARY_IS_ADAPTIVE = false/);
  assert.match(page, /Ouvir/);
  assert.match(page, /ArasaacAttribution/);
});

test("visual interactions are non-blocking and use the learning-session id", () => {
  for (const event of ["pictogram_opened", "visual_library_opened", "visual_library_item_selected"]) {
    assert.ok(analytics.includes(event));
  }
  assert.match(analytics, /void api\.post/);
  assert.match(analytics, /\.catch\(/);
  assert.match(learningSession, /contacomigo\.learning-session-id/);
  assert.match(sessionHook, /setCurrentLearningSessionId\(sessionId\)/);
});

test("child-facing pictogram actions preserve readable labels", () => {
  assert.match(page, /<span className="font-bold text-sm">Voltar<\/span>/);
  assert.match(page, /<span>Ouvir<\/span>/);
  assert.match(activity, /<span className="ml-2">Dica<\/span>/);
  assert.match(activity, /<span className="ml-2">Confirmar<\/span>/);
  for (const source of legacyActivities) {
    assert.match(source, /ArasaacPictogram/);
    assert.match(source, />Confirmar<\/span>/);
    assert.match(source, /onClick=\{handleSubmit\}/);
  }
});
