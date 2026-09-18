import { expandedActivityPools } from './activity-pools.seed';

const activities = expandedActivityPools() as any[];

describe('expanded activity pools', () => {
  it('covers twelve niches and five difficulty levels with unique structures', () => {
    expect(activities).toHaveLength(60);
    expect(new Set(activities.map((item) => item.content.semantic.niche)).size).toBe(12);
    expect(new Set(activities.map((item) => item.difficulty)).size).toBe(5);
    expect(new Set(activities.map((item) => item.content.semantic.structureId)).size).toBe(60);
  });

  it('keeps options and skill weights consistent', () => {
    for (const item of activities) {
      expect(item.content.options.filter((option: any) => option.isCorrect)).toHaveLength(1);
      expect(item.skillWeights.map((skill: any) => skill.code)).toEqual(item.bnccSkills);
      if (item.skillWeights.length) {
        expect(item.skillWeights.reduce((sum: number, skill: any) => sum + skill.weight, 0))
          .toBeCloseTo(1);
      }
    }
  });

  it('attributes the combined shopping problem to its three explicit skills', () => {
    const shopping = activities.find((item) => item.content.semantic.structureId === 'shopping_compare_sums');
    expect(shopping.bnccSkills).toEqual(['EF01MA08', 'EF01MA06', 'EF01MA03']);
    expect(shopping.skillWeights.map((skill: any) => skill.role))
      .toEqual(['primary', 'secondary', 'secondary']);
    expect(activities.find((item) => item.content.semantic.niche === 'magnitudes').bnccSkills)
      .toEqual([]);
  });
});
