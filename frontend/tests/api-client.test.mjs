import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/api-client.tsx", import.meta.url), "utf8");

test("API client accepts successful empty responses used by non-blocking analytics", () => {
  assert.match(source, /response\.status === 204/);
  assert.match(source, /const payload = await response\.text\(\)/);
  assert.match(source, /payload \? JSON\.parse\(payload\)/);
  assert.doesNotMatch(source, /return response\.json\(\)/);
});

test("API client preserves structured errors and tolerates plain-text errors", () => {
  assert.match(source, /JSON\.parse\(payload\)/);
  assert.match(source, /message = payload/);
  assert.match(source, /throw new Error\(message\)/);
});
