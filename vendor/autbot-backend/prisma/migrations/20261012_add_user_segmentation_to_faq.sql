/*
  Warnings:

  - A unique constraint covering the columns `[userId,question]` on the table `FrequentQuestion` will be added. If there are existing rows, this will be filled in with a partial index.
  - Added the required column `userId` to the `FrequentQuestion` table without a default value. This is required because the table is non-empty.

*/
-- DropIndex
DROP INDEX "FrequentQuestion_question_key";

-- AlterTable
ALTER TABLE "FrequentQuestion" ADD COLUMN "userId" TEXT NOT NULL,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "FrequentQuestion_userId_question_key" ON "FrequentQuestion"("userId", "question");

-- CreateIndex
CREATE INDEX "FrequentQuestion_userId_idx" ON "FrequentQuestion"("userId");

-- AddForeignKey
ALTER TABLE "FrequentQuestion" ADD CONSTRAINT "FrequentQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
