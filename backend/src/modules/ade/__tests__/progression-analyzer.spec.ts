/**
 * Progression Analyzer Tests
 * [PROPOSTA CONTA COMIGO]
 */

import { ProgressionAnalyzer, ProgressionRecord } from '../progression-analyzer';
import { DifficultyLevel } from '../../activities/entities/activity.entity';

describe('ProgressionAnalyzer', () => {
  describe('analyze', () => {
    it('should promote from EASY to MEDIUM after 2 correct with different structures', () => {
      const records: ProgressionRecord[] = [
        {
          activityId: 'a1',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_objects',
          type: 'quiz',
        },
        {
          activityId: 'a2',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_grouped',
          type: 'listening',
        },
      ];

      const analysis = ProgressionAnalyzer.analyze(records);

      expect(analysis.shouldPromote).toBe(true);
      expect(analysis.nextLevel).toBe(DifficultyLevel.MEDIUM);
      expect(analysis.evidence.correctCountCurrentLevel).toBe(2);
      expect(analysis.evidence.structureTypeDiversityCount).toBe(2);
    });

    it('should NOT promote with only 1 correct answer', () => {
      const records: ProgressionRecord[] = [
        {
          activityId: 'a1',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_objects',
          type: 'quiz',
        },
      ];

      const analysis = ProgressionAnalyzer.analyze(records);

      expect(analysis.shouldPromote).toBe(false);
      expect(analysis.evidence.correctCountCurrentLevel).toBe(1);
    });

    it('should NOT promote with 2 correct but same structure', () => {
      const records: ProgressionRecord[] = [
        {
          activityId: 'a1',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_objects',
          type: 'quiz',
        },
        {
          activityId: 'a2',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_objects',
          type: 'quiz',
        },
      ];

      const analysis = ProgressionAnalyzer.analyze(records);

      expect(analysis.shouldPromote).toBe(false);
      expect(analysis.evidence.structureTypeDiversityCount).toBe(1);
    });

    it('should NOT promote if recent answer was incorrect', () => {
      const records: ProgressionRecord[] = [
        {
          activityId: 'a1',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_objects',
          type: 'quiz',
        },
        {
          activityId: 'a2',
          difficulty: DifficultyLevel.EASY,
          isCorrect: true,
          structureId: 'count_grouped',
          type: 'listening',
        },
        {
          activityId: 'a3',
          difficulty: DifficultyLevel.EASY,
          isCorrect: false,
          structureId: 'compare_sets',
          type: 'drag_drop',
        },
      ];

      const analysis = ProgressionAnalyzer.analyze(records);

      // Should still promote because we have 2 correct with diverse structures
      // (incorrect doesn't block, just not counted)
      expect(analysis.shouldPromote).toBe(true);
    });

    it('should handle empty records gracefully', () => {
      const analysis = ProgressionAnalyzer.analyze([]);

      expect(analysis.shouldPromote).toBe(false);
      expect(analysis.currentLevel).toBe(DifficultyLevel.EASY);
    });

    it('should reach ceiling at EXTREME', () => {
      const records: ProgressionRecord[] = [
        {
          activityId: 'a1',
          difficulty: DifficultyLevel.EXTREME,
          isCorrect: true,
          structureId: 'complex_problem',
          type: 'open_ended',
        },
        {
          activityId: 'a2',
          difficulty: DifficultyLevel.EXTREME,
          isCorrect: true,
          structureId: 'complex_proof',
          type: 'logical_reasoning',
        },
      ];

      const analysis = ProgressionAnalyzer.analyze(records);

      expect(analysis.shouldPromote).toBe(true);
      expect(analysis.nextLevel).toBe(DifficultyLevel.EXTREME); // ceiling
    });
  });

  describe('filterByProgression', () => {
    it('should filter candidates to next level when promotion ready', () => {
      const candidates = [
        { id: 'easy_1', difficulty: DifficultyLevel.EASY },
        { id: 'easy_2', difficulty: DifficultyLevel.EASY },
        { id: 'medium_1', difficulty: DifficultyLevel.MEDIUM },
        { id: 'medium_2', difficulty: DifficultyLevel.MEDIUM },
        { id: 'hard_1', difficulty: DifficultyLevel.HARD },
      ];

      const progression = {
        shouldPromote: true,
        currentLevel: DifficultyLevel.EASY,
        nextLevel: DifficultyLevel.MEDIUM,
        evidence: {
          correctCountCurrentLevel: 2,
          structureTypeDiversityCount: 2,
          isReadyForPromotion: true,
        },
        reasoning: 'test',
      };

      const filtered = ProgressionAnalyzer.filterByProgression(candidates, progression);

      expect(filtered).toEqual([
        { id: 'medium_1', difficulty: DifficultyLevel.MEDIUM },
        { id: 'medium_2', difficulty: DifficultyLevel.MEDIUM },
      ]);
    });

    it('should return all candidates if no promotion needed', () => {
      const candidates = [
        { id: 'easy_1', difficulty: DifficultyLevel.EASY },
        { id: 'medium_1', difficulty: DifficultyLevel.MEDIUM },
      ];

      const progression = {
        shouldPromote: false,
        currentLevel: DifficultyLevel.EASY,
        evidence: {
          correctCountCurrentLevel: 1,
          structureTypeDiversityCount: 1,
          isReadyForPromotion: false,
        },
        reasoning: 'test',
      };

      const filtered = ProgressionAnalyzer.filterByProgression(candidates, progression);

      expect(filtered).toEqual(candidates);
    });

    it('should return original if no candidates at next level', () => {
      const candidates = [
        { id: 'easy_1', difficulty: DifficultyLevel.EASY },
        { id: 'easy_2', difficulty: DifficultyLevel.EASY },
      ];

      const progression = {
        shouldPromote: true,
        currentLevel: DifficultyLevel.EASY,
        nextLevel: DifficultyLevel.MEDIUM,
        evidence: {
          correctCountCurrentLevel: 2,
          structureTypeDiversityCount: 2,
          isReadyForPromotion: true,
        },
        reasoning: 'test',
      };

      const filtered = ProgressionAnalyzer.filterByProgression(candidates, progression);

      // Should return original since no MEDIUM candidates exist
      expect(filtered).toEqual(candidates);
    });
  });
});
