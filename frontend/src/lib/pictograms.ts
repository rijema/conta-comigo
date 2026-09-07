export interface PictogramDefinition {
  labelPt: string;
  symbol: string;
  arasaacId: number | null;
}

// Exercise content stores only these stable concept identifiers. Visual assets or
// future ARASAAC IDs are resolved here instead of being embedded in activities.
export const PICTOGRAM_REGISTRY: Record<string, PictogramDefinition> = {
  'action.yes': { labelPt: 'sim', symbol: '✅', arasaacId: null },
  'action.no': { labelPt: 'não', symbol: '❌', arasaacId: null },
  'character.titia': { labelPt: 'TitiA', symbol: '🦋', arasaacId: null },
  'math.addition': { labelPt: 'adição', symbol: '➕', arasaacId: null },
  'math.number_line': { labelPt: 'reta numérica', symbol: '🔢', arasaacId: null },
  'math.part': { labelPt: 'parte', symbol: '🧩', arasaacId: null },
  'math.whole': { labelPt: 'todo', symbol: '🔵', arasaacId: null },
  'object.apple': { labelPt: 'maçã', symbol: '🍎', arasaacId: null },
  'shape.circle': { labelPt: 'círculo', symbol: '⭕', arasaacId: null },
  'shape.square': { labelPt: 'quadrado', symbol: '⬜', arasaacId: null },
  'shape.triangle': { labelPt: 'triângulo', symbol: '🔺', arasaacId: null },
};

export function resolvePictogram(conceptId: string): PictogramDefinition | null {
  return PICTOGRAM_REGISTRY[conceptId] ?? null;
}
