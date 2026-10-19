import {
  GeneratedTemplateContent,
  TemplateInstanceKey,
  TemplateRandom,
  buildOptions,
  clampKey,
  createRandom,
  formatNumber,
  levelDifficulty,
} from './template-core';

/**
 * Template "Tirar objetos" (Ilha dos Biscoitos).
 *
 * Year sets the size of the numbers (1º ano até 20, 2º até 99, 3º até 999,
 * 4º até 9.999, 5º até 99.999). Level sets the kind of question:
 *   1 conta direta · 2-3 história "quanto sobrou?" · 4 "quantos foram tirados?"
 *   5 duas etapas.
 */
export const TAKE_AWAY_KIND = 'take_away';
export const TAKE_AWAY_STRUCTURE_ID = 'template_take_away';

export const TAKE_AWAY_SKILL_BY_YEAR: Record<number, string> = {
  1: 'EF01MA08',
  2: 'EF02MA06',
  3: 'EF03MA06',
  4: 'EF04MA03',
  5: 'EF05MA07',
};

interface TakeAwayContext {
  id: string;
  emoji: string;
  plural: string;
  feminine: boolean;
  /** Verb for "how many are left" (default: sobraram). */
  left?: string;
  /** Quantities that still sound realistic for this story. */
  min: number;
  max: number;
  start: (n: string) => string;
  take: (k: string, one: boolean) => string;
  again: (k: string, one: boolean) => string;
  missing: (n: string, r: string) => string;
}

const CONTEXTS: TakeAwayContext[] = [
  {
    id: 'biscoitos', min: 1, max: 30, emoji: '🍪', plural: 'biscoitos', feminine: false,
    start: (n) => `A TitiA assou ${n} biscoitos.`,
    take: (k) => `Ela comeu ${k}.`,
    again: (k) => `Depois, comeu mais ${k}.`,
    missing: (n, r) => `A TitiA assou ${n} biscoitos e comeu alguns. Sobraram ${r}. Quantos ela comeu?`,
  },
  {
    id: 'macas', min: 1, max: 30, emoji: '🍎', plural: 'maçãs', feminine: true,
    start: (n) => `Havia ${n} maçãs na cesta.`,
    take: (k, one) => `${k} ${one ? 'foi' : 'foram'} para o lanche.`,
    again: (k, one) => `Depois, mais ${k} ${one ? 'foi' : 'foram'} para o suco.`,
    missing: (n, r) => `Havia ${n} maçãs na cesta. Algumas foram para o lanche e ficaram ${r}. Quantas foram para o lanche?`,
  },
  {
    id: 'figurinhas', min: 1, max: 999, emoji: '🖼️', plural: 'figurinhas', feminine: true,
    start: (n) => `Leo tinha ${n} figurinhas.`,
    take: (k) => `Ele deu ${k} para a irmã.`,
    again: (k) => `Depois, deu mais ${k} para um amigo.`,
    missing: (n, r) => `Leo tinha ${n} figurinhas e deu algumas para a irmã. Ficou com ${r}. Quantas ele deu?`,
  },
  {
    id: 'moedas', min: 1, max: 999, emoji: '🪙', plural: 'moedas', feminine: true,
    start: (n) => `Bia tinha ${n} moedas.`,
    take: (k) => `Ela gastou ${k} na feira.`,
    again: (k) => `Depois, gastou mais ${k} no lanche.`,
    missing: (n, r) => `Bia tinha ${n} moedas e gastou algumas na feira. Ficou com ${r}. Quantas ela gastou?`,
  },
  {
    id: 'lapis', min: 1, max: 99, emoji: '✏️', plural: 'lápis', feminine: false,
    start: (n) => `A caixa tinha ${n} lápis.`,
    take: (k) => `A turma pegou ${k}.`,
    again: (k) => `Depois, a professora pegou mais ${k}.`,
    missing: (n, r) => `A caixa tinha ${n} lápis. A turma pegou alguns e ficaram ${r}. Quantos lápis a turma pegou?`,
  },
  {
    id: 'bolas', min: 1, max: 20, emoji: '⚽', plural: 'bolas', feminine: true,
    start: (n) => `Na quadra havia ${n} bolas.`,
    take: (k, one) => `${k} ${one ? 'foi guardada' : 'foram guardadas'}.`,
    again: (k, one) => `Depois, mais ${k} ${one ? 'foi guardada' : 'foram guardadas'}.`,
    missing: (n, r) => `Na quadra havia ${n} bolas. Algumas foram guardadas e ficaram ${r}. Quantas foram guardadas?`,
  },
  {
    id: 'fabrica', min: 100, max: 99999, emoji: '🍪', plural: 'biscoitos', feminine: false,
    start: (n) => `A fábrica fez ${n} biscoitos.`,
    take: (k, one) => `${k} ${one ? 'foi vendido' : 'foram vendidos'}.`,
    again: (k, one) => `Depois, mais ${k} ${one ? 'foi vendido' : 'foram vendidos'}.`,
    missing: (n, r) => `A fábrica fez ${n} biscoitos e vendeu alguns. Sobraram ${r}. Quantos foram vendidos?`,
  },
  {
    id: 'biblioteca', left: 'ficaram', min: 50, max: 99999, emoji: '📚', plural: 'livros', feminine: false,
    start: (n) => `A biblioteca tinha ${n} livros.`,
    take: (k, one) => `${k} ${one ? 'foi emprestado' : 'foram emprestados'}.`,
    again: (k, one) => `Depois, mais ${k} ${one ? 'foi emprestado' : 'foram emprestados'}.`,
    missing: (n, r) => `A biblioteca tinha ${n} livros. Alguns foram emprestados e ficaram ${r}. Quantos foram emprestados?`,
  },
  {
    id: 'estadio', left: 'ficaram', min: 1000, max: 99999, emoji: '🏟️', plural: 'pessoas', feminine: true,
    start: (n) => `Havia ${n} pessoas no estádio.`,
    take: (k, one) => `${k} ${one ? 'foi embora' : 'foram embora'}.`,
    again: (k, one) => `Depois, mais ${k} ${one ? 'foi embora' : 'foram embora'}.`,
    missing: (n, r) => `Havia ${n} pessoas no estádio. Algumas foram embora e ficaram ${r}. Quantas foram embora?`,
  },
];

const YEAR_ONE_RANGES: Array<[number, number]> = [[3, 6], [5, 10], [6, 10], [8, 15], [10, 20]];

function totalRange(year: number, level: number): [number, number] {
  if (year === 1) return YEAR_ONE_RANGES[level - 1];
  const low = 10 ** (year - 1) + 1;
  const high = 10 ** year - 1;
  return level === 1 ? [low, Math.floor((low + high) / 2)] : [low, high];
}

/** True when some digit of `taken` is bigger than the same digit of `total` ("empresta"). */
export function needsRegrouping(total: number, taken: number): boolean {
  for (let a = total, b = taken; b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) {
    if (b % 10 > a % 10) return true;
  }
  return false;
}

/** Typical mistake: subtracting each digit the "wrong way" (smaller from bigger). */
export function digitWiseMistake(total: number, taken: number): number {
  let result = 0;
  for (let a = total, b = taken, place = 1; a > 0 || b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10), place *= 10) {
    result += Math.abs((a % 10) - (b % 10)) * place;
  }
  return result;
}

function pickTaken(year: number, level: number, total: number, random: TemplateRandom): number {
  if (year === 1) return random.int(1, level === 1 ? Math.min(3, total - 1) : total - 1);
  const minTaken = Math.max(1, Math.ceil(total * 0.1));
  // Level 1 avoids regrouping; from level 2 on, regrouping is welcome.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const taken = random.int(minTaken, total - 1);
    if (needsRegrouping(total, taken) === level >= 2) return taken;
  }
  return random.int(minTaken, total - 1);
}

function itemsFor(context: TakeAwayContext, year: number, total: number): string[] | undefined {
  if (year !== 1 || total > 20) return undefined;
  const row = context.emoji.repeat(Math.min(total, 10));
  return total > 10 ? [row, context.emoji.repeat(total - 10)] : [row];
}

export function generateTakeAway(rawKey: Partial<TemplateInstanceKey>): GeneratedTemplateContent {
  const key = clampKey(rawKey);
  const { year, level } = key;
  const random = createRandom(key.seed * 31 + year * 7 + level);
  const [low, high] = totalRange(year, level);
  const total = random.int(low, high);
  const fitting = CONTEXTS.filter((candidate) => total >= candidate.min && total <= candidate.max);
  const context = random.pick(fitting.length ? fitting : CONTEXTS);
  const fmt = formatNumber;
  const howMany = `${context.feminine ? 'Quantas' : 'Quantos'} ${context.plural} ${context.left ?? 'sobraram'}?`;

  let prompt: string;
  let answer: number;
  let mistakes: number[];
  let hint: string;
  let structure: string;

  if (level <= 3) {
    const taken = pickTaken(year, level, total, random);
    answer = total - taken;
    mistakes = [total + taken, digitWiseMistake(total, taken), taken];
    if (level === 1) {
      structure = 'direct';
      prompt = year === 1
        ? `Há ${total} ${context.plural}. Tire ${taken}. ${context.feminine ? 'Quantas' : 'Quantos'} ficam?`
        : `Quanto é ${fmt(total)} − ${fmt(taken)}?`;
    } else {
      structure = 'story_result';
      prompt = `${context.start(fmt(total))} ${context.take(fmt(taken), taken === 1)} ${howMany}`;
    }
    hint = year === 1
      ? `Conte todos. Depois tire ${taken} e conte o que ficou.`
      : `Faça ${fmt(total)} − ${fmt(taken)}. Comece pelas unidades. Se não der para tirar, troque 1 dezena por 10 unidades.`;
  } else if (level === 4) {
    structure = 'missing_taken';
    const taken = pickTaken(year, level, total, random);
    const remaining = total - taken;
    answer = taken;
    mistakes = [remaining, total + remaining, taken + (year === 1 ? 2 : 10)];
    prompt = context.missing(fmt(total), fmt(remaining));
    hint = `Pense: ${fmt(remaining)} mais quanto dá ${fmt(total)}?`;
  } else {
    structure = 'two_steps';
    const first = Math.max(1, Math.floor(pickTaken(year, level, total, random) / 2));
    const second = random.int(1, Math.max(1, total - first - 1));
    answer = total - first - second;
    mistakes = [total - first, total - second, total - first + second];
    prompt = `${context.start(fmt(total))} ${context.take(fmt(first), first === 1)} ${context.again(fmt(second), second === 1)} ${howMany}`;
    hint = `Primeiro tire ${fmt(first)}. Depois tire ${fmt(second)} do que sobrou.`;
  }

  const options = buildOptions(answer, mistakes, random);
  return {
    instructionsPt: prompt,
    instructions: prompt,
    items: level <= 3 ? itemsFor(context, year, total) : undefined,
    options,
    correctAnswer: fmt(answer),
    validation: { kind: 'exact' },
    example: 'Exemplo: eu tinha 5 biscoitos e comi 2. Sobraram 3.',
    spokenHint: hint,
    bnccSkill: TAKE_AWAY_SKILL_BY_YEAR[year],
    difficulty: levelDifficulty(level),
    semantic: {
      niche: 'subtraction',
      structureId: TAKE_AWAY_STRUCTURE_ID,
      variant: structure,
      context: context.id,
      sensoryProfile: level <= 3 ? 'low' : 'medium',
    },
  };
}
