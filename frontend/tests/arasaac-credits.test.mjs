import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const credits = read("../src/app/[locale]/creditos/page.tsx");
const home = read("../src/app/[locale]/page.tsx");
const settings = read("../src/app/[locale]/settings/page.tsx");
const dialog = read("../src/components/arasaac/arasaac-library-dialog.tsx");
const attribution = read("../src/components/arasaac/arasaac-attribution.tsx");
const notices = read("../../THIRD_PARTY_NOTICES.md");

test("public credits page names the ARASAAC author, owner, license and usage terms", () => {
  for (const fragment of ["Créditos e licenças", "CC BY-NC-SA", "https://arasaac.org/terms-of-use"]) {
    assert.ok(credits.includes(fragment), fragment);
  }
  assert.match(credits, /<ArasaacAttribution/);
  assert.match(credits, /aria-labelledby="arasaac-title"/);
  assert.match(credits, /Voltar ao início/);
  for (const fragment of ["Sergio Palao", "Governo de Aragão", "ARASAAC", "CC BY-NC-SA"]) {
    assert.ok(attribution.includes(fragment), fragment);
    assert.ok(notices.includes(fragment), fragment);
  }
});

test("credits can be reached from the public home, library and settings", () => {
  for (const source of [home, settings, dialog]) {
    assert.match(source, /\$\{locale\}\/creditos/);
  }
  assert.match(home, /<ArasaacAttribution/);
  assert.match(dialog, /Ver créditos e condições de uso/);
});

test("credits do not suggest that loading pictograms from a CDN removes license terms", () => {
  assert.match(credits, /carregamento remoto não altera a licença/);
  assert.match(notices, /carregamento remoto não elimina a necessidade/);
});
