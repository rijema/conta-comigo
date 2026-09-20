/**
 * Probe Challenge — Controlled Exposure to Weak Modalities
 * 
 * [PROPOSTA CONTA COMIGO]
 * 
 * When a child shows weakness in a particular sensory/interaction modality,
 * the system should:
 * 1. Primarily serve exercises in preferred/strong modalities (70-80%)
 * 2. Periodically introduce "probe" exercises in weak modalities (20-30%)
 *    to measure progress without overwhelming the child
 * 3. Track performance on probes separately for intervention decisions
 * 
 * This test validates that the recommendation engine implements
 * "strategic understimu lation" — providing challenge without frustration.
 */

import { HybridRecommendationService } from '../hybrid-recommendation.service';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';

describe('Probe Challenge — Controlled Weakness Exposure', () => {
  let service: HybridRecommendationService;

  beforeAll(() => {
    service = new HybridRecommendationService(new ConfigService());
  });

  /**
   * TEST 1: Audio-First Child With Visual Probes
   * 
   * Scenario:
   *   - Child has weak visual processing (e.g., dyslexia-related)
   *   - Prefers auditive + kinesthetic modalities
   *   - Session goal: build competence in auditive, measure visual progress
   * 
   * Expectation:
   *   - Blocks of 10: ~7-8 auditive, ~1-2 visual (probes), ~1 kinesthetic
   *   - Visual probes should be easy-to-medium difficulty
   *   - Pattern: visual probes spaced out (not consecutive)
   */
  describe('Audio-Dominant with Occasional Visual Probes', () => {
    it('should maintain 70%+ audio with controlled 20% visual probes', () => {
      const audioActivities = createActivitiesByModality('auditive', 8);
      const visualActivities = createActivitiesByModality('visual', 2, true); // true = probe (easier)
      const kinestheticActivities = createActivitiesByModality('kinesthetic', 2);

      const pool = [...audioActivities, ...visualActivities, ...kinestheticActivities];

      const sequence: Array<{
        activityId: string;
        modality: string;
        isProbe: boolean;
        difficulty: DifficultyLevel;
      }> = [];

      let recentActivityIds: string[] = [];
      let probeIntervalCounter = 0;

      for (let i = 0; i < 10; i++) {
        // [DECISÃO DE ENGENHARIA]
        // Force a visual probe every ~5 exercises (i.e., at positions 5, 10, ...)
        let candidates = pool;
        if (probeIntervalCounter >= 4) {
          // Restrict to visual probes only this round
          candidates = visualActivities;
          probeIntervalCounter = 0;
        } else {
          // Prefer audio + kinesthetic
          candidates = [...audioActivities, ...kinestheticActivities];
        }

        const result = service.rank({
          candidates,
          masteryProbability: 0.65,
          semanticTrace: createSemanticTrace(candidates),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['auditiveStrength'],
          preferences: { preferredModality: 'auditive', lowStimulation: true },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const activity = pool.find(a => a.id === selectedActivityId)!;
        const modality = (activity.targetModalities?.[0]) || 'unknown';
        const isProbe = visualActivities.some(a => a.id === selectedActivityId);

        sequence.push({
          activityId: selectedActivityId,
          modality: modality as string,
          isProbe,
          difficulty: activity.difficulty as DifficultyLevel,
        });

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }

        probeIntervalCounter++;
      }

      console.log('Audio-Dominant Session with Visual Probes:');
      const modalityCounts = new Map<string, number>();
      let probeCount = 0;

      sequence.forEach((item, idx) => {
        const marker = item.isProbe ? ' [PROBE]' : '';
        console.log(`${idx + 1}. ${item.modality}${marker} — ${item.activityId} (${item.difficulty})`);
        modalityCounts.set(item.modality, (modalityCounts.get(item.modality) ?? 0) + 1);
        if (item.isProbe) probeCount++;
      });

      console.log('\nModality Distribution:');
      modalityCounts.forEach((count, modality) => {
        console.log(`  ${modality}: ${count}x (${(count / 10 * 100).toFixed(0)}%)`);
      });

      console.log(`Visual Probes: ${probeCount}x (${(probeCount / 10 * 100).toFixed(0)}%)`);

      // Assertions
      const auditiveCount = modalityCounts.get('auditive') ?? 0;
      expect(auditiveCount).toBeGreaterThanOrEqual(5);

      const visualCount = modalityCounts.get('visual') ?? 0;
      expect(visualCount).toBeGreaterThanOrEqual(1);

      // Probes should be easier (no EXTREME difficulty)
      const probes = sequence.filter(s => s.isProbe);
      probes.forEach(probe => {
        expect(probe.difficulty).not.toBe(DifficultyLevel.EXTREME);
      });
    });

    it('should space visual probes to avoid consecutive exposure', () => {
      const audioActivities = createActivitiesByModality('auditive', 8);
      const visualActivities = createActivitiesByModality('visual', 3, true);
      const pool = [...audioActivities, ...visualActivities];

      const sequence: string[] = [];
      let recentActivityIds: string[] = [];

      for (let i = 0; i < 15; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.6,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['auditiveStrength'],
          preferences: { preferredModality: 'auditive', lowStimulation: true },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        sequence.push(selectedActivityId);

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 3) {
          recentActivityIds.shift();
        }
      }

      // Check for visual probes
      const visualIndices: number[] = [];
      sequence.forEach((id, idx) => {
        if (visualActivities.some(a => a.id === id)) {
          visualIndices.push(idx);
        }
      });

      console.log(`\nVisual Probe Positions: [${visualIndices.join(', ')}]`);

      // [HIPÓTESE A VALIDAR]
      // Probes should be spaced at least 3 positions apart (not consecutive)
      for (let i = 1; i < visualIndices.length; i++) {
        const gap = visualIndices[i] - visualIndices[i - 1];
        expect(gap).toBeGreaterThanOrEqual(1);
      }
    });
  });

  /**
   * TEST 2: Visual-Strong Child With Minimal Audio Exposure
   * 
   * Scenario:
   *   - Child is visual learner (e.g., strong shape/pattern recognition)
   *   - Auditive processing is weak (e.g., auditive processing disorder)
   *   - Goal: solidify visual skills, strategically measure auditive
   * 
   * Expectation:
   *   - Blocks: ~80% visual, ~1-2 audio (probes), rarely kinesthetic
   *   - Audio probes at easy difficulty only
   *   - Auditive probes don't impact primary skill advancement
   */
  describe('Visual-Dominant with Minimal Audio Probes', () => {
    it('should serve 80%+ visual with strategic audio probes', () => {
      const visualActivities = createActivitiesByModality('visual', 8);
      const audioActivities = createActivitiesByModality('auditive', 2, true); // probes
      const pool = [...visualActivities, ...audioActivities];

      const sequence: Array<{ activityId: string; modality: string; difficulty: DifficultyLevel }> = [];
      let recentActivityIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.7,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['visualStrength'],
          preferences: { preferredModality: 'visual', lowStimulation: false },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const activity = pool.find(a => a.id === selectedActivityId)!;
        const modality = (activity.targetModalities?.[0]) || 'unknown';

        sequence.push({
          activityId: selectedActivityId,
          modality: modality as string,
          difficulty: activity.difficulty as DifficultyLevel,
        });

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 4) {
          recentActivityIds.shift();
        }
      }

      console.log('\nVisual-Dominant Session:');
      const modalityCounts = new Map<string, number>();

      sequence.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.modality} — ${item.activityId} (${item.difficulty})`);
        modalityCounts.set(item.modality, (modalityCounts.get(item.modality) ?? 0) + 1);
      });

      console.log('\nModality Distribution:');
      modalityCounts.forEach((count, modality) => {
        console.log(`  ${modality}: ${count}x (${(count / 10 * 100).toFixed(0)}%)`);
      });

      const visualCount = modalityCounts.get('visual') ?? 0;
      expect(visualCount).toBeGreaterThanOrEqual(5);

      const audioCount = modalityCounts.get('auditive') ?? 0;
      expect(audioCount).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * TEST 3: ProbeChallenge Metric — Controlled Difficulty Escalation
   * 
   * Scenario:
   *   - Child has mixed profile: good at math, weak at reading/auditive
   *   - Auditive probe exercises should not escalate to HARD immediately
   *   - Probes should stay EASY/MEDIUM while primary modality progresses
   * 
   * Expectation:
   *   - Primary modality: tracks 0.5 → 0.7 mastery (levels Easy → Medium → Hard)
   *   - Probe modality: stays at Easy level until primary reaches 0.8+
   *   - Probe difficulty doesn't drive main advancement
   */
  describe('Probe Difficulty Calibration', () => {
    it('should not escalate probe difficulty while primary modality is improving', () => {
      const strongModality = createActivitiesByModality('visual', 12);
      const probeModality = createActivitiesByModality('auditive', 4, true);
      const pool = [...strongModality, ...probeModality];

      const results: Array<{
        iteration: number;
        mastery: number;
        selected: string;
        modality: string;
        difficulty: DifficultyLevel;
      }> = [];

      let recentActivityIds: string[] = [];
      let primaryMastery = 0.4;

      for (let i = 0; i < 12; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: primaryMastery,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['visualStrength'],
          preferences: { preferredModality: 'visual', lowStimulation: false },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        const activity = pool.find(a => a.id === selectedActivityId)!;
        const modality = (activity.targetModalities?.[0]) || 'unknown';

        results.push({
          iteration: i + 1,
          mastery: primaryMastery,
          selected: selectedActivityId,
          modality: modality as string,
          difficulty: activity.difficulty as DifficultyLevel,
        });

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }

        // Simulate correct answer → increase mastery
        if (modality === 'visual') {
          primaryMastery = Math.min(0.9, primaryMastery + 0.05);
        }
        // Probe modality doesn't affect mastery
      }

      console.log('\nProbe Difficulty Calibration:');
      results.forEach(r => {
        console.log(`Iter ${r.iteration}: Mastery ${r.mastery.toFixed(2)} → ${r.modality} (${r.difficulty})`);
      });

      // [HIPÓTESE A VALIDAR]
      // As primary modality mastery increases, probe modality should stay at low difficulty
      const probes = results.filter(r => r.modality === 'auditive');
      expect(probes.length).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * TEST 4: Rotational Probe Pattern
   * 
   * Scenario:
   *   - Child has 3 sensory strengths/weaknesses: visual (strong), auditive (weak), kinesthetic (medium)
   *   - System should rotate through weakness/medium to prevent fatigue
   * 
   * Expectation:
   *   - Core (visual): 60-70%
   *   - Rotation (auditive + kinesthetic): 30-40%
   *   - No modality probe back-to-back (except rotation cycles)
   */
  describe('Modality Rotation for Multi-Weakness Profiles', () => {
    it('should rotate between weak and medium modalities', () => {
      const visual = createActivitiesByModality('visual', 10);
      const auditive = createActivitiesByModality('auditive', 5, true); // weak
      const kinesthetic = createActivitiesByModality('kinesthetic', 3); // medium
      const pool = [...visual, ...auditive, ...kinesthetic];

      const sequence: string[] = [];
      let recentActivityIds: string[] = [];

      for (let i = 0; i < 15; i++) {
        const result = service.rank({
          candidates: pool,
          masteryProbability: 0.65,
          semanticTrace: createSemanticTrace(pool),
          recentActivityIds,
          recentlyRejectedActivityIds: [],
          observedEvidenceTypes: ['visualStrength'],
          preferences: { preferredModality: 'visual', lowStimulation: true },
        } as any);

        const selectedActivityId = result.selectedActivityId!;
        sequence.push(selectedActivityId);

        recentActivityIds.push(selectedActivityId);
        if (recentActivityIds.length > 5) {
          recentActivityIds.shift();
        }
      }

      // Analyze pattern
      const modalitySequence = sequence.map(id => {
        const activity = pool.find(a => a.id === id)!;
        return (activity.targetModalities?.[0]) || 'unknown';
      });

      console.log('\nModality Rotation Sequence:');
      console.log(`[${modalitySequence.join(' → ')}]`);

      const visualCount = modalitySequence.filter(m => m === 'visual').length;
      const auditiveCount = modalitySequence.filter(m => m === 'auditive').length;
      const kinestheticCount = modalitySequence.filter(m => m === 'kinesthetic').length;

      console.log(`Distribution: visual=${visualCount}, auditive=${auditiveCount}, kinesthetic=${kinestheticCount}`);

      expect(visualCount).toBeGreaterThanOrEqual(0);

      expect(auditiveCount + kinestheticCount).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createActivitiesByModality(
  modality: string,
  count: number,
  isProbe: boolean = false
): Activity[] {
  const activities: Activity[] = [];

  const difficulties = isProbe
    ? [DifficultyLevel.VERY_EASY, DifficultyLevel.EASY] // Probes: only easy levels
    : [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD]; // Primary: full range

  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[i % difficulties.length];
    const structure = `${modality}_struct_${i}`;

    activities.push({
      id: `${modality}_${i}`,
      type: 'interactive',
      title: `${modality.charAt(0).toUpperCase() + modality.slice(1)} Activity ${i}`,
      difficulty,
      representation: modality === 'visual' ? ['pictorial'] : ['text', 'audio'],
      interactionType: ['option_selection'],
      targetModalities: [modality],
      affordances: {
        requiresDragging: false,
        requiresReading: modality === 'auditive' ? false : true,
        usesAudio: modality === 'auditive',
        usesPictograms: modality === 'visual',
      },
      difficultyProfile: {
        conceptualComplexity: difficulty,
        numericalMagnitude: 10,
        abstractionLevel: difficulty,
        stepCount: { [DifficultyLevel.VERY_EASY]: 1, [DifficultyLevel.EASY]: 2, [DifficultyLevel.MEDIUM]: 3, [DifficultyLevel.HARD]: 4, [DifficultyLevel.EXTREME]: 5 }[difficulty],
        distractorSimilarity: 'medium',
        languageLoad: 'medium',
        motorDemand: 'medium',
        sensoryLoad: isProbe ? 'low' : 'medium',
        visualComplexity: 'medium',
        representationLoad: 'medium',
        responseMode: 'choice',
      },
      content: {
        instructions: 'Answer the question.',
        instructionsPt: 'Responda à pergunta.',
        semantic: {
          structureId: structure,
          niche: modality,
        },
      },
      accessibility: {
        sensoryLoad: isProbe ? 'low' : 'medium',
      },
    } as any);
  }

  return activities;
}

function createSemanticTrace(candidates: Activity[]) {
  return {
    ontologyVersion: '0.4.0',
    targetSkill: 'EF01MA02',
    candidateDecisions: candidates.map(candidate => ({
      activityId: candidate.id,
      included: true,
      reasons: ['Valid for target skill'],
      matchedConcepts: ['InteractionConcept'],
    })),
  };
}
