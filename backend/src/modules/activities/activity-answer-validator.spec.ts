import { validateActivityAnswer } from './activity-answer-validator';

describe('parametric activity answer validation', () => {
  it.each([
    [{ validation: { kind: 'exact' as const }, correctAnswer: 'Square' }, ' square ', true],
    [{ validation: { kind: 'numeric' as const }, correctAnswer: 3 }, '3', true],
    [{ validation: { kind: 'numeric' as const, tolerance: 0.1 }, correctAnswer: 3 }, 3.2, false],
    [{ validation: { kind: 'boolean' as const }, correctAnswer: false }, false, true],
    [{ validation: { kind: 'sequence' as const }, correctOrder: ['1', '2'] }, ['1', '2'], true],
    [{ validation: { kind: 'set' as const }, correctAnswer: ['circle', 'square'] }, ['square', 'circle'], true],
  ])('validates configured strategies', (content, answer, expected) => {
    expect(validateActivityAnswer(content, answer)).toBe(expected);
  });

  it('validates an error-detection verdict together with its reason', () => {
    const content = {
      validation: { kind: 'compound' as const },
      correctAnswer: { value: false, reason: 'sum_is_five' },
    };

    expect(validateActivityAnswer(content, {
      reason: 'sum_is_five',
      value: false,
    })).toBe(true);
    expect(validateActivityAnswer(content, {
      value: false,
      reason: 'sum_is_six',
    })).toBe(false);
  });

  it('preserves legacy exact and drag/drop validation', () => {
    expect(validateActivityAnswer({ correctAnswer: '5' }, 5)).toBe(true);
    expect(validateActivityAnswer({
      validation: { kind: 'sequence' },
      correctOrder: 'n1,n2,n3',
    }, ['n1', 'n2', 'n3'])).toBe(true);
  });
});
