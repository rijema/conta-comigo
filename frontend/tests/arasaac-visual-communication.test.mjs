import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const registry = read("../src/lib/pictograms.ts");
const component = read("../src/components/arasaac/arasaac-pictogram.tsx");
const library = read("../src/lib/arasaac-catalog.ts");
const dialog = read("../src/components/arasaac/arasaac-library-dialog.tsx");
const page = read("../src/app/[locale]/arasaac/page.tsx");
const menu = read("../src/app/[locale]/learn/menu/page.tsx");
const activity = read("../src/components/activity/parametric-math-activity.tsx");
const analytics = read("../src/hooks/use-visual-communication-analytics.ts");
const learningSession = read("../src/lib/learning-session.ts");
const sessionHook = read("../src/hooks/use-session.tsx");
const legacyActivities = ["counting", "multiple-choice", "number-line", "drag-drop"]
  .map((name) => read(`../src/components/activity/${name}-activity.tsx`));
const catalogRoute = read("../src/app/api/arasaac/search/route.ts");
const educator = read("../src/app/[locale]/dashboard/educator/page.tsx");
const home = read("../src/app/[locale]/page.tsx");

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
  for (const source of [component, page, menu, activity, dialog]) {
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
  for (const category of ["Números", "Pessoas", "Animais", "Alimentos", "Objetos", "Ações", "Emoções", "Lugares", "Matemática", "Símbolos", "Formas", "Cores", "Cotidiano", "Aprender", "Educação", "Jogos", "Software"]) {
    assert.ok(library.includes(category));
  }
  assert.match(page, /ArasaacLibraryDialog/);
  assert.match(library, /ARASAAC_CATALOG_IS_ADAPTIVE = false/);
  assert.match(dialog, /Ouvir/);
  assert.match(dialog, /ArasaacAttribution/);
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
  assert.match(dialog, /Fechar biblioteca/);
  assert.match(dialog, /Ouvir/);
  assert.match(activity, /<span className="ml-2">Dica<\/span>/);
  assert.match(activity, /<span className="ml-2">Confirmar<\/span>/);
  for (const source of legacyActivities) {
    assert.match(source, /ArasaacPictogram/);
    assert.match(source, />Confirmar<\/span>/);
    assert.match(source, /onClick=\{handleSubmit\}/);
  }
});

test("the same full library opens from public home, the route and logged learning map", () => {
  assert.match(home, /<ArasaacLibraryDialog open=\{showArasaac\}/);
  assert.match(menu, /<ArasaacLibraryDialog open=\{showArasaac\}/);
  assert.match(page, /<ArasaacLibraryDialog open/);
  assert.match(dialog, /useModalFocus/);
  assert.match(dialog, /ARASAAC_CATEGORIES\.map/);
});

test("catalog search uses the Portuguese ARASAAC API with cached, sanitized results", () => {
  assert.match(catalogRoute, /api\.arasaac\.org\/v1\/pictograms\/pt\/search/);
  assert.match(catalogRoute, /revalidate: 86400/);
  assert.match(catalogRoute, /keyword\.keyword/);
  assert.match(library, /searchCache/);
  assert.match(library, /normalizeLabel\(match\.label\) === normalizeLabel\(entry\.labelPt\)/);
  assert.match(component, /arasaacCatalog\.resolveMissing\(conceptId\)/);
});

test("professional voice preference gates child pictogram speech", () => {
  assert.match(educator, /voiceEnabled", label: "Leitura dos pictogramas pela TitiA"/);
  assert.match(dialog, /professionalVoiceEnabled/);
  assert.match(dialog, /profile\.uiPreferences\?\.voiceEnabled === true/);
  assert.match(dialog, /if \(voiceAllowed\) speech\.speakPictogram/);
  assert.match(dialog, /visual_library_item_selected/);
});
