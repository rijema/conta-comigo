import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const learn = await readFile(join(root, "src/app/[locale]/learn/page.tsx"), "utf8");
const session = await readFile(join(root, "src/hooks/use-session.tsx"), "utf8");
const educator = await readFile(join(root, "src/app/[locale]/dashboard/educator/page.tsx"), "utf8");
const debug = await readFile(join(root, "src/components/recommendation/research-debug-panel.tsx"), "utf8");

test("Quero outro uses the registry, accessible text, speech, and the replacement endpoint", () => {
  assert.match(learn, /"Quero outro"/);
  assert.match(learn, /conceptId="navigation\.repeat"/);
  assert.match(learn, /aria-label="Quero outro exercício"/);
  assert.match(learn, /Vamos tentar de outro jeito!/);
  assert.match(session, /"\/activities\/change"/);
  assert.match(session, /currentRecommendationId/);
});

test("changing activity does not stop the learning session", () => {
  const body = session.slice(session.indexOf("const changeCurrentActivity"), session.indexOf("const submitAnswer"));
  assert.doesNotMatch(body, /stopSession|setSession\(null\)/);
  assert.match(body, /ACTIVITY_PRESENTED/);
});

test("professional review is optional and absent from child gameplay", () => {
  assert.doesNotMatch(learn, /ADEQUATE|PARTIALLY_ADEQUATE|INADEQUATE|Pular avaliação/);
  assert.match(educator, /ADEQUATE/);
  assert.match(educator, /PARTIALLY_ADEQUATE/);
  assert.match(educator, /INADEQUATE/);
  assert.match(educator, /Pular avaliação/);
  assert.match(debug, /Adaptation transition and feedback/);
});
