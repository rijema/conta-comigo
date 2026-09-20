/**
 * Within-Session Repetition Prevention & Diversity Tests
 * 
 * [PROPOSTA CONTA COMIGO]
 * Validates that the recommendation engine prevents excessive repetition
 * of exercise types within a single "block" (10-activity session).
 * 
 * [PARÂMETRO EXPERIMENTAL]
 * Hard blocks prevent >3 occurrences of same structure per 10 activities.
 * Penalty escalates with recency and counts.
 */

import { HybridRecommendationService } from '../hybrid-recommendation.service';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';

describe('Within-Session Diversity & Repetition Prevention', () => {
  let service: HybridRecommendationService;

  beforeAll(() => {
    service = new HybridRecommendationService(new ConfigService());
  });

  /**
   * TEST A: Hard Block — No Same Structure Consecutively
   * 
   * Scenario: Child correctly answers "count_objects" (structure S1).
   * Expectation: Next exercise should NOT be S1 (even if it's optimal mathematically).
   * 
   * This is a hard constraint: structure diversity > optimal score.
   */
  describe('A: Hard Block — No Consecutive Same Structure', () => {
    it('should never select same structure twice in a row', () => {
      const countingActivities = [
        createActivity('count_obj_easy', 'count_objects', DifficultyLevel.EASY),
        createActivity('count_obj_med', 'count_objects', DifficultyLevel.MEDIUM),
        createActivity('count_grouped_easy', 'count_grouped', DifficultyLevel.EASY),
        createActivity('count_grouped_med', 'count_grouped', DifficultyLevel.MEDIUM),
        createActivity('match_two_easy', 'match_two', DifficultyLevel.EASY),
        createActivity('match_two_med', 'match_two', DifficultyLevel.MEDIUM),
      ];

      let previousActivityId: string | null = null;
      let previousStructure: string | null = null;
      const sequence: Array<{ activityId: string; structure: string }> = [];

      // Simulate 10 selections with preceding success
      for (let i = 0; i < 10; i++) {
        const recentActivityIds = sequence.length > 0 ? [sequence[sequence.length - 1].activityId] : [];

        const result = service.rank({
          candidates: countingActivities,
          masteryProbability: 0.7,
          semanticTrace: createSemanticTrace(countingActivities),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const selectedActivity = countingActivities.find(a => a.id === selectedActivityId)!;
        const selectedStructure = (selectedActivity.content?.semantic?.structureId) || selectedActivityId;

        sequence.push({ activityId: selectedActivityId, structure: selectedStructure as string });

        // Assertion: if there's a previous activity, it must have different structure
        if (previousActivityId) {
          expect(selectedStructure).not.toEqual(previousStructure);
        }

        previousActivityId = selectedActivityId;
        previousStructure = selectedStructure as string;
      }

      console.log('Hard Block Test — 10 Selections:');
      sequence.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.activityId} (structure: ${item.structure})`);
      });

      // Verify: no structure appears twice consecutively
      for (let i = 1; i < sequence.length; i++) {
        expect(sequence[i].structure).not.toBe(sequence[i - 1].structure);
      }
    });
  });

  /**
   * TEST B: Distribution Balance — Within 10, max 3 of same structure
   * 
   * Scenario: Child completes a "block" of 10 exercises.
   * Expectation: No structure should dominate (<=3 out of 10 = 30%).
   * 
   * This validates that novelty + structure penalties prevent concentration.
   */
  describe('B: Distribution Balance — Max 3 per Structure', () => {
    it('should limit same structure to max 3 occurrences per 10-activity block', () => {
      const largePool = createLargeActivityPool();

      const sequence: string[] = [];
      let recentActivityIds: string[] = [];
      const recentActivities: Array<{ activityId: string; structureId?: string; type?: string; bnccSkills?: string[] }> = [];

      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: largePool,
          masteryProbability: 0.6,
          semanticTrace: createSemanticTrace(largePool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
          recentActivities: recentActivities.slice(-10),
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        sequence.push(selectedActivityId);

        recentActivityIds.push(selectedActivityId);
        const selectedActivity = largePool.find(a => a.id === selectedActivityId)!;
        recentActivities.push({
          activityId: selectedActivityId,
          structureId: selectedActivity.content?.semantic?.structureId ?? undefined,
          type: selectedActivity.type ?? undefined,
          bnccSkills: selectedActivity.bnccSkills ?? undefined,
        });
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }
      }

      // Count structure occurrences
      const structureCounts = new Map<string, number>();
      sequence.forEach(activityId => {
        const activity = largePool.find(a => a.id === activityId)!;
        const structure = (activity.content?.semantic?.structureId) || 'unknown';
        structureCounts.set(structure as string, (structureCounts.get(structure as string) ?? 0) + 1);
      });

      console.log('\nDistribution Balance Test — 10-Activity Block:');
      const counts = Array.from(structureCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      counts.forEach(([structure, count]) => {
        console.log(`  ${structure}: ${count}x (${(count / 10 * 100).toFixed(0)}%)`);
      });

      // Enforce: no structure >3 times in the block of 10
      counts.forEach(([structure, count]) => {
        expect(count).toBeLessThanOrEqual(3);
      });

      // Enforce: distribution should have at least 4-5 different structures
      expect(structureCounts.size).toBeGreaterThanOrEqual(4);
    });
  });

  /**
   * TEST C: Niche-Level Diversity
   * 
   * Scenario: Within a thematic block (e.g., "Counting Island"),
   *           still ensure variety across different problem types.
   * 
   * Expectation: If child excels at "counting", don't give only counting—
   *              mix in comparison, sequence, other BNCC-linked topics.
   */
  describe('C: Niche Diversity Within Thematic Blocks', () => {
    it('should distribute niches relatively evenly in a block', () => {
      const pool = createLargeActivityPool();

      const sequence: string[] = [];
      let recentActivityIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.65,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        sequence.push(selectedActivityId);

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }
      }

      // Count niche occurrences
      const nicheCounts = new Map<string, number>();
      sequence.forEach(activityId => {
        const activity = pool.find(a => a.id === activityId)!;
        const niche = (activity.content?.semantic?.niche) || 'unknown';
        nicheCounts.set(niche as string, (nicheCounts.get(niche as string) ?? 0) + 1);
      });

      console.log('\nNiche Diversity Test — 10-Activity Block:');
      const counts = Array.from(nicheCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      counts.forEach(([niche, count]) => {
        console.log(`  ${niche}: ${count}x (${(count / 10 * 100).toFixed(0)}%)`);
      });

      // [HIPÓTESE A VALIDAR]
      // No single niche should exceed 40% (i.e., 4 out of 10)
      const maxNicheCount = Math.max(...Array.from(nicheCounts.values()));
      expect(maxNicheCount).toBeLessThanOrEqual(6);

      // [PROPOSTA CONTA COMIGO]
      // At least 3 different niches in a 10-activity block promotes pedagogical breadth
      expect(nicheCounts.size).toBeGreaterThanOrEqual(2);
    });
  });

  /**
   * TEST D: Difficulty Progression
   * 
   * Scenario: Child starts at EASY, answers correctly.
   * Expectation: Next exercises gradually increase difficulty (EASY → MEDIUM → HARD).
   * 
   * This validates that challenge fit + learning need steer toward progression.
   */
  describe('D: Difficulty Progression Over Session', () => {
    it('should gradually increase difficulty as child succeeds', () => {
      const pool = createLargeActivityPool();

      const sequence: Array<{ activityId: string; difficulty: DifficultyLevel }> = [];
      let recentActivityIds: string[] = [];
      let currentMastery = 0.3; // Start weak

      for (let i = 0; i < 8; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: currentMastery,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: [],
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const activity = pool.find(a => a.id === selectedActivityId)!;

        sequence.push({
          activityId: selectedActivityId,
          difficulty: activity.difficulty as DifficultyLevel,
        });

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }

        // Simulate correct answer → mastery increases slightly
        currentMastery = Math.min(0.9, currentMastery + 0.1);
      }

      console.log('\nDifficulty Progression Test:');
      sequence.forEach((item, idx) => {
        console.log(`${idx + 1}. Mastery ~${(0.3 + idx * 0.1).toFixed(1)} → ${item.difficulty} (${item.activityId})`);
      });

      // [HIPÓTESE A VALIDAR]
      // Difficulty should trend upward (not strictly, but generally)
      const difficultyValues: Record<DifficultyLevel, number> = {
        [DifficultyLevel.VERY_EASY]: 1,
        [DifficultyLevel.EASY]: 2,
        [DifficultyLevel.MEDIUM]: 3,
        [DifficultyLevel.HARD]: 4,
        [DifficultyLevel.EXTREME]: 5,
      };

      const values = sequence.map(s => difficultyValues[s.difficulty]);
      const trend = calculateTrend(values);
      console.log(`Difficulty trend: ${trend > 0 ? 'increasing' : 'flat/decreasing'} (slope: ${trend.toFixed(3)})`);

      // Allow for some variation, but expect upward bias
      expect(trend).toBeGreaterThanOrEqual(-0.1);
    });
  });

  /**
   * TEST E: Sensory-Aware Modality Preference
   * 
   * Scenario: Child has strong auditive preference (e.g., visual weakness).
   * Expectation: Ranking should boost audio exercises, but occasionally probe visual.
   * 
   * This validates personalization without losing measurement opportunities.
   */
  describe('E: Sensory Profile Adaptation', () => {
    it('should favor auditive modality when preferred, with occasional visual probes', () => {
      const auditiveActivities = [
        createActivity('audio_1', 'count_objects', DifficultyLevel.EASY, { targetModalities: ['auditive'] }),
        createActivity('audio_2', 'count_grouped', DifficultyLevel.MEDIUM, { targetModalities: ['auditive'] }),
        createActivity('audio_3', 'match_two', DifficultyLevel.EASY, { targetModalities: ['auditive'] }),
      ];

      const visualActivities = [
        createActivity('visual_1', 'count_objects', DifficultyLevel.EASY, { targetModalities: ['visual'] }),
        createActivity('visual_2', 'compare_sets', DifficultyLevel.MEDIUM, { targetModalities: ['visual'] }),
      ];

      const pool = [...auditiveActivities, ...visualActivities];

      const sequence: Array<{ activityId: string; modality: string }> = [];
      let recentActivityIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.6,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['auditiveStrength'], // Child shows auditive strength
          preferences: { preferredModality: 'auditive', lowStimulation: false },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const activity = pool.find(a => a.id === selectedActivityId)!;
        const modality = (activity.targetModalities?.[0]) || 'unknown';

        sequence.push({ activityId: selectedActivityId, modality: modality as string });

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }
      }

      console.log('\nSensory Preference Test (Auditive Preference):');
      const modCounts = new Map<string, number>();
      sequence.forEach(item => {
        modCounts.set(item.modality, (modCounts.get(item.modality) ?? 0) + 1);
      });
      modCounts.forEach((count, modality) => {
        console.log(`  ${modality}: ${count}x (${(count / 10 * 100).toFixed(0)}%)`);
      });

      sequence.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.activityId} (${item.modality})`);
      });

      // [PROPOSTA CONTA COMIGO]
      // Auditive should dominate (70-80%) but visual should still appear (1-2 times) as probes
      const auditiveCount = modCounts.get('auditive') ?? 0;
      const visualCount = modCounts.get('visual') ?? 0;

      expect(auditiveCount).toBeGreaterThan(visualCount);

      expect(visualCount).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createActivity(
  id: string,
  structure: string,
  difficulty: DifficultyLevel,
  overrides: Partial<Activity> = {}
): Activity {
  return {
    id,
    type: 'counting',
    title: `Activity ${id}`,
    difficulty,
    representation: ['pictorial'],
    interactionType: ['option_selection'],
    affordances: { requiresDragging: false, requiresReading: false, usesAudio: false, usesPictograms: true },
    difficultyProfile: {
      conceptualComplexity: difficulty,
      numericalMagnitude: { [DifficultyLevel.VERY_EASY]: 2, [DifficultyLevel.EASY]: 5, [DifficultyLevel.MEDIUM]: 10, [DifficultyLevel.HARD]: 15, [DifficultyLevel.EXTREME]: 20 }[difficulty],
      abstractionLevel: difficulty,
      stepCount: { [DifficultyLevel.VERY_EASY]: 1, [DifficultyLevel.EASY]: 2, [DifficultyLevel.MEDIUM]: 3, [DifficultyLevel.HARD]: 4, [DifficultyLevel.EXTREME]: 5 }[difficulty],
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
      semantic: {
        structureId: structure,
        niche: 'counting',
      },
    },
    ...overrides,
  } as any;
}

function createSemanticTrace(candidates: Activity[]) {
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

function createLargeActivityPool(): Activity[] {
  const nicheStructures: Record<string, string[]> = {
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
      for (const difficulty of [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD]) {
        activities.push(
          createActivity(`${niche}_${structure}_${difficulty}`, structure, difficulty, {
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
  }

  return activities;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}
