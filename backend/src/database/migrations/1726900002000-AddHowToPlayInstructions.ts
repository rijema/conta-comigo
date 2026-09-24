import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHowToPlayInstructions1726900002000 implements MigrationInterface {
  name = 'AddHowToPlayInstructions1726900002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const howToPlayGuide: Record<string, { pt: string; en: string }> = {
      counting: {
        pt: 'Observe os objetos na tela e conte quantos há. Depois, clique no número correto.',
        en: 'Observe the objects on the screen and count how many there are. Then, click the correct number.',
      },
      quiz: {
        pt: 'Leia a pergunta e escolha a resposta correta entre as opções.',
        en: 'Read the question and choose the correct answer from the options.',
      },
      drag_drop: {
        pt: 'Arraste os objetos para o lugar correto. Use o dedo ou o mouse para mover.',
        en: 'Drag the objects to the correct place. Use your finger or mouse to move.',
      },
      visual_puzzle: {
        pt: 'Encontre as peças que faltam ou complete o padrão clicando nas opções.',
        en: 'Find the missing pieces or complete the pattern by clicking on the options.',
      },
      yes_no: {
        pt: 'Responda sim ou não para a pergunta. Clique no botão correto.',
        en: 'Answer yes or no to the question. Click the correct button.',
      },
      representation_matching: {
        pt: 'Ligue o número à quantidade correta ou escolha a representação certa.',
        en: 'Match the number to the correct quantity or choose the right representation.',
      },
      composition_decomposition: {
        pt: 'Decomponha o número em partes ou componha números menores para formar um maior.',
        en: 'Decompose the number into parts or compose smaller numbers to form a larger one.',
      },
      missing_number: {
        pt: 'Complete a sequência ou encontre o número que falta. Clique na resposta correta.',
        en: 'Complete the sequence or find the missing number. Click the correct answer.',
      },
      pattern_completion: {
        pt: 'Observe o padrão e continue a sequência. Escolha o próximo elemento correto.',
        en: 'Observe the pattern and continue the sequence. Choose the next correct element.',
      },
      error_detection: {
        pt: 'Encontre o erro ou o elemento que não pertence ao grupo. Clique nele.',
        en: 'Find the error or the element that does not belong to the group. Click on it.',
      },
      contextual_problem_solving: {
        pt: 'Leia o problema e resolva a operação matemática. Escolha a resposta correta.',
        en: 'Read the problem and solve the math operation. Choose the correct answer.',
      },
      video_question: {
        pt: 'Assista ao vídeo e responda a pergunta. Clique na opção correta.',
        en: 'Watch the video and answer the question. Click the correct option.',
      },
    };

    for (const [type, guides] of Object.entries(howToPlayGuide)) {
      await queryRunner.query(`
        UPDATE "activities"
        SET "content" = jsonb_set(
          "content",
          '{howToPlayPt}',
          to_jsonb($1::text)
        )
        WHERE "type" = $2 AND "content" ->> 'howToPlayPt' IS NULL
      `, [guides.pt, type]);

      await queryRunner.query(`
        UPDATE "activities"
        SET "content" = jsonb_set(
          "content",
          '{howToPlay}',
          to_jsonb($1::text)
        )
        WHERE "type" = $2 AND "content" ->> 'howToPlay' IS NULL
      `, [guides.en, type]);
    }
  }

  async down(): Promise<void> {
    // Instructions are educational content and should be preserved.
  }
}
