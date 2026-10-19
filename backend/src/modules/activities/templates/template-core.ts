/**
 * Exercise templates: one reviewed model produces many concrete exercises.
 *
 * The stored activity keeps `content.template = { kind }`. Every time it is
 * served, the backend picks a `TemplateInstanceKey` (school year 1-5, level
 * 1-5 and a random seed) and generates the concrete numbers/objects/story.
 * Generation is deterministic, so on submit the backend regenerates the same
 * exercise from the key the frontend sends back and validates the answer.
 */
export interface TemplateInstanceKey {
  year: number;
  level: number;
  seed: number;
}

export interface GeneratedTemplateContent {
  instructionsPt: string;
  instructions: string;
  items?: string[];
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: string;
  validation: { kind: 'exact' };
  example?: string;
  spokenHint?: string;
  bnccSkill: string;
  difficulty: string;
  semantic: Record<string, unknown>;
}

export const MIN_YEAR = 1;
export const MAX_YEAR = 5;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
const LEVEL_DIFFICULTY = ['very_easy', 'easy', 'medium', 'hard', 'extreme'];

export function clampKey(key: Partial<TemplateInstanceKey>): TemplateInstanceKey {
  const clamp = (value: unknown, min: number, max: number, fallback: number) => {
    const number = Math.trunc(Number(value));
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  return {
    year: clamp(key.year, MIN_YEAR, MAX_YEAR, 1),
    level: clamp(key.level, MIN_LEVEL, MAX_LEVEL, 2),
    seed: clamp(key.seed, 0, 2 ** 31 - 1, 1),
  };
}

/** Small deterministic PRNG (mulberry32). */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(values: readonly T[]): T => values[Math.floor(next() * values.length)],
    shuffle: <T>(values: T[]): T[] => {
      const copy = [...values];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

export type TemplateRandom = ReturnType<typeof createRandom>;

/** pt-BR number formatting (25847 -> "25.847") without relying on ICU data. */
export function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function levelDifficulty(level: number): string {
  return LEVEL_DIFFICULTY[clampKey({ level }).level - 1];
}

/** Builds 3 answer options: the right one plus typical mistakes, shuffled. */
export function buildOptions(
  answer: number,
  mistakes: number[],
  random: TemplateRandom,
): Array<{ id: string; text: string; isCorrect: boolean }> {
  const step = answer >= 100 ? 10 : 1;
  const candidates = [...mistakes, answer + step, answer - step, answer + 2 * step, answer + 1];
  const distractors: number[] = [];
  for (const candidate of candidates) {
    if (distractors.length === 2) break;
    if (candidate >= 0 && candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
  }
  return random.shuffle([answer, ...distractors]).map((value, index) => ({
    id: String(index),
    text: formatNumber(value),
    isCorrect: value === answer,
  }));
}
