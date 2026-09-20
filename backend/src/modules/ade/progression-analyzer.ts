/**
 * Progression Analyzer
 *
 * [PROPOSTA CONTA COMIGO] Automatic difficulty progression based on performance.
 *
 * Rules:
 * - If child got 2+ correct answers on same difficulty with different structures/types
 *   → promote to next difficulty level
 * - This prevents boredom from staying too long at same level
 * - Aligns with Vygotsky's Zone of Proximal Development (ZPD)
 */

import { DifficultyLevel } from '../activities/entities/activity.entity';

export interface ProgressionRecord {
  activityId: string;
  isCorrect: boolean;
  difficulty: DifficultyLevel;
  structureId?: string;
  type?: string;
  timestamp?: Date;
}

export interface ProgressionAnalysis {
  shouldPromote: boolean;
  currentLevel: DifficultyLevel;
  nextLevel?: DifficultyLevel;
  evidence: {
    correctCountCurrentLevel: number;
    structureTypeDiversityCount: number;
    isReadyForPromotion: boolean;
  };
  reasoning: string;
}

const DIFFICULTY_PROGRESSION: Record<DifficultyLevel, DifficultyLevel> = {
  [DifficultyLevel.VERY_EASY]: DifficultyLevel.EASY,
  [DifficultyLevel.EASY]: DifficultyLevel.MEDIUM,
  [DifficultyLevel.MEDIUM]: DifficultyLevel.HARD,
  [DifficultyLevel.HARD]: DifficultyLevel.EXTREME,
  [DifficultyLevel.EXTREME]: DifficultyLevel.EXTREME, // ceiling
};

export class ProgressionAnalyzer {
  /**
   * Analyze if child should be promoted to next difficulty level.
   *
   * [PARÂMETRO EXPERIMENTAL]
   * - successThreshold = 2: need 2+ correct answers
   * - targetDiversity = 2: need 2+ different structures/types
   *
   * @param records Recent activity attempts (most recent first)
   * @param maxLookback How many recent attempts to consider (default: 10)
   * @returns Progression analysis with decision
   */
  static analyze(
    records: ProgressionRecord[],
    maxLookback: number = 10,
  ): ProgressionAnalysis {
    if (!records || records.length === 0) {
      return {
        shouldPromote: false,
        currentLevel: DifficultyLevel.EASY,
        evidence: {
          correctCountCurrentLevel: 0,
          structureTypeDiversityCount: 0,
          isReadyForPromotion: false,
        },
        reasoning: 'No activity history available',
      };
    }

    // [PARÂMETRO EXPERIMENTAL]
    const successThreshold = 2;
    const targetDiversity = 2;

    const recent = records.slice(0, maxLookback);
    const currentLevel = recent[0]?.difficulty ?? DifficultyLevel.EASY;

    // Count correct answers at current level
    const correctAtCurrentLevel = recent.filter(
      (r) => r.isCorrect && r.difficulty === currentLevel,
    );

    // Count unique structure/type combinations at current level
    const uniqueStructureTypePairs = new Set<string>();
    correctAtCurrentLevel.forEach((r) => {
      const key = `${r.structureId ?? 'unknown'}:${r.type ?? 'unknown'}`;
      uniqueStructureTypePairs.add(key);
    });

    const structureTypeDiversity = uniqueStructureTypePairs.size;
    const correctCount = correctAtCurrentLevel.length;

    // [PROPOSTA CONTA COMIGO] Promotion criteria
    const isReadyForPromotion =
      correctCount >= successThreshold &&
      structureTypeDiversity >= targetDiversity;

    const nextLevel =
      isReadyForPromotion && currentLevel in DIFFICULTY_PROGRESSION
        ? DIFFICULTY_PROGRESSION[currentLevel]
        : undefined;

    return {
      shouldPromote: isReadyForPromotion,
      currentLevel,
      nextLevel,
      evidence: {
        correctCountCurrentLevel: correctCount,
        structureTypeDiversityCount: structureTypeDiversity,
        isReadyForPromotion,
      },
      reasoning: isReadyForPromotion
        ? `Ready to promote: ${correctCount} correct answers with ${structureTypeDiversity} different structure/type combinations at ${currentLevel} level`
        : `Not ready yet: ${correctCount}/${successThreshold} correct, ${structureTypeDiversity}/${targetDiversity} structure variety at ${currentLevel}`,
    };
  }

  /**
   * Filter activities to only show next difficulty level if progression ready.
   * This forces the system to promote when conditions are met.
   *
   * @param candidates Available activities
   * @param progression Analysis result from analyze()
   * @returns Filtered candidates (or original if no progression)
   */
  static filterByProgression<T extends { difficulty: DifficultyLevel }>(
    candidates: T[],
    progression: ProgressionAnalysis,
  ): T[] {
    if (!progression.shouldPromote || !progression.nextLevel) {
      return candidates;
    }

    // Filter to only activities at next level
    const nextLevelCandidates = candidates.filter(
      (c) => c.difficulty === progression.nextLevel,
    );

    // If no candidates at next level, return original
    return nextLevelCandidates.length > 0 ? nextLevelCandidates : candidates;
  }
}
