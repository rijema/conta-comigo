import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentSkillStates1700000002000 implements MigrationInterface {
  name = 'AddStudentSkillStates1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "student_skill_states" (
        "studentId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "skillId" UUID NOT NULL REFERENCES "bncc_skills"("id") ON DELETE CASCADE,
        "masteryProbability" DOUBLE PRECISION NOT NULL CHECK ("masteryProbability" BETWEEN 0 AND 1),
        "observations" INTEGER NOT NULL DEFAULT 0 CHECK ("observations" >= 0),
        "lastUpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("studentId", "skillId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_student_skill_states_student" ON "student_skill_states" ("studentId")`);
    await queryRunner.query(`CREATE INDEX "idx_student_skill_states_skill" ON "student_skill_states" ("skillId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_skill_states"`);
  }
}
