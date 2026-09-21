/**
 * Exercise Diversity Diagnostic Test
 * 
 * [PROPOSTA CONTA COMIGO]
 * Validates that:
 * 1. No structure/niche appears more than maxRepetitionsInBlock (1) times consecutively
 * 2. Different types are distributed across recommendations
 * 3. Different niches are represented within a block
 * 4. Prompt diversity is maintained (different phrasings)
 */

import { HybridRecommendationService } from '../hybrid-recommendation.service';
import { ConfigService } from '@nestjs/config';
import { Activity, DifficultyLevel } from '../../activities/entities/activity.entity';

describe('Exercise Diversity Diagnostic', () => {
  let service: HybridRecommendationService;

  beforeAll(() => {
    service = new HybridRecommendationService(new ConfigService());
  });

  const createActivity = (
    id: string,
    structure: string,
    type: string,
    niche: string,
    prompt: string,
    difficulty: DifficultyLevel = DifficultyLevel.EASY,
  ): Activity => {
    return {
      id,
      title: `Activity ${id}`,
      bnccSkills: ['EF01MA01'],
      difficulty,
      type,
      targetModalities: ['visual'],
      isActive: true,
      content: {
        semantic: {
          structureId: structure,
          niche,
        },
      },
      prompt,
      interactionType: [type],
      representation: ['pictorial'],
    } as any;
  };

  /**
   * Diagnostic: Track structure/niche repetition in a 15-exercise sequence
   */
  it('should detect and prevent structure repetition within a block', () => {
    const pool: Activity[] = [
      // Counting exercises (different structures)
      createActivity('count_visual', 'count_objects', 'quiz', 'counting', 'Conte os dados. Quantos há?'),
      createActivity('count_all', 'count_visual_group', 'quiz', 'counting', 'Quantas figuras você vê neste grupo?'),

      // Subtraction exercises (different structures & prompts)
      createActivity('sub_visual', 'subtraction.visual', 'quiz', 'subtraction', 'Separe um dado do grupo. Quantos restam?'),
      createActivity('sub_story', 'subtraction.story', 'quiz', 'subtraction', 'Você tinha frutas. Deu algumas. Quantas sobraram?'),
      createActivity('sub_basket', 'subtraction.basket', 'drag_drop', 'subtraction', 'Retire as frutas que foram comidas.'),

      // Addition exercises
      createActivity('add_visual', 'combine_groups', 'quiz', 'addition', 'Junte os dois grupos. Quantos dados há no total?'),
      createActivity('add_combine', 'addition_merge', 'drag_drop', 'addition', 'Junte os grupos para formar um total.'),

      // Comparison exercises
      createActivity('comp_groups', 'compare_sets', 'quiz', 'comparison', 'Qual conjunto tem mais itens?'),
      createActivity('comp_groups2', 'compare_size', 'quiz', 'comparison', 'Qual grupo tem mais borboletas?'),

      // Sequence exercises
      createActivity('seq_order', 'order_numbers', 'drag_drop', 'sequence', 'Coloque os números em ordem crescente.'),
      createActivity('seq_next', 'next_number', 'quiz', 'sequence', 'Qual número vem em seguida: 1, 2, 3, ...?'),

      // Classification exercises
      createActivity('class_shape', 'classify_shape', 'representation_matching', 'classification', 'Agrupe as formas iguais.'),
      createActivity('class_size', 'classify_size', 'representation_matching', 'classification', 'Organize do pequeno para o grande.'),

      // Shapes exercises
      createActivity('shape_name', 'identify_shape', 'quiz', 'shapes', 'Qual é o nome desta forma?'),
    ];

    const selected: string[] = [];
    const selectionLog: Array<{
      idx: number;
      activityId: string;
      structure: string;
      type: string;
      niche: string;
      prompt: string;
      score: number;
      recencyPenalty: number;
    }> = [];

    // Simulate 15 sequential recommendations
    for (let i = 0; i < 15; i++) {
      const recentActivities = selected.map((id) => {
        const activity = pool.find((a) => a.id === id)!;
        return {
          activityId: id,
          structureId: activity.content?.semantic?.structureId,
          type: activity.type,
          bnccSkills: activity.bnccSkills,
          isCorrect: true,
        };
      });

      const result = service.rank({
        candidates: pool,
        masteryProbability: 0.7,
        semanticTrace: {
          targetSkill: 'EF01MA01',
          candidateDecisions: pool.map((a) => ({
            activityId: a.id,
            matchedConcepts: ['math'],
            reasons: ['semantic match'],
          })),
          ontologyVersion: '0.4.0',
          runtimeFactsUsed: { recentAccuracy: 0.8 },
        },
        recentActivityIds: selected,
        recentlyRejectedActivityIds: [],
        observedEvidenceTypes: [],
        recentActivities: recentActivities as any,
      } as any);

      if (result.selectedActivityId) {
        selected.push(result.selectedActivityId);
        const activity = pool.find((a) => a.id === result.selectedActivityId)!;
        const selectedCandidate = result.candidates.find((c) => c.activityId === result.selectedActivityId);
        selectionLog.push({
          idx: i,
          activityId: result.selectedActivityId,
          structure: activity.content?.semantic?.structureId || 'unknown',
          type: activity.type,
          niche: activity.content?.semantic?.niche || 'unknown',
          prompt: (activity as any).prompt || 'no prompt',
          score: selectedCandidate?.finalScore || 0,
          recencyPenalty: selectedCandidate?.recencyPenalty || 0,
        });
      }
    }

    // Analysis
    console.log('\n[Diversity Diagnostic] 15-Exercise Selection Sequence:');
    selectionLog.forEach((log) => {
      console.log(
        `${log.idx + 1}. ${log.activityId.padEnd(20)} | ${log.structure.padEnd(25)} | ${log.type.padEnd(15)} | Score: ${log.score.toFixed(3)} | Penalty: ${log.recencyPenalty.toFixed(3)}`,
      );
    });

    // Check 1: No structure should appear more than 1 time consecutively
    console.log('\n[Check 1] Structure Repetition (should be 0 consecutive):');
    let maxConsecutive = 0;
    for (let i = 0; i < selectionLog.length - 1; i++) {
      if (selectionLog[i].structure === selectionLog[i + 1].structure) {
        maxConsecutive = Math.max(maxConsecutive, 2);
        console.log(`  ⚠️  "${selectionLog[i].structure}" repeated at positions ${i + 1} and ${i + 2}`);
      }
    }
    expect(maxConsecutive).toBeLessThanOrEqual(1);

    // Check 2: Structure frequency should be balanced
    console.log('\n[Check 2] Structure Distribution:');
    const structureCount = new Map<string, number>();
    selectionLog.forEach((log) => {
      structureCount.set(log.structure, (structureCount.get(log.structure) ?? 0) + 1);
    });
    structureCount.forEach((count, structure) => {
      console.log(`  ${structure}: ${count}x`);
      // With maxRepetitionsInBlock=1, expect mostly 0-1, very few 2x
      expect(count).toBeLessThanOrEqual(2);
    });

    // Check 3: Niche diversity
    console.log('\n[Check 3] Niche Distribution (should have variety):');
    const nicheCount = new Map<string, number>();
    selectionLog.forEach((log) => {
      nicheCount.set(log.niche, (nicheCount.get(log.niche) ?? 0) + 1);
    });
    nicheCount.forEach((count, niche) => {
      console.log(`  ${niche}: ${count}x`);
    });
    expect(nicheCount.size).toBeGreaterThanOrEqual(5); // At least 5 different niches

    // Check 4: Type diversity
    console.log('\n[Check 4] Exercise Type Distribution:');
    const typeCount = new Map<string, number>();
    selectionLog.forEach((log) => {
      typeCount.set(log.type, (typeCount.get(log.type) ?? 0) + 1);
    });
    typeCount.forEach((count, type) => {
      console.log(`  ${type}: ${count}x`);
    });
    expect(typeCount.size).toBeGreaterThanOrEqual(3); // At least 3 different types

    // Check 5: Prompt uniqueness
    console.log('\n[Check 5] Prompt Uniqueness:');
    const promptCount = new Map<string, number>();
    selectionLog.forEach((log) => {
      promptCount.set(log.prompt, (promptCount.get(log.prompt) ?? 0) + 1);
    });
    const uniquePrompts = promptCount.size;
    const mostRepeatedPrompt = Math.max(...Array.from(promptCount.values()));
    console.log(`  Total unique prompts: ${uniquePrompts} / ${selectionLog.length}`);
    console.log(`  Most repeated prompt appears: ${mostRepeatedPrompt}x`);
    expect(uniquePrompts).toBeGreaterThan(selectionLog.length * 0.5); // At least 50% unique
  });
});
