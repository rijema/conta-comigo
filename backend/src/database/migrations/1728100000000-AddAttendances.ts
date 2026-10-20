import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendances1728100000000 implements MigrationInterface {
  name = 'AddAttendances1728100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "attendances_status_enum" AS ENUM ('active', 'ended')`);
    await queryRunner.query(`CREATE TABLE "attendances" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "learnerId" UUID NOT NULL REFERENCES "users"("id"),
      "professionalId" UUID NOT NULL REFERENCES "users"("id"),
      "status" "attendances_status_enum" NOT NULL DEFAULT 'active',
      "startedAt" TIMESTAMP NOT NULL,
      "lastResumedAt" TIMESTAMP,
      "endedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);
    await queryRunner.query(`CREATE INDEX "idx_attendances_learner_status" ON "attendances" ("learnerId", "status")`);
    await queryRunner.query(`CREATE INDEX "idx_attendances_professional_status" ON "attendances" ("professionalId", "status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "attendances"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "attendances_status_enum"`);
  }
}
