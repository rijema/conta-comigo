import { interactiveFormatActivities } from './interactive-formats.seed';
import { validateActivityAnswer } from '../../modules/activities/activity-answer-validator';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('interactive format catalog', () => {
  const activities = interactiveFormatActivities() as any[];

  it('offers two difficulty stages for each authored format', () => {
    const formats = new Map<string, Set<string>>();
    for (const activity of activities) {
      const format = activity.content.semantic.formatId;
      if (!formats.has(format)) formats.set(format, new Set());
      formats.get(format)!.add(activity.difficulty);
    }
    expect(formats.size).toBe(26);
    expect([...formats.values()].every((levels) => levels.size === 2)).toBe(true);
  });

  it('validates categorization, ordering and quantity building on the server', () => {
    const categorization = activities.find((activity) => activity.content.semantic.formatId === 'classify_shape');
    expect(validateActivityAnswer(categorization.content, categorization.content.correctOrder)).toBe(true);
    expect(validateActivityAnswer(categorization.content, ['round', 'round', 'straight'])).toBe(false);

    const ordering = activities.find((activity) => activity.content.semantic.formatId === 'order_numbers');
    expect(validateActivityAnswer(ordering.content, { arrangement: ordering.content.correctOrder })).toBe(true);
    expect(validateActivityAnswer(ordering.content, { arrangement: [...ordering.content.correctOrder].reverse() })).toBe(false);

    const builder = activities.find((activity) => activity.content.semantic.formatId === 'build_quantity');
    expect(validateActivityAnswer(builder.content, { count: builder.content.correctAnswer })).toBe(true);
    expect(validateActivityAnswer(builder.content, { count: builder.content.correctAnswer + 1 })).toBe(false);
  });

  it('keeps unverified curriculum links empty and visual concepts explicit', () => {
    for (const activity of activities) {
      expect(activity.content.semantic.structureId).toBeTruthy();
      expect(activity.bnccSkills).toEqual(expect.any(Array));
      if (['patterns', 'magnitudes', 'spatial_position'].includes(activity.content.semantic.niche)) {
        expect(activity.bnccSkills).toEqual([]);
      }
    }
  });

  it('generates child-friendly titles instead of semantic ids', () => {
    for (const activity of activities) {
      expect(activity.title).not.toMatch(/^(Interativo\b|Pool\b)/);
      expect(activity.title).not.toMatch(/\b(order_numbers|complete_sequence|before_after|spatial_position)\b/);
    }
  });

  it('uses registered ARASAAC IDs for every authored visual concept', () => {
    const registrySource = readFileSync(resolve(process.cwd(), '../frontend/src/lib/pictograms.ts'), 'utf8');
    const registered = new Set([...registrySource.matchAll(/definition\(["']([^"']+)["'],[^\n]*?,\s*\d+\)/g)].map((match) => match[1]));
    const concepts: string[] = [];
    const visit = (value: unknown, key = ''): void => {
      if (typeof value === 'string' && /(?:pictogramConceptId|objectConceptId|referenceConceptId|buildPictogramConceptId)$/i.test(key)) concepts.push(value);
      else if (Array.isArray(value)) value.forEach((entry) => visit(entry, key === 'pictogramConceptIds' ? 'pictogramConceptId' : ''));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([name, entry]) => visit(entry, name));
    };
    activities.forEach((activity) => visit(activity.content));
    expect(concepts.length).toBeGreaterThan(100);
    expect(concepts.filter((concept) => !registered.has(concept) && !/^number\.(?:[0-9]|1[0-9]|20)$/.test(concept))).toEqual([]);
  });
});
