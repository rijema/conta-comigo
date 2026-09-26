/**
 * Review Context Utilities
 * [INTEGRATION 3C-FINAL]: Helpers for detecting and managing review activities
 */

import type { Activity } from '@/types';

/**
 * Detect if an activity is a review activity
 * [INTEGRATION 3C-FINAL]: Review mode is identified by the presence of reviewAssignmentId
 * from the backend response, not inferred from other properties
 */
export function isReviewActivity(activity: Activity | null | undefined): boolean {
  return Boolean(activity?.reviewAssignmentId);
}

/**
 * Extract review context from an activity
 */
export function getReviewContext(activity: Activity | null | undefined) {
  if (!activity) return null;
  
  return {
    reviewAssignmentId: activity.reviewAssignmentId,
    islandId: activity.islandId,
    cycleNumber: activity.cycleNumber,
    cyclePosition: activity.cyclePosition,
    recommendationId: activity.recommendationId,
  };
}

/**
 * Check if review context is complete
 */
export function hasCompleteReviewContext(activity: Activity | null | undefined): boolean {
  if (!isReviewActivity(activity)) return false;
  
  const context = getReviewContext(activity);
  return Boolean(
    context?.reviewAssignmentId &&
    context?.islandId &&
    context?.cycleNumber !== undefined
  );
}
