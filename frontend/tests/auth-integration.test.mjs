import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the frontend has a single authentication service implementation", async () => {
  const libFiles = await readdir(join(frontendRoot, "src", "lib"));
  const authImplementations = libFiles.filter((file) => /^auth\.tsx?$/.test(file));
  assert.deepEqual(authImplementations, ["auth.ts"]);
});

test("registration uses the shared authentication service through one modal", async () => {
  const dialog = await readFile(join(frontendRoot, "src", "components", "home", "auth-dialog.tsx"), "utf8");
  const route = await readFile(join(frontendRoot, "src", "app", "[locale]", "auth", "register", "page.tsx"), "utf8");
  assert.match(dialog, /authService\.register\(/);
  assert.doesNotMatch(dialog, /apiClient\.post\(["']\/auth\/register/);
  assert.match(route, /auth=register/);
});

test("the frontend registration roles match the backend wire values", async () => {
  const authService = await readFile(join(frontendRoot, "src", "lib", "auth.ts"), "utf8");
  assert.match(authService, /role:\s*"guardian"\s*\|\s*"professional"/);
  assert.doesNotMatch(authService, /"GUARDIAN"|"EDUCATOR"|"PROFESSIONAL"/);
});

test("professional registration does not force a child profile form", async () => {
  const dialog = await readFile(join(frontendRoot, "src", "components", "home", "auth-dialog.tsx"), "utf8");
  assert.match(dialog, /requiresChildProfile\s*=\s*form\.role\s*===\s*"guardian"/);
  assert.match(dialog, /form\.role\s*===\s*"guardian"\s*&&\s*\(!form\.childName\s*\|\|\s*!form\.childAge\s*\|\|\s*!form\.childPassword\)/);
  assert.doesNotMatch(dialog, /form\.role\s*===\s*"guardian"\s*&&\s*<>/);
});
