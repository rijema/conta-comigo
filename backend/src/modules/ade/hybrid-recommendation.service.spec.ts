import { ConfigService } from '@nestjs/config';
import { HybridRecommendationService } from './hybrid-recommendation.service';

describe('HybridRecommendationService', () => {
  const service = new HybridRecommendationService(new ConfigService());
  const activity = (id: string, difficulty: 'easy' | 'medium' | 'hard') => ({
    id,
    difficulty,
    representation: ['pictorial'],
    interactionType: ['option_selection'],
    affordances: { requiresDragging: false, requiresReading: false, usesAudio: false, usesPictograms: true },
    difficultyProfile: {
      conceptualComplexity: difficulty.toUpperCase(),
      numericalMagnitude: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 10 : 18,
      abstractionLevel: difficulty.toUpperCase(),
      stepCount: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5,
      sensoryLoad: 'medium',
      motorDemand: 'medium',
      languageLoad: 'medium',
      visualComplexity: 'medium',
      distractorSimilarity: 'medium',
      representationLoad: 'medium',
    },
    content: {
      instructions: 'Answer the question.',
      instructionsPt: 'Responda à pergunta.',
      semantic: { structureId: `structure-${id}` },
    },
  } as any);
  const input = (candidates: any[], overrides: Record<string, unknown> = {}) => ({
    candidates,
    masteryProbability: 0.4,
    recentActivityIds: [],
    recentlyRejectedActivityIds: [],
    observedEvidenceTypes: [],
    semanticTrace: {
      ontologyVersion: '0.4.0',
      candidateDecisions: candidates.map((candidate) => ({
        activityId: candidate.id,
        included: true,
        reasons: ['Addresses target skill'],
        matchedConcepts: ['AdditionConcept'],
      })),
    },
    ...overrides,
  } as any);

  it('is deterministic and selects the highest-scoring semantically valid candidate', () => {
    const candidates = [activity('easy', 'easy'), activity('medium', 'medium')];
    const first = service.rank(input(candidates));
    const second = service.rank(input(candidates));

    expect(first).toEqual(second);
    expect(first.selectedActivityId).toBe(first.candidates[0].activityId);
    expect(first.decisionSource).toBe('HYBRID_RANKING');
  });

  it('does not automatically select the easiest activity', () => {
    const result = service.rank(input([
      activity('easy', 'easy'),
      activity('medium', 'medium'),
    ], { masteryProbability: 0.8 }));

    expect(result.selectedActivityId).toBe('medium');
  });

  it('keeps missing interaction evidence neutral and marks it', () => {
    const result = service.rank(input([activity('candidate', 'medium')]));

    expect(result.candidates[0].interactionFit).toBe(0.5);
    expect(result.candidates[0].insufficientEvidence).toContain('interactionEvidence');
  });

  it('penalizes a recently rejected exact activity without blacklisting its format', () => {
    const candidates = [activity('rejected', 'medium'), activity('same-format', 'medium')];
    const result = service.rank(input(candidates, {
      recentlyRejectedActivityIds: ['rejected'],
    }));

    expect(result.candidates.find((item) => item.activityId === 'rejected')!.rejectionRisk).toBe(1);
    expect(result.candidates.find((item) => item.activityId === 'same-format')!.rejectionRisk).toBe(0);
    expect(result.candidateIds).toContain('same-format');
  });

  it('returns an explicitly labeled fallback when no valid candidates are supplied', () => {
    const result = service.rank(input([]));

    expect(result.fallbackUsed).toBe(true);
    expect(result.decisionSource).toBe('LEGACY_FALLBACK');
    expect(result.fallbackReason).toBeTruthy();
  });

  it('uses explicit sensory and format preferences and records ranking evidence', () => {
    const low = { ...activity('low', 'medium'), type: 'quiz', targetModalities: ['visual'],
      accessibility: { sensoryLoad: 'low' } };
    const high = { ...activity('high', 'medium'), type: 'quiz', targetModalities: ['auditive'],
      accessibility: { sensoryLoad: 'high' } };
    const result = service.rank(input([low, high], {
      preferences: { lowStimulation: true, preferredModality: 'visual' },
    }));
    expect(result.selectedActivityId).toBe('low');
    expect(result.candidates[0]).toEqual(expect.objectContaining({ formatFit: 1 }));
    expect(result.candidates[0]).toEqual(expect.objectContaining({
      difficulty: 'medium', activityType: 'quiz',
    }));
    expect(result.evidenceUsed).toEqual(expect.objectContaining({
      lowStimulation: true, preferredModality: 'visual',
    }));
  });

  it('penalizes repeated structure and higher challenge after slow responses', () => {
    const repeated = { ...activity('repeated', 'hard'), type: 'quiz',
      content: { semantic: { structureId: 'same-structure' } } };
    const newFormat = { ...activity('new', 'easy'), type: 'counting',
      content: { semantic: { structureId: 'new-structure' } } };
    const result = service.rank(input([repeated, newFormat], {
      recentActivities: [{ activityId: 'previous', type: 'quiz',
        structureId: 'same-structure', isCorrect: true, timeSpentSeconds: 150 }],
    }));
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.selectedActivityId).toBe('new');
  });
});
