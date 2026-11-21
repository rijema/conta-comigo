import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clinic scoping: professionals only see children of their own clinic.
 *
 * Data step: creates "Ciclo - Centro de Fonoaudiologia", gives it to the
 * professional Angela, and attaches every real child (and the guardians of
 * those children). Test accounts are left without a clinic, so no
 * professional sees them:
 *   - names containing "test"/"teste";
 *   - names containing "Olivia"/"Olívia";
 *   - anonymized accounts ("anon_…").
 */
const CICLO_NAME = 'Ciclo - Centro de Fonoaudiologia';
const CICLO_NORMALIZED = 'ciclo centro de fonoaudiologia';

const REAL_CHILD_FILTER = `
  u.role = 'child'
  AND u.name !~* 'test'
  AND u.name !~* 'ol[ií]via'
  AND u.name NOT LIKE 'anon\\_%'
`;

export class AddClinics1729000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The project runner (run-migrations.ts) does not wrap migrations in a
    // transaction; schema and data must land together or not at all.
    const ownTransaction = !queryRunner.isTransactionActive;
    if (ownTransaction) await queryRunner.startTransaction();
    try {
      await this.apply(queryRunner);
      if (ownTransaction) await queryRunner.commitTransaction();
    } catch (error) {
      if (ownTransaction) await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  private async apply(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinics" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "normalized_name" VARCHAR(255) NOT NULL,
        "owner_professional_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_clinics_normalized_name" ON "clinics" ("normalized_name")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_clinics_owner_professional_id"
      ON "clinics" ("owner_professional_id") WHERE "owner_professional_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "clinic_id" UUID REFERENCES "clinics"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "child_profiles"
      ADD COLUMN IF NOT EXISTS "clinic_id" UUID REFERENCES "clinics"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_clinic_id" ON "users" ("clinic_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_child_profiles_clinic_id" ON "child_profiles" ("clinic_id")`);

    // --- Data: Ciclo clinic, Angela, real children and their guardians ---
    await queryRunner.query(
      `INSERT INTO "clinics" ("name", "normalized_name")
       VALUES ($1, $2)
       ON CONFLICT ("normalized_name") DO NOTHING`,
      [CICLO_NAME, CICLO_NORMALIZED],
    );
    const [{ id: cicloId }] = await queryRunner.query(
      `SELECT "id" FROM "clinics" WHERE "normalized_name" = $1`,
      [CICLO_NORMALIZED],
    );

    // UPDATE … RETURNING comes back from TypeORM as [rows, count]; wrapping it
    // in a CTE + SELECT gives a plain row with the number of updated records.
    const countUpdated = async (update: string, params: unknown[]): Promise<number> => {
      const [{ n }] = await queryRunner.query(
        `WITH updated AS (${update} RETURNING 1) SELECT count(*)::int AS n FROM updated`,
        params,
      );
      return n;
    };

    const professionals = await countUpdated(
      `UPDATE "users" SET "clinic_id" = $1
       WHERE "role" = 'professional' AND "name" ~* '[aâ]ngela' AND "clinic_id" IS NULL`,
      [cicloId],
    );
    await queryRunner.query(
      `UPDATE "clinics" SET "owner_professional_id" = (
         SELECT "id" FROM "users"
         WHERE "role" = 'professional' AND "clinic_id" = $1
         ORDER BY "createdAt" ASC LIMIT 1
       )
       WHERE "id" = $1 AND "owner_professional_id" IS NULL`,
      [cicloId],
    );

    const children = await countUpdated(
      `UPDATE "child_profiles" cp SET "clinic_id" = $1
       FROM "users" u
       WHERE cp."userId" = u."id" AND cp."clinic_id" IS NULL AND ${REAL_CHILD_FILTER}`,
      [cicloId],
    );
    const guardians = await countUpdated(
      `UPDATE "users" g SET "clinic_id" = $1
       WHERE g."role" = 'guardian' AND g."clinic_id" IS NULL AND g."id" IN (
         SELECT cp."guardianId" FROM "child_profiles" cp WHERE cp."clinic_id" = $1
       )`,
      [cicloId],
    );

    // eslint-disable-next-line no-console
    console.log(
      `[AddClinics] ${CICLO_NAME}: ${professionals} profissional(is), `
      + `${children} criança(s), ${guardians} responsável(is)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_child_profiles_clinic_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_clinic_id"`);
    await queryRunner.query(`ALTER TABLE "child_profiles" DROP COLUMN IF EXISTS "clinic_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinics"`);
  }
}
