import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sessionHook = await readFile(join(frontendRoot, "src/hooks/use-session.tsx"), "utf8");

test("activity lifecycle events reuse the session id and are deduplicated", () => {
  assert.match(sessionHook, /trackedLifecycleEventsRef = useRef\(new Set<string>\(\)\)/);
  assert.match(sessionHook, /`\$\{sessionId\}:\$\{activityId\}:\$\{eventType\}`/);
  assert.match(sessionHook, /"ACTIVITY_PRESENTED"/);
  assert.match(sessionHook, /"ACTIVITY_STARTED"/);
  assert.match(sessionHook, /\{ sessionId, eventType, \.\.\.context \}/);
});

test("answer timing is sent without adding raw answers to analytics metadata", () => {
  assert.match(sessionHook, /responseTimeMs: payload\.timeSpentMs/);
  assert.doesNotMatch(sessionHook, /metadata:\s*\{[^}]*answer/s);
});

test("assistance and skip signals are tied to explicit interactions", () => {
  assert.match(sessionHook, /"HINT_REQUESTED"/);
  assert.match(sessionHook, /"TUTORIAL_OPENED"/);
  assert.match(sessionHook, /counters\.tutorialOpens > 0/);
  assert.match(sessionHook, /"INSTRUCTION_REPLAYED"/);
  assert.match(sessionHook, /"ACTIVITY_SKIPPED"/);
  assert.match(sessionHook, /timeBeforeSkipMs: Math\.max\(0, Date\.now\(\) - session\.activityStartTime\)/);
  assert.match(sessionHook, /attemptsBeforeSkip: counters\.attempts/);
  assert.match(sessionHook, /hintsBeforeSkip: counters\.hints/);
});
