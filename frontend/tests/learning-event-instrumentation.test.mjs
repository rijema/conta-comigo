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

test("answer timing distinguishes first interaction, current response, and total time", () => {
  assert.match(sessionHook, /responseTimeMs: activeElapsedMs\(counters\.pauses, counters\.lastAttemptAt \?\? activityStart, answerAt\)/);
  assert.match(sessionHook, /firstInteractionMs: activeElapsedMs\(counters\.pauses, activityStart, counters\.firstInteractionAt\)/);
  assert.match(sessionHook, /const totalTimeMs = activeElapsedMs\(counters\.pauses, activityStart, answerAt\)/);
  assert.match(sessionHook, /timeSpentSeconds: Math\.round\(totalTimeMs \/ 1000\)/);
  assert.match(sessionHook, /hintsUsed: counters\.hints/);
  assert.doesNotMatch(sessionHook, /metadata:\s*\{[^}]*answer/s);
});

test("round completion and leaving an activity emit distinct lifecycle events", () => {
  assert.match(sessionHook, /trackSessionEvent\(session\.id, "SESSION_COMPLETED"\)/);
  assert.match(sessionHook, /"ACTIVITY_ABANDONED"/);
});

test("the current recommendation id follows lifecycle and answer requests", () => {
  assert.match(sessionHook, /currentRecommendationId: adeDecision\?\.id \?\? null/);
  assert.match(sessionHook, /recommendationId: recommendationId \?\? undefined/);
  assert.match(sessionHook, /recommendationId: session\?\.currentRecommendationId \?\? undefined/);
});

test("assistance and skip signals are tied to explicit interactions", () => {
  assert.match(sessionHook, /"HINT_REQUESTED"/);
  assert.match(sessionHook, /"TUTORIAL_OPENED"/);
  assert.match(sessionHook, /counters\.tutorialOpens > 0/);
  assert.match(sessionHook, /"INSTRUCTION_REPLAYED"/);
  assert.match(sessionHook, /"ACTIVITY_SKIPPED"/);
  assert.match(sessionHook, /timeBeforeSkipMs: activeTimeSinceStart\(/);
  assert.match(sessionHook, /attemptsBeforeSkip: counters\.attempts/);
  assert.match(sessionHook, /hintsBeforeSkip: counters\.hints/);
});

test("calm breaks are excluded from exercise timing and recorded as pause events", () => {
  assert.match(sessionHook, /function activeElapsedMs\(pauses: PauseInterval\[\], from: number, to: number\)/);
  assert.match(sessionHook, /"PAUSE_STARTED"/);
  assert.match(sessionHook, /"PAUSE_ENDED"/);
  assert.match(sessionHook, /pauseDurationMs: Math\.max\(0, endedAt - pauseState\.startedAt\)/);
  assert.match(sessionHook, /if \(pauseState\) return;/);
});
