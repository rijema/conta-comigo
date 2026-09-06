import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const researchRoot = join(frontendRoot, "..", "docs", "research");

const scientificLabels = [
  "[LITERATURA]",
  "[PROPOSTA CONTA COMIGO]",
  "[DECISÃO DE ENGENHARIA]",
  "[PARÂMETRO EXPERIMENTAL]",
  "[HIPÓTESE A VALIDAR]",
];

const dissertationSections = [
  "## Texto potencial para a dissertação",
  "### Metodologia",
  "### Decisão de projeto",
  "### Limitações",
  "### Evidência necessária no experimento",
];

test("every research document classifies the source of its statements", async () => {
  const documents = (await readdir(researchRoot)).filter((file) => file.endsWith(".md"));
  assert.ok(documents.length > 0, "At least one research document must exist");

  for (const document of documents) {
    const source = await readFile(join(researchRoot, document), "utf8");
    for (const label of scientificLabels) {
      assert.ok(source.includes(label), `${document} must include ${label}`);
    }
  }
});

test("every research document ends with the dissertation drafting structure", async () => {
  const documents = (await readdir(researchRoot)).filter((file) => file.endsWith(".md"));

  for (const document of documents) {
    const source = await readFile(join(researchRoot, document), "utf8");
    let previousPosition = -1;
    for (const heading of dissertationSections) {
      const position = source.indexOf(heading);
      assert.ok(position > previousPosition, `${document} must include ${heading} in order`);
      previousPosition = position;
    }

    assert.ok(
      source.indexOf("## Texto potencial para a dissertação") > source.length / 2,
      `${document} must place the dissertation text at the end`,
    );
  }
});
