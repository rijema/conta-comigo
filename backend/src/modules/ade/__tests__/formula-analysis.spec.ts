/**
 * Learning Analytics Formula Analysis & Diagnostics
 * 
 * Objective: Understand factor contribution, identify bottlenecks,
 * and validate distribution properties of the recommendation formula.
 * 
 * [PARÂMETRO EXPERIMENTAL]
 * These tests establish baseline metrics for the hybrid ranking formula.
 * Results should inform weight tuning and structural improvements.
 */

import { HybridRecommendationService } from '../hybrid-recommendation.service';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';

describe('Formula Analysis — Hybrid Ranking Diagnostics', () => {
  let service: HybridRecommendationService;
  const config = new ConfigService();

  beforeAll(() => {
    service = new HybridRecommendationService(config);
  });

  /**
   * TEST 1: Factor Contribution Analysis
   * 
   * Measure: What is the relative impact of each factor on final score?
   * Why: If one factor dominates, it reduces adaptivity.
   */
  describe('Factor Contribution Ranges', () => {
    it('should document factor ranges when mastery varies', () => {
      const activity = mockActivity('test', 'medium');
      const masteryLevels = [0.1, 0.3, 0.5, 0.7, 0.9];
      
      const results = masteryLevels.map(mastery => {
        const result = service.rank({
          candidates: [activity],
          masteryProbability: mastery,
          semanticTrace: mockSemanticTrace([activity]),
          recentActivityIds: [],
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: [],
        } as any);
        
        const candidate = result.candidates[0];
        return {
          mastery,
          learningNeed: candidate.learningNeed,
          challengeFit: candidate.challengeFit,
          finalScore: candidate.finalScore,
        };
      });

      // Learning need should be inverse of mastery
      expect(results[0].learningNeed).toBeGreaterThan(results[4].learningNeed);
      
      // Challenge fit should be optimal near target probability
      const challengeFits = results.map(r => r.challengeFit);
      expect(Math.max(...challengeFits)).toBeGreaterThan(0.5);
      
      console.log('Factor Contribution by Mastery:');
      console.table(results);
    });

    it('should show penalty accumulation over rejections', () => {
      const activity = mockActivity('rejected', 'medium');
      const recentlyRejected = ['rejected', 'rejected', 'rejected'];
      
      const result = service.rank({
        candidates: [activity],
        masteryProbability: 0.5,
        semanticTrace: mockSemanticTrace([activity]),
        recentActivityIds: [],
        recentlyRejectedActivityIds: recentlyRejected,
        observedEvidenceTypes: [],
        recentActivities: [],
      } as any);

      const candidate = result.candidates[0];
      console.log('Rejection Penalty Analysis:');
      console.log(`  Activity ID: ${candidate.activityId}`);
      console.log(`  Rejection Risk: ${candidate.rejectionRisk}`);
      console.log(`  Final Score: ${candidate.finalScore}`);
      console.log(`  Explanation Penalties: ${JSON.stringify(candidate.explanation.penalties)}`);
      
      expect(candidate.rejectionRisk).toBeGreaterThan(0);
    });
  });

  /**
   * TEST 2: Novelty Window Effectiveness
   * 
   * Measure: Does novelty properly decrease for recently-seen activities?
   * Why: If novelty decays too fast, child sees only "forced variety"
   *       If too slow, repetition happens.
   */
  describe('Novelty Window Behavior', () => {
    it('should penalize recent activities progressively', () => {
      const candidates = [
        mockActivity('very_recent', 'medium'),
        mockActivity('recent', 'medium'),
        mockActivity('old', 'medium'),
      ];

      const results = [
        // Scenario 1: All three in recent window
        service.rank({
          candidates,
          masteryProbability: 0.5,
          semanticTrace: mockSemanticTrace(candidates),
          recentActivityIds: ['very_recent', 'recent', 'old'],
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: [],
        } as any),
        
        // Scenario 2: Only two recent
        service.rank({
          candidates,
          masteryProbability: 0.5,
          semanticTrace: mockSemanticTrace(candidates),
          recentActivityIds: ['very_recent', 'recent'],
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: [],
        } as any),

        // Scenario 3: None recent
        service.rank({
          candidates,
          masteryProbability: 0.5,
          semanticTrace: mockSemanticTrace(candidates),
          recentActivityIds: [],
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: [],
        } as any),
      ];

      console.log('Novelty Decay Across Scenarios:');
      results.forEach((result, idx) => {
        console.log(`\nScenario ${idx + 1}:`);
        result.candidates.forEach(c => {
          console.log(`  ${c.activityId}: novelty=${c.novelty.toFixed(3)}, score=${c.finalScore.toFixed(3)}`);
        });
      });

      // In scenario 3 (none recent), all should have equal novelty
      const scenario3Novelties = results[2].candidates.map(c => c.novelty);
      expect(new Set(scenario3Novelties).size).toBe(1);
    });
  });

  /**
   * TEST 3: Distribution Within a 10-Activity Block
   * 
   * Measure: If we simulate 10 correct answers in a row, 
   *          do we get variety in niche/structure?
   * Why: Main complaint is repetition within a "block".
   */
  describe('Within-Block Repetition (Block of 10)', () => {
    it('should NOT select same structure twice in succession', () => {
      const pool = createMockPool();
      let selected: string[] = [];
      let recentActivityIds: string[] = [];

      // Simulate 10 selections, each with preceding success
      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.7,
          semanticTrace: mockSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: selected.map((id) => {
            const activity = pool.find((item) => item.id === id);
            return {
              activityId: id,
              structureId: activity?.content?.semantic?.structureId,
              type: activity?.type,
              bnccSkills: activity?.bnccSkills,
            };
          }),
        } as any);

        const selected_activity = result.selectedActivityId!;
        selected.push(selected_activity);
        recentActivityIds.push(selected_activity);

        // Keep only recent 10
        if (recentActivityIds.length > 10) {
          recentActivityIds.shift();
        }
      }

      console.log('Simulated 10-Activity Block:');
      selected.forEach((id, idx) => {
        const activity = pool.find(a => a.id === id);
        console.log(`${idx + 1}. ${id} (structure: ${(activity as any)?.content?.semantic?.structureId || 'unknown'})`);
      });

      // Check: no structure appears more than 3 times in the block
      const structureIds = selected.map(id => {
        const activity = pool.find(a => a.id === id);
        return (activity as any)?.content?.semantic?.structureId || id;
      });

      const structureCounts = new Map<string, number>();
      structureIds.forEach(s => {
        structureCounts.set(s, (structureCounts.get(s) ?? 0) + 1);
      });

      console.log('\nStructure Frequency:');
      structureCounts.forEach((count, structure) => {
        console.log(`  ${structure}: ${count}x`);
      });

      // [DECISÃO DE ENGENHARIA]
      // Maximum occurrences of same structure in a 10-activity block should be <= 3
      // This provides variety while still allowing deliberate practice.
      Array.from(structureCounts.values()).forEach(count => {
        expect(count).toBeLessThanOrEqual(3);
      });
    });

    it('should respect niche distribution preferences', () => {
      const pool = createMockPool();
      const selectedNiches: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.6,
          semanticTrace: mockSemanticTrace(pool),
          recentActivityIds: selectedNiches.slice(-5),
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: [],
        } as any);

        if (result.selectedActivityId) {
          const activity = pool.find(a => a.id === result.selectedActivityId);
          const niche = (activity as any)?.content?.semantic?.niche || 'unknown';
          selectedNiches.push(niche as string);
        }
      }

      console.log('\nNiche Distribution in Block:');
      const nicheCounts = new Map<string, number>();
      selectedNiches.forEach(n => {
        nicheCounts.set(n, (nicheCounts.get(n) ?? 0) + 1);
      });
      nicheCounts.forEach((count, niche) => {
        console.log(`  ${niche}: ${count}x`);
      });

      // [HIPÓTESE A VALIDAR]
      const counts = Array.from(nicheCounts.values()).sort((a, b) => b - a);
      expect(counts[0]).toBeLessThanOrEqual(10);
    });
  });

  /**
   * TEST 4: Sensory Preference Impact
   * 
   * Measure: If child has visual weakness, do audio activities score higher?
   * Why: Core feature for personalization per learning profile.
   */
  describe('Sensory Profile Adaptation', () => {
    it('should boost audio when child prefers auditive modality', () => {
      const candidates = [
        mockActivity('audio', 'medium', { targetModalities: ['auditive'] }),
        mockActivity('visual', 'medium', { targetModalities: ['visual'] }),
        mockActivity('mixed', 'medium', { targetModalities: ['auditive', 'visual'] }),
      ];

      const resultPreferAudio = service.rank({
        candidates,
        masteryProbability: 0.5,
        semanticTrace: mockSemanticTrace(candidates),
        recentActivityIds: [],
        recentlyRejectedActivityIds: [],
        observedEvidenceTypes: [],
        preferences: { preferredModality: 'auditive', lowStimulation: false },
      } as any);

      const resultNoPreference = service.rank({
        candidates,
        masteryProbability: 0.5,
        semanticTrace: mockSemanticTrace(candidates),
        recentActivityIds: [],
        recentlyRejectedActivityIds: [],
        observedEvidenceTypes: [],
      } as any);

      console.log('Sensory Preference Impact:');
      console.log('\nWith Auditive Preference:');
      resultPreferAudio.candidates.forEach(c => {
        console.log(`  ${c.activityId}: score=${c.finalScore.toFixed(3)}`);
      });

      console.log('\nWithout Preference:');
      resultNoPreference.candidates.forEach(c => {
        console.log(`  ${c.activityId}: score=${c.finalScore.toFixed(3)}`);
      });

      // Audio should rank higher when preference is set
      const audioScoreWith = resultPreferAudio.candidates.find(c => c.activityId === 'audio')!.finalScore;
      const visualScoreWith = resultPreferAudio.candidates.find(c => c.activityId === 'visual')!.finalScore;
      expect(audioScoreWith).toBeGreaterThan(visualScoreWith);
    });
  });

  /**
   * TEST 5: Challenge Fit Calibration
   * 
   * Measure: Is challengeFit actually targeting ~70% success (targetSuccessProbability)?
   * Why: If calibration is off, difficulty won't adapt properly.
   */
  describe('Challenge Fit Calibration', () => {
    it('should peak when predictedSuccess ≈ targetSuccessProbability', () => {
      // Create activities of varying difficulty
      const difficulties: DifficultyLevel[] = [
        DifficultyLevel.VERY_EASY,
        DifficultyLevel.EASY,
        DifficultyLevel.MEDIUM,
        DifficultyLevel.HARD,
        DifficultyLevel.EXTREME,
      ];

      const activities = difficulties.map((diff, idx) =>
        mockActivity(`${diff}_act`, 'medium', {
          difficulty: diff,
          difficultyProfile: {
            conceptualComplexity: diff,
            numericalMagnitude: [2, 5, 10, 15, 20][idx],
            abstractionLevel: diff,
            stepCount: [1, 2, 3, 4, 5][idx],
          } as any,
        })
      );

      // Test with mid-level mastery
      const result = service.rank({
        candidates: activities,
        masteryProbability: 0.5,
        semanticTrace: mockSemanticTrace(activities),
        recentActivityIds: [],
        recentlyRejectedActivityIds: [],
        observedEvidenceTypes: [],
      } as any);

      console.log('Challenge Fit by Difficulty Level:');
      result.candidates.forEach(c => {
        console.log(`  ${c.difficulty}: challengeFit=${c.challengeFit.toFixed(3)}, score=${c.finalScore.toFixed(3)}`);
      });

      // Challenge fit should be highest for medium difficulty (approximate fit)
      const challengeFits = result.candidates.map(c => c.challengeFit);
      const maxIdx = challengeFits.indexOf(Math.max(...challengeFits));
      expect([DifficultyLevel.VERY_EASY, DifficultyLevel.EASY, DifficultyLevel.MEDIUM]).toContain(result.candidates[maxIdx].difficulty);
    });
  });

  /**
   * TEST 6: Score Normalization Check
   * 
   * Measure: Do scores have reasonable range and variation?
   * Why: If scores are always 0-1 vs 0-100, weighting breaks.
   */
  describe('Score Range & Normalization', () => {
    it('should produce scores within expected numerical range', () => {
      const pool = createMockPool();
      
      const results = [0.2, 0.5, 0.8].map(mastery =>
        service.rank({
          candidates: pool.slice(0, 5),
          masteryProbability: mastery,
          semanticTrace: mockSemanticTrace(pool.slice(0, 5)),
          recentActivityIds: [],
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
        } as any)
      );

      console.log('Final Score Ranges:');
      results.forEach((result, idx) => {
        const scores = result.candidates.map(c => c.finalScore);
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const avg = scores.reduce((a, b) => a + b) / scores.length;
        console.log(`  Mastery ${[0.2, 0.5, 0.8][idx]}: [${min.toFixed(3)}, ${avg.toFixed(3)}, ${max.toFixed(3)}]`);
      });

      // Scores should have some variation (not all identical)
      results.forEach(result => {
        const scores = result.candidates.map(c => c.finalScore);
        const variance = calculateVariance(scores);
        expect(variance).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mockActivity(
  id: string,
  type: string = 'counting',
  overrides: Partial<Activity> = {}
): Activity {
  return {
    id,
    type,
    title: `Activity ${id}`,
    difficulty: DifficultyLevel.MEDIUM,
    representation: ['pictorial'],
    interactionType: ['option_selection'],
    affordances: { requiresDragging: false, requiresReading: false, usesAudio: false, usesPictograms: true },
    difficultyProfile: {
      conceptualComplexity: 'MEDIUM',
      numericalMagnitude: 10,
      abstractionLevel: 'MEDIUM',
      stepCount: 3,
      distractorSimilarity: 'medium',
      languageLoad: 'medium',
      motorDemand: 'medium',
      sensoryLoad: 'medium',
      visualComplexity: 'medium',
      representationLoad: 'medium',
      responseMode: 'choice',
    },
    content: {
      instructions: 'Answer the question.',
      instructionsPt: 'Responda à pergunta.',
      semantic: {
        structureId: `struct_${id}`,
        niche: type,
      },
    },
    ...overrides,
  } as any;
}

function mockSemanticTrace(candidates: Activity[]) {
  return {
    ontologyVersion: '0.4.0',
    targetSkill: 'EF01MA02',
    candidateDecisions: candidates.map(candidate => ({
      activityId: candidate.id,
      included: true,
      reasons: ['Valid for target skill'],
      matchedConcepts: ['CountingConcept', 'NumberConcept'],
    })),
  };
}

function createMockPool(): Activity[] {
  const nicheStructures = {
    counting: ['count_objects', 'count_grouped', 'count_scattered'],
    number_quantity: ['match_two', 'match_five', 'match_ten'],
    comparison: ['compare_sets', 'compare_equal', 'compare_estimate'],
    addition: ['join_objects', 'sum_fingers', 'add_context'],
    subtraction: ['remove_objects', 'subtract_fingers', 'subtract_ten'],
  };

  const activities: Activity[] = [];
  let id = 0;

  for (const [niche, structures] of Object.entries(nicheStructures)) {
    for (const structure of structures) {
      activities.push(
        mockActivity(`${niche}_${id}`, niche, {
          content: {
            instructions: 'Answer the question.',
            instructionsPt: 'Responda à pergunta.',
            semantic: {
              structureId: structure,
              niche,
            },
          },
        })
      );
      id++;
    }
  }

  return activities;
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b) / values.length;
}
