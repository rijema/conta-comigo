import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("browser title is concise and points to shared favicon assets", async () => {
  const layout = await readFile(join(root, "src/app/[locale]/layout.tsx"), "utf8");
  assert.match(layout, /title: "Mestrado - Conta Comigo"/);
  for (const path of ["favicon.ico", "favicon-32x32.png", "apple-touch-icon.png"]) {
    assert.ok(layout.includes(`/${path}`));
  }
});

test("favicon includes valid 16, 32 and 48 pixel PNG frames", async () => {
  const icon = await readFile(join(root, "public/favicon.ico"));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    assert.equal(icon[entry], size);
    assert.equal(icon[entry + 1], size);
    const byteLength = icon.readUInt32LE(entry + 8);
    const offset = icon.readUInt32LE(entry + 12);
    assert.equal(icon.subarray(offset, offset + 8).toString("hex"), "89504e470d0a1a0a");
    assert.ok(offset + byteLength <= icon.length);
  }
});
