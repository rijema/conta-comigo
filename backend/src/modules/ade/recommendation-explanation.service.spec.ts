import { AdeDecision } from './entities/ade-decision.entity';
import { RecommendationExplanationService } from './recommendation-explanation.service';

describe('RecommendationExplanationService', () => {
  const service = new RecommendationExplanationService();
  const decision = {
    id: 'decision-1',
    userId: 'child-1',
    sessionId: 'session-1',
    recommendedDifficulty: 'easy',
    recommendedModality: 'visual',
    recommendedActivityType: 'quiz',
    recommendedBnccSkill: 'EF01MA08',
    xaiLog: {
      ontologyInferences: ['visual_support'],
      rulesFired: ['maintain_scaffolding'],
      mlPredictions: { masteryProbability: 0.42 },
      finalReason: 'BKT mastery=0.42 semanticFit=0.91',
      confidence: 0.83,
    },
    inputSnapshot: {
      recentAccuracy: 0.5,
      currentMastery: 0.42,
      shouldReduceStimulation: true,
      rawChildEvent: 'must-not-be-exposed',
    },
    createdAt: new Date('2026-09-07T12:00:00Z'),
  } as AdeDecision;

  it('creates four audience explanations from the same persisted decision', () => {
    const result = service.explain({ decision });

    expect(result.childExplanation).toContain('figuras');
    expect(result.guardianExplanation).toContain('EF01MA08');
    expect(result.professionalExplanation.bnccSkill).toBe('EF01MA08');
    expect(result.researchExplanation.recommendationId).toBe(decision.id);
  });

  it('keeps child and guardian explanations free of technical scores and terms', () => {
    const result = service.explain({ decision });
    const publicText = `${result.childExplanation} ${result.guardianExplanation}`;

    expect(publicText).not.toMatch(/BKT|semanticFit|ontology|confidence|0\.42|42%/i);
  });

  it('provides a readable professional explanation and optional details', () => {
    const explanation = service.explain({
      decision,
      learnerState: { recentActivityHistory: ['Quiz de adição concluído.'] },
    }).professionalExplanation;

    expect(explanation.summary).toContain('EF01MA08');
    expect(explanation.estimatedMastery).toContain('42%');
    expect(explanation.interactionEvidence[0]).toContain('50%');
    expect(explanation.supportConsiderations).toContain(
      'Reduzir estímulos durante a atividade.',
    );
    expect(explanation.recentActivityHistory).toEqual([
      'Quiz de adição concluído.',
    ]);
    expect(explanation.details.recommendedModality).toBe('visual');
  });

  it('returns the complete technical shape without inventing unavailable metrics', () => {
    const research = service.explain({ decision }).researchExplanation;

    expect(research.studentSkillState).toEqual({
      status: 'recorded',
      value: { masteryProbability: 0.42 },
    });
    expect(research.semanticInferences.status).toBe('recorded');
    expect(research.challengeFit.status).toBe('not_recorded');
    expect(research.interactionFit.status).toBe('not_recorded');
    expect(research.semanticFit.status).toBe('not_recorded');
    expect(research.novelty.status).toBe('not_recorded');
    expect(research.rejectionRisk.status).toBe('not_recorded');
    expect(research.finalScore.status).toBe('not_recorded');
    expect(research.candidateRanking.status).toBe('not_recorded');
    expect(research.ontologyCandidateTrace.status).toBe('not_recorded');
    expect(research.ontologyExclusionTrace.status).toBe('not_recorded');
    expect(research.weights.status).toBe('not_recorded');
    expect(research.ontologyVersion.status).toBe('not_recorded');
    expect(research.rankingVersion.status).toBe('not_recorded');
    expect(research.recommendationOutcome.status).toBe('not_recorded');
    expect(JSON.stringify(research)).not.toContain('must-not-be-exposed');
  });

  it('includes explicitly supplied semantic trace and outcome', () => {
    const research = service.explain({
      decision,
      outcome: { selectedActivityId: 'activity-1', completed: true },
      semanticTrace: {
        challengeFit: 0.7,
        candidateRanking: [{ activityId: 'activity-1', position: 1 }],
        weights: { challenge: 1 },
        ontologyVersion: 'test-ontology',
        rankingVersion: 'test-ranking',
      },
    }).researchExplanation;

    expect(research.challengeFit).toEqual({ status: 'recorded', value: 0.7 });
    expect(research.candidateRanking.status).toBe('recorded');
    expect(research.recommendationOutcome.status).toBe('recorded');
  });
});
