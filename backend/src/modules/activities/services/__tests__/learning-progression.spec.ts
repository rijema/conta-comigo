import {
  ProgressionAttempt,
  activityYearOf,
  applyYearWindow,
  chooseProgressionSkill,
  demonstratedYear,
  performanceBand,
  progressionEnabled,
  readyToAdvance,
  yearWindow,
} from '../learning-progression';

const attempt = (skill: string, isCorrect = true, hintsUsed = 0): ProgressionAttempt => ({ skill, isCorrect, hintsUsed });
const act = (id: string, skill?: string, extra: Record<string, any> = {}) =>
  ({ id, bnccSkills: skill ? [skill] : [], content: extra });

describe('learning progression', () => {
  describe('performance band', () => {
    it('needs a full window before calling a child strong', () => {
      expect(performanceBand([attempt('EF01MA03'), attempt('EF01MA03')])).toBe('insufficient');
      expect(performanceBand(Array(5).fill(attempt('EF01MA03')))).toBe('strong');
    });

    it('flags two recent errors as struggling even with little evidence', () => {
      expect(performanceBand([attempt('EF03MA07', false), attempt('EF03MA07', false)])).toBe('struggling');
    });

    it('counts one error in five (80%) as strong with the default parameters', () => {
      // With window 5, strong >= 0.8 and struggling >= 2 errors, "steady" is
      // unreachable; it only appears when the experimental parameters change.
      expect(performanceBand([
        attempt('A'), attempt('A', false), attempt('A'), attempt('A'), attempt('A'),
      ])).toBe('strong');
    });

    it('is steady between the thresholds when parameters allow it', () => {
      const parameters = { window: 5, strongAccuracy: 0.9, strugglingErrors: 3, advanceStreak: 3, masteryThreshold: 0.8 };
      expect(performanceBand([
        attempt('A'), attempt('A', false), attempt('A'), attempt('A'), attempt('A'),
      ], parameters)).toBe('steady');
    });
  });

  describe('year window', () => {
    it('allows one year below and one above the school year by default', () => {
      expect(yearWindow(4, 'steady', null)).toEqual({ minYear: 3, maxYear: 5 });
      expect(yearWindow(1, 'insufficient', null)).toEqual({ minYear: 1, maxYear: 2 });
    });

    it('does not go back to basic exercises when the child is doing well', () => {
      expect(yearWindow(3, 'strong', 4)).toEqual({ minYear: 4, maxYear: 4 });
      expect(yearWindow(null, 'strong', 2)).toEqual({ minYear: 2, maxYear: 5 });
    });

    it('opens the easier years again when the child is struggling', () => {
      expect(yearWindow(4, 'struggling', 4)).toEqual({ minYear: 1, maxYear: 5 });
    });

    it('works without a school year registered', () => {
      expect(yearWindow(null, 'steady', null)).toEqual({ minYear: 1, maxYear: 5 });
      expect(yearWindow(undefined, 'insufficient', null)).toEqual({ minYear: 1, maxYear: 5 });
    });
  });

  it('reads the year from the primary BNCC skill, then content, else 1º ano', () => {
    expect(activityYearOf(act('a', 'EF04MA06'))).toBe(4);
    expect(activityYearOf(act('b', undefined, { targetYear: 3 }))).toBe(3);
    expect(activityYearOf(act('c'))).toBe(1);
  });

  it('measures the year the child is currently succeeding at', () => {
    expect(demonstratedYear([attempt('EF03MA07'), attempt('EF04MA06', false), attempt('EF02MA05')], 5)).toBe(3);
    expect(demonstratedYear([attempt('EF03MA07', false)], 5)).toBeNull();
  });

  describe('applyYearWindow', () => {
    const pool = [act('y1', 'EF01MA03'), act('y3', 'EF03MA07'), act('y4', 'EF04MA06'), act('tpl', 'EF01MA08', { template: { kind: 'take_away' } })];

    it('keeps only exercises inside the window, plus templates that adapt to the year', () => {
      expect(applyYearWindow(pool, { minYear: 3, maxYear: 4 }).map((a) => a.id)).toEqual(['y3', 'y4', 'tpl']);
    });

    it('never returns an empty list (safety valve)', () => {
      const onlyBasic = [act('y1', 'EF01MA03')];
      expect(applyYearWindow(onlyBasic, { minYear: 4, maxYear: 5 }).map((a) => a.id)).toEqual(['y1']);
      expect(applyYearWindow([], { minYear: 4, maxYear: 5 })).toEqual([]);
    });

    it('relaxes the lower bound before ignoring the window', () => {
      const pool2 = [act('y1', 'EF01MA03'), act('y5', 'EF05MA06')];
      expect(applyYearWindow(pool2, { minYear: 3, maxYear: 3 }).map((a) => a.id)).toEqual(['y1']);
    });
  });

  describe('chooseProgressionSkill', () => {
    const island = ['EF01MA06', 'EF02MA07', 'EF03MA07', 'EF03MA03', 'EF04MA06'].map((code) => ({ code }));

    it('keeps the current skill while the child is still practising it', () => {
      const choice = chooseProgressionSkill({
        currentSkill: 'EF03MA07', available: island, window: { minYear: 2, maxYear: 4 },
        attempts: [attempt('EF03MA07'), attempt('EF03MA07', false)], masteryBySkill: { EF03MA07: 0.6 },
      });
      expect(choice).toEqual({ skill: 'EF03MA07', reason: 'keep_current' });
    });

    it('advances to the next unmastered skill after independent successes and mastery', () => {
      const choice = chooseProgressionSkill({
        currentSkill: 'EF03MA07', available: island, window: { minYear: 2, maxYear: 4 },
        attempts: [attempt('EF03MA07'), attempt('EF03MA07'), attempt('EF03MA07')],
        masteryBySkill: { EF03MA07: 0.9 },
      });
      expect(choice?.skill).toBe('EF03MA03');
      expect(choice?.reason).toBe('advance_after_mastery');
    });

    it('does not advance when the streak used hints', () => {
      expect(readyToAdvance('EF03MA07', [attempt('EF03MA07'), attempt('EF03MA07', true, 1), attempt('EF03MA07')],
        { EF03MA07: 0.95 })).toBe(false);
    });

    it('prefers a skill that shares a concept with the current one when advancing', () => {
      const choice = chooseProgressionSkill({
        currentSkill: 'EF03MA07',
        available: [{ code: 'EF03MA07' }, { code: 'EF03MA03' }, { code: 'EF04MA06', sharesConceptWithCurrent: true }],
        window: { minYear: 3, maxYear: 4 },
        attempts: [attempt('EF03MA07'), attempt('EF03MA07'), attempt('EF03MA07')],
        masteryBySkill: { EF03MA07: 0.9 },
      });
      expect(choice?.skill).toBe('EF04MA06');
    });

    it('leaves a 1º ano skill when the window starts at a later year', () => {
      const choice = chooseProgressionSkill({
        currentSkill: 'EF01MA06', available: island, window: { minYear: 3, maxYear: 5 },
        attempts: Array(5).fill(attempt('EF01MA06')), masteryBySkill: {},
      });
      expect(choice).toEqual({ skill: 'EF03MA03', reason: 'enter_year_window' });
    });

    it('enters an island at the first unmastered skill of the window', () => {
      const choice = chooseProgressionSkill({
        currentSkill: 'EF01MA14', available: island, window: { minYear: 2, maxYear: 3 },
        attempts: [], masteryBySkill: { EF02MA07: 0.95 },
      });
      expect(choice).toEqual({ skill: 'EF03MA03', reason: 'enter_scope' });
    });

    it('returns null when the scope has no BNCC skill in range, so the ADE default is kept', () => {
      expect(chooseProgressionSkill({
        currentSkill: null, available: [{ code: 'not-bncc' }], window: { minYear: 1, maxYear: 5 },
        attempts: [], masteryBySkill: {},
      })).toBeNull();
      expect(chooseProgressionSkill({
        currentSkill: null, available: [{ code: 'EF05MA06' }], window: { minYear: 1, maxYear: 2 },
        attempts: [], masteryBySkill: {},
      })).toBeNull();
    });
  });

  it('can be switched off with ADE_YEAR_PROGRESSION_ENABLED=false', () => {
    expect(progressionEnabled({} as NodeJS.ProcessEnv)).toBe(true);
    expect(progressionEnabled({ ADE_YEAR_PROGRESSION_ENABLED: 'false' } as NodeJS.ProcessEnv)).toBe(false);
    expect(progressionEnabled({ ADE_YEAR_PROGRESSION_ENABLED: 'FALSE' } as NodeJS.ProcessEnv)).toBe(false);
  });
});
