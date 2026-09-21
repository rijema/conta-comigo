// Authored interaction structures. Difficulty labels are configurable research parameters.
type VisualGroup = { label?: string; pictogramConceptIds: string[] };
type Option = { text: string; pictogramConceptId?: string; pictogramConceptIds?: string[] };
type Format = { id: string; niche: string; skills: string[]; type: string; prompt: string; levels: [number, number]; build: (level: number) => Record<string, unknown> };
const unit = 'library.die';
const n = (value: number) => `number.${value}`;
const group = (count: number, conceptId = unit): VisualGroup => ({ pictogramConceptIds: Array(count).fill(conceptId) });
const visual = (left: number, right?: number): VisualGroup[] => right === undefined ? [group(left)] : [group(left), group(right)];
const choice = (groups: VisualGroup[], answers: Option[], correct: string) => ({ visualGroups: groups, options: answers.map((answer, index) => ({ id: String(index), ...answer, isCorrect: answer.text === correct })), correctAnswer: correct, validation: { kind: 'exact' } });
const numbers = (values: number[]): Option[] => values.map((value) => ({ text: String(value), pictogramConceptId: n(value) }));
const drag = (items: Array<{ id: string; label: string; pictogramConceptId?: string; pictogramConceptIds?: string[] }>, correctOrder: string[], slotLabels?: string[], slotPictogramConceptIds?: string[][]) => ({ items, correctOrder, slotCount: correctOrder.length, slotLabels, slotPictogramConceptIds, validation: { kind: 'sequence' } });
const sort = (items: Array<{ id: string; label: string; pictogramConceptId: string }>, bins: Array<{ id: string; label: string; pictogramConceptId: string }>, order: string[]) => ({ interaction: 'categorize', items, bins, correctOrder: order, validation: { kind: 'sequence' } });
const item = (id: string, concept: string, label = id) => ({ id, label, pictogramConceptId: concept });
const formatLabels: Record<string, string> = {
  visual_counting: 'Contagem visual', number_to_quantity: 'Número para quantidade', quantity_to_number: 'Quantidade para número',
  order_numbers: 'Ordenar números', complete_sequence: 'Completar sequência', before_after: 'Antes e depois',
  greater_less_equal: 'Maior, menor ou igual', more_less: 'Mais ou menos', group_by_quantity: 'Agrupar por quantidade',
  classify_shape: 'Classificar formas', classify_size: 'Classificar tamanhos', classify_attribute: 'Classificar cores',
  complete_pattern: 'Completar padrões', shape_real_object: 'Formas em objetos', build_quantity: 'Montar quantidade',
  visual_addition: 'Adição visual', visual_subtraction: 'Subtração visual', subtraction_story: 'Subtração com história', everyday_problem: 'Problema cotidiano',
  visual_strategy: 'Estratégia visual', odd_one_out: 'Item diferente', equivalent_set: 'Conjunto equivalente',
  one_to_one: 'Correspondência um a um', spatial_position: 'Posição espacial', magnitude: 'Grandezas',
  compare_length: 'Comprido ou curto', full_empty: 'Cheio ou vazio',
};

const formatTitleVariants: Record<string, [string, string]> = {
  visual_counting: ['Contar figuras', 'Contar mais figuras'],
  number_to_quantity: ['Ligar número e quantidade', 'Ligar mais números e quantidades'],
  quantity_to_number: ['Ligar quantidade e número', 'Ligar mais quantidades e números'],
  order_numbers: ['Colocar números em ordem', 'Ordenar números maiores'],
  complete_sequence: ['Completar a sequência', 'Descobrir o próximo número'],
  before_after: ['Descobrir o número anterior', 'Pensar no antes e depois'],
  greater_less_equal: ['Comparar quantidades', 'Comparar grupos maiores'],
  more_less: ['Encontrar o grupo com mais', 'Encontrar o grupo com menos'],
  group_by_quantity: ['Separar por quantidade', 'Agrupar mais quantidades'],
  classify_shape: ['Agrupar formas iguais', 'Comparar diferentes formas'],
  classify_size: ['Separar figuras por tamanho', 'Comparar tamanhos das figuras'],
  classify_attribute: ['Agrupar figuras por cor', 'Comparar cores das figuras'],
  complete_pattern: ['Completar o padrão', 'Descobrir a repetição'],
  shape_real_object: ['Encontrar a forma do objeto', 'Comparar objeto e forma'],
  build_quantity: ['Montar a quantidade', 'Montar quantidades maiores'],
  visual_addition: ['Somar dois grupos', 'Somar mais figuras'],
  visual_subtraction: ['Descobrir quantos restam', 'Tirar e contar o que sobrou'],
  subtraction_story: ['Contar o que sobra após dar', 'Resolver um problema de subtração'],
  everyday_problem: ['Resolver um problema do dia a dia', 'Resolver outro problema do dia a dia'],
  visual_strategy: ['Escolher como resolver a soma', 'Escolher a melhor estratégia'],
  odd_one_out: ['Encontrar a figura diferente', 'Descobrir o item diferente'],
  equivalent_set: ['Encontrar a mesma quantidade', 'Comparar quantidades iguais'],
  one_to_one: ['Fazer pares um a um', 'Conferir se todos têm par'],
  spatial_position: ['Descobrir onde está', 'Observar outra posição'],
  magnitude: ['Comparar qual tem mais', 'Comparar grupos maiores'],
  compare_length: ['Descobrir o que é mais comprido', 'Comparar comprimentos'],
  full_empty: ['Descobrir o que está cheio', 'Comparar recipientes'],
};

const spatialRelationTitles: Record<string, [string, string]> = {
  above: ['Descobrir o que está em cima', 'Observar quem fica mais acima'],
  below: ['Descobrir o que está embaixo', 'Observar quem fica mais abaixo'],
  inside: ['Descobrir o que está dentro', 'Observar quem fica por dentro'],
  outside: ['Descobrir o que está fora', 'Observar quem fica por fora'],
  left: ['Descobrir o que está à esquerda', 'Observar quem fica mais à esquerda'],
  right: ['Descobrir o que está à direita', 'Observar quem fica mais à direita'],
};

const formats: Format[] = [
  { id: 'visual_counting', niche: 'counting', skills: ['EF01MA02'], type: 'quiz', prompt: 'Conte os dados. Quantos há?', levels: [2, 5], build: (v) => choice(visual(v), numbers([v - 1, v, v + 1]), String(v)) },
  { id: 'number_to_quantity', niche: 'number_quantity', skills: ['EF01MA01', 'EF01MA02'], type: 'drag_drop', prompt: 'Leve cada número para o conjunto correspondente.', levels: [2, 4], build: (v) => drag([item('a', n(v), String(v)), item('b', n(v + 1), String(v + 1))], ['b', 'a'], ['Conjunto 1', 'Conjunto 2'], [group(v + 1).pictogramConceptIds, group(v).pictogramConceptIds]) },
  { id: 'quantity_to_number', niche: 'number_quantity', skills: ['EF01MA02', 'EF01MA01'], type: 'drag_drop', prompt: 'Leve cada conjunto para o número correspondente.', levels: [2, 4], build: (v) => drag([{ id: 'a', label: `${v} dados`, pictogramConceptIds: group(v).pictogramConceptIds }, { id: 'b', label: `${v + 1} dados`, pictogramConceptIds: group(v + 1).pictogramConceptIds }], ['b', 'a'], [String(v + 1), String(v)], [[n(v + 1)], [n(v)]]) },
  { id: 'order_numbers', niche: 'sequence', skills: ['EF01MA01'], type: 'drag_drop', prompt: 'Coloque os números em ordem crescente.', levels: [3, 8], build: (v) => drag([item('c', n(v + 2), String(v + 2)), item('a', n(v), String(v)), item('b', n(v + 1), String(v + 1))], ['a', 'b', 'c']) },
  { id: 'complete_sequence', niche: 'sequence', skills: ['EF01MA01'], type: 'quiz', prompt: 'Qual número completa a sequência?', levels: [3, 8], build: (v) => choice([{ label: `${v - 2}, ${v - 1}, ?`, pictogramConceptIds: [n(v - 2), n(v - 1)] }], numbers([v, v + 1]), String(v)) },
  { id: 'before_after', niche: 'sequence', skills: ['EF01MA01'], type: 'quiz', prompt: 'Qual número vem imediatamente antes?', levels: [4, 10], build: (v) => choice([{ pictogramConceptIds: [n(v)] }], numbers([v - 1, v + 1]), String(v - 1)) },
  { id: 'greater_less_equal', niche: 'comparison', skills: ['EF01MA03'], type: 'quiz', prompt: 'Compare os dois grupos. O primeiro tem mais, menos ou a mesma quantidade?', levels: [2, 5], build: (v) => choice(visual(v, v + 1), [{ text: 'mais', pictogramConceptId: 'mathematics.more' }, { text: 'menos', pictogramConceptId: 'mathematics.less' }, { text: 'igual', pictogramConceptId: 'mathematics.equal' }], 'menos') },
  { id: 'more_less', niche: 'comparison', skills: ['EF01MA03'], type: 'quiz', prompt: 'Qual conjunto tem mais itens?', levels: [2, 5], build: (v) => choice([{ label: 'A', ...group(v) }, { label: 'B', ...group(v + 2) }], [{ text: 'A', pictogramConceptId: n(v) }, { text: 'B', pictogramConceptId: n(v + 2) }], 'B') },
  { id: 'group_by_quantity', niche: 'classification', skills: ['EF01MA02'], type: 'counting', prompt: 'Coloque cada número no grupo de sua quantidade.', levels: [2, 5], build: (v) => sort([item('a', n(v), String(v)), item('b', n(v + 1), String(v + 1)), item('c', n(v), String(v))], [item('few', n(v), String(v)), item('many', n(v + 1), String(v + 1))], ['few', 'many', 'few']) },
  { id: 'classify_shape', niche: 'classification', skills: ['EF01MA14'], type: 'representation_matching', prompt: 'Agrupe as formas iguais.', levels: [2, 4], build: (v) => sort([item('a', 'library.circle', 'figura A'), item('b', v === 2 ? 'library.square' : 'library.rectangle', 'figura B'), item('c', 'library.circle', 'figura C')], [item('round', 'library.circle', 'círculos'), item('straight', v === 2 ? 'library.square' : 'library.rectangle', 'outras formas')], ['round', 'straight', 'round']) },
  { id: 'classify_size', niche: 'classification', skills: [], type: 'representation_matching', prompt: 'Agrupe os desenhos maiores e menores.', levels: [2, 4], build: (v) => ({ interaction: 'categorize', items: [{ ...item('a', 'library.die', 'figura A'), visualScale: v === 2 ? 0.7 : 0.5 }, { ...item('b', 'library.die', 'figura B'), visualScale: v === 2 ? 1.5 : 1.8 }, { ...item('c', 'library.die', 'figura C'), visualScale: v === 2 ? 0.7 : 0.5 }], bins: [{ ...item('small', 'library.die', 'pequenos'), visualScale: 0.7 }, { ...item('large', 'library.die', 'grandes'), visualScale: 1.5 }], correctOrder: ['small', 'large', 'small'], validation: { kind: 'sequence' } }) },
  { id: 'classify_attribute', niche: 'classification', skills: [], type: 'representation_matching', prompt: 'Agrupe os desenhos por cor.', levels: [2, 4], build: (v) => sort([item('a', 'library.red', 'figura A'), item('b', 'library.blue', 'figura B'), item('c', v === 2 ? 'library.red' : 'library.blue', 'figura C')], [item('red', 'library.red', 'vermelhos'), item('blue', 'library.blue', 'azuis')], ['red', 'blue', v === 2 ? 'red' : 'blue']) },
  { id: 'complete_pattern', niche: 'patterns', skills: [], type: 'quiz', prompt: 'Complete o padrão de cores: vermelho, azul, vermelho, ...', levels: [2, 4], build: (v) => choice([{ pictogramConceptIds: v === 2 ? ['library.red', 'library.blue', 'library.red'] : ['library.red', 'library.blue', 'library.red', 'library.blue', 'library.red'] }], [{ text: 'azul', pictogramConceptId: 'library.blue' }, { text: 'vermelho', pictogramConceptId: 'library.red' }], 'azul') },
  { id: 'shape_real_object', niche: 'shapes', skills: ['EF01MA14'], type: 'quiz', prompt: 'O contorno da face deste objeto lembra qual forma?', levels: [2, 4], build: (v) => choice([{ pictogramConceptIds: [v === 2 ? 'library.cylinder' : 'library.cube'] }], [{ text: 'círculo', pictogramConceptId: 'library.circle' }, { text: 'quadrado', pictogramConceptId: 'library.square' }], v === 2 ? 'círculo' : 'quadrado') },
  { id: 'build_quantity', niche: 'number_quantity', skills: ['EF01MA02'], type: 'counting', prompt: 'Monte a quantidade indicada pelo número.', levels: [2, 6], build: (v) => ({ interaction: 'quantity_builder', visualGroups: [{ pictogramConceptIds: [n(v)] }], buildPictogramConceptId: unit, maxCount: v + 2, correctAnswer: v, validation: { kind: 'numeric' } }) },
  { id: 'visual_addition', niche: 'addition', skills: ['EF01MA06'], type: 'quiz', prompt: 'Junte os dois grupos. Quantos dados há no total?', levels: [2, 4], build: (v) => choice(visual(v, v - 1), numbers([v + v - 2, v + v - 1]), String(v + v - 1)) },
  { id: 'visual_subtraction', niche: 'subtraction', skills: ['EF01MA08'], type: 'quiz', prompt: 'Separe um dado do grupo. Quantos restam?', levels: [3, 6], build: (v) => choice(visual(v), numbers([v - 2, v - 1, v]), String(v - 1)) },
  { id: 'subtraction_story', niche: 'subtraction', skills: ['EF01MA08'], type: 'quiz', prompt: 'Você tinha frutas. Deu algumas. Quantas sobraram?', levels: [3, 8], build: (v) => choice(visual(v), numbers([Math.max(0, v - 3), Math.max(0, v - 2), Math.max(0, v - 1)]), String(v - 2)) },
  { id: 'everyday_problem', niche: 'everyday_problems', skills: ['EF01MA08', 'EF01MA06'], type: 'quiz', prompt: 'Uma criança tem um grupo de dados e ganha mais um. Quantos tem agora?', levels: [2, 5], build: (v) => choice(visual(v, 1), numbers([v, v + 1]), String(v + 1)) },
  { id: 'visual_strategy', niche: 'addition', skills: ['EF01MA06'], type: 'quiz', prompt: 'Qual representação ajuda a juntar os dois grupos?', levels: [2, 4], build: (v) => choice(visual(v, 1), [{ text: 'juntar', pictogramConceptId: 'mathematics.addition' }, { text: 'tirar', pictogramConceptId: 'mathematics.subtraction' }], 'juntar') },
  { id: 'odd_one_out', niche: 'classification', skills: ['EF01MA14'], type: 'quiz', prompt: 'Qual forma é diferente das outras?', levels: [2, 4], build: (v) => choice([{ pictogramConceptIds: v === 2 ? ['library.circle', 'library.circle', 'library.square'] : ['library.square', 'library.square', 'library.circle'] }], [{ text: 'círculo', pictogramConceptId: 'library.circle' }, { text: 'quadrado', pictogramConceptId: 'library.square' }], v === 2 ? 'quadrado' : 'círculo') },
  { id: 'equivalent_set', niche: 'number_quantity', skills: ['EF01MA02'], type: 'quiz', prompt: 'Qual conjunto tem a mesma quantidade?', levels: [2, 5], build: (v) => choice([group(v, 'library.circle')], [{ text: 'A', pictogramConceptIds: group(v - 1, 'library.square').pictogramConceptIds }, { text: 'B', pictogramConceptIds: group(v, 'library.square').pictogramConceptIds }], 'B') },
  { id: 'one_to_one', niche: 'number_quantity', skills: ['EF01MA02'], type: 'quiz', prompt: 'Cada círculo precisa de um quadrado. Qual grupo permite um para cada?', levels: [2, 5], build: (v) => choice([group(v, 'library.circle')], [{ text: 'A', pictogramConceptIds: group(v, 'library.square').pictogramConceptIds }, { text: 'B', pictogramConceptIds: group(v - 1, 'library.square').pictogramConceptIds }], 'A') },
  { id: 'spatial_position', niche: 'spatial_position', skills: [], type: 'quiz', prompt: 'Observe a ordem dos números. Qual fica à direita do primeiro?', levels: [2, 5], build: (v) => choice([{ pictogramConceptIds: [n(v), n(v + 1)] }], numbers([v, v + 1]), String(v + 1)) },
  { id: 'magnitude', niche: 'magnitudes', skills: [], type: 'quiz', prompt: 'Qual conjunto tem mais itens?', levels: [2, 5], build: (v) => choice([{ label: 'A', ...group(v) }, { label: 'B', ...group(v + 2) }], [{ text: 'A', pictogramConceptId: n(v) }, { text: 'B', pictogramConceptId: n(v + 2) }], 'B') },
  { id: 'compare_length', niche: 'magnitudes', skills: [], type: 'quiz', prompt: 'Qual fita é mais comprida?', levels: [2, 4], build: (v) => ({ ...choice([], [{ text: 'A', pictogramConceptId: 'library.domino' }, { text: 'B', pictogramConceptId: 'library.domino' }], 'B'), visualLengths: [{ label: 'A', units: v }, { label: 'B', units: v + 2 }] }) },
  { id: 'full_empty', niche: 'magnitudes', skills: [], type: 'quiz', prompt: 'Qual recipiente está cheio?', levels: [0, 2], build: (v) => ({ ...choice([], [{ text: 'A', pictogramConceptId: 'library.die' }, { text: 'B', pictogramConceptId: 'library.die' }], 'B'), visualContainers: [{ label: 'A', count: v }, { label: 'B', count: 6 }] }) },
];

export function interactiveFormatActivities(): Record<string, unknown>[] {
  const base = formats.flatMap((format) => format.levels.map((level, index) => ({
    title: formatTitleVariants[format.id]?.[index] ?? formatLabels[format.id],
    description: `${format.niche} / ${format.id}`,
    type: format.type,
    difficulty: index === 0 ? 'very_easy' : 'medium',
    bnccSkills: format.skills,
    skillWeights: format.skills.map((code, position) => ({ code, role: position === 0 ? 'primary' : 'secondary', weight: position === 0 ? (format.skills.length === 1 ? 1 : 0.7) : 0.3 / (format.skills.length - 1) })),
    targetModalities: ['visual'],
    pointsReward: index === 0 ? 10 : 20,
    isActive: true,
    accessibility: { hasVisual: true, usesPictograms: true, sensoryLoad: 'low' },
    content: { question: format.prompt, instructionsPt: format.prompt, instructions: format.prompt, formatLabel: formatLabels[format.id], ...format.build(level), semantic: { niche: format.niche, structureId: `${format.id}.${index}`, formatId: format.id, context: index === 0 ? 'concrete' : 'expanded', sensoryProfile: 'low' } },
  })));
  const spatialRelations = [
    ['above', 'acima'], ['below', 'abaixo'], ['inside', 'dentro'],
    ['outside', 'fora'], ['left', 'à esquerda'], ['right', 'à direita'],
  ];
  const spatialExamples = spatialRelations.flatMap(([relation, label]) => [0, 1].map((stage) => ({
    title: spatialRelationTitles[relation]?.[stage] ?? formatLabels.spatial_position,
    description: `spatial_position / ${relation}`,
    type: 'quiz', difficulty: stage === 0 ? 'very_easy' : 'medium', bnccSkills: [], skillWeights: [],
    targetModalities: ['visual'], pointsReward: stage === 0 ? 10 : 20, isActive: true,
    accessibility: { hasVisual: true, usesPictograms: true, sensoryLoad: 'low' },
    content: {
      question: `Onde está ${stage === 0 ? 'o dado em relação ao quadrado' : 'o dominó em relação ao retângulo'}?`,
      instructionsPt: `Onde está ${stage === 0 ? 'o dado em relação ao quadrado' : 'o dominó em relação ao retângulo'}?`,
      formatLabel: formatLabels.spatial_position,
      visualScene: { relation, objectConceptId: stage === 0 ? 'library.die' : 'library.domino', referenceConceptId: stage === 0 ? 'library.square' : 'library.rectangle' },
      ...choice([], [{ text: label, pictogramConceptId: stage === 0 ? 'library.die' : 'library.domino' }, { text: relation === 'above' ? 'abaixo' : 'acima', pictogramConceptId: stage === 0 ? 'library.square' : 'library.rectangle' }], label),
      semantic: { niche: 'spatial_position', structureId: `spatial_position.${relation}.${stage}`, formatId: 'spatial_position', context: stage === 0 ? 'concrete' : 'expanded', sensoryProfile: 'low' },
    },
  })));
  return [...base, ...spatialExamples];
}
