import officialBncc from './data/bncc-matematica-anos-iniciais.json';
import { CURRICULUM_PROGRESSION_SPECS, DESIGN_BASIS, curriculumProgressionActivities } from './curriculum-progression.seed';
import { ISLAND_CATALOG, activityYear, classifyActivityIsland } from './island-catalog.seed';
import { expandedActivityPools } from './activity-pools.seed';
import { interactiveFormatActivities } from './interactive-formats.seed';
import { templateActivities } from './template-activities.seed';
import { generate77ExercisesBreakingCycle } from './exercises-77-breaking-cycle.seed';
import { progressionSkillRows } from './bncc-skills.seed';
import { readFileSync } from 'fs';
import { join } from 'path';

const activities = curriculumProgressionActivities() as any[];
const official = officialBncc.skills as Record<string, { year: number; description: string }>;

/** Symbols that a speech engine reads badly ("um barra quatro", "erre cifrão"). */
const UNSPEAKABLE = /[/×÷°%]|R\$|\d{1,3}\.\d{3}|\d:\d\d/;

describe('curriculum progression exercises (2º–5º ano)', () => {
  it('only uses BNCC skills from the official MEC text, for years 2 to 5', () => {
    for (const activity of activities) {
      const [code] = activity.bnccSkills;
      expect(official[code]).toBeDefined();
      expect(official[code].year).toBeGreaterThanOrEqual(2);
      expect(activityYear({ ...activity, id: 'x' })).toBe(official[code].year);
    }
  });

  it('has unique titles and structure ids, including against every existing seed', () => {
    const seedSource = readFileSync(join(__dirname, 'activities.seed.ts'), 'utf8');
    const literalTitles = [...seedSource.matchAll(/title: '([^']+)'/g)].map((match) => match[1]);
    const existing = new Set([
      ...literalTitles,
      ...(generate77ExercisesBreakingCycle() as any[]).map((a) => a.title),
      ...(expandedActivityPools() as any[]).map((a) => a.title),
      ...(interactiveFormatActivities() as any[]).map((a) => a.title),
      ...(templateActivities() as any[]).map((a) => a.title),
    ]);
    const titles = activities.map((a) => a.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const title of titles) expect(existing.has(title)).toBe(false);
    const structures = activities.map((a) => a.content.semantic.structureId);
    expect(new Set(structures).size).toBe(structures.length);
  });

  it('keeps answers consistent with what the child can choose or place', () => {
    for (const activity of activities) {
      const { content } = activity;
      if (activity.type === 'quiz') {
        const correct = content.options.filter((option: any) => option.isCorrect);
        expect(correct).toHaveLength(1);
        expect(correct[0].text).toBe(content.correctAnswer);
        expect(new Set(content.options.map((o: any) => o.text)).size).toBe(content.options.length);
        expect(content.validation).toEqual({ kind: 'exact' });
      } else if (activity.type === 'drag_drop') {
        const ids = content.items.map((item: any) => item.id);
        expect([...content.correctOrder].sort()).toEqual([...ids].sort());
        expect(content.slotCount).toBe(content.correctOrder.length);
        expect(content.slotLabels).toHaveLength(content.slotCount);
        expect(content.validation).toEqual({ kind: 'sequence' });
      } else {
        expect(activity.type).toBe('representation_matching');
        expect(content.interaction).toBe('categorize');
        const binIds = new Set(content.bins.map((bin: any) => bin.id));
        expect(content.correctOrder).toHaveLength(content.items.length);
        for (const binId of content.correctOrder) expect(binIds.has(binId)).toBe(true);
        expect(content.validation).toEqual({ kind: 'sequence' });
      }
    }
  });

  it('always renders its own content instead of a generic minigame', () => {
    for (const activity of activities) {
      const semantic = activity.content.semantic;
      expect(semantic.niche).not.toBe('comparison');
      expect(semantic.structureId).not.toMatch(/pattern|numberline|ordering\.two_digit/);
      expect(activity.type).not.toBe('pattern_completion');
      if (activity.type === 'drag_drop') expect(Array.isArray(activity.content.correctOrder)).toBe(true);
    }
  });

  it('gives TitiA speakable text for the question, steps, hint and feedback', () => {
    for (const activity of activities) {
      const { content } = activity;
      expect(content.spokenSteps.length).toBeGreaterThanOrEqual(2);
      for (const text of [content.spokenQuestion, content.spokenSuccessFeedback, content.spokenRetryFeedback, ...content.spokenSteps]) {
        expect(typeof text).toBe('string');
        expect(text).not.toMatch(UNSPEAKABLE);
      }
      expect(content.spokenHint.length).toBeGreaterThan(0);
      for (const option of content.options ?? []) {
        expect(option.spokenText ?? option.text).not.toMatch(UNSPEAKABLE);
      }
      for (const item of activity.type === 'drag_drop' ? content.items : []) {
        expect(item.spokenText ?? item.label).not.toMatch(UNSPEAKABLE);
      }
    }
  });

  it('cites a literature-backed design basis for every exercise', () => {
    const allowed = new Set(Object.values(DESIGN_BASIS));
    for (const activity of activities) {
      expect(activity.content.semantic.designBasis.length).toBeGreaterThan(0);
      for (const basis of activity.content.semantic.designBasis) expect(allowed.has(basis)).toBe(true);
    }
  });

  it('places every exercise in a themed island and balances islands for years 3 to 5', () => {
    const catalogSkills = new Set(ISLAND_CATALOG.flatMap((island) => island.bnccSkills));
    const counts = new Map<string, number>();
    for (const activity of activities) {
      expect(catalogSkills.has(activity.bnccSkills[0])).toBe(true);
      const key = `${classifyActivityIsland({ ...activity, id: 'x' })}:${activityYear({ ...activity, id: 'x' })}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const island of ISLAND_CATALOG) {
      expect(counts.get(`${island.islandId}:2`) ?? 0).toBeGreaterThanOrEqual(2);
      for (const year of [3, 4, 5]) {
        expect(counts.get(`${island.islandId}:${year}`) ?? 0).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('splits add/subtract skills by wording into Pomar (join) and Biscoitos (take away)', () => {
    const islandOf = (key: string) => classifyActivityIsland({
      ...activities.find((a) => a.content.semantic.structureId === `bncc_progression.${key}`), id: 'x',
    });
    expect(islandOf('ef03ma06.livros_ao_todo')).toBe('island-body');
    expect(islandOf('ef04ma03.sorvetes_ao_todo')).toBe('island-body');
    expect(islandOf('ef05ma07.lanche_decimais')).toBe('island-body');
    expect(islandOf('ef03ma06.lugares_faltam')).toBe('island-home');
    expect(islandOf('ef02ma06.livros_estante')).toBe('island-home');
    expect(islandOf('ef02ma06.figurinhas_restaram')).toBe('island-home');
  });

  it('mixes difficulty levels inside each school year', () => {
    for (const year of [3, 4, 5]) {
      const levels = new Set(CURRICULUM_PROGRESSION_SPECS
        .filter((spec) => Number(spec.skill[3]) === year).map((spec) => spec.difficulty));
      expect(levels).toEqual(new Set(['easy', 'medium', 'hard']));
    }
  });

  it('adds the official BNCC text for skills not yet in the skills table', () => {
    const rows = progressionSkillRows(new Set(['EF02MA01']));
    expect(rows.find((row) => row.code === 'EF02MA01')).toBeUndefined();
    const row = rows.find((candidate) => candidate.code === 'EF03MA08');
    expect(row?.description).toBe(official.EF03MA08.description);
    expect(row?.description).toContain('com resto zero e com resto diferente de zero');
  });
});
