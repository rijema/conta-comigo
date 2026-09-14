import { LongitudinalLearningAnalyticsService } from './longitudinal-learning-analytics.service';

describe('LongitudinalLearningAnalyticsService', () => {
  const service = new LongitudinalLearningAnalyticsService({} as any);
  const emptyRows = {
    sessions: [], mastery: [], formats: [], outcomes: [], adaptations: [], feedback: [], interactions: [],
  };

  it('keeps missing evidence distinct from a zero result', () => {
    const report = service.assemble(emptyRows);
    expect(report.observedData.accuracy).toBeNull();
    expect(report.observedData.recommendationSummary.completionRate).toBeNull();
    expect(report.longitudinal.trendStatus).toBe('INSUFFICIENT_DATA');
    expect(report.evidenceState.status).toBe('INSUFFICIENT_DATA');
  });

  it('calculates observed longitudinal metrics and labels BKT as an estimate', () => {
    const report = service.assemble({
      ...emptyRows,
      sessions: [
        { sessionId: 's1', date: '2026-09-01', answers: '2', correctAnswers: '1', activitiesCompleted: '1', averageResponseTimeMs: '800', hints: '1', instructionReplays: '0', skips: '0', changeRequests: '0' },
        { sessionId: 's2', date: '2026-09-02', answers: '3', correctAnswers: '3', activitiesCompleted: '2', averageResponseTimeMs: '600', hints: '0', instructionReplays: '1', skips: '1', changeRequests: '1' },
      ],
      mastery: [{ skillCode: 'EF01MA06', observations: '5', masteryProbability: '0.72' }],
      outcomes: [{ status: 'COMPLETED', count: '3' }, { status: 'SKIPPED', count: '1' }],
    });
    expect(report.observedData.accuracy).toBe(0.8);
    expect(report.observedData.activitiesCompleted).toBe(3);
    expect(report.observedData.recommendationSummary.completionRate).toBe(0.75);
    expect(report.observedData.recommendationSummary.skipRate).toBe(0.25);
    expect(report.observedData.recommendationSummary.changeRequestRate).toBe(0.25);
    expect(report.learningProgress.masteryEstimates[0]).toMatchObject({
      skillCode: 'EF01MA06', observations: 5, status: 'AVAILABLE', estimatedMastery: 0.72,
    });
    expect(report.longitudinal.trendStatus).toBe('AVAILABLE');
    expect(report.longitudinal.trendMessage).toContain('não demonstra melhora');
  });

  it('removes technical model values and traces from the guardian projection', async () => {
    const dataSource = { query: jest.fn() } as any;
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ skillCode: 'EF01MA06', observations: '2', masteryProbability: '0.8' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const guardian = await new LongitudinalLearningAnalyticsService(dataSource).getGuardianReport('child-1');
    expect(JSON.stringify(guardian)).not.toContain('masteryProbability');
    expect(JSON.stringify(guardian)).not.toContain('estimatedMastery');
    expect(JSON.stringify(guardian)).not.toContain('semantic');
    expect(guardian.learningProgress.skillsInDevelopment[0].state).toBe('Habilidade em desenvolvimento');
    expect(dataSource.query).toHaveBeenCalledTimes(7);
  });

  it('summarizes adaptations and labels professional feedback as evaluation', () => {
    const report = service.assemble({
      ...emptyRows,
      adaptations: [{
        sessionId: 's1', targetSkill: 'EF01MA08', previousActivity: 'Drag', previousFormat: 'drag_drop',
        replacementActivity: 'Choice', replacementFormat: 'multiple_choice', sameSkill: true,
        sameConcept: true, previousOutcome: 'SKIPPED', replacementOutcome: 'COMPLETED', fallbackUsed: false,
      }],
      feedback: [{ rating: 'ADEQUATE', count: '2', reasonCodes: ['FORMAT_HELPED'] }],
    });
    expect(report.adaptations.sameSkillReplacements).toBe(1);
    expect(report.adaptations.items[0]).toMatchObject({ targetSkill: 'EF01MA08', replacementOutcome: 'COMPLETED' });
    expect(report.professionalFeedback[0]).toMatchObject({
      rating: 'ADEQUATE', count: 2, reasonCodes: ['FORMAT_HELPED'], label: 'Avaliação profissional',
    });
  });
});
