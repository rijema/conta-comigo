import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignProductionSchemaWithMigrations1728000001000 implements MigrationInterface {
  name = 'AlignProductionSchemaWithMigrations1728000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercise_performance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "activityId" uuid NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
        "islandId" varchar,
        "sessionId" varchar,
        "attemptNumber" integer NOT NULL DEFAULT 1,
        "isCorrect" boolean NOT NULL DEFAULT false,
        "score" float NOT NULL DEFAULT 0,
        "responseTimeMs" integer,
        "hintsUsed" integer NOT NULL DEFAULT 0,
        "tutorialOpenedCount" integer NOT NULL DEFAULT 0,
        "instructionReplayCount" integer NOT NULL DEFAULT 0,
        "skipped" boolean NOT NULL DEFAULT false,
        "timeBeforeSkipMs" integer,
        "metadata" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_activity"
      ON "exercise_performance"("userId", "activityId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_island"
      ON "exercise_performance"("userId", "islandId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exercise_performance_user_created"
      ON "exercise_performance"("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "island_exercises_mapping" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL UNIQUE,
        "islandName" varchar(100) NOT NULL,
        "topic" varchar(100) NOT NULL,
        "bnccSkills" jsonb NOT NULL,
        "exerciseCount" integer NOT NULL,
        "exerciseTitles" jsonb NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_exercises_mapping_island_id"
      ON "island_exercises_mapping"("islandId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "islands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL UNIQUE,
        "name" varchar(100) NOT NULL,
        "description" text,
        "theme" varchar(100) NOT NULL,
        "arasaacPictogramIds" jsonb NOT NULL DEFAULT '[]',
        "bnccSkills" jsonb NOT NULL DEFAULT '[]',
        "sequenceOrder" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_islands_island_id" ON "islands"("islandId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "island_activity_mappings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "islandId" varchar(50) NOT NULL REFERENCES "islands"("islandId") ON DELETE CASCADE,
        "activityId" uuid NOT NULL REFERENCES "activities"("id") ON DELETE CASCADE,
        "sequenceInIsland" integer NOT NULL,
        "difficulty" varchar(20) NOT NULL,
        "modality" varchar(50) NOT NULL,
        "customTitle" varchar(255),
        "customInstructions" text,
        "scaffolding" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("islandId", "activityId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_activity_mappings_island_id"
      ON "island_activity_mappings"("islandId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_island_activity_mappings_activity_id"
      ON "island_activity_mappings"("activityId")
    `);

    await queryRunner.query(`
      INSERT INTO "islands" ("islandId", "name", "description", "theme", "sequenceOrder", "arasaacPictogramIds", "bnccSkills")
      VALUES
        ('island-numbers', 'Ilha dos Números', 'Explore o mundo dos números através de contagem, sequência e operações matemáticas básicas', 'numbers', 1, '["23190", "23191", "23192"]'::jsonb, '["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06", "EF01MA08"]'::jsonb),
        ('island-colors', 'Ilha das Cores', 'Descubra as cores, padrões e classificações através de atividades visuais e interativas', 'colors', 2, '["61042", "61043", "61044"]'::jsonb, '["EF01MA14", "EF01MA03"]'::jsonb),
        ('island-beach', 'Ilha da Praia', 'Aprenda com elementos da praia: areia, água, sol, conchas e diversão ao ar livre', 'beach', 3, '["23189", "23190", "23191"]'::jsonb, '["EF01MA01", "EF01MA02", "EF01MA03", "EF01MA06"]'::jsonb)
      ON CONFLICT ("islandId") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "islandId" varchar
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_activities_island_id" ON "activities"("islandId")
    `);
    await queryRunner.query(`
      UPDATE "activities" a
      SET "islandId" = (
        SELECT iam."islandId"
        FROM "island_activity_mappings" iam
        WHERE iam."activityId" = a."id" AND iam."isActive" = true
        LIMIT 1
      )
      WHERE a."islandId" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "island_activity_mappings" iam
          WHERE iam."activityId" = a."id" AND iam."isActive" = true
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "ade_decisions" ADD COLUMN IF NOT EXISTS "recommendedIslandId" varchar(50)
    `);
    await queryRunner.query(`
      ALTER TABLE "ade_decisions" ADD COLUMN IF NOT EXISTS "sequenceInIsland" integer
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ade_decisions_island_id"
      ON "ade_decisions"("recommendedIslandId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activity_attempts_island_id"
      ON "activity_attempts"("islandId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typname = 'review_type_enum'
        ) THEN
          CREATE TYPE "review_type_enum" AS ENUM ('REMEDIATION', 'RETENTION', 'GENERALIZATION');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "skillId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "reviewType" "review_type_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "sourceInteractionIds" uuid[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "sourceRecommendationIds" uuid[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "selectedActivityTemplateId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "selectedActivityInstanceId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "reason" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "priorityScore" double precision
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "scoringConfiguration" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "scoringBreakdown" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "baselineState" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "completedAt" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_review_assignments_student_skill_created"
      ON "review_assignments"("studentId", "skillId", "createdAt")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typname = 'progression_classification_enum'
        ) THEN
          CREATE TYPE "progression_classification_enum" AS ENUM ('IMPROVED', 'STABLE', 'NEEDS_SUPPORT', 'INCONCLUSIVE');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "reviewRecommendationId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "baselineMetrics" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "reviewMetrics" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "deltas" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "normalizedDeltas" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "classificationReason" text
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "review_outcomes" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_review_outcomes_student_skill_created"
      ON "review_outcomes"("studentId", "skillId", "createdAt")
    `);

    await queryRunner.query(`
      INSERT INTO "typeorm_migrations" ("timestamp", "name")
      SELECT v.timestamp, v.name
      FROM (VALUES
        (1726900000000, 'AddExercisePerformanceTracking1726900000000'),
        (1726900001000, 'AddIslandExercisesMapping1726900001000'),
        (1726900002000, 'AddHowToPlayInstructions1726900002000'),
        (1726950000000, 'AddReviewAssignments1726950000000'),
        (1726950001000, 'AddReviewOutcomes1726950001000'),
        (1726950002000, 'AddReviewAssignmentIdToActivityAttempts1726950002000'),
        (1726950003000, 'RenameReviewInteractionIdToReviewAttemptId1726950003000'),
        (1726950004000, 'AddIslandCycleToActivityAttempts1726950004000'),
        (1726950005000, 'AddCheckpointContextToReviewAssignments1726950005000'),
        (1726950006000, 'CreateIslandsAndActivityMappings1726950006000'),
        (1726950007000, 'AddIslandContextToAdeDecision1726950007000'),
        (1726950008000, 'AddIslandIdToActivities1726950008000')
      ) AS v("timestamp", "name")
      WHERE NOT EXISTS (
        SELECT 1
        FROM "typeorm_migrations" tm
        WHERE tm."timestamp" = v.timestamp AND tm."name" = v.name
      )
    `);

    const howToPlayGuide: Record<string, { pt: string; en: string }> = {
      counting: {
        pt: 'Observe os objetos na tela e conte quantos ha. Depois, clique no numero correto.',
        en: 'Observe the objects on the screen and count how many there are. Then, click the correct number.',
      },
      quiz: {
        pt: 'Leia a pergunta e escolha a resposta correta entre as opcoes.',
        en: 'Read the question and choose the correct answer from the options.',
      },
      drag_drop: {
        pt: 'Arraste os objetos para o lugar correto. Use o dedo ou o mouse para mover.',
        en: 'Drag the objects to the correct place. Use your finger or mouse to move.',
      },
      visual_puzzle: {
        pt: 'Encontre as pecas que faltam ou complete o padrao clicando nas opcoes.',
        en: 'Find the missing pieces or complete the pattern by clicking on the options.',
      },
      yes_no: {
        pt: 'Responda sim ou nao para a pergunta. Clique no botao correto.',
        en: 'Answer yes or no to the question. Click the correct button.',
      },
      representation_matching: {
        pt: 'Ligue o numero a quantidade correta ou escolha a representacao certa.',
        en: 'Match the number to the correct quantity or choose the right representation.',
      },
      composition_decomposition: {
        pt: 'Decomponha o numero em partes ou componha numeros menores para formar um maior.',
        en: 'Decompose the number into parts or compose smaller numbers to form a larger one.',
      },
      missing_number: {
        pt: 'Complete a sequencia ou encontre o numero que falta. Clique na resposta correta.',
        en: 'Complete the sequence or find the missing number. Click the correct answer.',
      },
      pattern_completion: {
        pt: 'Observe o padrao e continue a sequencia. Escolha o proximo elemento correto.',
        en: 'Observe the pattern and continue the sequence. Choose the next correct element.',
      },
      error_detection: {
        pt: 'Encontre o erro ou o elemento que nao pertence ao grupo. Clique nele.',
        en: 'Find the error or the element that does not belong to the group. Click on it.',
      },
      contextual_problem_solving: {
        pt: 'Leia o problema e resolva a operacao matematica. Escolha a resposta correta.',
        en: 'Read the problem and solve the math operation. Choose the correct answer.',
      },
      video_question: {
        pt: 'Assista ao video e responda a pergunta. Clique na opcao correta.',
        en: 'Watch the video and answer the question. Click the correct option.',
      },
    };

    for (const [type, guides] of Object.entries(howToPlayGuide)) {
      await queryRunner.query(
        `
          UPDATE "activities"
          SET "content" = jsonb_set(
            "content",
            '{howToPlayPt}',
            to_jsonb($1::text)
          )
          WHERE "type" = $2 AND "content" ->> 'howToPlayPt' IS NULL
        `,
        [guides.pt, type],
      );

      await queryRunner.query(
        `
          UPDATE "activities"
          SET "content" = jsonb_set(
            "content",
            '{howToPlay}',
            to_jsonb($1::text)
          )
          WHERE "type" = $2 AND "content" ->> 'howToPlay' IS NULL
        `,
        [guides.en, type],
      );
    }

    await queryRunner.query(`
      INSERT INTO "island_exercises_mapping" ("islandId", "islandName", "topic", "bnccSkills", "exerciseCount", "exerciseTitles")
      VALUES
        ('island-sun', 'Ilha do Sol', 'Contagem', '["EF01MA01", "EF01MA02"]'::jsonb, 12, '["Conta as estrelas!", "Contar grupos de figuras", "Contar apenas os triangulos", "Somar os lapis das caixas", "Descobrir quantos livros faltam", "Ligar a quantidade ao numero", "Contar os dedos da mao", "Contar os dedos das duas maos", "Ler marcas e descobrir o numero", "Juntar dezena e unidades", "Quantas macas?", "Contar frutas da feira"]'::jsonb),
        ('island-sea', 'Ilha do Mar', 'Adicao', '["EF01MA06", "EF01MA07"]'::jsonb, 12, '["Juntar bolas e contar", "Somar nos dedos", "Completar a conta de adicao", "Formar o numero dez", "Somar copos na mesa", "Comparar duas cestas de frutas", "Compre 4 paes e depois mais 3", "Uma cesta tem 7 macas e recebe 5 peras", "Junte 1 bola e 2 bolas", "Mostre 3 dedos e mais 2", "Na mesa havia 8 copos; chegaram mais 5", "Adicionar numeros em contexto"]'::jsonb),
        ('island-forest', 'Ilha da Floresta', 'Subtracao', '["EF01MA08", "EF01MA09"]'::jsonb, 12, '["Tirar um lapis e contar", "Abaixar dedos e contar", "Completar a conta de subtracao", "Descobrir quantas figurinhas sobraram", "Descobrir quantos livros foram retirados", "Voce tinha 7 moedas e gastou 2", "De 12 figurinhas, 5 foram dadas", "Ha 3 lapis. Tire 1. Quantos restam?", "Mostre 5 dedos e abaixe 2", "Complete: 9 - __ = 6", "Subtrair em contexto de compras", "Remover objetos e contar"]'::jsonb),
        ('island-flowers', 'Ilha das Flores', 'Comparacao', '["EF01MA03", "EF01MA04"]'::jsonb, 12, '["Comparar dois grupos", "Descobrir se as quantidades sao iguais", "Perceber qual pote tem menos", "Calcular quantos a mais", "Comparar resultados da coleta", "Qual grupo tem mais: tres circulos ou dois triangulos?", "Ha 4 bolas azuis e 4 vermelhas", "Qual pote parece ter menos", "Uma fila tem 9 criancas e outra tem 6", "Uma turma recolheu 14 papeis e outra 11", "Um saco tem 5 laranjas e outro 3", "Comparar quantidades em contexto"]'::jsonb),
        ('island-apples', 'Ilha das Macas', 'Formas', '["EF01MA14", "EF01MA15"]'::jsonb, 12, '["Reconhecer o circulo", "Reconhecer o triangulo", "Encontrar a forma da porta", "Perceber a forma mesmo girada", "Comparar figuras com quatro lados", "Separar figuras sem pontas", "Encontrar a figura com tres pontas", "Encontrar a figura com quatro lados", "Descobrir o que duas figuras tem em comum", "Encontrar a figura diferente do grupo", "Qual forma nao tem lados retos?", "Um quadrado girado continua sendo qual forma?"]'::jsonb),
        ('island-animals', 'Ilha dos Animais', 'Medidas', '["EF01MA16", "EF01MA17"]'::jsonb, 12, '["Comparar fitas", "Descobrir o pacote mais pesado", "Descobrir se as cordas tem o mesmo tamanho", "Calcular a diferenca de comprimento", "Encontrar a medida do meio", "Uma fita mede 2 passos e outra 4", "Um pacote pesa 1 kg e outro 3 kg", "Duas cordas medem 5 palmos cada", "Uma fita mede 9 cm e outra 6 cm", "Qual medida fica entre 12 cm e 16 cm?", "Medir comprimentos", "Comparar pesos e tamanhos"]'::jsonb),
        ('island-magic', 'Ilha Magica', 'Sequencias', '["EF01MA10", "EF01MA11"]'::jsonb, 12, '["Completar a contagem", "Descobrir o numero anterior", "Descobrir o numero que fica no meio", "Contar de dois em dois", "Completar a reta numerica", "Continue: azul, vermelho, azul, __", "Continue a sequencia de formas", "Continue: 1 palito, 2 palitos, 3 palitos, __", "Continue: sol, lua, estrela, sol, lua, __", "Na sequencia 2, 4, 6, 8, o proximo numero e:", "Complete: 1, 2, __", "Descobrir padroes e sequencias"]'::jsonb),
        ('island-love', 'Ilha do Amor', 'Ordenacao', '["EF01MA05", "EF01MA12"]'::jsonb, 12, '["Descobrir o que esta em cima", "Descobrir o que esta embaixo", "Descobrir quem esta no meio", "Descobrir quem vem primeiro", "Descobrir esquerda e direita", "O livro esta em cima da mesa", "A bola esta debaixo da cadeira", "Ana esta entre Bia e Caio", "Numa fila, Leo vem depois de Lia", "O copo esta a esquerda do prato", "Ordenar objetos espacialmente", "Compreender posicoes relativas"]'::jsonb)
      ON CONFLICT ("islandId") DO NOTHING
    `);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(): Promise<void> {
    // This migration aligns production and should not be rolled back automatically.
  }
}
