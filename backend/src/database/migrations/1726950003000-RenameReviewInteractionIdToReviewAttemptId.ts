import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameReviewInteractionIdToReviewAttemptId1726950003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // [INTEGRATION 3C]: Rename reviewInteractionId to reviewAttemptId
    // This aligns with the new attempt-based tracking in Integration 3B.2
    // reviewInteractionId was a LearningEvent ID; reviewAttemptId is an ActivityAttempt ID
    
    // Rename the column
    await queryRunner.query(`
      ALTER TABLE review_outcomes
      RENAME COLUMN "reviewInteractionId" TO "reviewAttemptId";
    `);

    // [INTEGRATION 3C]: Make reviewRecommendationId nullable to preserve historical provenance
    // The recommendation context is captured in ActivityAttempt.researchTrace.recommendationId
    // and ActivityAttempt.adeDecisionContext.decisionId
    // Keep this column for backward compatibility and provenance reconstruction
    await queryRunner.query(`
      ALTER TABLE review_outcomes
      ALTER COLUMN "reviewRecommendationId" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the original schema
    await queryRunner.query(`
      ALTER TABLE review_outcomes
      ALTER COLUMN "reviewRecommendationId" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE review_outcomes
      RENAME COLUMN "reviewAttemptId" TO "reviewInteractionId";
    `);
  }
}
