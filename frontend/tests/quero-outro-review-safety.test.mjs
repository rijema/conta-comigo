/**
 * "Quero Outro" Review Safety Test
 * [INTEGRATION 3C-FINAL]: Verify that "Quero outro" is disabled during active review
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'fs';
import path from 'path';

const useSessionPath = path.join(
  process.cwd(),
  'src/hooks/use-session.tsx'
);

test('changeCurrentActivity is disabled during active review', async () => {
  const content = fs.readFileSync(useSessionPath, 'utf-8');
  
  // Verify that the review check exists
  assert.match(
    content,
    /if\s*\(\s*session\.currentActivity\?\.reviewAssignmentId\s*\)\s*\{/,
    'changeCurrentActivity should check for reviewAssignmentId'
  );
  
  // Verify that it returns false during review
  assert.match(
    content,
    /if\s*\(\s*session\.currentActivity\?\.reviewAssignmentId\s*\)\s*\{[\s\S]*?return\s+false/,
    'changeCurrentActivity should return false when reviewAssignmentId exists'
  );
});

test('review mode check happens before API call', async () => {
  const content = fs.readFileSync(useSessionPath, 'utf-8');
  
  // Find the changeCurrentActivity function
  const functionStart = content.indexOf('const changeCurrentActivity = useCallback(async () => {');
  assert.ok(functionStart !== -1, 'changeCurrentActivity function should exist');
  
  // Find the review check
  const reviewCheckStart = content.indexOf(
    'if (session.currentActivity?.reviewAssignmentId)',
    functionStart
  );
  assert.ok(reviewCheckStart !== -1, 'Review check should exist');
  
  // Find the API call
  const apiCallStart = content.indexOf(
    'api.post<{ activity: any; adeDecision: any }>',
    functionStart
  );
  assert.ok(apiCallStart !== -1, 'API call should exist');
  
  // Review check should come before API call
  assert.ok(
    reviewCheckStart < apiCallStart,
    'Review check should happen before API call'
  );
});

test('no random activity replacement during review', async () => {
  const content = fs.readFileSync(useSessionPath, 'utf-8');
  
  // Verify that changeCurrentActivity doesn't fabricate a ReviewAssignment
  assert.doesNotMatch(
    content,
    /new ReviewAssignment|fabricate.*Review|random.*activity.*review/i,
    'changeCurrentActivity should not fabricate ReviewAssignments'
  );
  
  // Verify that it doesn't create a fake replacement
  assert.doesNotMatch(
    content,
    /Math\.random\(\).*review|random.*select.*review/i,
    'changeCurrentActivity should not use random selection during review'
  );
});

test('reviewAssignmentId is preserved in session state', async () => {
  const content = fs.readFileSync(useSessionPath, 'utf-8');
  
  // Verify that reviewAssignmentId is part of Activity type
  const activityTypePath = path.join(
    process.cwd(),
    'src/types/index.ts'
  );
  const typesContent = fs.readFileSync(activityTypePath, 'utf-8');
  
  assert.match(
    typesContent,
    /reviewAssignmentId\?:\s*string/,
    'Activity type should have optional reviewAssignmentId'
  );
});

test('console warning is logged when change is attempted during review', async () => {
  const content = fs.readFileSync(useSessionPath, 'utf-8');
  
  assert.match(
    content,
    /console\.warn\s*\(\s*['"]Cannot change activity during active review['"]|Cannot change activity during active review/,
    'Should log warning when change is attempted during review'
  );
});
