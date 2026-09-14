import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type EvidenceStatus = 'AVAILABLE' | 'INSUFFICIENT_DATA';

@Injectable()
export class LongitudinalLearningAnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getProfessionalReport(studentId: string) {
    return this.load(studentId, true);
  }

  async getGuardianReport(studentId: string) {
    const report = await this.load(studentId, false);
    return {
      observedData: report.observedData,
      learningProgress: {
        skillsPracticed: report.learningProgress.skillsPracticed,
        skillsInDevelopment: report.learningProgress.masteryEstimates.map((item: any) => ({
          skillCode: item.skillCode,
          state: item.status === 'AVAILABLE' ? 'Habilidade em desenvolvimento' : 'Dados ainda insuficientes',
        })),
      },
      longitudinal: report.longitudinal,
      adaptations: {
        totalChangeRequests: report.adaptations.totalChangeRequests,
        message: report.adaptations.totalChangeRequests > 0
          ? 'O sistema mudou a forma de alguns exercícios para manter, quando possível, o objetivo de aprendizagem.'
          : 'Ainda não houve solicitações de mudança de atividade.',
      },
      evidenceState: report.evidenceState,
    };
  }

  private async load(studentId: string, includeProfessionalDetails: boolean) {
    const [sessions, mastery, formats, outcomes, adaptations, feedback, interactions] = await Promise.all([
      this.dataSource.query(this.sessionSql(), [studentId]),
      this.dataSource.query(this.masterySql(), [studentId]),
      this.dataSource.query(this.formatSql(), [studentId]),
      this.dataSource.query(this.outcomeSql(), [studentId]),
      this.dataSource.query(this.adaptationSql(), [studentId]),
      this.dataSource.query(this.feedbackSql(), [studentId]),
      this.dataSource.query(this.interactionSql(), [studentId]),
    ]);
    return this.assemble({ sessions, mastery, formats, outcomes, adaptations, feedback, interactions }, includeProfessionalDetails);
  }

  assemble(rows: any, includeProfessionalDetails = true) {
    const sessions = rows.sessions.map((row: any) => ({
      sessionId: row.sessionId,
      date: row.date,
      answers: this.number(row.answers),
      correctAnswers: this.number(row.correctAnswers),
      accuracy: this.nullableRatio(row.correctAnswers, row.answers),
      activitiesCompleted: this.number(row.activitiesCompleted),
      attempts: this.number(row.answers),
      averageResponseTimeMs: this.nullableNumber(row.averageResponseTimeMs),
      hints: this.number(row.hints),
      instructionReplays: this.number(row.instructionReplays),
      skips: this.number(row.skips),
      changeRequests: this.number(row.changeRequests),
    }));
    const answers = sessions.reduce((sum: number, item: any) => sum + item.answers, 0);
    const correct = sessions.reduce((sum: number, item: any) => sum + item.correctAnswers, 0);
    const completed = sessions.reduce((sum: number, item: any) => sum + item.activitiesCompleted, 0);
    const hints = sessions.reduce((sum: number, item: any) => sum + item.hints, 0);
    const changeRequests = sessions.reduce((sum: number, item: any) => sum + item.changeRequests, 0);
    const recommendationOutcomes = rows.outcomes.map((row: any) => ({
      status: row.status,
      count: this.number(row.count),
    }));
    const recommendationCount = recommendationOutcomes.reduce((sum: number, item: any) => sum + item.count, 0);
    const outcomeCount = (status: string) => recommendationOutcomes
      .find((item: any) => item.status === status)?.count ?? 0;
    const masteryEstimates = rows.mastery.map((row: any) => ({
      skillCode: row.skillCode,
      observations: this.number(row.observations),
      status: this.number(row.observations) > 0 ? 'AVAILABLE' : 'INSUFFICIENT_DATA',
      estimatedMastery: this.number(row.observations) > 0 ? Number(row.masteryProbability) : null,
      label: this.number(row.observations) > 0
        ? `Habilidade ${row.skillCode} — em desenvolvimento`
        : `Habilidade ${row.skillCode} — dados insuficientes`,
    }));
    const adaptationItems = includeProfessionalDetails ? rows.adaptations.map((row: any) => ({
      sessionId: row.sessionId,
      targetSkill: row.targetSkill,
      previousActivity: row.previousActivity,
      previousFormat: row.previousFormat,
      replacementActivity: row.replacementActivity,
      replacementFormat: row.replacementFormat,
      sameSkill: row.sameSkill,
      sameConcept: row.sameConcept,
      previousOutcome: row.previousOutcome,
      replacementOutcome: row.replacementOutcome,
      fallbackUsed: row.fallbackUsed,
    })) : [];
    return {
      observedData: {
        answers,
        correctAnswers: correct,
        accuracy: answers ? correct / answers : null,
        activitiesCompleted: completed,
        hints,
        changeRequests,
        activityFormats: rows.formats.map((row: any) => ({ type: row.type, count: this.number(row.count) })),
        recommendationOutcomes,
        recommendationSummary: {
          total: recommendationCount,
          completionRate: recommendationCount ? outcomeCount('COMPLETED') / recommendationCount : null,
          skipRate: recommendationCount ? outcomeCount('SKIPPED') / recommendationCount : null,
          changeRequestRate: recommendationCount ? changeRequests / recommendationCount : null,
        },
      },
      learningProgress: {
        skillsPracticed: rows.mastery.map((row: any) => row.skillCode),
        masteryEstimates,
      },
      longitudinal: {
        sessions,
        trendStatus: sessions.length >= 2 ? 'AVAILABLE' : 'INSUFFICIENT_DATA',
        trendMessage: sessions.length >= 2
          ? 'Série observada por sessão; a linha, isoladamente, não demonstra melhora.'
          : 'Ainda não há observações suficientes para mostrar uma tendência.',
      },
      adaptations: {
        totalChangeRequests: changeRequests,
        sameSkillReplacements: rows.adaptations.filter((row: any) => row.sameSkill === true).length,
        items: adaptationItems,
      },
      interactionHistory: {
        status: rows.interactions.length ? 'AVAILABLE' : 'INSUFFICIENT_DATA',
        message: rows.interactions.length
          ? 'Histórico observacional de formatos e demandas; não constitui diagnóstico.'
          : 'Dados ainda insuficientes para estimar esta característica.',
        items: includeProfessionalDetails ? rows.interactions.map((row: any) => ({
          interactionType: row.interactionType,
          representation: row.representation,
          motorDemand: row.motorDemand,
          sensoryLoad: row.sensoryLoad,
          count: this.number(row.count),
        })) : [],
      },
      professionalFeedback: includeProfessionalDetails ? rows.feedback.map((row: any) => ({
        rating: row.rating,
        count: this.number(row.count),
        reasonCodes: row.reasonCodes ?? [],
        label: 'Avaliação profissional',
      })) : undefined,
      evidenceState: sessions.length
        ? { status: 'AVAILABLE' as EvidenceStatus, message: 'Dados observados disponíveis.' }
        : { status: 'INSUFFICIENT_DATA' as EvidenceStatus, message: 'Dados ainda insuficientes.' },
    };
  }

  private sessionSql() { return `SELECT e."sessionId" AS "sessionId", MIN(e.timestamp)::date AS date,
    COUNT(*) FILTER (WHERE e."eventType" = 'ANSWER_SUBMITTED') AS answers,
    COUNT(*) FILTER (WHERE e."eventType" = 'ANSWER_SUBMITTED' AND e.correct = true) AS "correctAnswers",
    COUNT(DISTINCT e."activityId") FILTER (WHERE e."eventType" = 'ACTIVITY_COMPLETED') AS "activitiesCompleted",
    AVG(e."responseTimeMs") FILTER (WHERE e."eventType" = 'ANSWER_SUBMITTED' AND e."responseTimeMs" IS NOT NULL) AS "averageResponseTimeMs",
    COUNT(*) FILTER (WHERE e."eventType" = 'HINT_REQUESTED') AS hints,
    COUNT(*) FILTER (WHERE e."eventType" = 'INSTRUCTION_REPLAYED') AS "instructionReplays",
    COUNT(*) FILTER (WHERE e."eventType" = 'ACTIVITY_SKIPPED') AS skips,
    COUNT(*) FILTER (WHERE e."eventType" = 'ACTIVITY_SKIPPED' AND e.metadata->>'changeRequested' = 'true') AS "changeRequests"
    FROM learning_events e WHERE e."studentId" = $1 GROUP BY e."sessionId" ORDER BY MIN(e.timestamp)`; }
  private masterySql() { return `SELECT s.code AS "skillCode", k."masteryProbability", k.observations
    FROM student_skill_states k JOIN bncc_skills s ON s.id = k."skillId"
    WHERE k."studentId" = $1 ORDER BY s.code`; }
  private formatSql() { return `SELECT a.type, COUNT(*) AS count FROM learning_events e
    JOIN activities a ON a.id = e."activityId" WHERE e."studentId" = $1 AND e."eventType" = 'ACTIVITY_COMPLETED'
    GROUP BY a.type ORDER BY a.type`; }
  private outcomeSql() { return `SELECT status, COUNT(*) AS count FROM recommendation_outcomes
    WHERE "studentId" = $1 GROUP BY status ORDER BY status`; }
  private adaptationSql() { return `SELECT t."sessionId", d."recommendedBnccSkill" AS "targetSkill",
    p.title AS "previousActivity", p.type AS "previousFormat", r.title AS "replacementActivity", r.type AS "replacementFormat",
    t."sameBNCCSkill" AS "sameSkill", t."sameMathematicalConcept" AS "sameConcept",
    po.status AS "previousOutcome", ro.status AS "replacementOutcome", rd."fallbackUsed"
    FROM adaptation_transitions t LEFT JOIN ade_decisions d ON d.id = t."previousRecommendationId"
    LEFT JOIN activities p ON p.id = t."previousActivityId" LEFT JOIN activities r ON r.id = t."replacementActivityId"
    LEFT JOIN recommendation_outcomes po ON po."recommendationId" = t."previousRecommendationId"
    LEFT JOIN recommendation_outcomes ro ON ro."recommendationId" = t."replacementRecommendationId"
    LEFT JOIN ade_decisions rd ON rd.id = t."replacementRecommendationId"
    WHERE t."studentId" = $1 ORDER BY t."createdAt"`; }
  private feedbackSql() { return `SELECT rating, COUNT(*) AS count,
    COALESCE(jsonb_agg(DISTINCT reasons.code) FILTER (WHERE reasons.code IS NOT NULL), '[]'::jsonb) AS "reasonCodes"
    FROM professional_recommendation_feedback f LEFT JOIN LATERAL jsonb_array_elements_text(f."reasonCodes") reasons(code) ON true
    WHERE f."studentId" = $1 GROUP BY rating ORDER BY rating`; }
  private interactionSql() { return `SELECT "interactionType", representation, "motorDemand", "sensoryLoad", COUNT(*) AS count
    FROM interaction_evidence WHERE "studentId" = $1
    GROUP BY "interactionType", representation, "motorDemand", "sensoryLoad" ORDER BY count DESC`; }
  private number(value: unknown): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  private nullableNumber(value: unknown): number | null { return value === null || value === undefined ? null : this.number(value); }
  private nullableRatio(numerator: unknown, denominator: unknown): number | null {
    const total = this.number(denominator); return total ? this.number(numerator) / total : null;
  }
}
