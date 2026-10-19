import { randomInt } from 'crypto';
import { generateTakeAway, TAKE_AWAY_KIND } from './take-away.template';
import {
  GeneratedTemplateContent,
  MAX_LEVEL,
  MAX_YEAR,
  MIN_LEVEL,
  MIN_YEAR,
  TemplateInstanceKey,
  clampKey,
} from './template-core';

export { TemplateInstanceKey, clampKey } from './template-core';

const GENERATORS: Record<string, (key: Partial<TemplateInstanceKey>) => GeneratedTemplateContent> = {
  [TAKE_AWAY_KIND]: generateTakeAway,
};

interface TemplateCarrier {
  content?: any;
  bnccSkills?: string[];
  difficulty?: any;
  skillWeights?: any;
}

export function templateKindOf(activity: TemplateCarrier | null | undefined): string | null {
  const kind = activity?.content?.template?.kind;
  return typeof kind === 'string' && GENERATORS[kind] ? kind : null;
}

/** Returns a copy of the activity with concrete numbers/story for the given key. */
export function materializeTemplate<T extends TemplateCarrier>(activity: T, rawKey: Partial<TemplateInstanceKey>): T {
  const kind = templateKindOf(activity);
  if (!kind) return activity;
  const key = clampKey(rawKey);
  const { bnccSkill, difficulty, semantic, ...generated } = GENERATORS[kind](key);
  return {
    ...activity,
    bnccSkills: [bnccSkill],
    skillWeights: [{ code: bnccSkill, role: 'primary', weight: 1 }],
    difficulty,
    content: {
      ...activity.content,
      ...generated,
      items: generated.items,
      semantic: { ...(activity.content?.semantic ?? {}), ...semantic },
      targetYear: key.year,
      templateInstance: key,
    },
  };
}

export interface TemplateHistoryEntry {
  key: Partial<TemplateInstanceKey>;
  isCorrect: boolean;
}

/**
 * Picks school year + level for the next exercise of a template.
 * Starts gently (child's school year, level 1). Two right answers in a row
 * move one step up; two wrong answers in a row move one step down. The child
 * can go one school year above their own, never below the 1st year.
 */
export function chooseTemplateKey(
  schoolYear: number | null | undefined,
  history: TemplateHistoryEntry[],
  seed: number = randomInt(1, 2 ** 31 - 1),
): TemplateInstanceKey {
  const baseYear = clampKey({ year: schoolYear ?? MIN_YEAR }).year;
  const maxYear = Math.min(MAX_YEAR, baseYear + 1);
  if (!history.length) return { year: baseYear, level: MIN_LEVEL, seed };

  const last = clampKey(history[0].key);
  let { year, level } = last;
  // Only answers given at the current year/level count, so one step up needs
  // two new answers before the next change.
  const lastTwo = history.slice(0, 2).filter((entry) => {
    const entryKey = clampKey(entry.key);
    return entryKey.year === last.year && entryKey.level === last.level;
  });
  if (lastTwo.length === 2 && lastTwo.every((entry) => entry.isCorrect)) {
    level += 1;
    if (level > MAX_LEVEL) {
      if (year < maxYear) {
        year += 1;
        level = MIN_LEVEL;
      } else {
        level = MAX_LEVEL;
      }
    }
  } else if (lastTwo.length === 2 && lastTwo.every((entry) => !entry.isCorrect)) {
    level -= 1;
    if (level < MIN_LEVEL) {
      if (year > MIN_YEAR) {
        year -= 1;
        level = 3;
      } else {
        level = MIN_LEVEL;
      }
    }
  }
  return { year: Math.min(year, maxYear), level, seed };
}
