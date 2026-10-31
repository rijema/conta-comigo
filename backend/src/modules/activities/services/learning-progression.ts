/**
 * Curricular progression helpers (pure functions, no I/O).
 *
 * Problem (out/2026): the target skill was always the skill of the last
 * attempt and 89% of the catalogue was 1º ano, so a child who answered
 * everything correctly kept receiving 1º ano exercises.
 *
 * Rules, all reusing parameters that already exist in the ADE:
 *  - Performance band over the last ADE_STRATEGY_RECENT_WINDOW (5) attempts:
 *    "strong"     = accuracy >= ADE_EXPLORE_MASTERY_THRESHOLD (0.8), full window;
 *    "struggling" = errors >= ADE_REINFORCE_MIN_ERRORS (2) in the window;
 *    otherwise "steady", or "insufficient" with less than one window.
 *  - School-year window (Vygotsky's ZPD as already used by the template
 *    engine: never more than one year above the child's school year):
 *    max = schoolYear + 1; min = schoolYear − 1 by default; min rises to the
 *    highest year the child is currently succeeding at when "strong"; min is
 *    1 when "struggling", so easier exercises remain available as support.
 *  - Skill choice keeps the current skill (coherence with what the child just
 *    did) until the child shows ADE_EXPLORE_MIN_INDEPENDENT_SUCCESSES (3)
 *    correct answers in a row without hints AND BKT mastery >= 0.8; then it
 *    moves to the next unmastered skill of the same island, ordered by school
 *    year, preferring skills that share a concept with the current one.
 *
 * Every filter has a safety valve: if it would leave nothing to choose, the
 * previous behaviour is kept. Set ADE_YEAR_PROGRESSION_ENABLED=false to turn
 * the whole module off.
 */

export type PerformanceBand = 'insufficient' | 'struggling' | 'steady' | 'strong';

export interface ProgressionAttempt {
  skill: string | null;
  isCorrect: boolean;
  hintsUsed?: number | null;
}

export interface ProgressionParameters {
  window: number;
  strongAccuracy: number;
  strugglingErrors: number;
  advanceStreak: number;
  masteryThreshold: number;
}

export const DEFAULT_PROGRESSION_PARAMETERS: ProgressionParameters = {
  window: 5,
  strongAccuracy: 0.8,
  strugglingErrors: 2,
  advanceStreak: 3,
  masteryThreshold: 0.8,
};

export interface YearWindow {
  minYear: number;
  maxYear: number;
}

const MIN_YEAR = 1;
const MAX_YEAR = 5;

/** School year (1–5) of a BNCC code such as EF03MA07; null if not a BNCC code. */
export function bnccYear(code: string | null | undefined): number | null {
  const match = typeof code === 'string' ? code.match(/^EF0([1-5])MA\d{2}$/) : null;
  return match ? Number(match[1]) : null;
}

interface YearCarrier {
  bnccSkills?: string[] | null;
  content?: Record<string, any> | null;
}

/** School year an activity targets: primary BNCC skill, then content.targetYear, else 1º ano. */
export function activityYearOf(activity: YearCarrier): number {
  const fromSkill = bnccYear(activity.bnccSkills?.[0]);
  if (fromSkill) return fromSkill;
  const target = Number(activity.content?.targetYear);
  return Number.isInteger(target) && target >= MIN_YEAR && target <= MAX_YEAR ? target : MIN_YEAR;
}

/** Template activities generate numbers for the child's own year, so year filters never apply to them. */
export function adaptsToSchoolYear(activity: YearCarrier): boolean {
  return typeof activity.content?.template?.kind === 'string';
}

export function performanceBand(
  attempts: ProgressionAttempt[],
  parameters: ProgressionParameters = DEFAULT_PROGRESSION_PARAMETERS,
): PerformanceBand {
  const recent = attempts.slice(0, parameters.window);
  const errors = recent.filter((attempt) => !attempt.isCorrect).length;
  if (errors >= parameters.strugglingErrors) return 'struggling';
  if (recent.length < parameters.window) return 'insufficient';
  return (recent.length - errors) / recent.length >= parameters.strongAccuracy ? 'strong' : 'steady';
}

/** Highest school year among the recent correct answers (what the child is currently succeeding at). */
export function demonstratedYear(attempts: ProgressionAttempt[], window: number): number | null {
  const years = attempts.slice(0, window)
    .filter((attempt) => attempt.isCorrect)
    .map((attempt) => bnccYear(attempt.skill))
    .filter((year): year is number => year !== null);
  return years.length ? Math.max(...years) : null;
}

export function yearWindow(
  schoolYear: number | null | undefined,
  band: PerformanceBand,
  demonstrated: number | null,
): YearWindow {
  const year = Number.isInteger(schoolYear) && schoolYear! >= MIN_YEAR && schoolYear! <= MAX_YEAR
    ? schoolYear! : null;
  const maxYear = year ? Math.min(MAX_YEAR, year + 1) : MAX_YEAR;
  if (band === 'struggling') return { minYear: MIN_YEAR, maxYear };
  const baseMin = year ? Math.max(MIN_YEAR, year - 1) : MIN_YEAR;
  const minYear = band === 'strong' && demonstrated
    ? Math.min(maxYear, Math.max(baseMin, demonstrated))
    : baseMin;
  return { minYear, maxYear };
}

/**
 * Keeps candidates inside the year window. Safety valve: relaxes the lower
 * bound, then the whole window, instead of ever returning an empty list.
 */
export function applyYearWindow<T extends YearCarrier>(candidates: T[], window: YearWindow): T[] {
  if (!candidates.length) return candidates;
  const inside = (activity: T, minYear: number) => {
    if (adaptsToSchoolYear(activity)) return true;
    const year = activityYearOf(activity);
    return year >= minYear && year <= window.maxYear;
  };
  const strict = candidates.filter((activity) => inside(activity, window.minYear));
  if (strict.length) return strict;
  const relaxed = candidates.filter((activity) => inside(activity, MIN_YEAR));
  return relaxed.length ? relaxed : candidates;
}

export interface SkillOption {
  code: string;
  /** Concepts shared with the current skill (from the ontology), used only to break ties. */
  sharesConceptWithCurrent?: boolean;
}

export interface SkillChoiceInput {
  currentSkill: string | null;
  /** Skills that have at least one eligible activity in scope (e.g. the island the child opened). */
  available: SkillOption[];
  window: YearWindow;
  attempts: ProgressionAttempt[];
  masteryBySkill: Record<string, number>;
  parameters?: ProgressionParameters;
}

export interface SkillChoice {
  skill: string;
  reason: 'keep_current' | 'advance_after_mastery' | 'enter_year_window' | 'enter_scope';
}

const progressionOrder = (left: string, right: string) =>
  (bnccYear(left) ?? 0) - (bnccYear(right) ?? 0) || left.localeCompare(right);

/** True when the child just answered the current skill correctly N times in a row, without hints, with BKT mastery. */
export function readyToAdvance(
  skill: string,
  attempts: ProgressionAttempt[],
  masteryBySkill: Record<string, number>,
  parameters: ProgressionParameters = DEFAULT_PROGRESSION_PARAMETERS,
): boolean {
  const streak = attempts.slice(0, parameters.advanceStreak);
  return streak.length === parameters.advanceStreak &&
    streak.every((attempt) => attempt.skill === skill && attempt.isCorrect && !attempt.hintsUsed) &&
    (masteryBySkill[skill] ?? 0) >= parameters.masteryThreshold;
}

export function chooseProgressionSkill(input: SkillChoiceInput): SkillChoice | null {
  const parameters = input.parameters ?? DEFAULT_PROGRESSION_PARAMETERS;
  const bnccOptions = input.available.filter((option) => bnccYear(option.code) !== null);
  if (!bnccOptions.length) return null;
  const inWindow = (code: string) => {
    const year = bnccYear(code)!;
    return year >= input.window.minYear && year <= input.window.maxYear;
  };
  const unmastered = (code: string) => (input.masteryBySkill[code] ?? 0) < parameters.masteryThreshold;
  const current = input.currentSkill;
  const currentAvailable = current !== null && bnccOptions.some((option) => option.code === current);

  if (current && currentAvailable && inWindow(current)) {
    if (!readyToAdvance(current, input.attempts, input.masteryBySkill, parameters)) {
      return { skill: current, reason: 'keep_current' };
    }
    // Next = another unmastered skill of the same or a later school year
    // (never an earlier one), closest year first.
    const currentYear = bnccYear(current)!;
    const next = bnccOptions
      .filter((option) => option.code !== current && inWindow(option.code) && unmastered(option.code) &&
        bnccYear(option.code)! >= currentYear)
      .sort((left, right) => Number(Boolean(right.sharesConceptWithCurrent)) -
        Number(Boolean(left.sharesConceptWithCurrent)) || progressionOrder(left.code, right.code))[0];
    return next
      ? { skill: next.code, reason: 'advance_after_mastery' }
      : { skill: current, reason: 'keep_current' };
  }

  const ordered = bnccOptions
    .filter((option) => inWindow(option.code))
    .sort((left, right) => Number(unmastered(right.code)) - Number(unmastered(left.code)) ||
      Number(Boolean(right.sharesConceptWithCurrent)) - Number(Boolean(left.sharesConceptWithCurrent)) ||
      progressionOrder(left.code, right.code));
  if (!ordered.length) return null;
  return { skill: ordered[0].code, reason: currentAvailable ? 'enter_year_window' : 'enter_scope' };
}

export function progressionEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env.ADE_YEAR_PROGRESSION_ENABLED ?? 'true').toLowerCase() !== 'false';
}
