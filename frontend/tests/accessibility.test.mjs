import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the viewport does not disable browser zoom", async () => {
  const layout = await readFile(join(frontendRoot, "src", "app", "[locale]", "layout.tsx"), "utf8");
  assert.doesNotMatch(layout, /maximumScale|userScalable/);
});

test("home modals share the keyboard focus implementation", async () => {
  const homePage = await readFile(join(frontendRoot, "src", "app", "[locale]", "page.tsx"), "utf8");
  const authDialog = await readFile(join(frontendRoot, "src", "components", "home", "auth-dialog.tsx"), "utf8");

  assert.match(homePage, /useModalFocus<HTMLElement>\(showAbout/);
  assert.match(authDialog, /useModalFocus<HTMLElement>\(open/);
});

test("the shared modal hook supports escape, tab containment, and focus restoration", async () => {
  const hook = await readFile(join(frontendRoot, "src", "hooks", "use-modal-focus.ts"), "utf8");
  assert.match(hook, /event\.key === "Escape"/);
  assert.match(hook, /event\.key !== "Tab"/);
  assert.match(hook, /previousFocusRef\.current\.focus\(\)/);
  assert.match(hook, /document\.body\.style\.overflow = "hidden"/);
});
