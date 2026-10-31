import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const registry = read("../src/lib/pictograms.ts");
const multipleChoice = read("../src/components/activity/multiple-choice-activity.tsx");

// IDs that were checked against static.arasaac.org in out/2026 and returned
// HTTP 404. None of them may be used as an image ID again.
const NONEXISTENT_ARASAAC_IDS = [
  13186, 14098, 14120, 14379, 14456, 14494, 14560, 15358, 15532, 15811, 15813,
  15814, 15851, 15953, 15971, 15195, 16590, 17331, 17333, 17629, 17784, 20951,
  23189, 23190, 23191, 26968, 44702, 61042,
];

const registeredImageIds = () => [...registry.matchAll(
  /definition\(\s*['"`][^'"`]+['"`]\s*,\s*"[A-Z_]+"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*(\d+)\s*\)/g,
)].map((match) => Number(match[1]));

const conceptImageId = (conceptId) => {
  const escaped = conceptId.replace(/\./g, "\\.");
  const match = registry.match(new RegExp(
    `definition\\(\\s*['"]${escaped}['"]\\s*,\\s*"[A-Z_]+"\\s*,\\s*"[^"]*"\\s*,\\s*"[^"]*"(?:\\s*,\\s*(\\d+))?\\s*\\)`,
  ));
  return match ? (match[1] ? Number(match[1]) : null) : undefined;
};

test("no registry entry points to an ARASAAC ID known not to exist", () => {
  const used = new Set(registeredImageIds());
  for (const id of NONEXISTENT_ARASAAC_IDS) {
    assert.equal(used.has(id), false, `ARASAAC ${id} returns 404 and must not be used as an image`);
  }
});

test("euro money pictograms are not used for amounts in reais", () => {
  for (const euroId of [4630, 8633, 10279, 4776, 4780, 4784, 4788]) {
    assert.equal(registeredImageIds().includes(euroId), false, `ARASAAC ${euroId} shows euros`);
  }
});

test("the geometric triangle is pinned instead of resolved by label search", () => {
  assert.equal(conceptImageId("shape.triangle"), 4763);
  assert.equal(conceptImageId("library.triangle"), 4763);
});

test("quiz items that are pictogram IDs are drawn, not printed as text", () => {
  assert.match(multipleChoice, /isPictogramItem\(item\)/);
  assert.match(multipleChoice, /pictogramRegistry\.get\(item\) !== null/);
});
