import { RuleEngineService } from './rule-engine.service';
import { DifficultyLevel } from '../../activities/entities/activity.entity';

const rules = new RuleEngineService({ get: (_key: string, fallback: number) => fallback } as any);
const base = {
  recentAccuracy: 1, averageTimeSeconds: 20, hintsUsed: 0,
  currentSkillMastery: 0.75, asdSupportLevel: 'mild', streakCount: 0,
  engagementScore: 0.8, recentSkips: 0,
};
const attempt = (id: string, isCorrect = true, hintsUsed = 0) => ({
  activityId: id, isCorrect, hintsUsed, timeSpentSeconds: 20,
  difficulty: DifficultyLevel.EASY,
});

describe('difficulty progression', () => {
  it('does not promote after one correct response', () => {
    expect(rules.evaluate({ ...base, recentAttempts: [attempt('a')] }).recommendedDifficulty)
      .toBe(DifficultyLevel.EASY);
  });

  it('promotes one step after repeated independent success', () => {
    expect(rules.evaluate({ ...base, recentAttempts: [attempt('a'), attempt('b'), attempt('c')] })
      .recommendedDifficulty).toBe(DifficultyLevel.MEDIUM);
  });

  it('holds after hints or repeated attempts on the same activity', () => {
    expect(rules.evaluate({ ...base, recentAttempts: [attempt('a', true, 1), attempt('b'), attempt('c')] })
      .recommendedDifficulty).toBe(DifficultyLevel.EASY);
    expect(rules.evaluate({ ...base, recentAttempts: [attempt('a'), attempt('a'), attempt('b')] })
      .recommendedDifficulty).toBe(DifficultyLevel.EASY);
  });

  it('reduces a level after repeated errors and supports the lower boundary', () => {
    expect(rules.evaluate({ ...base, recentAccuracy: 0,
      recentAttempts: [attempt('a', false), attempt('b', false)] }).recommendedDifficulty)
      .toBe(DifficultyLevel.VERY_EASY);
    expect(rules.evaluate({ ...base, recentAccuracy: 0, recentAttempts: [
      { ...attempt('a', false), difficulty: DifficultyLevel.VERY_EASY },
      { ...attempt('b', false), difficulty: DifficultyLevel.VERY_EASY },
    ] }).recommendedDifficulty).toBe(DifficultyLevel.VERY_EASY);
  });

  it('holds when mastery is low even with several correct answers', () => {
    expect(rules.evaluate({ ...base, currentSkillMastery: 0.2,
      recentAttempts: [attempt('a'), attempt('b'), attempt('c')] }).recommendedDifficulty)
      .toBe(DifficultyLevel.EASY);
  });
});
