/**
 * Longitudinal Review Analytics Service
 * [INTEGRATION 3C-FINAL]: Provides professional dashboard with review evidence
 */

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ReviewEvidenceItem {
  bnccCode: string;
  skillDescription: string;
  islandId: string;
  cycleNumber: number;
  baselineDate: Date;
  reviewDate: Date;
  daysSinceBaseline: number;
  reviewType: string;
  baselineActivityId: string;
  reviewActivityId: string;
  instanceComparison: string | null;
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
  evidenceSufficiency: string;
  longitudinalClassification: string;
}

@Injectable()
export class LongitudinalReviewAnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get review evidence for professional dashboard
   * [INTEGRATION 3C-FINAL]: Returns structured review comparisons
   */
  async getReviewEvidence(studentId: string): Promise<ReviewEvidenceItem[]> {
    const sql = `
      SELECT
        s.code as bncc_code,
        s.description as skill_description,
        ra.island_id,
        ra.cycle_number,
        ba.created_at as baseline_date,
        ra2.created_at as review_date,
        EXTRACT(DAY FROM ra2.created_at - ba.created_at) as days_since_baseline,
        ra.review_type,
        ba.activity_id as baseline_activity_id,
        ra2.activity_id as review_activity_id,
        ro.instance_comparison,
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
        CASE
          WHEN a1.difficulty = a2.difficulty THEN 'Mesma dificuldade'
          WHEN a1.difficulty < a2.difficulty THEN 'Aumentou'
          ELSE 'Diminuiu'
        END as difficulty_comparison,
        ro.evidence_sufficiency,
        ro.longitudinal_classification
      FROM review_assignments ra
      JOIN review_outcomes ro ON ra.id = ro.review_assignment_id
      JOIN activity_attempts ba ON ra.source_interaction_ids[1]::uuid = ba.id
      JOIN activity_attempts ra2 ON ro.review_attempt_id = ra2.id
      JOIN activities a1 ON ba.activity_id = a1.id
      JOIN activities a2 ON ra2.activity_id = a2.id
      JOIN student_skill_states s ON ra.skill_id = s.skill_id
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
    
    return results.map((row: any) => ({
      bnccCode: row.bncc_code,
      skillDescription: row.skill_description,
      islandId: row.island_id,
      cycleNumber: row.cycle_number,
      baselineDate: row.baseline_date,
      reviewDate: row.review_date,
      daysSinceBaseline: row.days_since_baseline,
      reviewType: row.review_type,
      baselineActivityId: row.baseline_activity_id,
      reviewActivityId: row.review_activity_id,
      instanceComparison: row.instance_comparison,
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
      evidenceSufficiency: row.evidence_sufficiency,
      longitudinalClassification: this.translateClassification(row.longitudinal_classification),
    }));
  }

  private translateClassification(classification: string): string {
    const translations: Record<string, string> = {
      'IMPROVED': 'Melhora observada',
      'STABLE': 'Desempenho estável',
      'NEEDS_SUPPORT': 'Pode precisar de apoio',
      'INCONCLUSIVE': 'Dados insuficientes',
    };
    return translations[classification] || classification;
  }
}
