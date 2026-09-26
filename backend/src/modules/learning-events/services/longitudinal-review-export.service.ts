/**
 * Longitudinal Review Export Service
 * [INTEGRATION 3C-FINAL]: Exports reconstructable review evidence for research
 */

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ResearchPseudonymizationService } from './research-pseudonymization.service';

export interface ReviewExportRecord {
  pseudonymousLearnerId: string;
  sessionId: string;
  islandId: string;
  authoritiveCycleNumber: number;
  cyclePosition: number;
  reviewAssignmentId: string;
  reviewOutcomeId: string;
  baselineActivityAttemptId: string;
  reviewActivityAttemptId: string;
  baselineActivityId: string;
  reviewActivityId: string;
  skillUuid: string;
  bnccCode: string;
  reviewType: string;
  baselineTimestamp: Date;
  reviewTimestamp: Date;
  daysSinceBaseline: number;
  baselineAccuracy: number | null;
  reviewAccuracy: number | null;
  accuracyDelta: number | null;
  baselineAttempts: number | null;
  reviewAttempts: number | null;
  attemptsDelta: number | null;
  baselineHints: number | null;
  reviewHints: number | null;
  hintsDelta: number | null;
  baselineResponseTimeMs: number | null;
  reviewResponseTimeMs: number | null;
  normalizedResponseTimeDelta: number | null;
  masteryBefore: number | null;
  masteryAfter: number | null;
  masteryDelta: number | null;
  difficultyBefore: string | null;
  difficultyAfter: string | null;
  difficultyComparison: string | null;
  instanceComparison: string | null;
  evidenceSufficiency: string;
  longitudinalClassification: string;
  sourceRecommendationIds: string[];
  reviewRecommendationId: string | null;
  scoringConfigurationVersion: string | null;
  scoringBreakdown: Record<string, number> | null;
}

@Injectable()
export class LongitudinalReviewExportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pseudonymizationService: ResearchPseudonymizationService,
  ) {}

  /**
   * Export longitudinal review evidence for research
   * [INTEGRATION 3C-FINAL]: Returns reconstructable evidence with pseudonymous learner ID
   */
  async exportReviewEvidence(studentId: string): Promise<ReviewExportRecord[]> {
    const sql = `
      SELECT
        'learner-' || substring(ra.student_id::text, 1, 8) as pseudonymous_learner_id,
        ra.student_id as session_id,
        ra.island_id,
        ra.cycle_number as authoritive_cycle_number,
        COALESCE(le.metadata->>'cyclePosition', '0')::int as cycle_position,
        ra.id as review_assignment_id,
        ro.id as review_outcome_id,
        ba.id as baseline_activity_attempt_id,
        ra2.id as review_activity_attempt_id,
        ba.activity_id as baseline_activity_id,
        ra2.activity_id as review_activity_id,
        ra.skill_id as skill_uuid,
        s.code as bncc_code,
        ra.review_type,
        ba.created_at as baseline_timestamp,
        ra2.created_at as review_timestamp,
        EXTRACT(DAY FROM ra2.created_at - ba.created_at) as days_since_baseline,
        ba.is_correct::int::float / NULLIF(ba_count.total, 0) as baseline_accuracy,
        ra2.is_correct::int::float / NULLIF(ra2_count.total, 0) as review_accuracy,
        (ra2.is_correct::int::float / NULLIF(ra2_count.total, 0)) - 
        (ba.is_correct::int::float / NULLIF(ba_count.total, 0)) as accuracy_delta,
        ba_count.total as baseline_attempts,
        ra2_count.total as review_attempts,
        ra2_count.total - ba_count.total as attempts_delta,
        ba.hints_used as baseline_hints,
        ra2.hints_used as review_hints,
        ra2.hints_used - ba.hints_used as hints_delta,
        ba.time_spent_seconds * 1000 as baseline_response_time_ms,
        ra2.time_spent_seconds * 1000 as review_response_time_ms,
        CASE 
          WHEN ba.time_spent_seconds > 0 AND ra2.time_spent_seconds > 0
          THEN (ra2.time_spent_seconds - ba.time_spent_seconds) / ba.time_spent_seconds
          ELSE NULL
        END as normalized_response_time_delta,
        ro.mastery_before,
        ro.mastery_after,
        ro.mastery_after - ro.mastery_before as mastery_delta,
        a1.difficulty as difficulty_before,
        a2.difficulty as difficulty_after,
        ro.instance_comparison as difficulty_comparison,
        ro.instance_comparison,
        ro.evidence_sufficiency,
        ro.longitudinal_classification,
        ra.source_recommendation_ids as source_recommendation_ids,
        ro.review_recommendation_id,
        ro.scoring_configuration_version,
        ro.scoring_breakdown
      FROM review_assignments ra
      JOIN review_outcomes ro ON ra.id = ro.review_assignment_id
      JOIN activity_attempts ba ON ra.source_interaction_ids[1]::uuid = ba.id
      JOIN activity_attempts ra2 ON ro.review_attempt_id = ra2.id
      JOIN activities a1 ON ba.activity_id = a1.id
      JOIN activities a2 ON ra2.activity_id = a2.id
      JOIN student_skill_states s ON ra.skill_id = s.skill_id
      LEFT JOIN learning_events le ON ra2.id = le.metadata->>'activityAttemptId'
      LEFT JOIN (
        SELECT activity_id, COUNT(*) as total
        FROM activity_attempts
        WHERE student_id = $1
        GROUP BY activity_id
      ) ba_count ON ba.activity_id = ba_count.activity_id
      LEFT JOIN (
        SELECT activity_id, COUNT(*) as total
        FROM activity_attempts
        WHERE student_id = $1
        GROUP BY activity_id
      ) ra2_count ON ra2.activity_id = ra2_count.activity_id
      WHERE ra.student_id = $1
      ORDER BY ra.created_at DESC
    `;

    const results = await this.dataSource.query(sql, [studentId]);
    
    // [INTEGRATION 3C-FINAL]: Use HMAC-based pseudonym instead of UUID substring
    const pseudonym = this.pseudonymizationService.generatePseudonym(studentId);
    
    return results.map((row: any) => ({
      pseudonymousLearnerId: pseudonym,
      sessionId: row.session_id,
      islandId: row.island_id,
      authoritiveCycleNumber: row.authoritive_cycle_number,
      cyclePosition: row.cycle_position,
      reviewAssignmentId: row.review_assignment_id,
      reviewOutcomeId: row.review_outcome_id,
      baselineActivityAttemptId: row.baseline_activity_attempt_id,
      reviewActivityAttemptId: row.review_activity_attempt_id,
      baselineActivityId: row.baseline_activity_id,
      reviewActivityId: row.review_activity_id,
      skillUuid: row.skill_uuid,
      bnccCode: row.bncc_code,
      reviewType: row.review_type,
      baselineTimestamp: row.baseline_timestamp,
      reviewTimestamp: row.review_timestamp,
      daysSinceBaseline: row.days_since_baseline,
      baselineAccuracy: row.baseline_accuracy,
      reviewAccuracy: row.review_accuracy,
      accuracyDelta: row.accuracy_delta,
      baselineAttempts: row.baseline_attempts,
      reviewAttempts: row.review_attempts,
      attemptsDelta: row.attempts_delta,
      baselineHints: row.baseline_hints,
      reviewHints: row.review_hints,
      hintsDelta: row.hints_delta,
      baselineResponseTimeMs: row.baseline_response_time_ms,
      reviewResponseTimeMs: row.review_response_time_ms,
      normalizedResponseTimeDelta: row.normalized_response_time_delta,
      masteryBefore: row.mastery_before,
      masteryAfter: row.mastery_after,
      masteryDelta: row.mastery_delta,
      difficultyBefore: row.difficulty_before,
      difficultyAfter: row.difficulty_after,
      difficultyComparison: row.difficulty_comparison,
      instanceComparison: row.instance_comparison,
      evidenceSufficiency: row.evidence_sufficiency,
      longitudinalClassification: row.longitudinal_classification,
      sourceRecommendationIds: row.source_recommendation_ids || [],
      reviewRecommendationId: row.review_recommendation_id,
      scoringConfigurationVersion: row.scoring_configuration_version,
      scoringBreakdown: row.scoring_breakdown,
    }));
  }
}
