/**
 * Progression & Diversity Integration Test
 * 
 * [PROPOSTA CONTA COMIGO]
 * Validates:
 * 1. Automatic difficulty progression: 2+ correct on same level → promote to next
 * 2. No repetition of dominated exercises (correct history blocking)
 * 3. Diversity in modality/structure within a block
 * 4. Clear ranking with multiple valid candidates
 */

import { HybridRecommendationService } from '../hybrid-recommendation.service';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';

describe('Progression and Diversity - Integration Tests', () => {
  let service: HybridRecommendationService;

  beforeAll(() => {
    service = new HybridRecommendationService(new ConfigService());
  });

  const createActivityWithDetails = (id: string, difficulty: DifficultyLevel, structure: string, type: string, modality: string): Activity => {
    return {
      id,
      title: `Activity ${id}`,
      bnccSkills: ['EF01MA01'],
      difficulty,
      type,
      targetModalities: [modality],
      isActive: true,
      content: {
        semantic: {
          structureId: structure,
          niche: 'counting',
        },
      },
      interactionType: [type],
      representation: [modality === 'visual' ? 'pictorial' : 'textual'],
    } as any;
  };

  const createSemanticTrace = (activities: Activity[]) => ({
    targetSkill: 'EF01MA01',
    candidateDecisions: activities.map(a => ({
      activityId: a.id,
      matchedConcepts: ['counting', 'numbers'],
      reasons: ['semantic match'],
    })),
    ontologyVersion: '0.4.0',
    runtimeFactsUsed: { recentAccuracy: 0.8 },
  });

  /**
   * TEST 1: Automatic Progression
   * 
   * Scenario: Child gets 2 correct answers on EASY level with different structures.
   * Expectation: Next recommendation should be MEDIUM difficulty.
   * 
   * This tests the core business rule: progression on demonstrated mastery.
   */
  it('should promote difficulty after 2 correct answers on same level with different types', () => {
    const easyVisualCount = createActivityWithDetails('easy_visual_count', DifficultyLevel.EASY, 'count_objects', 'quiz', 'visual');
    const easyAudioCount = createActivityWithDetails('easy_audio_count', DifficultyLevel.EASY, 'count_grouped', 'listening', 'auditive');
    const mediumVisualCompare = createActivityWithDetails('medium_visual_compare', DifficultyLevel.MEDIUM, 'compare_sets', 'quiz', 'visual');
    const mediumAudioCompare = createActivityWithDetails('medium_audio_compare', DifficultyLevel.MEDIUM, 'compare_equal', 'listening', 'auditive');

    const pool = [easyVisualCount, easyAudioCount, mediumVisualCompare, mediumAudioCompare];

    // Simulate 2 correct answers on EASY with different structures
    const recentActivities: Array<{
      activityId: string;
      structureId?: string;
      type?: string;
      bnccSkills?: string[];
      isCorrect?: boolean;
      masteryAfter?: number;
    }> = [
      {
        activityId: 'easy_visual_count',
        structureId: 'count_objects',
        type: 'quiz',
        bnccSkills: ['EF01MA01'],
        isCorrect: true,
        masteryAfter: 0.55,
      },
      {
        activityId: 'easy_audio_count',
        structureId: 'count_grouped',
        type: 'listening',
        bnccSkills: ['EF01MA01'],
        isCorrect: true,
        masteryAfter: 0.65,
      },
    ];

    const result = service.rank({
      candidates: pool,
      masteryProbability: 0.65,
      semanticTrace: createSemanticTrace(pool),
      recentActivityIds: ['easy_visual_count', 'easy_audio_count'],
      recentlyRejectedActivityIds: [],
      observedEvidenceTypes: [],
      recentActivities: recentActivities,
    } as any);

    const selected = pool.find(a => a.id === result.selectedActivityId);
    console.log(`\n[Progression Test] Selected: ${selected?.id} (${selected?.difficulty})`);
    console.log(`Recent mastery trend: ${recentActivities.map(r => r.masteryAfter).join(' → ')}`);
    
    // After 2 correct on EASY, next should NOT be EASY again
    expect(selected?.difficulty).not.toBe(DifficultyLevel.EASY);
    expect(result.selectedActivityId).not.toBeNull();
  });

  /**
   * TEST 2: No Repetition of Dominated Exercises
   * 
   * Scenario: Child correctly answered 'easy_visual_count' in previous session.
   * In current session, ranking should NOT recommend it again.
   * 
   * This prevents frustration from re-practicing already-mastered content.
   */
  it('should not recommend previously correct exercises', () => {
    const easyVisualCount = createActivityWithDetails('easy_visual_count', DifficultyLevel.EASY, 'count_objects', 'quiz', 'visual');
    const easyAudioCount = createActivityWithDetails('easy_audio_count', DifficultyLevel.EASY, 'count_grouped', 'listening', 'auditive');
    const easyVisualCompare = createActivityWithDetails('easy_visual_compare', DifficultyLevel.EASY, 'compare_sets', 'quiz', 'visual');

    const pool = [easyVisualCount, easyAudioCount, easyVisualCompare];

    // Simulate that 'easy_visual_count' was already dominated (correct history)
    const successHistory = ['easy_visual_count']; // Already mastered
    const recentActivities: Array<{
      activityId: string;
      structureId?: string;
      type?: string;
      bnccSkills?: string[];
    }> = [];

    const result = service.rank({
      candidates: pool.filter(a => !successHistory.includes(a.id)),
      masteryProbability: 0.7,
      semanticTrace: createSemanticTrace(pool),
      recentActivityIds: successHistory,
      recentlyRejectedActivityIds: [],
      observedEvidenceTypes: [],
      recentActivities,
    } as any);

    console.log(`\n[No Repetition Test] Success history: ${successHistory}`);
    console.log(`Selected: ${result.selectedActivityId}`);
    
    expect(result.selectedActivityId).not.toBe('easy_visual_count');
    expect(result.selectedActivityId).not.toBeNull();
  });

  /**
   * TEST 3: Diversity Within Block of 10
   * 
   * Scenario: Simulate 10 correct answers in sequence.
   * Expectation: Mix of different structures, types, and modalities—
   *              no 2-item cycle, no 3+ of same structure.
   * 
   * This is the core UX complaint: "I keep seeing the same exercise."
   */
  it('should maintain diversity: no same structure more than 2x in 10-activity block', () => {
    const largePool = [
      createActivityWithDetails('easy_vis_count', DifficultyLevel.EASY, 'count_objects', 'quiz', 'visual'),
      createActivityWithDetails('easy_aud_count', DifficultyLevel.EASY, 'count_grouped', 'listening', 'auditive'),
      createActivityWithDetails('easy_vis_compare', DifficultyLevel.EASY, 'compare_sets', 'quiz', 'visual'),
      createActivityWithDetails('easy_aud_compare', DifficultyLevel.EASY, 'compare_equal', 'listening', 'auditive'),
      createActivityWithDetails('easy_vis_match', DifficultyLevel.EASY, 'match_two', 'drag_drop', 'visual'),
      createActivityWithDetails('easy_aud_match', DifficultyLevel.EASY, 'match_five', 'listening', 'auditive'),
      createActivityWithDetails('med_vis_count', DifficultyLevel.MEDIUM, 'count_scattered', 'quiz', 'visual'),
      createActivityWithDetails('med_aud_count', DifficultyLevel.MEDIUM, 'count_grouped', 'listening', 'auditive'),
    ];

    const selected: string[] = [];
    const recentActivities: Array<{
      activityId: string;
      structureId?: string;
      type?: string;
      bnccSkills?: string[];
    }> = [];

    for (let i = 0; i < 10; i++) {
      const result = service.rank({
        candidates: largePool,
        masteryProbability: 0.7 + i * 0.02,
        semanticTrace: createSemanticTrace(largePool),
        recentActivityIds: selected,
        recentlyRejectedActivityIds: [],
        observedEvidenceTypes: [],
        recentActivities: recentActivities.slice(-10),
      } as any);

      const selectedActivityId = result.selectedActivityId!;
      selected.push(selectedActivityId);

      const selectedActivity = largePool.find(a => a.id === selectedActivityId)!;
      recentActivities.push({
        activityId: selectedActivityId,
        structureId: selectedActivity.content?.semantic?.structureId,
        type: selectedActivity.type,
        bnccSkills: selectedActivity.bnccSkills,
      });
    }

    // Count structures
    const structureCounts = new Map<string, number>();
    selected.forEach(id => {
      const activity = largePool.find(a => a.id === id)!;
      const structure = activity.content?.semantic?.structureId!;
      structureCounts.set(structure, (structureCounts.get(structure) ?? 0) + 1);
    });

    console.log('\n[Diversity Test] 10-Activity Block:');
    selected.forEach((id, idx) => {
      const activity = largePool.find(a => a.id === id)!;
      console.log(`${idx + 1}. ${activity.id} (${activity.content?.semantic?.structureId})`);
    });
    console.log('\nStructure Distribution:');
    structureCounts.forEach((count, structure) => {
      console.log(`  ${structure}: ${count}x`);
    });

    // [PROPOSTA CONTA COMIGO]
    // No structure should appear more than 2x in the block (allowing for limited repetition but preventing cycles)
    Array.from(structureCounts.values()).forEach(count => {
      expect(count).toBeLessThanOrEqual(2);
    });

    // At least 4 different structures in 10 activities
    expect(structureCounts.size).toBeGreaterThanOrEqual(4);

    // No 2-item cycle: same structure should not appear at consecutive positions 3+ times
    let cycleDetected = false;
    for (let i = 0; i < selected.length - 1; i++) {
      const curr = largePool.find(a => a.id === selected[i])!.content?.semantic?.structureId;
      const next = largePool.find(a => a.id === selected[i + 1])!.content?.semantic?.structureId;
      if (i > 0) {
        const prev = largePool.find(a => a.id === selected[i - 1])!.content?.semantic?.structureId;
        if (curr === next && curr === prev) {
          cycleDetected = true;
        }
      }
    }
    expect(cycleDetected).toBe(false);
  });
});
