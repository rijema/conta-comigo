import { DataSource } from 'typeorm';
import { expandedActivityPools } from './activity-pools.seed';
import { interactiveFormatActivities } from './interactive-formats.seed';
import { generate77ExercisesBreakingCycle } from './exercises-77-breaking-cycle.seed';

export async function ActivitiesSeed(dataSource: DataSource) {
  const repo = dataSource.getRepository('activities');

  // 🚀 ADD 77 EXERCISES TO BREAK REPETITION CYCLE (EF01MA03 priority)
  const newExercises = generate77ExercisesBreakingCycle();

  const activities: any[] = [
    // ── NEW: 77 DIVERSE EXERCISES (Breaking the cycle!)
    ...newExercises,
    // ── EF01MA01: Counting 1–10 ─────────────────────────────────────────
    {
      title: 'Conta as estrelas!',
      description: 'Conte os objetos e escolha o número certo',
      type: 'counting',
      difficulty: 'easy',
      bnccSkills: ['EF01MA01'],
      targetModalities: ['visual'],
      pointsReward: 10,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Quantas estrelas você vê?',
        instructions: 'How many stars do you see?',
        howToPlayPt: 'Veja as estrelas. Conte uma, duas, três. Escolha o número correto.',
        howToPlay: 'Look at the stars. Count one, two, three. Choose the correct number.',
        pictogramConceptIds: ['arasaac.17331'],
        options: [
          { id: 'a', text: '2', isCorrect: false },
          { id: 'b', text: '3', isCorrect: true },
          { id: 'c', text: '4', isCorrect: false },
          { id: 'd', text: '5', isCorrect: false },
        ],
        correctAnswer: '3',
      },
    },
    {
      title: 'Quantas maçãs?',
      description: 'Conte as frutas',
      type: 'counting',
      difficulty: 'easy',
      bnccSkills: ['EF01MA01'],
      targetModalities: ['visual'],
      pointsReward: 10,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Quantas maçãs há na cesta?',
        instructions: 'How many apples are in the basket?',
        howToPlayPt: 'Veja as maçãs na cesta. Conte cada uma. Escolha o número certo.',
        howToPlay: 'Look at the apples in the basket. Count each one. Choose the correct number.',
        pictogramConceptIds: ['arasaac.23189'],
        options: [
          { id: 'a', text: '3', isCorrect: false },
          { id: 'b', text: '4', isCorrect: false },
          { id: 'c', text: '5', isCorrect: true },
          { id: 'd', text: '6', isCorrect: false },
        ],
        correctAnswer: '5',
      },
    },
    // ── EF01MA03: Number comparison ─────────────────────────────────────
    {
      title: 'Qual número é maior?',
      description: 'Compare os números',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA03'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Qual número é MAIOR: 7 ou 4?',
        instructions: 'Which number is BIGGER: 7 or 4?',
        options: [
          { id: 'a', text: '4', isCorrect: false },
          { id: 'b', text: '7', isCorrect: true },
          { id: 'c', text: 'São iguais', isCorrect: false },
        ],
        correctAnswer: '7',
      },
    },
    {
      title: 'Menor ou maior?',
      description: 'Compare os números',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF01MA03'],
      targetModalities: ['logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Qual é o MENOR número: 15, 9 ou 12?',
        instructions: 'Which is the SMALLEST: 15, 9 or 12?',
        howToPlayPt: 'Veja os três números: 15, 9 e 12. O número 9 é o mais pequeno. Escolha o menor.',
        howToPlay: 'Look at the three numbers: 15, 9 and 12. The number 9 is the smallest. Choose the smallest.',
        options: [
          { id: 'a', text: '15', isCorrect: false },
          { id: 'b', text: '12', isCorrect: false },
          { id: 'c', text: '9', isCorrect: true },
        ],
        correctAnswer: '9',
      },
    },
    // ── EF01MA06: Addition ───────────────────────────────────────────────
    {
      title: 'Sominha fácil!',
      description: 'Resolva a adição',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Uma maçã mais duas maçãs = ?',
        instructions: '1 apple + 2 apples = ?',
        howToPlayPt: 'Você tem 1 maçã. Ganha mais 2 maçãs. Junte os dois grupos. Quantas maçãs você tem?',
        howToPlay: 'You have 1 apple. You get 2 more apples. Add both groups. How many apples do you have?',
        pictogramConceptIds: ['arasaac.23189'],
        items: ['arasaac.23189', '+', 'arasaac.23189', 'arasaac.23189', '=', '?'],
        options: [
          { id: 'a', text: '2', isCorrect: false },
          { id: 'b', text: '3', isCorrect: true },
          { id: 'c', text: '4', isCorrect: false },
          { id: 'd', text: '1', isCorrect: false },
        ],
        correctAnswer: '3',
      },
    },
    {
      title: '2 + 3 = ?',
      description: 'Adição com números',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['logical'],
      pointsReward: 15,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Quanto é 2 + 3?',
        instructions: 'What is 2 + 3?',
        howToPlayPt: 'Você tem 2 maçãs. Ganha mais 3 maçãs. Junte os dois grupos. Quantas maçãs você tem agora?',
        howToPlay: 'You have 2 apples. You get 3 more apples. Add both groups. How many apples do you have now?',
        pictogramConceptIds: ['arasaac.23189'],
        options: [
          { id: 'a', text: '4', isCorrect: false },
          { id: 'b', text: '5', isCorrect: true },
          { id: 'c', text: '6', isCorrect: false },
          { id: 'd', text: '3', isCorrect: false },
        ],
        correctAnswer: '5',
      },
    },
    {
      title: 'Soma com bolas',
      description: 'Some as bolas coloridas',
      type: 'counting',
      difficulty: 'easy',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Some as bolas: bolas azuis + bolas vermelhas = ?',
        instructions: 'Add blue balls + red balls = ?',
        howToPlayPt: 'Veja as bolas azuis. Conte-as. Depois veja as bolas vermelhas. Conte-as. Junte os dois grupos e escolha o total.',
        howToPlay: 'Look at the blue balls. Count them. Then look at the red balls. Count them. Add both groups and choose the total.',
        pictogramConceptIds: ['arasaac.16590', 'arasaac.16591'],
        options: [
          { id: 'a', text: '4', isCorrect: false },
          { id: 'b', text: '5', isCorrect: true },
          { id: 'c', text: '6', isCorrect: false },
        ],
        correctAnswer: '5',
      },
    },
    // ── EF01MA07: Subtraction ────────────────────────────────────────────
    {
      title: 'Tirando biscoitos',
      description: 'Resolva a subtração',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA08'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Tinha 5 biscoitos, comeu 2. Quantos sobraram?',
        instructions: 'Had 5 cookies, ate 2. How many are left?',
        howToPlayPt: 'Você tem 5 biscoitos. Come 2. Conte quantos biscoitos sobraram.',
        howToPlay: 'You have 5 cookies. You eat 2. Count how many cookies are left.',
        pictogramConceptIds: ['arasaac.17333'],
        items: ['arasaac.17333','arasaac.17333','arasaac.17333','arasaac.17333','arasaac.17333'],
        options: [
          { id: 'a', text: '2', isCorrect: false },
          { id: 'b', text: '3', isCorrect: true },
          { id: 'c', text: '4', isCorrect: false },
        ],
        correctAnswer: '3',
      },
    },
    {
      title: '8 - 3 = ?',
      description: 'Subtração',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF01MA08'],
      targetModalities: ['logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Quanto é 8 menos 3?',
        instructions: 'What is 8 minus 3?',
        options: [
          { id: 'a', text: '4', isCorrect: false },
          { id: 'b', text: '5', isCorrect: true },
          { id: 'c', text: '6', isCorrect: false },
          { id: 'd', text: '3', isCorrect: false },
        ],
        correctAnswer: '5',
      },
    },
    // ── EF02MA01: Numbers up to 100 ──────────────────────────────────────
    {
      title: 'Que número vem depois?',
      description: 'Sequência numérica',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF02MA01'],
      targetModalities: ['logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Que número vem depois de 29?',
        instructions: 'What number comes after 29?',
        options: [
          { id: 'a', text: '28', isCorrect: false },
          { id: 'b', text: '30', isCorrect: true },
          { id: 'c', text: '31', isCorrect: false },
          { id: 'd', text: '20', isCorrect: false },
        ],
        correctAnswer: '30',
      },
    },
    // ── EF02MA05: Doubling/Halving ───────────────────────────────────────
    {
      title: 'O dobro!',
      description: 'Calcule o dobro',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF02MA05'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Qual é o dobro de 4?',
        instructions: 'What is double of 4?',
        howToPlayPt: 'O dobro significa duas vezes a mesma quantidade. Se você tem 4 maçãs e ganha mais 4, terá 8 maçãs no total. Escolha o dobro de 4.',
        howToPlay: 'Double means two times the same amount. If you have 4 apples and get 4 more, you will have 8 apples total. Choose the double of 4.',
        pictogramConceptIds: ['arasaac.23189'],
        options: [
          { id: 'a', text: '6', isCorrect: false },
          { id: 'b', text: '8', isCorrect: true },
          { id: 'c', text: '10', isCorrect: false },
          { id: 'd', text: '4', isCorrect: false },
        ],
        correctAnswer: '8',
      },
    },
    // ── EF03MA07: Multiplication ─────────────────────────────────────────
    {
      title: 'Tabuada do 2',
      description: 'Multiplicação por 2',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF03MA07'],
      targetModalities: ['logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: '3 × 2 = ?',
        instructions: '3 × 2 = ?',
        options: [
          { id: 'a', text: '5', isCorrect: false },
          { id: 'b', text: '6', isCorrect: true },
          { id: 'c', text: '8', isCorrect: false },
          { id: 'd', text: '4', isCorrect: false },
        ],
        correctAnswer: '6',
      },
    },
    {
      title: 'Tabuada do 5',
      description: 'Multiplicação por 5',
      type: 'quiz',
      difficulty: 'hard',
      bnccSkills: ['EF03MA07'],
      targetModalities: ['logical'],
      pointsReward: 30,
      isActive: true,
      accessibility: { sensoryLoad: 'medium' },
      content: {
        instructionsPt: '4 × 5 = ?',
        instructions: '4 × 5 = ?',
        options: [
          { id: 'a', text: '15', isCorrect: false },
          { id: 'b', text: '20', isCorrect: true },
          { id: 'c', text: '25', isCorrect: false },
          { id: 'd', text: '18', isCorrect: false },
        ],
        correctAnswer: '20',
      },
    },
    // ── DRAG-DROP: Ordering numbers ──────────────────────────────────────
    {
      title: 'Ordene do menor para o maior!',
      description: 'Arraste os números na ordem crescente',
      type: 'drag_drop',
      difficulty: 'easy',
      bnccSkills: ['EF01MA03'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Arraste os números do MENOR para o MAIOR',
        instructions: 'Drag the numbers from SMALLEST to BIGGEST',
        howToPlayPt: 'Veja os números: 3, 1, 4, 2. Coloque-os em ordem crescente: 1, 2, 3, 4. Você pode arrastar ou tocar nos números para preenchê-los.',
        howToPlay: 'Look at the numbers: 3, 1, 4, 2. Put them in ascending order: 1, 2, 3, 4. You can drag or tap the numbers to fill them.',
        question: 'Coloque os números em ordem crescente: do menor para o maior!',
        items: [
          { id: 'n3', label: '3' },
          { id: 'n1', label: '1' },
          { id: 'n4', label: '4' },
          { id: 'n2', label: '2' },
        ],
        slotCount: 4,
        correctOrder: ['n1', 'n2', 'n3', 'n4'],
        correctAnswer: 'n1,n2,n3,n4',
        supportsTapToFill: true,
        tapToFillInstructions: 'Você também pode tocar nos números para preenchê-los na ordem correta.',
      },
    },
    {
      title: 'Do maior para o menor!',
      description: 'Arraste os números em ordem decrescente',
      type: 'drag_drop',
      difficulty: 'medium',
      bnccSkills: ['EF01MA03'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Arraste os números do MAIOR para o MENOR',
        instructions: 'Drag the numbers from BIGGEST to SMALLEST',
        howToPlayPt: 'Veja os números: 7, 5, 9, 6. Coloque-os em ordem decrescente: 9, 7, 6, 5. Você pode arrastar ou tocar nos números para preenchê-los.',
        howToPlay: 'Look at the numbers: 7, 5, 9, 6. Put them in descending order: 9, 7, 6, 5. You can drag or tap the numbers to fill them.',
        question: 'Coloque os números em ordem decrescente: do maior para o menor!',
        items: [
          { id: 'n7', label: '7' },
          { id: 'n5', label: '5' },
          { id: 'n9', label: '9' },
          { id: 'n6', label: '6' },
        ],
        slotCount: 4,
        correctOrder: ['n9', 'n7', 'n6', 'n5'],
        correctAnswer: 'n9,n7,n6,n5',
        supportsTapToFill: true,
        tapToFillInstructions: 'Você também pode tocar nos números para preenchê-los na ordem correta.',
      },
    },
    {
      title: 'Complete a sequência!',
      description: 'Ordene os números que estão faltando',
      type: 'drag_drop',
      difficulty: 'easy',
      bnccSkills: ['EF02MA01'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Complete a sequência: 10, ?, ?, 13',
        instructions: 'Complete the sequence: 10, ?, ?, 13',
        howToPlayPt: 'Veja a sequência: 10, ?, ?, 13. Os números que faltam são 11 e 12. Coloque-os na ordem correta. Você pode arrastar ou tocar nos números.',
        howToPlay: 'Look at the sequence: 10, ?, ?, 13. The missing numbers are 11 and 12. Put them in the correct order. You can drag or tap the numbers.',
        question: 'A sequência é 10, __, __, 13. Arraste os números que faltam na ordem certa!',
        items: [
          { id: 'n12', label: '12' },
          { id: 'n11', label: '11' },
        ],
        slotCount: 2,
        correctOrder: ['n11', 'n12'],
        correctAnswer: 'n11,n12',
        supportsTapToFill: true,
        tapToFillInstructions: 'Você também pode tocar nos números para preenchê-los na ordem correta.',
      },
    },
    {
      title: 'Conta e ordena as frutas!',
      description: 'Ordene os grupos de frutas do menor para o maior',
      type: 'drag_drop',
      difficulty: 'easy',
      bnccSkills: ['EF01MA01'],
      targetModalities: ['visual'],
      pointsReward: 20,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Ordene os grupos do que tem MENOS para o que tem MAIS!',
        instructions: 'Order groups from FEWEST to MOST!',
        howToPlayPt: 'Veja os grupos: 3 maçãs, 1 maçã, 2 maçãs. Coloque-os em ordem crescente: 1, 2, 3. Você pode arrastar ou tocar nos grupos.',
        howToPlay: 'Look at the groups: 3 apples, 1 apple, 2 apples. Put them in ascending order: 1, 2, 3. You can drag or tap the groups.',
        question: 'Arraste os grupos do que tem MENOS para o que tem MAIS frutas!',
        items: [
          { id: 'g3', label: '3 maçãs' },
          { id: 'g1', label: '1 maçã' },
          { id: 'g2', label: '2 maçãs' },
        ],
        slotCount: 3,
        correctOrder: ['g1', 'g2', 'g3'],
        correctAnswer: 'g1,g2,g3',
        supportsTapToFill: true,
        tapToFillInstructions: 'Você também pode tocar nos grupos para preenchê-los na ordem correta.',
      },
    },
    {
      title: 'Ordene os passos da adição!',
      description: 'Monte a conta de adição na ordem certa',
      type: 'drag_drop',
      difficulty: 'medium',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Monte a conta: 4 + 3 = 7. Arraste na ordem!',
        instructions: 'Build the equation: 4 + 3 = 7. Drag in order!',
        howToPlayPt: 'Veja as peças: 4, +, 3, =, 7. Coloque-as na ordem correta para montar a conta. Você pode arrastar ou tocar nas peças.',
        howToPlay: 'Look at the pieces: 4, +, 3, =, 7. Put them in the correct order to build the equation. You can drag or tap the pieces.',
        question: 'Arraste as peças para montar a conta correta!',
        items: [
          { id: 'eq7', label: '7' },
          { id: 'eqp', label: '+' },
          { id: 'eq4', label: '4' },
          { id: 'eqe', label: '=' },
          { id: 'eq3', label: '3' },
        ],
        slotCount: 5,
        correctOrder: ['eq4', 'eqp', 'eq3', 'eqe', 'eq7'],
        // Addition is commutative; both authored operand orders are valid.
        acceptedOrders: [['eq3', 'eqp', 'eq4', 'eqe', 'eq7']],
        correctAnswer: 'eq4,eqp,eq3,eqe,eq7',
        supportsTapToFill: true,
        tapToFillInstructions: 'Você também pode tocar nas peças para preenchê-las na ordem correta.',
      },
    },
    // ── EF01MA15: Shapes ─────────────────────────────────────────────────
    {
      title: 'Que forma é essa?',
      description: 'Reconheça as formas geométricas',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA14'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Como se chama essa forma?',
        instructions: 'What is this shape?',
        howToPlayPt: 'Veja a forma. Tem 4 lados iguais. É um quadrado. Escolha o nome certo.',
        howToPlay: 'Look at the shape. It has 4 equal sides. It is a square. Choose the correct name.',
        pictogramConceptIds: ['arasaac.17331'],
        options: [
          { id: 'a', text: 'Círculo', isCorrect: false },
          { id: 'b', text: 'Quadrado', isCorrect: true },
          { id: 'c', text: 'Triângulo', isCorrect: false },
          { id: 'd', text: 'Retângulo', isCorrect: false },
        ],
        correctAnswer: 'Quadrado',
      },
    },
    {
      title: 'Círculo ou quadrado?',
      description: 'Identifique a forma',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA14'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Uma pizza tem o formato de qual forma?',
        instructions: 'Which shape does a pizza have?',
        howToPlayPt: 'Uma pizza é redonda. Não tem pontas. É um círculo. Escolha a forma certa.',
        howToPlay: 'A pizza is round. It has no corners. It is a circle. Choose the correct shape.',
        pictogramConceptIds: ['arasaac.17330'],
        options: [
          { id: 'a', text: 'Quadrado', isCorrect: false },
          { id: 'b', text: 'Círculo', isCorrect: true },
          { id: 'c', text: 'Triângulo', isCorrect: false },
        ],
        correctAnswer: 'Círculo',
      },
    },
    // ── PARAMETRIC FAMILIES: coverage-driven additions ─────────────────
    {
      title: 'Decomponha o número 7',
      description: 'Separe 7 em duas partes usando barras de blocos',
      type: 'composition_decomposition',
      difficulty: 'medium',
      bnccSkills: ['EF01MA07'],
      targetModalities: ['visual', 'sensory', 'kinesthetic'],
      pointsReward: 25,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'medium', hasAudio: true },
      content: {
        instructionsPt: 'Veja 7 blocos. Separe em 2 grupos. Quantos em cada grupo?',
        instructions: 'Look at 7 blocks. Separate into 2 groups. How many in each group?',
        spokenIntroduction: 'Você tem 7 blocos amarelos. Precisa separá-los em duas pilhas de cores diferentes. Quantos blocos em cada pilha? Existem muitas respostas corretas!',
        howToPlayPt: 'Veja a linha com 7 blocos amarelos. Arraste alguns blocos para uma pilha vermelha (à esquerda) e o resto para uma pilha azul (à direita). Qual é a composição? Por exemplo: 3 blocos vermelhos + 4 blocos azuis = 7. Ou 2 blocos vermelhos + 5 blocos azuis = 7. Você escolhe!',
        howToPlay: 'Look at the line with 7 yellow blocks. Drag some blocks to a red pile (left) and the rest to a blue pile (right). What is the composition? For example: 3 red blocks + 4 blue blocks = 7. Or 2 red blocks + 5 blue blocks = 7. You choose!',
        timeLimit: 45,
        pictogramConceptIds: ['arasaac.13186', 'arasaac.26968', 'arasaac.14098'], // ordem, tamanho, construir
        items: [
          { id: 'block1', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block2', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block3', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block4', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block5', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block6', color: '#FFD700', size: 'medium', count: 1, value: 1 },
          { id: 'block7', color: '#FFD700', size: 'medium', count: 1, value: 1 },
        ],
        correctAnswers: [
          ['block1', 'block2', 'block3', 'block4', 'block5', 'block6', 'block7'], // 7+0
          ['block1', 'block2', 'block3', 'block4', 'block5', 'block6'], // 6+1
          ['block1', 'block2', 'block3', 'block4', 'block5'], // 5+2
          ['block1', 'block2', 'block3', 'block4'], // 4+3
          ['block1', 'block2', 'block3'], // 3+4
          ['block1', 'block2'], // 2+5
          ['block1'], // 1+6
          [], // 0+7
        ],
        validation: { kind: 'set', tolerance: 0 },
        dragDropInstructions: 'Arraste blocos AMARELOS para o lado VERMELHO (esquerda) e o resto para o lado AZUL (direita).',
        dragDropInstructionsPt: 'Arraste blocos AMARELOS para o lado VERMELHO (esquerda) e o resto para o lado AZUL (direita).',
        spokenSteps: 'Passo 1: Pense em um número entre 0 e 7. Passo 2: Arraste esse número de blocos para o lado vermelho. Passo 3: Os blocos restantes vão para o lado azul. Passo 4: Conte quantos tem em cada lado e aprenda a composição!',
        spokenSuccessFeedback: 'Excelente! Você decompôs o número 7! Quantos blocos você colocou em cada lado? Essa é uma forma de decompor 7!',
        semantic: {
          structureId: 'composition_decomposition.number_decomposition_7',
          type: 'manipulative',
          concept: 'understanding_number_composition_flexible',
          learningGoal: 'understanding_flexible_part_part_whole',
          mathematicalConcepts: ['NumberConcept', 'CompositionConcept', 'DecompositionConcept'],
          representation: ['object_based', 'pictorial'],
          interactionType: ['decomposition_exploration'],
        },
      },
    },
    {
      title: 'Descubra o número que falta',
      description: 'Complete um fato básico da adição',
      type: 'missing_number',
      difficulty: 'easy',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['logical'],
      pointsReward: 20,
      isActive: true,
      accessibility: { sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Qual número completa a igualdade?',
        instructions: 'Which number completes the equation?',
        question: '5 + ? = 8',
        inputMode: 'numeric',
        correctAnswer: 3,
        validation: { kind: 'numeric' },
        scaffolding: {
          hints: [{ textLabel: 'Conte do 5 até o 8.', pictogramConceptId: 'math.number_line' }],
          workedExample: '2 + ? = 5; o número que falta é 3.',
        },
        semantic: {
          mathematicalConcepts: ['AdditionConcept'],
          conceptMappingStatus: 'MAPPED',
          representation: ['symbolic'],
          interactionType: ['missing_value_entry'],
          difficultyProfile: {
            conceptualComplexity: null,
            numericalMagnitude: 8,
            abstractionLevel: null,
            stepCount: 1,
            distractorSimilarity: null,
            languageLoad: null,
            motorDemand: 'LOW',
            sensoryLoad: 'LOW',
            scaffoldingLevel: 'OPTIONAL',
          },
          affordances: {
            requiresDragging: false,
            requiresReading: true,
            usesAudio: false,
            usesPictograms: false,
          },
        },
      },
    },
    {
      title: 'Combine a forma com o nome',
      description: 'Relacione representações de uma figura plana',
      type: 'representation_matching',
      difficulty: 'easy',
      bnccSkills: ['EF01MA14'],
      targetModalities: ['visual'],
      pointsReward: 20,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Qual nome combina com esta forma?',
        instructions: 'Which name matches this shape?',
        question: '⬜',
        pictogramConceptIds: ['shape.square'],
        options: [
          { id: 'shape-circle', text: 'Círculo', value: 'circle', pictogramConceptId: 'shape.circle', isCorrect: false },
          { id: 'shape-square', text: 'Quadrado', value: 'square', pictogramConceptId: 'shape.square', isCorrect: true },
          { id: 'shape-triangle', text: 'Triângulo', value: 'triangle', pictogramConceptId: 'shape.triangle', isCorrect: false },
        ],
        correctAnswer: 'square',
        validation: { kind: 'exact' },
        scaffolding: {
          hints: [{ textLabel: 'Observe os quatro lados iguais.', pictogramConceptId: 'shape.square' }],
        },
        semantic: {
          mathematicalConcepts: ['BasicGeometryConcept', 'SquareConcept'],
          conceptMappingStatus: 'PARTIAL',
          representation: ['pictorial', 'object_based'],
          interactionType: ['representation_matching'],
          difficultyProfile: {
            conceptualComplexity: null,
            numericalMagnitude: null,
            abstractionLevel: null,
            stepCount: 1,
            distractorSimilarity: null,
            languageLoad: null,
            motorDemand: 'LOW',
            sensoryLoad: 'LOW',
            scaffoldingLevel: 'OPTIONAL',
          },
          affordances: {
            requiresDragging: false,
            requiresReading: true,
            usesAudio: false,
            usesPictograms: true,
          },
        },
      },
    },
    {
      title: 'A conta da TitiA está certa?',
      description: 'Avalie uma afirmação e escolha uma justificativa',
      type: 'error_detection',
      difficulty: 'medium',
      bnccSkills: ['EF01MA06'],
      targetModalities: ['logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'TitiA pensa que 3 + 2 = 6. Ela está certa? Escolha também o motivo.',
        instructions: 'TitiA thinks 3 + 2 = 6. Is she right? Also choose the reason.',
        spokenIntroduction: 'Oi! A TitiA vai te explicar.',
        spokenSteps: [
          'Olhe a conta.',
          'Conte três objetos.',
          'Agora conte mais dois.',
          'Escolha sim ou não.',
          'Depois escolha o motivo.',
        ],
        spokenHint: 'Conte três objetos. Depois conte mais dois.',
        spokenSuccessFeedback: 'Muito bem! Três mais dois é igual a cinco.',
        spokenRetryFeedback: 'Tudo bem. Conte os objetos mais uma vez.',
        question: '3 + 2 = 6?',
        pictogramConceptIds: ['character.titia'],
        options: [
          { id: 'verdict-yes', text: 'Sim', value: true, pictogramConceptId: 'action.yes', isCorrect: false },
          { id: 'verdict-no', text: 'Não', value: false, pictogramConceptId: 'action.no', isCorrect: true },
        ],
        reasonOptions: [
          { id: 'reason-five', text: 'Porque 3 + 2 = 5', value: 'sum_is_five', isCorrect: true },
          { id: 'reason-six', text: 'Porque 3 + 2 = 6', value: 'sum_is_six', isCorrect: false },
        ],
        correctAnswer: { value: false, reason: 'sum_is_five' },
        validation: { kind: 'compound' },
        scaffolding: {
          hints: [{ textLabel: 'Conte três objetos e depois mais dois.', pictogramConceptId: 'math.addition' }],
          requireReason: true,
        },
        semantic: {
          mathematicalConcepts: ['AdditionConcept'],
          conceptMappingStatus: 'MAPPED',
          representation: ['contextual', 'symbolic', 'pictorial'],
          interactionType: ['error_evaluation'],
          difficultyProfile: {
            conceptualComplexity: null,
            numericalMagnitude: 6,
            abstractionLevel: null,
            stepCount: 2,
            distractorSimilarity: null,
            languageLoad: null,
            motorDemand: 'LOW',
            sensoryLoad: 'LOW',
            scaffoldingLevel: 'OPTIONAL',
          },
          affordances: {
            requiresDragging: false,
            requiresReading: true,
            usesAudio: false,
            usesPictograms: true,
          },
        },
      },
    },
    {
      title: 'Maçãs para o lanche',
      description: 'Resolva uma situação de juntar quantidades',
      type: 'contextual_problem_solving',
      difficulty: 'easy',
      bnccSkills: ['EF01MA08'],
      targetModalities: ['visual', 'logical'],
      pointsReward: 25,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Havia 3 maçãs. Colocaram mais 2. Quantas maçãs há agora?',
        instructions: 'There were 3 apples. Two more were added. How many are there now?',
        spokenIntroduction: 'Oi! A TitiA vai te explicar.',
        spokenSteps: [
          'Olhe as três maçãs.',
          'Agora olhe mais duas.',
          'Junte os grupos.',
          'Quantas maçãs temos?',
        ],
        spokenHint: 'Junte as maçãs. Depois conte todas.',
        spokenSuccessFeedback: 'Muito bem! Temos cinco maçãs.',
        spokenRetryFeedback: 'Tudo bem. Junte os grupos e conte novamente.',
        question: '3 maçãs + 2 maçãs = ?',
        context: { operationMeaning: 'join' },
        pictogramConceptIds: ['object.apple', 'math.addition'],
        inputMode: 'numeric',
        correctAnswer: 5,
        validation: { kind: 'numeric' },
        scaffolding: {
          hints: [{ textLabel: 'Junte os dois grupos de maçãs e conte.', pictogramConceptId: 'object.apple' }],
          allowManipulatives: true,
        },
        semantic: {
          mathematicalConcepts: ['AdditionConcept', 'EarlyProblemSolvingConcept'],
          conceptMappingStatus: 'PARTIAL',
          representation: ['contextual', 'object_based', 'pictorial'],
          interactionType: ['contextual_response'],
          difficultyProfile: {
            conceptualComplexity: null,
            numericalMagnitude: 5,
            abstractionLevel: null,
            stepCount: 2,
            distractorSimilarity: null,
            languageLoad: null,
            motorDemand: 'LOW',
            sensoryLoad: 'LOW',
            scaffoldingLevel: 'OPTIONAL',
          },
          affordances: {
            requiresDragging: false,
            requiresReading: true,
            usesAudio: false,
            usesPictograms: true,
          },
        },
      },
    },
  ];

  // ── BNCC COVERAGE: 12 New Exercises for Missing Skills ──────────────────
  
  // EF01MA07: Composição com blocos manipulativos
  activities.push({
    title: 'Jogo da Composição: Combine os Blocos!',
    description: 'Combine barras de blocos para formar o número alvo (8)',
    type: 'composition_decomposition',
    difficulty: 'medium',
    bnccSkills: ['EF01MA07'],
    targetModalities: ['visual', 'sensory', 'kinesthetic', 'logical'],
    pointsReward: 28,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, hasAudio: true, sensoryLoad: 'medium' },
    content: {
      instructionsPt: 'Junte barras de blocos para formar o número 8',
      instructions: 'Combine rods of blocks to form the number 8',
      spokenIntroduction: 'Você tem barras de blocos de diferentes tamanhos. Cada barra representa um número. Você precisa combinar duas ou mais barras para fazer exatamente 8 blocos no total!',
      howToPlayPt: 'Veja as barras de blocos (vermelho, azul, verde, etc). Cada barra tem um número diferente de blocos. Arraste as barras para a área de resposta. Combine para fazer 8 blocos. Por exemplo: barra vermelha (5 blocos) + barra azul (3 blocos) = 8. Ou barra verde (4 blocos) + barra amarela (4 blocos) = 8. Você pode encontrar várias soluções!',
      howToPlay: 'Look at the block rods (red, blue, green, etc). Each rod has a different number of blocks. Drag the rods to the answer area. Combine to make 8 blocks. For example: red rod (5 blocks) + blue rod (3 blocks) = 8. Or green rod (4 blocks) + yellow rod (4 blocks) = 8. You can find multiple solutions!',
      timeLimit: 60,
      pictogramConceptIds: ['arasaac.13186', 'arasaac.26968', 'arasaac.14098'], // ordem, tamanho, construir
      bars: [
        { id: 'bar1', color: '#FF6B6B', value: 1, label: 'Barra Vermelha (1)' },
        { id: 'bar2', color: '#4ECDC4', value: 2, label: 'Barra Azul (2)' },
        { id: 'bar3', color: '#45B7D1', value: 3, label: 'Barra Ciano (3)' },
        { id: 'bar4', color: '#95E1D3', value: 4, label: 'Barra Verde (4)' },
        { id: 'bar5', color: '#FFA07A', value: 5, label: 'Barra Laranja (5)' },
        { id: 'bar6', color: '#FFD700', value: 6, label: 'Barra Amarela (6)' },
        { id: 'bar7', color: '#98D8C8', value: 7, label: 'Barra Menta (7)' },
        { id: 'bar8', color: '#9B59B6', value: 8, label: 'Barra Roxo (8)' },
      ],
      targetValue: 8,
      validCombinations: [
        [8], // bar8 alone
        [1, 7], [2, 6], [3, 5], [4, 4], // two bars
        [1, 2, 5], [1, 3, 4], [2, 2, 4], [2, 3, 3], [1, 1, 6], [1, 2, 2, 3], // three+ bars
      ],
      validation: { kind: 'set', tolerance: 0 },
      dragDropInstructions: 'Arraste as barras (de qualquer cor) para a área de resposta. Combine para que o total seja 8.',
      dragDropInstructionsPt: 'Arraste as barras (de qualquer cor) para a área de resposta. Combine para que o total seja 8.',
      spokenSteps: 'Passo 1: Escolha uma barra. Leia o número (ex: 5 blocos). Passo 2: Escolha outra barra. Leia o número (ex: 3 blocos). Passo 3: Coloque na área de resposta. Passo 4: O sistema conta: 5 + 3 = 8. Parabéns! Você compôs 8!',
      spokenSuccessFeedback: 'Excelente! Você compôs o número 8 corretamente! Parabéns, matemático!',
      semantic: {
        structureId: 'composition_decomposition.composition_8_bars',
        type: 'manipulative',
        concept: 'composition_through_bar_combination',
        learningGoal: 'understanding_number_composition_multiple_solutions',
        mathematicalConcepts: ['NumberConcept', 'AdditionConcept', 'CompositionConcept'],
        representation: ['object_based', 'bar_model'],
        interactionType: ['composition_building_flexible'],
      },
    },
  });


  // EF01MA13: Figuras geométricas espaciais - Reconhecimento de objetos 3D
  activities.push({
    title: 'Qual Objeto tem Forma de Cubo?',
    description: 'Identifique objetos com forma de cubo no mundo real',
    type: 'quiz',
    difficulty: 'easy',
    bnccSkills: ['EF01MA13'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 20,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual desses objetos tem a forma de um cubo?',
      instructions: 'Which of these objects has the shape of a cube?',
      howToPlayPt: 'Um cubo tem 6 faces quadradas. Um dado é um cubo. Uma caixa de presente pode ser um cubo. Escolha qual objeto é um cubo.',
      howToPlay: 'A cube has 6 square faces. A die is a cube. A gift box can be a cube. Choose which object is a cube.',
      pictogramConceptIds: ['arasaac.23191'],
      options: [
        { id: 'a', text: 'Bola', isCorrect: false },
        { id: 'b', text: 'Caixa de presente', isCorrect: true },
        { id: 'c', text: 'Cone de sorvete', isCorrect: false },
      ],
      correctAnswer: 'Caixa de presente',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos aprender sobre formas 3D! Qual objeto é um cubo?',
      spokenSuccessFeedback: 'Muito bem! Uma caixa de presente é um cubo!',
    },
  });

  // EF02MA07: Multiplicação por 2,3,4,5 - História com grupos
  activities.push({
    title: 'A História das Rodas: 3 Carros × 4 Rodas',
    description: 'Resolva problemas de multiplicação com uma história visual',
    type: 'contextual_problem_solving',
    difficulty: 'medium',
    bnccSkills: ['EF02MA07'],
    targetModalities: ['visual', 'logical', 'verbal'],
    pointsReward: 30,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, hasAudio: true, sensoryLoad: 'medium' },
    content: {
      instructionsPt: 'Quantas rodas têm 3 carros? Cada carro tem 4 rodas.',
      instructions: 'How many wheels do 3 cars have? Each car has 4 wheels.',
      howToPlayPt: 'Veja a história: 3 carros, cada um com 4 rodas. 3 × 4 = 12 rodas. Conte os grupos de 4.',
      howToPlay: 'Look at the story: 3 cars, each with 4 wheels. 3 × 4 = 12 wheels. Count the groups of 4.',
      pictogramConceptIds: ['arasaac.16590'],
      items: [
        { id: 'car1', label: 'Carro 1: 4 rodas', count: 4 },
        { id: 'car2', label: 'Carro 2: 4 rodas', count: 4 },
        { id: 'car3', label: 'Carro 3: 4 rodas', count: 4 },
      ],
      options: [
        { id: 'a', text: '8', isCorrect: false },
        { id: 'b', text: '12', isCorrect: true },
        { id: 'c', text: '15', isCorrect: false },
      ],
      correctAnswer: '12',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos contar rodas! Quantas rodas têm 3 carros?',
      spokenSuccessFeedback: 'Excelente! 3 carros × 4 rodas = 12 rodas!',
    },
  });

  // EF02MA14: Reconhecer figuras espaciais - Nomeação de sólidos
  activities.push({
    title: 'Qual é o Nome desse Sólido?',
    description: 'Identifique e nomeie figuras geométricas espaciais',
    type: 'representation_matching',
    difficulty: 'medium',
    bnccSkills: ['EF02MA14'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 25,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual é o nome dessa forma 3D?',
      instructions: 'What is the name of this 3D shape?',
      howToPlayPt: 'Veja a forma: tem uma ponta no topo e uma base redonda. É um cone! Escolha o nome certo.',
      howToPlay: 'Look at the shape: it has a point at the top and a round base. It is a cone! Choose the correct name.',
      pictogramConceptIds: ['arasaac.23191'],
      options: [
        { id: 'a', text: 'Cilindro', isCorrect: false },
        { id: 'b', text: 'Cone', isCorrect: true },
        { id: 'c', text: 'Esfera', isCorrect: false },
      ],
      correctAnswer: 'Cone',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos aprender nomes de formas 3D!',
      spokenSuccessFeedback: 'Correto! Essa forma é um cone!',
    },
  });

  // EF03MA01: Números naturais até milhar - Comparação de números grandes
  activities.push({
    title: 'Qual Número é Maior: 1234 ou 1243?',
    description: 'Compare números naturais até a ordem de unidade de milhar',
    type: 'quiz',
    difficulty: 'hard',
    bnccSkills: ['EF03MA01'],
    targetModalities: ['logical'],
    pointsReward: 35,
    isActive: true,
    isNew: true,
    accessibility: { sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual número é maior: 1234 ou 1243?',
      instructions: 'Which number is greater: 1234 or 1243?',
      howToPlayPt: 'Compare os números: 1234 tem 3 dezenas. 1243 tem 4 dezenas. 1243 é maior! Escolha o número maior.',
      howToPlay: 'Compare the numbers: 1234 has 3 tens. 1243 has 4 tens. 1243 is greater! Choose the larger number.',
      pictogramConceptIds: ['arasaac.23190'],
      options: [
        { id: 'a', text: '1234', isCorrect: false },
        { id: 'b', text: '1243', isCorrect: true },
      ],
      correctAnswer: '1243',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos comparar números grandes até 1000!',
      spokenSuccessFeedback: 'Parabéns! 1243 é maior que 1234!',
    },
  });

  // EF03MA08: Divisão com resto - Distribuição em grupos
  activities.push({
    title: 'Divida os Biscoitos: 12 ÷ 3',
    description: 'Resolva problemas de divisão com resto zero',
    type: 'drag_drop',
    difficulty: 'medium',
    bnccSkills: ['EF03MA08'],
    targetModalities: ['visual', 'sensory', 'logical'],
    pointsReward: 30,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'medium' },
    content: {
      instructionsPt: 'Distribua 12 biscoitos em 3 pratos. Quantos biscoitos em cada prato?',
      instructions: 'Distribute 12 cookies into 3 plates. How many cookies on each plate?',
      howToPlayPt: 'Veja 12 biscoitos. Coloque-os em 3 pratos iguais. 12 ÷ 3 = 4 biscoitos em cada prato.',
      howToPlay: 'Look at 12 cookies. Put them on 3 equal plates. 12 ÷ 3 = 4 cookies on each plate.',
      pictogramConceptIds: ['arasaac.17333'],
      items: [
        { id: 'cookie1', label: 'Biscoito 1' },
        { id: 'cookie2', label: 'Biscoito 2' },
        { id: 'cookie3', label: 'Biscoito 3' },
        { id: 'cookie4', label: 'Biscoito 4' },
      ],
      options: [
        { id: 'a', text: '3', isCorrect: false },
        { id: 'b', text: '4', isCorrect: true },
        { id: 'c', text: '5', isCorrect: false },
      ],
      correctAnswer: '4',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos dividir biscoitos em pratos!',
      spokenSuccessFeedback: 'Excelente! 12 ÷ 3 = 4 biscoitos em cada prato!',
    },
  });

  // EF03MA15: Classificar figuras planas - Contagem de lados
  activities.push({
    title: 'Qual Forma tem 4 Lados?',
    description: 'Classifique figuras planas pela quantidade de lados',
    type: 'quiz',
    difficulty: 'easy',
    bnccSkills: ['EF03MA15'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 20,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual forma tem exatamente 4 lados?',
      instructions: 'Which shape has exactly 4 sides?',
      howToPlayPt: 'Conte os lados: o círculo não tem lados. O triângulo tem 3 lados. O quadrado tem 4 lados! Escolha a forma com 4 lados.',
      howToPlay: 'Count the sides: the circle has no sides. The triangle has 3 sides. The square has 4 sides! Choose the shape with 4 sides.',
      pictogramConceptIds: ['arasaac.17331'],
      options: [
        { id: 'a', text: 'Círculo', isCorrect: false },
        { id: 'b', text: 'Quadrado', isCorrect: true },
        { id: 'c', text: 'Triângulo', isCorrect: false },
      ],
      correctAnswer: 'Quadrado',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos contar os lados das formas!',
      spokenSuccessFeedback: 'Certo! O quadrado tem 4 lados!',
    },
  });

  // EF04MA01: Números até dezenas de milhar - Leitura e escrita
  activities.push({
    title: 'Leia o Número: 25.847',
    description: 'Leia e compreenda números até dezenas de milhar',
    type: 'quiz',
    difficulty: 'hard',
    bnccSkills: ['EF04MA01'],
    targetModalities: ['logical'],
    pointsReward: 35,
    isActive: true,
    isNew: true,
    accessibility: { sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Como se lê o número 25.847?',
      instructions: 'How do you read the number 25,847?',
      howToPlayPt: 'Veja o número: 25.847. Tem 2 dezenas de milhar, 5 unidades de milhar, 8 centenas, 4 dezenas e 7 unidades. Escolha a leitura correta.',
      howToPlay: 'Look at the number: 25,847. It has 2 tens of thousands, 5 thousands, 8 hundreds, 4 tens and 7 units. Choose the correct reading.',
      pictogramConceptIds: ['arasaac.23190'],
      options: [
        { id: 'a', text: 'Vinte e cinco mil, oitocentos e quarenta e sete', isCorrect: true },
        { id: 'b', text: 'Dois mil, quinhentos e oitenta e quatro', isCorrect: false },
        { id: 'c', text: 'Duzentos e cinquenta e oito mil, quarenta e sete', isCorrect: false },
      ],
      correctAnswer: 'Vinte e cinco mil, oitocentos e quarenta e sete',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos ler números grandes!',
      spokenSuccessFeedback: 'Parabéns! Você leu corretamente: vinte e cinco mil, oitocentos e quarenta e sete!',
    },
  });

  // EF04MA06: Multiplicação significados - Arranjo retangular
  activities.push({
    title: 'Quantos Quadrados na Malha?',
    description: 'Compreenda multiplicação através de arranjos retangulares',
    type: 'visual_puzzle',
    difficulty: 'medium',
    bnccSkills: ['EF04MA06'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 30,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'medium' },
    content: {
      instructionsPt: 'Quantos quadrados há em uma malha de 5 × 6?',
      instructions: 'How many squares are in a 5 × 6 grid?',
      howToPlayPt: 'Veja a malha: 5 linhas e 6 colunas. Conte: 5 × 6 = 30 quadrados. Escolha a resposta certa.',
      howToPlay: 'Look at the grid: 5 rows and 6 columns. Count: 5 × 6 = 30 squares. Choose the correct answer.',
      pictogramConceptIds: ['arasaac.23190'],
      items: [
        { id: 'grid', label: 'Malha 5 × 6', visual: 'grid:5x6' },
      ],
      options: [
        { id: 'a', text: '25', isCorrect: false },
        { id: 'b', text: '30', isCorrect: true },
        { id: 'c', text: '35', isCorrect: false },
      ],
      correctAnswer: '30',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos contar quadrados em uma malha!',
      spokenSuccessFeedback: 'Excelente! 5 × 6 = 30 quadrados!',
    },
  });

  // EF04MA09: Frações unitárias - Reconhecimento visual
  activities.push({
    title: 'Qual é a Fração: 1/4 da Pizza',
    description: 'Reconheça frações unitárias mais usuais',
    type: 'quiz',
    difficulty: 'medium',
    bnccSkills: ['EF04MA09'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 25,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual fração representa 1 pedaço de uma pizza dividida em 4 partes?',
      instructions: 'Which fraction represents 1 piece of a pizza divided into 4 parts?',
      howToPlayPt: 'Veja a pizza: está dividida em 4 partes iguais. 1 pedaço é 1/4 da pizza. Escolha a fração correta.',
      howToPlay: 'Look at the pizza: it is divided into 4 equal parts. 1 piece is 1/4 of the pizza. Choose the correct fraction.',
      pictogramConceptIds: ['arasaac.23189'],
      options: [
        { id: 'a', text: '1/2', isCorrect: false },
        { id: 'b', text: '1/4', isCorrect: true },
        { id: 'c', text: '1/3', isCorrect: false },
      ],
      correctAnswer: '1/4',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos aprender sobre frações!',
      spokenSuccessFeedback: 'Correto! 1 pedaço de uma pizza dividida em 4 partes é 1/4!',
    },
  });

  // EF05MA01: Números até centenas de milhar - Comparação
  activities.push({
    title: 'Qual Número é Maior: 123.456 ou 132.456?',
    description: 'Compare números naturais até centenas de milhar',
    type: 'quiz',
    difficulty: 'extreme',
    bnccSkills: ['EF05MA01'],
    targetModalities: ['logical'],
    pointsReward: 40,
    isActive: true,
    isNew: true,
    accessibility: { sensoryLoad: 'low' },
    content: {
      instructionsPt: 'Qual número é maior: 123.456 ou 132.456?',
      instructions: 'Which number is greater: 123,456 or 132,456?',
      howToPlayPt: 'Compare os números: ambos têm 1 centena de milhar. Mas 123.456 tem 2 dezenas de milhar, e 132.456 tem 3 dezenas de milhar. 132.456 é maior!',
      howToPlay: 'Compare the numbers: both have 1 hundred thousand. But 123,456 has 2 ten thousands, and 132,456 has 3 ten thousands. 132,456 is greater!',
      pictogramConceptIds: ['arasaac.23190'],
      options: [
        { id: 'a', text: '123.456', isCorrect: false },
        { id: 'b', text: '132.456', isCorrect: true },
      ],
      correctAnswer: '132.456',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos comparar números muito grandes!',
      spokenSuccessFeedback: 'Parabéns! 132.456 é maior que 123.456!',
    },
  });

  // EF05MA06: Porcentagens - Visualização de percentuais
  activities.push({
    title: 'Quanto é 50% de 100 Moedas?',
    description: 'Associe representações de porcentagens',
    type: 'visual_puzzle',
    difficulty: 'hard',
    bnccSkills: ['EF05MA06'],
    targetModalities: ['visual', 'logical'],
    pointsReward: 35,
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, sensoryLoad: 'medium' },
    content: {
      instructionsPt: 'Quanto é 50% de 100 moedas?',
      instructions: 'What is 50% of 100 coins?',
      howToPlayPt: 'Veja 100 moedas. 50% significa metade. Metade de 100 é 50. Escolha a resposta certa.',
      howToPlay: 'Look at 100 coins. 50% means half. Half of 100 is 50. Choose the correct answer.',
      pictogramConceptIds: ['arasaac.16590'],
      items: [
        { id: 'coins', label: '100 moedas', count: 100 },
      ],
      options: [
        { id: 'a', text: '25', isCorrect: false },
        { id: 'b', text: '50', isCorrect: true },
        { id: 'c', text: '75', isCorrect: false },
      ],
      correctAnswer: '50',
      validation: { kind: 'exact' },
      spokenIntroduction: 'Vamos aprender sobre porcentagens!',
      spokenSuccessFeedback: 'Excelente! 50% de 100 moedas são 50 moedas!',
    },
  });

  activities.push(...expandedActivityPools() as any[], ...interactiveFormatActivities() as any[]);
  // Use createQueryBuilder to avoid eager-loading corrupted relations
  const existingRecords = await repo.createQueryBuilder('activity')
    .select(['activity.id', 'activity.title', 'activity.content', 'activity.bnccSkills'])
    .getMany()
    .catch(() => []);
  const existingTitles = new Set(existingRecords.map((record: any) => record.title));
  const existingByTitle = new Map(existingRecords.map((record: any) => [record.title, record]));
  const existingByStructureId = new Map(existingRecords
    .map((record: any) => [record.content?.semantic?.structureId, record] as const)
    .filter(([structureId]) => typeof structureId === 'string' && structureId.length > 0));
  let created = 0;
  let speechMetadataUpdated = 0;
  let authoredContentUpdated = 0;
  let titleMetadataUpdated = 0;
  for (const activity of activities) {
    const structureId = (activity.content as Record<string, any>)?.semantic?.structureId;
    if (typeof structureId === 'string' && existingByStructureId.has(structureId)) {
      const existing = existingByStructureId.get(structureId) as any;
      let shouldSave = false;
      if (existing.title !== activity.title) {
        existing.title = activity.title;
        shouldSave = true;
      }
      if (existing.description !== activity.description) {
        existing.description = activity.description;
        shouldSave = true;
      }
      if (JSON.stringify(existing.bnccSkills) !== JSON.stringify(activity.bnccSkills)) {
        existing.bnccSkills = activity.bnccSkills;
        shouldSave = true;
      }
      if (shouldSave) {
        await repo.save(existing);
        titleMetadataUpdated += 1;
      }
      continue;
    }
    if (existingTitles.has(activity.title)) {
      const existing = existingByTitle.get(activity.title) as any;
      const correctedSkill = ['Que forma é essa?', 'Círculo ou quadrado?'].includes(activity.title)
        ? 'EF01MA14'
        : ['Tirando biscoitos', '8 - 3 = ?'].includes(activity.title) ? 'EF01MA08' : null;
      if (correctedSkill && JSON.stringify(existing.bnccSkills) !== JSON.stringify([correctedSkill])) {
        existing.bnccSkills = [correctedSkill];
        await repo.save(existing);
      }
      const activityContent = activity.content as Record<string, any>;
      const authoredSpeech = Object.fromEntries(
        ['spokenIntroduction', 'spokenSteps', 'spokenHint', 'spokenSuccessFeedback', 'spokenRetryFeedback']
          .filter((key) => activityContent[key] !== undefined)
          .map((key) => [key, activityContent[key]]),
      );
      if (Object.keys(authoredSpeech).length > 0 && !existing.content?.spokenSteps) {
        existing.content = { ...existing.content, ...authoredSpeech };
        await repo.save(existing);
        speechMetadataUpdated += 1;
      }
      const authoredCorrection = activity.title === 'Círculo ou quadrado?'
        ? { instructionsPt: activityContent.instructionsPt, instructions: activityContent.instructions }
        : activity.title === 'Ordene os passos da adição!'
          ? { acceptedOrders: activityContent.acceptedOrders }
          : null;
      if (authoredCorrection && Object.entries(authoredCorrection).some(
        ([key, value]) => JSON.stringify(existing.content?.[key]) !== JSON.stringify(value),
      )) {
        existing.content = { ...existing.content, ...authoredCorrection };
        await repo.save(existing);
        authoredContentUpdated += 1;
      }
      continue;
    }
    const record = repo.create(activity);
    await repo.save(record);
    created += 1;
  }

  console.log(`✅ ${created} new activities seeded; ${titleMetadataUpdated} title metadata records updated; ${speechMetadataUpdated} speech metadata records updated; ${authoredContentUpdated} authored content corrections (${activities.length} defined)`);
}
