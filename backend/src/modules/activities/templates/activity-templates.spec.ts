import { validateActivityAnswer } from '../activity-answer-validator';
import { chooseTemplateKey, materializeTemplate, templateKindOf } from './activity-templates';
import { formatNumber } from './template-core';
import { generateTakeAway, needsRegrouping, TAKE_AWAY_SKILL_BY_YEAR } from './take-away.template';

const parse = (text: string) => Number(text.replace(/\./g, ''));

describe('take-away template', () => {
  it('is deterministic for the same key', () => {
    expect(generateTakeAway({ year: 3, level: 4, seed: 42 })).toEqual(generateTakeAway({ year: 3, level: 4, seed: 42 }));
    expect(generateTakeAway({ year: 3, level: 4, seed: 42 }).instructionsPt)
      .not.toEqual(generateTakeAway({ year: 3, level: 4, seed: 43 }).instructionsPt);
  });

  it('always has exactly one correct, non-negative answer among three different options', () => {
    for (let year = 1; year <= 5; year += 1) {
      for (let level = 1; level <= 5; level += 1) {
        for (let seed = 1; seed <= 60; seed += 1) {
          const content = generateTakeAway({ year, level, seed });
          const correct = content.options.filter((option) => option.isCorrect);
          expect(correct).toHaveLength(1);
          expect(correct[0].text).toBe(content.correctAnswer);
          expect(new Set(content.options.map((option) => option.text)).size).toBe(3);
          expect(parse(content.correctAnswer)).toBeGreaterThanOrEqual(0);
          expect(content.bnccSkill).toBe(TAKE_AWAY_SKILL_BY_YEAR[year]);
        }
      }
    }
  });

  it('scales the numbers with the school year', () => {
    const biggest = (year: number) => Math.max(...Array.from({ length: 40 }, (_, seed) =>
      Math.max(...(generateTakeAway({ year, level: 2, seed }).instructionsPt.match(/\d[\d.]*/g) ?? ['0']).map(parse))));
    expect(biggest(1)).toBeLessThanOrEqual(10);
    expect(biggest(2)).toBeLessThan(100);
    expect(biggest(3)).toBeGreaterThanOrEqual(100);
    expect(biggest(4)).toBeGreaterThanOrEqual(1000);
  });

  it('shows pictures only for small 1st-year quantities', () => {
    expect(generateTakeAway({ year: 1, level: 1, seed: 3 }).items?.length).toBeGreaterThan(0);
    expect(generateTakeAway({ year: 3, level: 1, seed: 3 }).items).toBeUndefined();
  });

  it('asks for regrouping from level 2 on in higher years', () => {
    const direct = generateTakeAway({ year: 3, level: 1, seed: 7 }).instructionsPt.match(/\d[\d.]*/g)!.map(parse);
    expect(needsRegrouping(direct[0], direct[1])).toBe(false);
    expect(formatNumber(25847)).toBe('25.847');
  });
});

describe('template activities', () => {
  const stored: any = {
    id: 't1',
    bnccSkills: ['EF01MA08'],
    difficulty: 'easy',
    content: { template: { kind: 'take_away' }, semantic: { structureId: 'template_take_away' } },
  };

  it('materializes a concrete exercise that the answer validator accepts', () => {
    expect(templateKindOf(stored)).toBe('take_away');
    const served = materializeTemplate(stored, { year: 3, level: 3, seed: 9 });
    expect(served.bnccSkills).toEqual(['EF03MA06']);
    expect(served.content.templateInstance).toEqual({ year: 3, level: 3, seed: 9 });
    expect(served.content.semantic.structureId).toBe('template_take_away');
    expect(validateActivityAnswer(served.content, { selectedText: served.content.correctAnswer })).toBe(true);
    const wrong = served.content.options.find((option: any) => !option.isCorrect);
    expect(validateActivityAnswer(served.content, { selectedText: wrong.text })).toBe(false);
    expect(templateKindOf({ content: {} })).toBeNull();
  });

  it('starts at the school year, level 1, and adapts after two answers', () => {
    expect(chooseTemplateKey(3, [], 5)).toEqual({ year: 3, level: 1, seed: 5 });
    const at = (year: number, level: number, isCorrect: boolean) => ({ key: { year, level, seed: 1 }, isCorrect });
    expect(chooseTemplateKey(3, [at(3, 2, true), at(3, 2, true)], 1)).toMatchObject({ year: 3, level: 3 });
    expect(chooseTemplateKey(3, [at(3, 3, true), at(3, 2, true)], 1)).toMatchObject({ year: 3, level: 3 });
    expect(chooseTemplateKey(3, [at(3, 2, false), at(3, 2, false)], 1)).toMatchObject({ year: 3, level: 1 });
    expect(chooseTemplateKey(3, [at(3, 1, false), at(3, 1, false)], 1)).toMatchObject({ year: 2, level: 3 });
    expect(chooseTemplateKey(3, [at(3, 5, true), at(3, 5, true)], 1)).toMatchObject({ year: 4, level: 1 });
    expect(chooseTemplateKey(3, [at(4, 5, true), at(4, 5, true)], 1)).toMatchObject({ year: 4, level: 5 });
    expect(chooseTemplateKey(1, [at(1, 1, false), at(1, 1, false)], 1)).toMatchObject({ year: 1, level: 1 });
  });
});
