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

test("registration interfaces use the shared authentication service", async () => {
  const registrationFiles = [
    join(frontendRoot, "src", "components", "home", "auth-dialog.tsx"),
    join(frontendRoot, "src", "app", "[locale]", "auth", "register", "page.tsx"),
  ];

  for (const file of registrationFiles) {
    const source = await readFile(file, "utf8");
    assert.match(source, /authService\.register\(/);
    assert.doesNotMatch(source, /apiClient\.post\(["']\/auth\/register/);
  }
});

test("the frontend registration roles match the backend wire values", async () => {
  const authService = await readFile(join(frontendRoot, "src", "lib", "auth.ts"), "utf8");
  assert.match(authService, /role:\s*"guardian"\s*\|\s*"professional"/);
  assert.doesNotMatch(authService, /"GUARDIAN"|"EDUCATOR"|"PROFESSIONAL"/);
});
