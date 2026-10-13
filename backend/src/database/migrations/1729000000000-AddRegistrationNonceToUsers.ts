import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationNonceToUsers1729000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "registration_nonce" VARCHAR(128)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_registration_nonce"
      ON "users" ("registration_nonce")
      WHERE "registration_nonce" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_registration_nonce"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "registration_nonce"
    `);
  }
}
