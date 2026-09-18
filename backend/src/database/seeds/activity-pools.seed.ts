// Authored question structures. Levels are research parameters, not BNCC grade claims.
type Question = [string, string, string[], string, string, string, string[]?, string[]?];
const levels = ['very_easy', 'easy', 'medium', 'hard', 'extreme'];
const pools: Array<{ niche: string; skills: string[]; questions: Question[] }> = [
  { niche: 'counting', skills: ['EF01MA02'], questions: [
    ['count_objects', 'Conte: ⭐ ⭐', ['1','2','3'], '2', 'counting', 'céu', ['⭐','⭐']],
    ['count_grouped', 'Há 3 círculos juntos e 2 separados. Quantos ao todo?', ['4','5','6'], '5', 'counting', 'formas', ['●','●','●','○','○']],
    ['count_scattered', 'Conte somente os triângulos: ▲ ● ▲ ■ ▲', ['2','3','4'], '3', 'counting', 'formas', ['▲','●','▲','■','▲']],
    ['count_from_ten', 'Uma caixa tem 10 lápis e outra tem 4. Quantos lápis?', ['12','14','15'], '14', 'quiz', 'escola'],
    ['count_missing_group', 'Há 12 livros. Você vê 7 na mesa. Quantos estão na estante?', ['4','5','6'], '5', 'contextual_problem_solving', 'biblioteca'],
  ]},
  { niche: 'number_quantity', skills: ['EF01MA01','EF01MA02'], questions: [
    ['match_two', 'Qual número representa ● ●?', ['1','2','3'], '2', 'representation_matching', 'formas', ['●','●']],
    ['match_five', 'Qual número representa cinco dedos?', ['4','5','6'], '5', 'representation_matching', 'corpo'],
    ['match_ten', 'Duas mãos abertas mostram quantos dedos?', ['8','10','12'], '10', 'representation_matching', 'corpo'],
    ['match_tally', 'Marcas ||||| ||| representam qual número?', ['7','8','9'], '8', 'representation_matching', 'marcas'],
    ['match_decomposition', '1 dezena e 3 unidades representam qual número?', ['13','31','10'], '13', 'representation_matching', 'material_decimal'],
  ]},
  { niche: 'comparison', skills: ['EF01MA03'], questions: [
    ['compare_sets', 'Qual grupo tem mais? ●●● ou ▲▲', ['círculos','triângulos'], 'círculos', 'quiz', 'formas'],
    ['compare_equal', 'Há 4 bolas azuis e 4 vermelhas. Qual grupo tem mais?', ['azuis','vermelhas','iguais'], 'iguais', 'quiz', 'brinquedos'],
    ['compare_estimate', 'Qual pote parece ter menos: um com 8 tampinhas ou um com 12?', ['8','12'], '8', 'quiz', 'objetos'],
    ['compare_difference', 'Uma fila tem 9 crianças e outra tem 6. Quantas a mais na primeira?', ['2','3','4'], '3', 'contextual_problem_solving', 'escola'],
    ['compare_context', 'Uma turma recolheu 14 papéis e outra 11. Qual é a diferença?', ['2','3','4'], '3', 'contextual_problem_solving', 'coleta'],
  ]},
  { niche: 'sequence', skills: ['EF01MA01'], questions: [
    ['next_small', 'Complete: 1, 2, __', ['3','4','5'], '3', 'missing_number', 'números'],
    ['previous', 'Qual número vem antes de 6?', ['4','5','7'], '5', 'missing_number', 'números'],
    ['between', 'Complete: 8, __, 10', ['7','9','11'], '9', 'missing_number', 'números'],
    ['count_by_two', 'Complete a contagem: 2, 4, 6, __', ['7','8','10'], '8', 'missing_number', 'saltos'],
    ['number_line', 'Na reta 11, 12, __, 14, qual número falta?', ['13','15','16'], '13', 'missing_number', 'reta'],
  ]},
  { niche: 'addition', skills: ['EF01MA06'], questions: [
    ['join_objects', 'Junte 1 bola e 2 bolas. Quantas?', ['2','3','4'], '3', 'counting', 'brinquedos', ['🔵','+','🔵','🔵']],
    ['sum_fingers', 'Mostre 3 dedos e mais 2. Quantos dedos?', ['4','5','6'], '5', 'quiz', 'corpo'],
    ['missing_addend', 'Complete: 4 + __ = 7', ['2','3','4'], '3', 'missing_number', 'equação'],
    ['make_ten', 'Que número completa 6 para formar 10?', ['3','4','5'], '4', 'composition_decomposition', 'decomposição'],
    ['add_context', 'Na mesa havia 8 copos; chegaram mais 5. Quantos há?', ['12','13','14'], '13', 'contextual_problem_solving', 'cozinha'],
  ]},
  { niche: 'subtraction', skills: ['EF01MA08'], questions: [
    ['remove_objects', 'Há 3 lápis. Tire 1. Quantos restam?', ['1','2','3'], '2', 'counting', 'escola', ['✏️','✏️','✏️']],
    ['subtract_fingers', 'Mostre 5 dedos e abaixe 2. Quantos ficam?', ['2','3','4'], '3', 'quiz', 'corpo'],
    ['missing_subtrahend', 'Complete: 9 - __ = 6', ['2','3','4'], '3', 'missing_number', 'equação'],
    ['subtract_ten', 'De 12 figurinhas, 5 foram dadas. Quantas sobraram?', ['6','7','8'], '7', 'contextual_problem_solving', 'coleção'],
    ['reverse_problem', 'Havia 15 livros. Agora há 9. Quantos foram retirados?', ['5','6','7'], '6', 'contextual_problem_solving', 'biblioteca'],
  ]},
  { niche: 'shapes', skills: ['EF01MA14'], questions: [
    ['recognize_circle', 'Qual forma não tem lados retos?', ['círculo','quadrado','triângulo'], 'círculo', 'quiz', 'formas'],
    ['recognize_triangle', 'Qual forma tem três lados?', ['quadrado','triângulo','círculo'], 'triângulo', 'quiz', 'formas'],
    ['shape_in_object', 'O contorno de uma porta costuma lembrar qual forma?', ['círculo','retângulo','triângulo'], 'retângulo', 'representation_matching', 'casa'],
    ['rotate_shape', 'Um quadrado girado continua sendo qual forma?', ['quadrado','círculo','triângulo'], 'quadrado', 'quiz', 'formas'],
    ['compare_shapes', 'Qual forma plana tem quatro lados, mas nem sempre todos iguais?', ['retângulo','triângulo','círculo'], 'retângulo', 'quiz', 'formas'],
  ]},
  { niche: 'classification', skills: ['EF03MA15'], questions: [
    ['sort_round', 'Qual figura pertence ao grupo sem vértices?', ['círculo','triângulo','quadrado'], 'círculo', 'quiz', 'figuras'],
    ['sort_three', 'Qual figura tem exatamente três vértices?', ['quadrado','triângulo','círculo'], 'triângulo', 'quiz', 'figuras'],
    ['sort_four', 'Qual destas figuras tem quatro lados?', ['círculo','triângulo','quadrado'], 'quadrado', 'quiz', 'figuras'],
    ['classify_pair', 'Quadrado e retângulo compartilham qual característica?', ['quatro lados','três lados','sem vértices'], 'quatro lados', 'quiz', 'figuras'],
    ['exception', 'Qual não pertence ao grupo de figuras com lados retos?', ['quadrado','triângulo','círculo'], 'círculo', 'error_detection', 'figuras'],
  ]},
  { niche: 'patterns', skills: [], questions: [
    ['alternate', 'Continue: azul, vermelho, azul, __', ['azul','vermelho'], 'vermelho', 'pattern_completion', 'cores'],
    ['pair_repeat', 'Continue: ● ● ▲, ● ● ▲, ● ● __', ['●','▲'], '▲', 'pattern_completion', 'formas'],
    ['growing', 'Continue: 1 palito, 2 palitos, 3 palitos, __', ['3','4','5'], '4', 'pattern_completion', 'objetos'],
    ['repeat_three', 'Continue: sol, lua, estrela, sol, lua, __', ['sol','lua','estrela'], 'estrela', 'pattern_completion', 'céu'],
    ['find_rule', 'Na sequência 2, 4, 6, 8, o próximo número é:', ['9','10','12'], '10', 'pattern_completion', 'números'],
  ]},
  { niche: 'magnitudes', skills: [], questions: [
    ['longer', 'Uma fita mede 2 passos e outra 4. Qual é mais comprida?', ['2 passos','4 passos'], '4 passos', 'quiz', 'medidas'],
    ['heavier', 'Um pacote pesa 1 kg e outro 3 kg. Qual é mais pesado?', ['1 kg','3 kg'], '3 kg', 'quiz', 'cozinha'],
    ['same_length', 'Duas cordas medem 5 palmos cada. Qual é maior?', ['primeira','segunda','iguais'], 'iguais', 'quiz', 'medidas'],
    ['difference_length', 'Uma fita mede 9 cm e outra 6 cm. Qual a diferença?', ['2','3','4'], '3', 'contextual_problem_solving', 'medidas'],
    ['order_magnitude', 'Qual medida fica entre 12 cm e 16 cm?', ['10 cm','14 cm','18 cm'], '14 cm', 'quiz', 'medidas'],
  ]},
  { niche: 'spatial_position', skills: [], questions: [
    ['above', 'O livro está em cima da mesa. Onde está o livro?', ['em cima','embaixo'], 'em cima', 'quiz', 'casa'],
    ['below', 'A bola está debaixo da cadeira. Onde está a bola?', ['em cima','embaixo'], 'embaixo', 'quiz', 'casa'],
    ['between_people', 'Ana está entre Bia e Caio. Quem está no meio?', ['Ana','Bia','Caio'], 'Ana', 'quiz', 'fila'],
    ['before_after', 'Numa fila, Leo vem depois de Lia. Quem vem primeiro?', ['Leo','Lia'], 'Lia', 'quiz', 'fila'],
    ['relative_position', 'O copo está à esquerda do prato. O prato está à __ do copo.', ['esquerda','direita'], 'direita', 'quiz', 'mesa'],
  ]},
  { niche: 'everyday_problems', skills: [], questions: [
    ['shopping_count', 'Na feira, pegue 2 maçãs e 1 pera. Quantas frutas?', ['2','3','4'], '3', 'contextual_problem_solving', 'compras', undefined, ['EF01MA08','EF01MA06']],
    ['shopping_compare', 'Um saco tem 5 laranjas e outro 3. Qual tem mais?', ['saco de 5','saco de 3'], 'saco de 5', 'contextual_problem_solving', 'compras', undefined, ['EF01MA03']],
    ['shopping_change', 'Você tinha 7 moedas e gastou 2. Quantas restam?', ['4','5','6'], '5', 'contextual_problem_solving', 'compras', undefined, ['EF01MA08']],
    ['shopping_two_steps', 'Compre 4 pães e depois mais 3. Dê 2. Quantos ficam?', ['4','5','6'], '5', 'contextual_problem_solving', 'compras', undefined, ['EF01MA08','EF01MA06']],
    ['shopping_compare_sums', 'Uma cesta tem 7 maçãs e recebe 5 peras. Outra tem 10 frutas. Qual tem mais?', ['primeira','segunda','iguais'], 'primeira', 'contextual_problem_solving', 'compras', undefined, ['EF01MA08','EF01MA06','EF01MA03']],
  ]},
];

export function expandedActivityPools(): Record<string, unknown>[] {
  return pools.flatMap(({ niche, skills, questions }) => questions.map((question, index) => {
    const [structureId, prompt, answers, correctAnswer, type, context, items, questionSkills] = question;
    const mappedSkills = questionSkills ?? skills;
    return {
      title: `Pool ${niche}: ${structureId}`,
      description: `${niche} / ${context}`,
      type,
      difficulty: levels[index],
      bnccSkills: mappedSkills,
      skillWeights: mappedSkills.map((code, skillIndex) => ({ code, role: skillIndex === 0 ? 'primary' : 'secondary',
        weight: skillIndex === 0 ? (mappedSkills.length === 1 ? 1 : 0.6) : 0.4 / (mappedSkills.length - 1) })),
      targetModalities: items ? ['visual'] : ['visual', 'logical'],
      pointsReward: 10 + 5 * index,
      isActive: true,
      accessibility: { hasVisual: Boolean(items), sensoryLoad: index < 3 ? 'low' : 'medium' },
      content: {
        instructionsPt: prompt,
        instructions: prompt,
        items,
        options: answers.map((text, optionIndex) => ({ id: String(optionIndex), text, isCorrect: text === correctAnswer })),
        correctAnswer,
        validation: { kind: 'exact' },
        semantic: { niche, structureId, context, sensoryProfile: index < 3 ? 'low' : 'medium' },
      },
    };
  }));
}
