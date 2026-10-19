import { DataSource } from 'typeorm';

/**
 * Themed island catalog (clinical decision, Oct/2026).
 *
 * Every active activity belongs to exactly one island, chosen by its math
 * theme. Island ids are kept from the original catalog so attempt history,
 * cycle tracking and analytics keep pointing at the same islands; only the
 * child-facing names and the activity grouping change.
 *
 * Runs on every `npm run db:seed` (after ActivitiesSeed), so new activities
 * are placed in an island automatically.
 */
export interface IslandDefinition {
  islandId: string;
  name: string;
  description: string;
  theme: string;
  sequenceOrder: number;
  bnccSkills: string[];
}

export const ISLAND_CATALOG: IslandDefinition[] = [
  {
    islandId: 'island-numbers',
    name: 'Ilha das Estrelinhas',
    description: 'Vamos contar! Contar, ler e conhecer os números.',
    theme: 'numbers',
    sequenceOrder: 1,
    bnccSkills: ['EF01MA01', 'EF01MA02', 'EF01MA04', 'EF01MA07', 'EF02MA01', 'EF02MA04',
      'EF03MA01', 'EF03MA02', 'EF04MA01', 'EF04MA02', 'EF05MA01'],
  },
  {
    islandId: 'island-beach',
    name: 'Ilha dos Gigantes e Formiguinhas',
    description: 'Quem tem mais? Comparar, ordenar e medir.',
    theme: 'beach',
    sequenceOrder: 2,
    bnccSkills: ['EF01MA03', 'EF01MA05', 'EF01MA17'],
  },
  {
    islandId: 'island-body',
    name: 'Ilha do Pomar',
    description: 'Junta tudo na cesta! Somar e multiplicar.',
    theme: 'body',
    sequenceOrder: 3,
    bnccSkills: ['EF01MA06', 'EF02MA05', 'EF02MA07', 'EF03MA07', 'EF04MA06'],
  },
  {
    islandId: 'island-home',
    name: 'Ilha dos Biscoitos',
    description: 'Quanto sobrou? Tirar e repartir.',
    theme: 'home',
    sequenceOrder: 4,
    bnccSkills: ['EF01MA08', 'EF02MA06', 'EF03MA06', 'EF04MA03', 'EF05MA07', 'EF03MA08', 'EF04MA09', 'EF05MA06'],
  },
  {
    islandId: 'island-colors',
    name: 'Ilha do Arco-Íris',
    description: 'Cores e padrões: organizar e continuar sequências.',
    theme: 'colors',
    sequenceOrder: 5,
    bnccSkills: ['EF01MA09', 'EF01MA10', 'EF01MA15'],
  },
  {
    islandId: 'island-nature',
    name: 'Ilha do Castelo das Formas',
    description: 'Que forma é essa? Formas e posições.',
    theme: 'nature',
    sequenceOrder: 6,
    bnccSkills: ['EF01MA11', 'EF01MA12', 'EF01MA13', 'EF01MA14', 'EF01MA16', 'EF02MA14', 'EF03MA15'],
  },
];

const ISLAND_BY_SKILL = new Map<string, string>(
  ISLAND_CATALOG.flatMap((island) => island.bnccSkills.map((code) => [code, island.islandId] as const)),
);

const ISLAND_BY_NICHE: Record<string, string> = {
  counting: 'island-numbers',
  number_quantity: 'island-numbers',
  sequence: 'island-numbers',
  comparison: 'island-beach',
  magnitudes: 'island-beach',
  addition: 'island-body',
  subtraction: 'island-home',
  patterns: 'island-colors',
  shapes: 'island-nature',
  classification: 'island-nature',
  spatial_position: 'island-nature',
};

const ADD_OR_SUBTRACT_SKILLS = new Set(['EF01MA08', 'EF02MA06', 'EF03MA06', 'EF04MA03', 'EF05MA07']);

const DIFFICULTY_RANK: Record<string, number> = {
  very_easy: 1, easy: 2, medium: 3, hard: 4, extreme: 5,
};

export interface CatalogActivity {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  difficulty: string;
  bnccSkills?: string[] | null;
  content?: Record<string, any> | null;
}

function activityText(activity: CatalogActivity): string {
  const content = activity.content ?? {};
  return [activity.title, activity.description, content.instructionsPt, content.instructions]
    .filter((part) => typeof part === 'string')
    .join(' ')
    .toLowerCase();
}

const TAKE_AWAY = /\b(tir|sobr|rest|gast|retir|abaix|perd|comeu|comer|deu|dad[oa]s|faltam)|subtra|menos|−| - /;
const JOIN = /\b(som|junt|chegar|ganh|pegu|receb|ao todo|mais \d)|adi[cç]|\+/;
const COLOR_OR_SIZE_SORTING = /\bcor(es)?\b|figuras por tamanho|tamanhos das figuras/;

/** Returns the islandId an activity belongs to. Pure, so it can be unit tested. */
export function classifyActivityIsland(activity: CatalogActivity): string {
  const text = activityText(activity);
  const primarySkill = activity.bnccSkills?.[0];

  // These skills cover both adding and taking-away problems; split by wording.
  if (primarySkill && ADD_OR_SUBTRACT_SKILLS.has(primarySkill)) {
    if (TAKE_AWAY.test(text)) return 'island-home';
    if (JOIN.test(text)) return 'island-body';
    return 'island-home';
  }
  if (primarySkill && ISLAND_BY_SKILL.has(primarySkill)) {
    return ISLAND_BY_SKILL.get(primarySkill)!;
  }

  // Sorting by color or size (no BNCC code yet) belongs with colors and patterns.
  if (!primarySkill && COLOR_OR_SIZE_SORTING.test(text)) return 'island-colors';

  const niche = activity.content?.semantic?.niche;
  if (typeof niche === 'string' && ISLAND_BY_NICHE[niche]) return ISLAND_BY_NICHE[niche];

  if (activity.type === 'pattern_completion' || /padr[ãa]o|\bcor(es)?\b|sequ[êe]ncia de/.test(text)) {
    return 'island-colors';
  }
  if (/forma|tri[âa]ngul|c[íi]rculo|quadrad|ret[âa]ngul|esquerd|direit|em cima|embaixo/.test(text)) {
    return 'island-nature';
  }
  if (/maior|menor|mais pesad|comprid|compar/.test(text)) return 'island-beach';
  if (TAKE_AWAY.test(text)) return 'island-home';
  if (JOIN.test(text)) return 'island-body';
  return 'island-numbers';
}

/** School year the activity targets (1..5), used to order easy-to-hard. */
export function activityYear(activity: CatalogActivity): number {
  const match = activity.bnccSkills?.[0]?.match(/^EF0?(\d)MA/);
  if (match) return parseInt(match[1], 10);
  const targetYear = Number(activity.content?.targetYear);
  return Number.isFinite(targetYear) && targetYear > 0 ? targetYear : 1;
}

export interface IslandPlacement {
  islandId: string;
  activityId: string;
  sequenceInIsland: number;
  difficulty: string;
}

/** Places every activity in one island, ordered by school year, then difficulty, then title. */
export function planIslandCatalog(activities: CatalogActivity[]): IslandPlacement[] {
  const byIsland = new Map<string, CatalogActivity[]>();
  for (const activity of activities) {
    const islandId = classifyActivityIsland(activity);
    byIsland.set(islandId, [...(byIsland.get(islandId) ?? []), activity]);
  }

  const placements: IslandPlacement[] = [];
  for (const [islandId, items] of byIsland) {
    items
      .sort((a, b) => activityYear(a) - activityYear(b)
        || (DIFFICULTY_RANK[a.difficulty] ?? 3) - (DIFFICULTY_RANK[b.difficulty] ?? 3)
        || a.title.localeCompare(b.title, 'pt-BR')
        || a.id.localeCompare(b.id))
      .forEach((activity, index) => placements.push({
        islandId,
        activityId: activity.id,
        sequenceInIsland: index + 1,
        difficulty: activity.difficulty,
      }));
  }
  return placements;
}

async function tableExists(dataSource: DataSource, table: string): Promise<boolean> {
  const [row] = await dataSource.query(`SELECT to_regclass($1) IS NOT NULL AS exists`, [`"${table}"`]);
  return Boolean(row?.exists);
}

export const IslandCatalogSeed = async (dataSource: DataSource): Promise<void> => {
  if (!(await tableExists(dataSource, 'islands')) || !(await tableExists(dataSource, 'island_activity_mappings'))) {
    console.log('⚠️  Island tables not found, skipping island catalog');
    return;
  }

  const activities: CatalogActivity[] = await dataSource.query(`
    SELECT id, title, description, type::text AS type, difficulty::text AS difficulty, "bnccSkills", content
    FROM activities
    WHERE "isActive" = true
  `);
  const placements = planIslandCatalog(activities);

  const [islandIdColumn] = await dataSource.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'activities' AND column_name = 'islandId'
  `);

  await dataSource.transaction(async (manager) => {
    for (const island of ISLAND_CATALOG) {
      await manager.query(`
        INSERT INTO "islands" ("islandId", "name", "description", "theme", "sequenceOrder", "bnccSkills", "isActive")
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, true)
        ON CONFLICT ("islandId") DO UPDATE SET
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "sequenceOrder" = EXCLUDED."sequenceOrder",
          "bnccSkills" = EXCLUDED."bnccSkills",
          "isActive" = true,
          "updatedAt" = CURRENT_TIMESTAMP
      `, [island.islandId, island.name, island.description, island.theme, island.sequenceOrder,
        JSON.stringify(island.bnccSkills)]);
    }

    if (!placements.length) return;
    const islandIds = placements.map((p) => p.islandId);
    const activityIds = placements.map((p) => p.activityId);
    const sequences = placements.map((p) => p.sequenceInIsland);
    const difficulties = placements.map((p) => p.difficulty);

    // Old curated titles/instructions did not match the exercise they opened,
    // so the activity's own title and instructions are shown from now on.
    await manager.query(`
      INSERT INTO "island_activity_mappings"
        ("islandId", "activityId", "sequenceInIsland", "difficulty", "modality", "customTitle", "customInstructions", "isActive")
      SELECT p.island_id, p.activity_id, p.seq, p.difficulty, 'visual', NULL, NULL, true
      FROM unnest($1::varchar[], $2::uuid[], $3::int[], $4::varchar[]) AS p(island_id, activity_id, seq, difficulty)
      ON CONFLICT ("islandId", "activityId") DO UPDATE SET
        "sequenceInIsland" = EXCLUDED."sequenceInIsland",
        "difficulty" = EXCLUDED."difficulty",
        "customTitle" = NULL,
        "customInstructions" = NULL,
        "isActive" = true,
        "updatedAt" = CURRENT_TIMESTAMP
    `, [islandIds, activityIds, sequences, difficulties]);

    // Each activity lives in one island only; older duplicates are switched off (kept for history).
    await manager.query(`
      UPDATE "island_activity_mappings" m
      SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE m."isActive" = true
        AND NOT EXISTS (
          SELECT 1 FROM unnest($1::varchar[], $2::uuid[]) AS p(island_id, activity_id)
          WHERE p.island_id = m."islandId" AND p.activity_id = m."activityId"
        )
    `, [islandIds, activityIds]);

    if (islandIdColumn) {
      await manager.query(`
        UPDATE "activities" a SET "islandId" = p.island_id
        FROM unnest($1::varchar[], $2::uuid[]) AS p(island_id, activity_id)
        WHERE a.id = p.activity_id AND a."islandId" IS DISTINCT FROM p.island_id
      `, [islandIds, activityIds]);
    }
  });

  const counts = ISLAND_CATALOG.map((island) =>
    `${island.name}: ${placements.filter((p) => p.islandId === island.islandId).length}`);
  console.log(`✅ Island catalog synced (${counts.join(', ')})`);
};
