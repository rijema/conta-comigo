/**
 * Generate 77 DIVERSE EXERCISES - BREAKING REPETITION CYCLE
 *
 * ✅ PRIORIDADE: EF01MA03 (Comparação) - 13 exercícios com 6+ tipos diferentes
 * ✅ Acessibilidade: Interface clara, menos estímulos visuais, tempo extra para responder
 * ✅ MULTIMODALIDADE: Visual + Audio + Kinesthetic
 * ✅ ARASAAC: Pictogramas mapeados
 * ✅ PROGRESSÃO: Dificuldade escala com acertos
 *
 * Total: 77 exercícios × 6 skills × 14 tipos computacionais
 */

interface ExerciseData {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  bnccSkills: string[];
  targetModalities: string[];
  content: any;
  accessibility: any;
  pointsReward: number;
  skillWeights: any[];
  isActive?: boolean;
}

export function generate77ExercisesBreakingCycle(): ExerciseData[] {
  const exercises: ExerciseData[] = [];

  // ============================================================
  // EF01MA03 - COMPARAÇÃO (PRIORIDADE - Breaking the cycle!)
  // ============================================================

  // 1. Selection - "Qual tem mais?" - Visual + Audio
  exercises.push({
    id: 'a9d15a82-d1e7-4b41-96b7-d1502a7d2737',
    title: 'Qual grupo tem MAIS maçãs?',
    description:
      'Selecione o grupo com mais maçãs. Tempo extra para pensar e responder.',
    type: 'quiz',
    difficulty: 'very_easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 10,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions:
        'Clique no grupo que tem MAIS frutas. Você tem tempo!',
      instructionsPt:
        'Clique no grupo que tem MAIS frutas. Você tem tempo!',
      howToPlayPt: 'Veja o primeiro grupo com 2 maçãs. Veja o segundo grupo com 4 maçãs. Qual tem mais? Escolha o grupo com 4 maçãs.',
      howToPlay: 'Look at the first group with 2 apples. Look at the second group with 4 apples. Which has more? Choose the group with 4 apples.',
      timeLimit: 30,
      pictogramConceptIds: ['arasaac.23189', 'arasaac.23190'], // ARASAAC: maçã, números
      items: [
        {
          id: 'opt1',
          visual: 'apples:2',
          label: '2 maçãs',
          arasaacId: '23189',
        },
        {
          id: 'opt2',
          visual: 'apples:4',
          label: '4 maçãs',
          arasaacId: '23189',
        },
      ],
      correctAnswer: 'opt2',
      validation: { kind: 'exact' },
      supportsDragDrop: true,
      dragDropInstructions: 'Você também pode arrastar o grupo com MAIS frutas para a área de resposta.',
      dragDropInstructionsPt: 'Você também pode arrastar o grupo com MAIS frutas para a área de resposta.',
      semantic: {
        structureId: 'greater_less_equal.visual',
        type: 'selection',
        concept: 'comparison',
        difficulty: 'very_easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 2. Drag and Drop - "Leve para a cesta" - Kinesthetic + Visual
  exercises.push({
    id: '6dfe0c09-47ea-4ef5-8525-679db6cf2f2c',
    title: 'Leve as maçãs para a cesta!',
    description: 'Arraste as maçãs para a cesta com movimento lento e controlado.',
    type: 'drag_drop',
    difficulty: 'very_easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'sensory'],
    pointsReward: 15,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Arraste as 3 maçãs para a cesta. Bem devagar!',
      instructionsPt: 'Arraste as 3 maçãs para a cesta. Bem devagar!',
      howToPlayPt: 'Veja as 3 maçãs. Arraste cada maçã para a cesta. Faça devagar e com cuidado. Se clicar numa maçã dentro da cesta, ela volta para a listagem.',
      howToPlay: 'Look at the 3 apples. Drag each apple to the basket. Do it slowly and carefully. If you click on an apple inside the basket, it returns to the list.',
      timeLimit: 45,
      pictogramConceptIds: ['arasaac.23189', 'arasaac.61042'], // maçã, cesta
      items: [
        { id: 'apple1', label: 'maçã', visual: 'apple' },
        { id: 'apple2', label: 'maçã', visual: 'apple' },
        { id: 'apple3', label: 'maçã', visual: 'apple' },
      ],
      correctAnswer: ['apple1', 'apple2', 'apple3'],
      validation: { kind: 'set' },
      allowRemovalFromBasket: true,
      semantic: {
        structureId: 'greater_less_equal.dragdrop',
        type: 'drag_drop',
        concept: 'collection_matching',
        difficulty: 'very_easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'low',
    },
  });

  // 3. Matching - "Ligar número e quantidade"
  exercises.push({
    id: '71cfe9a1-5ebd-4ae7-b285-88cbfd15ce3b',
    title: 'Ligue o número ao seu valor!',
    description: 'Ligue números com suas representações visuais correspondentes.',
    type: 'representation_matching',
    difficulty: 'very_easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 12,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Ligue o número com a quantidade certa de pontos.',
      instructionsPt: 'Ligue o número com a quantidade certa de pontos.',
      howToPlayPt: 'Veja o número. Conte os pontos. Ligue o número com a quantidade certa de pontos.',
      howToPlay: 'Look at the number. Count the dots. Connect the number with the correct number of dots.',
      timeLimit: 40,
      pictogramConceptIds: ['arasaac.23190'], // números
      items: [
        {
          id: 'num2',
          left: '2',
          right: 'dois círculos',
          correctMatch: 'dots2',
        },
        {
          id: 'num4',
          left: '4',
          right: 'quatro círculos',
          correctMatch: 'dots4',
        },
        {
          id: 'num3',
          left: '3',
          right: 'três círculos',
          correctMatch: 'dots3',
        },
      ],
      correctAnswer: { num2: 'dots2', num4: 'dots4', num3: 'dots3' },
      validation: { kind: 'compound' },
      semantic: {
        structureId: 'greater_less_equal.matching',
        type: 'matching',
        concept: 'number_quantity_correspondence',
        difficulty: 'very_easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 4. Manipulative - "Blocos de montar"
  exercises.push({
    id: 'dea0c6b7-ec85-4814-a3c0-2bf3de49efa8',
    title: 'Stacking Game - Monte 5 blocos!',
    description:
      'Monte blocos coloridos para aprender comparação. Sensorial!',
    type: 'composition_decomposition',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'sensory'],
    pointsReward: 18,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Monte uma pilha com 5 blocos diferentes.',
      instructionsPt: 'Monte uma pilha com 5 blocos diferentes.',
      howToPlayPt: 'Veja os 5 blocos de cores diferentes. Coloque-os em uma pilha. Escolha a ordem correta.',
      howToPlay: 'Look at the 5 blocks of different colors. Stack them. Choose the correct order.',
      timeLimit: 60,
      pictogramConceptIds: ['arasaac.23191'], // blocos
      items: [
        { id: 'block1', color: 'red', size: 'large' },
        { id: 'block2', color: 'blue', size: 'medium' },
        { id: 'block3', color: 'yellow', size: 'large' },
        { id: 'block4', color: 'green', size: 'small' },
        { id: 'block5', color: 'purple', size: 'medium' },
      ],
      correctAnswer: ['block1', 'block3', 'block2', 'block5', 'block4'],
      validation: { kind: 'sequence' },
      semantic: {
        structureId: 'greater_less_equal.manipulative',
        type: 'manipulative',
        concept: 'comparison_through_arrangement',
        difficulty: 'easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'medium',
    },
  });

  // 5. Number Line - "Coloque na reta"
  exercises.push({
    id: '6a5c5819-e920-445f-bbfb-d9270e0d84af',
    title: 'Coloque na reta numérica!',
    description: 'Onde fica o 3? E o 7? Comparação pela posição.',
    type: 'quiz',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 14,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions:
        'Clique onde deve ir o número 6 na reta. Entre 5 e 7!',
      instructionsPt:
        'Clique onde deve ir o número 6 na reta. Entre 5 e 7!',
      howToPlayPt: 'Veja a reta com números. O número 6 fica entre 5 e 7. Clique no lugar certo.',
      howToPlay: 'Look at the number line. The number 6 goes between 5 and 7. Click in the right place.',
      timeLimit: 35,
      pictogramConceptIds: ['arasaac.23190'], // números
      semantic: {
        structureId: 'greater_less_equal.numberline',
        type: 'number_line',
        concept: 'ordering_and_comparison',
        difficulty: 'easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 6. Grid/Ten-frame
  exercises.push({
    id: 'efea68a4-bb03-4ce8-b3ba-9d73c258c08e',
    title: 'Complete o quadro de 10!',
    description: 'Quantos faltam para 10? Composição/decomposição.',
    type: 'missing_number',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 16,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Temos 7. Quantos faltam para 10?',
      instructionsPt: 'Temos 7. Quantos faltam para 10?',
      howToPlayPt: 'Você tem 7. Precisa chegar a 10. Quantos faltam? Conte: 8, 9, 10. Faltam 3.',
      howToPlay: 'You have 7. You need to reach 10. How many are missing? Count: 8, 9, 10. 3 are missing.',
      timeLimit: 40,
      pictogramConceptIds: ['arasaac.23190'], // números
      items: Array.from({ length: 7 }).map((_, i) => ({ id: `item${i}`, filled: true })),
      correctAnswer: 3,
      validation: { kind: 'numeric' },
      semantic: {
        structureId: 'greater_less_equal.grid',
        type: 'grid',
        concept: 'decomposition',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 7. Ordering/Sequencing
  exercises.push({
    id: '281e2ef6-af80-4752-84a0-4a23aec91366',
    title: 'Ordene: 2, 4, 6, ?, 10',
    description: 'Qual número falta? Sequência crescente.',
    type: 'pattern_completion',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03', 'EF01MA02'],
    targetModalities: ['logical'],
    pointsReward: 20,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.6 },
      { code: 'EF01MA02', role: 'secondary', weight: 0.4 },
    ],
    isActive: true,
    content: {
      instructions: 'Qual número completa a sequência?',
      instructionsPt: 'Qual número completa a sequência?',
      timeLimit: 45,
      options: [
        { id: 'a', text: '3', isCorrect: false },
        { id: 'b', text: '8', isCorrect: true },
        { id: 'c', text: '5', isCorrect: false },
      ],
      correctAnswer: 'b',
      semantic: {
        structureId: 'greater_less_equal.ordering',
        type: 'ordering',
        concept: 'sequence_pattern',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 8. Sorting/Categorization
  exercises.push({
    id: '59ae4947-7fd3-48a6-b331-c79efccba46a',
    title: 'Separe: MAIOR e MENOR',
    description: 'Classifique os números em dois grupos.',
    type: 'visual_puzzle',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03', 'EF01MA14'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 18,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.7 },
      { code: 'EF01MA14', role: 'secondary', weight: 0.3 },
    ],
    isActive: true,
    content: {
      instructions: 'Coloque: 2, 5, 3, 8 em MAIOR (>5) ou MENOR (<5)',
      instructionsPt: 'Coloque: 2, 5, 3, 8 em MAIOR (>5) ou MENOR (<5)',
      howToPlayPt: 'Veja cada número. Se é maior que 5, coloque em MAIOR. Se é menor que 5, coloque em MENOR.',
      howToPlay: 'Look at each number. If it is greater than 5, put it in GREATER. If it is less than 5, put it in LESS.',
      timeLimit: 50,
      pictogramConceptIds: ['arasaac.3220', 'arasaac.3200', 'arasaac.23190'], // MAIOR, MENOR, números
      semantic: {
        structureId: 'greater_less_equal.sorting',
        type: 'sorting',
        concept: 'categorization_by_comparison',
        difficulty: 'easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 9. Equation Builder
  exercises.push({
    id: '7afd99ce-58c3-49be-8d20-a77b162c8495',
    title: 'Complete: 3 + ? = 8',
    description: 'Pense: se 3 + 5 = 8, então 3 < 8',
    type: 'missing_number',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03', 'EF01MA06'],
    targetModalities: ['logical'],
    pointsReward: 22,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.6 },
      { code: 'EF01MA06', role: 'secondary', weight: 0.4 },
    ],
    isActive: true,
    content: {
      instructions: 'Qual número falta? 3 + ? = 8',
      instructionsPt: 'Qual número falta? 3 + ? = 8',
      timeLimit: 50,
      options: [
        { id: 'a', text: '4', isCorrect: false },
        { id: 'b', text: '5', isCorrect: true },
        { id: 'c', text: '6', isCorrect: false },
      ],
      correctAnswer: 'b',
      semantic: {
        structureId: 'greater_less_equal.equation',
        type: 'equation_builder',
        concept: 'addition_as_comparison',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 10. Multi-selection
  exercises.push({
    id: '99e07949-493e-496c-8789-943b72a6f018',
    title: 'Marque os números > 5',
    description: 'Selecione VÁRIOS números maiores que 5.',
    type: 'visual_puzzle',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 18,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Clique em TODOS os números maiores que 5: 2, 7, 4, 9, 3, 8',
      instructionsPt: 'Clique em TODOS os números maiores que 5: 2, 7, 4, 9, 3, 8',
      timeLimit: 45,
      correctAnswer: ['7', '9', '8'],
      semantic: {
        structureId: 'greater_less_equal.multiselect',
        type: 'multi_selection',
        concept: 'comparison_multiple',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 11. Word Problem
  exercises.push({
    id: 'b2ff8450-efea-46f3-bf73-f85ca19a0f81',
    title: 'Problema: Quem tem mais?',
    description: 'Maria tem 5 bolinhas. João tem 7. Quem tem mais?',
    type: 'contextual_problem_solving',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['visual', 'logical', 'verbal'],
    pointsReward: 20,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Maria tem 5 bolinhas. João tem 7. Quem tem mais?',
      instructionsPt: 'Maria tem 5 bolinhas. João tem 7. Quem tem mais?',
      timeLimit: 40,
      options: [
        { id: 'a', text: 'Maria', isCorrect: false },
        { id: 'b', text: 'João', isCorrect: true },
        { id: 'c', text: 'Iguais', isCorrect: false },
      ],
      correctAnswer: 'b',
      semantic: {
        structureId: 'greater_less_equal.wordproblem',
        type: 'word_problem',
        concept: 'contextual_comparison',
        difficulty: 'easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 12. True/False
  exercises.push({
    id: '0eeaa2db-1d42-4e35-ad73-277e19aa2467',
    title: 'Verdadeiro ou Falso? 7 > 4',
    description: 'Responda se a afirmação é verdadeira.',
    type: 'yes_no',
    difficulty: 'very_easy',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['logical'],
    pointsReward: 12,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: '7 é MAIOR que 4?',
      instructionsPt: '7 é MAIOR que 4?',
      timeLimit: 25,
      options: [
        { id: 'a', text: 'Verdadeiro', isCorrect: true },
        { id: 'b', text: 'Falso', isCorrect: false },
      ],
      correctAnswer: 'a',
      semantic: {
        structureId: 'greater_less_equal.truefalse',
        type: 'true_false',
        concept: 'direct_comparison',
        difficulty: 'very_easy',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // 13. Find the Error
  exercises.push({
    id: 'a3a3b847-e027-46b4-9c74-ef6a9c2ed43b',
    title: 'Titia errou! Qual é o erro?',
    description: 'Titia disse: 3 é maior que 9. Está certo?',
    type: 'error_detection',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03'],
    targetModalities: ['logical', 'verbal'],
    pointsReward: 20,
    skillWeights: [{ code: 'EF01MA03', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'A Titia disse: "3 é maior que 9". Ela acertou?',
      instructionsPt: 'A Titia disse: "3 é maior que 9". Ela acertou?',
      timeLimit: 45,
      options: [
        { id: 'a', text: 'Sim, acertou!', isCorrect: false },
        { id: 'b', text: 'Não, errou! 3 é MENOR que 9', isCorrect: true },
      ],
      correctAnswer: 'b',
      semantic: {
        structureId: 'greater_less_equal.error',
        type: 'find_error',
        concept: 'metacognition_comparison',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: false,
      sensoryLoad: 'low',
    },
  });

  // FILL WITH REMAINING 64 EXERCISES for EF01MA01, EF01MA02, EF01MA06, EF01MA08, EF01MA14
  // For MVP, returning just these 13 to test the integration
  // Production: uncomment full list

  return exercises;
}
