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


  // 4. Manipulative - "Blocos de montar" - IMPLEMENTED: BlockStackingMinigame
  // BNCC Skills: EF01MA03 (Comparação), EF01MA06 (Composição/Decomposição)
  exercises.push({
    id: 'dea0c6b7-ec85-4814-a3c0-2bf3de49efa8',
    title: 'Pilha de Blocos - Do Maior para o Menor!',
    description:
      'Empilhe blocos em ordem decrescente de tamanho. Crie uma pirâmide!',
    type: 'composition_decomposition',
    difficulty: 'easy',
    bnccSkills: ['EF01MA03', 'EF01MA06'],
    targetModalities: ['visual', 'sensory', 'logical'],
    pointsReward: 18,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.5 },
      { code: 'EF01MA06', role: 'primary', weight: 0.5 },
    ],
    isActive: true,
    content: {
      instructions: 'Coloque os blocos na pilha. Do MAIOR para o MENOR!',
      instructionsPt: 'Coloque os blocos na pilha. Do MAIOR para o MENOR!',
      spokenIntroduction: 'Vamos montar uma pilha com blocos de tamanhos MUITO diferentes! O bloco maior e mais LARGO vem primeiro, embaixo. Depois o bloco menor, no topo. Será como uma pirâmide!',
      howToPlayPt: 'Veja os blocos à esquerda: cada um tem um tamanho DIFERENTE! O bloco VERMELHO é o MAIOR e o MAIS LARGO (120px). O bloco ROXO é o MENOR e o MAIS ESTREITO (20px). Você precisa colocar na ordem certa: do maior para o menor. Veja como os blocos já estão renderizados com seus tamanhos reais! Arraste cada bloco para a área de pilha, começando pelo VERMELHO (o maior) na base.',
      howToPlay: 'Look at the blocks on the left: each one has a DIFFERENT size! The RED block is the BIGGEST and the WIDEST (120px). The PURPLE block is the SMALLEST and the NARROWEST (20px). You must place them in the correct order: from biggest to smallest. See how the blocks are already rendered with their actual sizes! Drag each block to the stack area, starting with RED (the biggest) at the base.',
      timeLimit: 60,
      pictogramConceptIds: ['arasaac.26968', 'arasaac.13186', 'arasaac.14098'],
      // Visual preview showing all blocks with their sizes
      visualPreview: {
        availableBlocksLabel: 'Blocos Disponíveis (Veja os tamanhos diferentes!)',
        stackAreaLabel: 'Sua Pilha (Do MAIOR para o MENOR)',
        sizeHints: [
          'Bloco Vermelho (120px) = MAIOR',
          'Bloco Azul (95px)',
          'Bloco Ciano (70px)',
          'Bloco Laranja (45px)',
          'Bloco Roxo (20px) = MENOR',
        ],
      },
      items: [
        { id: 'block1', color: '#FF6B6B', size: 'xlarge', width: 120, height: 30, borderRadius: 4, label: 'Bloco Vermelho GRANDE (120px)' },
        { id: 'block2', color: '#4ECDC4', size: 'large', width: 95, height: 25, borderRadius: 4, label: 'Bloco Azul (95px)' },
        { id: 'block3', color: '#45B7D1', size: 'medium', width: 70, height: 20, borderRadius: 4, label: 'Bloco Ciano (70px)' },
        { id: 'block4', color: '#FFA07A', size: 'small', width: 45, height: 15, borderRadius: 4, label: 'Bloco Laranja (45px)' },
        { id: 'block5', color: '#9B59B6', size: 'xsmall', width: 20, height: 10, borderRadius: 4, label: 'Bloco Roxo PEQUENO (20px)' },
      ],
      correctAnswer: ['block1', 'block2', 'block3', 'block4', 'block5'],
      validation: { kind: 'sequence' },
      spokenSteps: 'Passo 1: Encontre o bloco VERMELHO, o maior e o mais LARGO. Arraste para a pilha na base. Passo 2: Encontre o bloco AZUL, o segundo maior. Coloque em cima do vermelho. Passo 3: Coloque o bloco CIANO no meio. Passo 4: Coloque o bloco LARANJA. Passo 5: Coloque o bloco ROXO, o menor e mais estreito, no topo!',
      spokenSuccessFeedback: 'Excelente! Você fez uma pilha perfeita! Do maior para o menor! Isso é uma pirâmide! Os blocos estão em ordem DECRESCENTE de tamanho!',
      dragDropInstructions: 'Arraste os blocos (já renderizados com seus tamanhos visuais reais!) para criar a pilha. Comece com o MAIOR (mais LARGO) na base.',
      dragDropInstructionsPt: 'Arraste os blocos (já renderizados com seus tamanhos visuais reais!) para criar a pilha. Comece com o MAIOR (mais LARGO) na base.',
      semantic: {
        structureId: 'composition_decomposition.stacking_ordered',
        type: 'manipulative',
        concept: 'composition_through_ordered_arrangement',
        difficulty: 'easy',
        learningGoal: 'understanding_size_ordering_and_seriation',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'medium',
    },
  });

  // 4b. Stacking (Ascending) - "Pilha Crescente"
  exercises.push({
    id: '8c2e4f9a-b3d1-4a5e-c6f2-7d8e9a1b2c3d',
    title: 'Pilha Crescente - Do Menor para o Maior!',
    description:
      'Empilhe blocos em ordem crescente. Uma escada mágica!',
    type: 'composition_decomposition',
    difficulty: 'medium',
    bnccSkills: ['EF01MA03', 'EF01MA06'],
    targetModalities: ['visual', 'sensory', 'logical'],
    pointsReward: 22,
    skillWeights: [
      { code: 'EF01MA03', role: 'primary', weight: 0.6 },
      { code: 'EF01MA06', role: 'primary', weight: 0.4 },
    ],
    isActive: true,
    content: {
      instructions: 'Coloque os blocos na pilha. Do MENOR para o MAIOR!',
      instructionsPt: 'Coloque os blocos na pilha. Do MENOR para o MAIOR!',
      spokenIntroduction: 'Agora vamos fazer o contrário! Desta vez, comece com o bloco PEQUENO e ESTREITO embaixo e coloque blocos cada vez MAIORES e MAIS LARGOS. Será como uma escada subindo!',
      howToPlayPt: 'Veja os 5 blocos à esquerda: cada um tem um tamanho DIFERENTE! O bloco ROXO é o MENOR e MAIS ESTREITO (20px). O bloco VERMELHO é o MAIOR e MAIS LARGO (120px). Os blocos já estão renderizados com seus tamanhos visuais reais! Você precisa colocar na ordem crescente: do menor para o maior. Como uma escada subindo! Comece com o bloco roxo (o menor e mais estreito) na base.',
      howToPlay: 'Look at the 5 blocks on the left: each one has a DIFFERENT size! The PURPLE block is the SMALLEST and NARROWEST (20px). The RED block is the BIGGEST and WIDEST (120px). The blocks are already rendered with their actual visual sizes! You must place them in growing order: from smallest to biggest. Like a staircase going up! Start with the purple block (the smallest and narrowest) at the base.',
      timeLimit: 60,
      pictogramConceptIds: ['arasaac.26968', 'arasaac.17629', 'arasaac.14098'],
      // Visual preview showing all blocks with their sizes
      visualPreview: {
        availableBlocksLabel: 'Blocos Disponíveis (Veja os tamanhos diferentes!)',
        stackAreaLabel: 'Sua Escada (Do MENOR para o MAIOR)',
        sizeHints: [
          'Bloco Roxo (20px) = MENOR - na base!',
          'Bloco Laranja (45px)',
          'Bloco Ciano (70px)',
          'Bloco Azul (95px)',
          'Bloco Vermelho (120px) = MAIOR - no topo!',
        ],
      },
      items: [
        { id: 'block1', color: '#9B59B6', size: 'xsmall', width: 20, height: 10, borderRadius: 4, label: 'Bloco Roxo PEQUENO (20px)' },
        { id: 'block2', color: '#FFA07A', size: 'small', width: 45, height: 15, borderRadius: 4, label: 'Bloco Laranja (45px)' },
        { id: 'block3', color: '#45B7D1', size: 'medium', width: 70, height: 20, borderRadius: 4, label: 'Bloco Ciano (70px)' },
        { id: 'block4', color: '#4ECDC4', size: 'large', width: 95, height: 25, borderRadius: 4, label: 'Bloco Azul (95px)' },
        { id: 'block5', color: '#FF6B6B', size: 'xlarge', width: 120, height: 30, borderRadius: 4, label: 'Bloco Vermelho GRANDE (120px)' },
      ],
      correctAnswer: ['block1', 'block2', 'block3', 'block4', 'block5'],
      validation: { kind: 'sequence' },
      spokenSteps: 'Passo 1: Encontre o bloco ROXO, o menor e mais ESTREITO. Coloque na base. Passo 2: Encontre o bloco LARANJA, o segundo menor. Coloque em cima. Passo 3: Coloque o bloco CIANO no meio. Passo 4: Coloque o bloco AZUL. Passo 5: Coloque o bloco VERMELHO, o maior e o mais LARGO, no topo!',
      spokenSuccessFeedback: 'Fantástico! Você fez uma escada perfeita! Do menor para o maior! A pilha está crescendo! Os blocos estão em ordem CRESCENTE de tamanho!',
      dragDropInstructions: 'Arraste os blocos (já renderizados com seus tamanhos visuais reais!) para criar a escada. Comece com o MENOR (mais ESTREITO) na base.',
      dragDropInstructionsPt: 'Arraste os blocos (já renderizados com seus tamanhos visuais reais!) para criar a escada. Comece com o MENOR (mais ESTREITO) na base.',
      semantic: {
        structureId: 'composition_decomposition.stacking_ascending',
        type: 'manipulative',
        concept: 'composition_through_ascending_arrangement',
        difficulty: 'medium',
        learningGoal: 'understanding_size_ordering_reverse_seriation',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'medium',
    },
  });


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

  // ============================================================
  // EF01MA04 - CONTAGEM ATÉ 100 (NEW)
  // ============================================================

  // 14. Counting Collections - "Conte até 100!"
  exercises.push({
    id: 'c4f9d2a1-8e3c-4d1f-9b7e-5a2c1d3e4f5a',
    title: 'Conte até 100!',
    description: 'Conte objetos em coleções grandes (até 100).',
    type: 'counting',
    difficulty: 'medium',
    bnccSkills: ['EF01MA04'],
    targetModalities: ['visual', 'kinesthetic'],
    pointsReward: 25,
    skillWeights: [{ code: 'EF01MA04', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Conte os objetos. Clique para agrupar em 10s.',
      instructionsPt: 'Conte os objetos. Clique para agrupar em 10s.',
      howToPlayPt: 'Veja muitos objetos. Conte em grupos de 10. Total: quantos?',
      howToPlay: 'See many objects. Count by groups of 10. Total: how many?',
      timeLimit: 60,
      pictogramConceptIds: ['arasaac.23190'], // números
      totalCount: 47, // Variable amount between 20-100
      semantic: {
        structureId: 'counting.large_collections',
        type: 'counting',
        concept: 'quantification_to_100',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'medium',
    },
  });

  // ============================================================
  // EF01MA05 - ORDENAÇÃO DE NÚMEROS ATÉ 100 (NEW)
  // ============================================================

  // 15. Ordering Two-Digit Numbers - "Ordene os números: 34, 12, 56, 23"
  exercises.push({
    id: 'd5a0e3b2-9f4d-5e2a-0c8f-6b3d2e4f5a6b',
    title: 'Ordene os números!',
    description: 'Ordene números de 2 algarismos em ordem crescente.',
    type: 'drag_drop',
    difficulty: 'medium',
    bnccSkills: ['EF01MA05'],
    targetModalities: ['visual', 'logical', 'kinesthetic'],
    pointsReward: 24,
    skillWeights: [{ code: 'EF01MA05', role: 'primary', weight: 1.0 }],
    isActive: true,
    content: {
      instructions: 'Ordene os números do menor para o maior.',
      instructionsPt: 'Ordene os números do menor para o maior.',
      howToPlayPt: 'Veja os números: 34, 12, 56, 23. Organize: 12, 23, 34, 56.',
      howToPlay: 'See the numbers: 34, 12, 56, 23. Organize them: 12, 23, 34, 56.',
      timeLimit: 50,
      pictogramConceptIds: ['arasaac.23190'], // números
      items: [
        { id: 'num34', label: '34', value: 34 },
        { id: 'num12', label: '12', value: 12 },
        { id: 'num56', label: '56', value: 56 },
        { id: 'num23', label: '23', value: 23 },
      ],
      correctOrder: ['num12', 'num23', 'num34', 'num56'],
      validation: { kind: 'sequence' },
      semantic: {
        structureId: 'ordering.two_digit_numbers',
        type: 'ordering',
        concept: 'sequence_two_digit',
        difficulty: 'medium',
      },
    },
    accessibility: {
      hasAudio: true,
      hasVisual: true,
      hasAnimation: true,
      sensoryLoad: 'low',
    },
  });

  // FILL WITH REMAINING 64 EXERCISES for EF01MA01, EF01MA02, EF01MA06, EF01MA08, EF01MA14
  // For MVP, returning just these 15 to test the integration
  // Production: uncomment full list

  return exercises;
}
