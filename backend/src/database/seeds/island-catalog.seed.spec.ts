import { expandedActivityPools } from './activity-pools.seed';
import {
  ISLAND_CATALOG,
  classifyActivityIsland,
  planIslandCatalog,
  CatalogActivity,
} from './island-catalog.seed';

const activity = (overrides: Partial<CatalogActivity>): CatalogActivity => ({
  id: 'a', title: 'x', type: 'quiz', difficulty: 'easy', bnccSkills: [], content: {}, ...overrides,
});

describe('island catalog', () => {
  it('defines six islands with unique ids, order and BNCC skills', () => {
    expect(ISLAND_CATALOG).toHaveLength(6);
    expect(new Set(ISLAND_CATALOG.map((island) => island.islandId)).size).toBe(6);
    expect(ISLAND_CATALOG.map((island) => island.sequenceOrder)).toEqual([1, 2, 3, 4, 5, 6]);
    const skills = ISLAND_CATALOG.flatMap((island) => island.bnccSkills);
    expect(new Set(skills).size).toBe(skills.length);
  });

  it('places activities by their primary BNCC skill', () => {
    expect(classifyActivityIsland(activity({ bnccSkills: ['EF01MA02'] }))).toBe('island-numbers');
    expect(classifyActivityIsland(activity({ bnccSkills: ['EF01MA03', 'EF01MA06'] }))).toBe('island-beach');
    expect(classifyActivityIsland(activity({ bnccSkills: ['EF03MA07'] }))).toBe('island-body');
    expect(classifyActivityIsland(activity({ bnccSkills: ['EF04MA09'] }))).toBe('island-home');
    expect(classifyActivityIsland(activity({ bnccSkills: ['EF03MA15'] }))).toBe('island-nature');
  });

  it('splits EF01MA08 problems into taking away and joining', () => {
    expect(classifyActivityIsland(activity({
      bnccSkills: ['EF01MA08'], title: 'Descobrir quantas moedas restam',
    }))).toBe('island-home');
    expect(classifyActivityIsland(activity({
      bnccSkills: ['EF01MA08'], title: 'Contar frutas', content: { instructionsPt: 'Pegue 2 maçãs e 1 pera.' },
    }))).toBe('island-body');
  });

  it('uses the niche or wording when there is no BNCC code', () => {
    expect(classifyActivityIsland(activity({ title: 'Agrupar figuras por cor' }))).toBe('island-colors');
    expect(classifyActivityIsland(activity({ content: { semantic: { niche: 'magnitudes' } } }))).toBe('island-beach');
    expect(classifyActivityIsland(activity({ content: { semantic: { niche: 'spatial_position' } } }))).toBe('island-nature');
    expect(classifyActivityIsland(activity({ type: 'pattern_completion' }))).toBe('island-colors');
  });

  it('puts every activity in exactly one island, ordered by year then difficulty', () => {
    const pool = (expandedActivityPools() as any[]).map((item, index) => ({ ...item, id: `id-${index}` }));
    pool.push(activity({ id: 'year3', bnccSkills: ['EF03MA07'], difficulty: 'very_easy', title: 'Tabuada' }));
    const plan = planIslandCatalog(pool);

    expect(plan).toHaveLength(pool.length);
    expect(new Set(plan.map((p) => p.activityId)).size).toBe(pool.length);
    for (const island of ISLAND_CATALOG) {
      const sequence = plan.filter((p) => p.islandId === island.islandId).map((p) => p.sequenceInIsland);
      expect(sequence).toEqual(sequence.map((_, index) => index + 1));
    }
    const pomar = plan.filter((p) => p.islandId === 'island-body')
      .sort((a, b) => a.sequenceInIsland - b.sequenceInIsland);
    expect(pomar[pomar.length - 1].activityId).toBe('year3');
  });
});
