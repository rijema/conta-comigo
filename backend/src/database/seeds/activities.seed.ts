import { DataSource } from 'typeorm';

export async function ActivitiesSeed(dataSource: DataSource) {
  const repo = dataSource.getRepository('activities');

  const existing = await repo.count();
  if (existing > 0) {
    console.log('⏩ Activities already seeded, skipping');
    return;
  }

  const activities = [
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
        items: ['⭐','⭐','⭐'],
        options: [
          { id: 'a', text: '2', emoji: '2️⃣', isCorrect: false },
          { id: 'b', text: '3', emoji: '3️⃣', isCorrect: true },
          { id: 'c', text: '4', emoji: '4️⃣', isCorrect: false },
          { id: 'd', text: '5', emoji: '5️⃣', isCorrect: false },
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
        items: ['🍎','🍎','🍎','🍎','🍎'],
        options: [
          { id: 'a', text: '3', emoji: '3️⃣', isCorrect: false },
          { id: 'b', text: '4', emoji: '4️⃣', isCorrect: false },
          { id: 'c', text: '5', emoji: '5️⃣', isCorrect: true },
          { id: 'd', text: '6', emoji: '6️⃣', isCorrect: false },
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
          { id: 'a', text: '4', emoji: '4️⃣', isCorrect: false },
          { id: 'b', text: '7', emoji: '7️⃣', isCorrect: true },
          { id: 'c', text: 'São iguais', emoji: '🟰', isCorrect: false },
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
        instructionsPt: '🍬 + 🍬🍬 = ?',
        instructions: '1 candy + 2 candies = ?',
        items: ['🍬', '+', '🍬', '🍬', '=', '?'],
        options: [
          { id: 'a', text: '2', emoji: '2️⃣', isCorrect: false },
          { id: 'b', text: '3', emoji: '3️⃣', isCorrect: true },
          { id: 'c', text: '4', emoji: '4️⃣', isCorrect: false },
          { id: 'd', text: '1', emoji: '1️⃣', isCorrect: false },
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
        instructionsPt: 'Some as bolas: 🔵🔵 + 🔴🔴🔴 = ?',
        instructions: 'Add the balls: 🔵🔵 + 🔴🔴🔴 = ?',
        items: ['🔵', '🔵', '+', '🔴', '🔴', '🔴'],
        options: [
          { id: 'a', text: '4', emoji: '4️⃣', isCorrect: false },
          { id: 'b', text: '5', emoji: '5️⃣', isCorrect: true },
          { id: 'c', text: '6', emoji: '6️⃣', isCorrect: false },
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
      bnccSkills: ['EF01MA07'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Tinha 5 🍪, comeu 2. Quantos sobraram?',
        instructions: 'Had 5 🍪, ate 2. How many are left?',
        items: ['🍪','🍪','🍪','🍪','🍪'],
        options: [
          { id: 'a', text: '2', emoji: '2️⃣', isCorrect: false },
          { id: 'b', text: '3', emoji: '3️⃣', isCorrect: true },
          { id: 'c', text: '4', emoji: '4️⃣', isCorrect: false },
        ],
        correctAnswer: '3',
      },
    },
    {
      title: '8 - 3 = ?',
      description: 'Subtração',
      type: 'quiz',
      difficulty: 'medium',
      bnccSkills: ['EF01MA07'],
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
    // ── EF01MA15: Shapes ─────────────────────────────────────────────────
    {
      title: 'Que forma é essa?',
      description: 'Reconheça as formas geométricas',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA15'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Como se chama essa forma? ⬜',
        instructions: 'What is this shape? ⬜',
        options: [
          { id: 'a', text: 'Círculo', emoji: '⭕', isCorrect: false },
          { id: 'b', text: 'Quadrado', emoji: '⬜', isCorrect: true },
          { id: 'c', text: 'Triângulo', emoji: '🔺', isCorrect: false },
          { id: 'd', text: 'Retângulo', emoji: '▬', isCorrect: false },
        ],
        correctAnswer: 'Quadrado',
      },
    },
    {
      title: 'Círculo ou quadrado?',
      description: 'Identifique a forma',
      type: 'quiz',
      difficulty: 'easy',
      bnccSkills: ['EF01MA15'],
      targetModalities: ['visual'],
      pointsReward: 15,
      isActive: true,
      accessibility: { hasVisual: true, sensoryLoad: 'low' },
      content: {
        instructionsPt: 'Uma pizza tem formato de... ⭕',
        instructions: 'A pizza has the shape of... ⭕',
        options: [
          { id: 'a', text: 'Quadrado', emoji: '⬜', isCorrect: false },
          { id: 'b', text: 'Círculo', emoji: '⭕', isCorrect: true },
          { id: 'c', text: 'Triângulo', emoji: '🔺', isCorrect: false },
        ],
        correctAnswer: 'Círculo',
      },
    },
  ];

  for (const activity of activities) {
    const record = repo.create(activity);
    await repo.save(record);
  }

  console.log(`✅ ${activities.length} activities seeded`);
}
