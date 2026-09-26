/**
 * Longitudinal Review Integration Tests
 * [INTEGRATION 3C-FINAL]: Verify review plumbing and child UX
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('review context is detected from reviewAssignmentId', () => {
  const reviewContext = read('../src/lib/review-context.ts');
  assert.match(reviewContext, /isReviewActivity/);
  assert.match(reviewContext, /reviewAssignmentId/);
  assert.match(reviewContext, /Boolean/);
});

test('Activity type supports optional review fields', () => {
  const types = read('../src/types/index.ts');
  assert.match(types, /reviewAssignmentId\?\: string/);
  assert.match(types, /cycleNumber\?\: number/);
  assert.match(types, /cyclePosition\?\: number/);
  assert.match(types, /islandId\?\: string/);
});

test('review activity submission includes reviewAssignmentId', () => {
  const session = read('../src/hooks/use-session.tsx');
  assert.match(session, /reviewAssignmentId/);
  assert.match(session, /currentActivity\?\.reviewAssignmentId/);
  assert.match(session, /islandId/);
  assert.match(session, /cycleNumber/);
});

test('normal activity submission does not require reviewAssignmentId', () => {
  const session = read('../src/hooks/use-session.tsx');
  // Verify that reviewAssignmentId is optional (using spread operator)
  assert.match(session, /\.\.\.\(session\?\.currentActivity\?\.reviewAssignmentId/);
});

test('review mode is detected and transition is shown', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  // Verify review state management
  assert.match(learn, /showReviewTransition/);
  assert.match(learn, /isInReviewMode/);
  // Verify review detection logic
  assert.match(learn, /Boolean\(session\.currentActivity\.reviewAssignmentId\)/);
  // Verify transition only shows once
  assert.match(learn, /if \(isReview && !wasInReview\)/);
});

test('review transition uses child-friendly Titia language', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  assert.match(learn, /Vamos lembrar um pouquinho/);
  assert.match(learn, /atividades que já conhece/);
  // Verify no technical terms are shown
  assert.doesNotMatch(learn, /REMEDIATION|RETENTION|GENERALIZATION/);
  assert.doesNotMatch(learn, /BKT|mastery|IMPROVED|STABLE|NEEDS_SUPPORT/);
});

test('review transition speaks introduction through Titia', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  assert.match(learn, /speech\.speakFeedback.*Vamos lembrar/);
});

test('review activities use existing ActivityRenderer', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  // Verify ActivityRenderer is used for all activities (including review)
  assert.match(learn, /<ActivityRenderer/);
  // Verify no separate ReviewActivityRenderer exists
  assert.doesNotMatch(learn, /ReviewActivityRenderer/);
});

test('review context survives session state', () => {
  const session = read('../src/hooks/use-session.tsx');
  // Verify currentActivity state preserves review fields
  assert.match(session, /currentActivity:.*nextActivity/);
  // Verify no parallel review session store
  assert.doesNotMatch(session, /reviewSession|reviewState/);
});

test('recommendationId remains independent from reviewAssignmentId', () => {
  const types = read('../src/types/index.ts');
  const session = read('../src/hooks/use-session.tsx');
  // Both fields exist independently
  assert.match(types, /recommendationId/);
  assert.match(types, /reviewAssignmentId/);
  // Both are preserved in submission
  assert.match(session, /currentRecommendationId/);
  assert.match(session, /currentActivity\?\.reviewAssignmentId/);
});

test('backend cycle context is preserved but not recalculated', () => {
  const types = read('../src/types/index.ts');
  const learn = read('../src/app/[locale]/learn/page.tsx');
  // Cycle fields are optional in Activity type
  assert.match(types, /cycleNumber\?\: number/);
  assert.match(types, /cyclePosition\?\: number/);
  // No local cycle calculation logic
  assert.doesNotMatch(learn, /Math\.floor.*cycle|cycle.*Math\.floor/);
});

test('review completion returns to normal learning flow', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  // Verify exit from review mode
  assert.match(learn, /!isReview && wasInReview/);
  // Verify normal flow continues
  assert.match(learn, /setIsInReviewMode\(false\)/);
});

test('session restoration preserves review context', () => {
  const session = read('../src/hooks/use-session.tsx');
  // Session state is persisted with currentActivity
  assert.match(session, /localStorage\.setItem.*SESSION_STORAGE_KEY/);
  assert.match(session, /currentActivity.*session/);
});

test('ActivityAttemptPayload supports optional review fields', () => {
  const activity = read('../src/hooks/use-activity.tsx');
  assert.match(activity, /reviewAssignmentId\?\: string/);
  assert.match(activity, /islandId\?\: string/);
  assert.match(activity, /cycleNumber\?\: number/);
});

test('review helper functions are available', () => {
  const reviewContext = read('../src/lib/review-context.ts');
  assert.match(reviewContext, /export function isReviewActivity/);
  assert.match(reviewContext, /export function getReviewContext/);
  assert.match(reviewContext, /export function hasCompleteReviewContext/);
});

test('no hardcoded review identifiers are created', () => {
  const learn = read('../src/app/[locale]/learn/page.tsx');
  const session = read('../src/hooks/use-session.tsx');
  // Verify reviewAssignmentId comes from backend only
  assert.doesNotMatch(learn, /reviewAssignmentId.*=.*uuid|generateId|Math\.random/);
  assert.doesNotMatch(session, /reviewAssignmentId.*=.*uuid|generateId|Math\.random/);
});
