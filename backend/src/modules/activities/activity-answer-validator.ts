export type ValidationKind =
  | 'exact'
  | 'numeric'
  | 'boolean'
  | 'sequence'
  | 'set'
  | 'compound';

export interface ParametricActivityContent {
  correctAnswer?: unknown;
  correctOrder?: unknown[] | string;
  acceptedOrders?: unknown[][];
  validation?: {
    kind: ValidationKind;
    tolerance?: number;
  };
}

export interface ItemFeedback {
  itemId: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface DetailedValidationResult {
  isCorrect: boolean;
  itemFeedback?: ItemFeedback[];
}

function normalizeScalar(value: unknown): unknown {
  if (typeof value === 'string') return value.toLowerCase().trim();
  return value;
}

function normalizeSubmittedAnswer(answer: unknown): unknown {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return answer;
  const record = answer as Record<string, unknown>;
  return record.value ?? record.selectedText ?? record.selectedOption ?? record.count ?? record.arrangement ?? answer;
}

function arraysEqual(left: unknown[], right: unknown[]): boolean {
  return left.length === right.length && left.every(
    (value, index) => normalizeScalar(value) === normalizeScalar(right[index]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function validateActivityAnswer(
  content: ParametricActivityContent,
  submittedAnswer: unknown,
): boolean {
  const validation = content.validation;
  const correct = content.correctAnswer;
  const answer = validation?.kind === 'compound'
    ? submittedAnswer
    : normalizeSubmittedAnswer(submittedAnswer);

  switch (validation?.kind) {
    case 'numeric': {
      const expectedNumber = Number(correct);
      const submittedNumber = Number(answer);
      if (!Number.isFinite(expectedNumber) || !Number.isFinite(submittedNumber)) return false;
      return Math.abs(expectedNumber - submittedNumber) <= (validation.tolerance ?? 0);
    }
    case 'boolean':
      return typeof correct === 'boolean' && typeof answer === 'boolean' && answer === correct;
    case 'sequence': {
      const expected = Array.isArray(content.correctOrder)
        ? content.correctOrder
        : Array.isArray(correct)
          ? correct
          : String(content.correctOrder ?? correct ?? '').split(',').map((item) => item.trim());
      const submitted = Array.isArray(answer)
        ? answer
        : String(answer ?? '').split(',').map((item) => item.trim());
      return [expected, ...(content.acceptedOrders ?? [])].some((order) => arraysEqual(submitted, order));
    }
    case 'set': {
      if (!Array.isArray(correct) || !Array.isArray(answer)) return false;
      const expected = correct.map(normalizeScalar).sort();
      const submitted = answer.map(normalizeScalar).sort();
      return arraysEqual(submitted, expected);
    }
    case 'compound':
      return canonicalJson(answer) === canonicalJson(correct);
    case 'exact':
      return normalizeScalar(answer) === normalizeScalar(correct);
    default:
      return legacyValidate(content, answer);
  }
}

function legacyValidate(content: ParametricActivityContent, answer: unknown): boolean {
  const correct = content.correctAnswer;
  if (correct === null || correct === undefined) return false;
  if (typeof correct === 'string') {
    return String(answer).toLowerCase().trim() === correct.toLowerCase().trim();
  }
  if (typeof correct === 'number') return Number(answer) === correct;
  if (Array.isArray(correct)) return JSON.stringify(answer) === JSON.stringify(correct);
  return answer === correct;
}

export function validateActivityAnswerDetailed(
  content: ParametricActivityContent,
  submittedAnswer: unknown,
  itemOrder?: string[],
): DetailedValidationResult {
  const isCorrect = validateActivityAnswer(content, submittedAnswer);
  const validation = content.validation;
  const correct = content.correctAnswer;
  const answer = validation?.kind === 'compound'
    ? submittedAnswer
    : normalizeSubmittedAnswer(submittedAnswer);

  const itemFeedback: ItemFeedback[] = [];

  if (validation?.kind === 'sequence' && itemOrder) {
    const expected = Array.isArray(content.correctOrder)
      ? content.correctOrder
      : Array.isArray(correct)
        ? correct
        : String(content.correctOrder ?? correct ?? '').split(',').map((item) => item.trim());
    const submitted = Array.isArray(answer)
      ? answer
      : String(answer ?? '').split(',').map((item) => item.trim());

    itemOrder.forEach((itemId, index) => {
      const expectedValue = String(expected[index] ?? '').trim();
      const submittedValue = String(submitted[index] ?? '').trim();
      const itemCorrect = normalizeScalar(expectedValue) === normalizeScalar(submittedValue);
      itemFeedback.push({
        itemId,
        isCorrect: itemCorrect,
        feedback: itemCorrect ? 'Correto!' : `Esperado: ${expectedValue}, Recebido: ${submittedValue}`,
      });
    });
  } else if (validation?.kind === 'set') {
    if (Array.isArray(correct) && Array.isArray(answer)) {
      const expected = correct.map(normalizeScalar);
      const submitted = answer.map(normalizeScalar);
      
      itemOrder?.forEach((itemId, index) => {
        const itemCorrect = expected.includes(normalizeScalar(submitted[index] ?? ''));
        itemFeedback.push({
          itemId,
          isCorrect: itemCorrect,
          feedback: itemCorrect ? 'Correto!' : 'Este item não pertence ao conjunto correto.',
        });
      });
    }
  }

  return {
    isCorrect,
    itemFeedback: itemFeedback.length > 0 ? itemFeedback : undefined,
  };
}
