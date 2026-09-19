ALTER TABLE "User"
ADD COLUMN     "externalAuthProvider" TEXT,
ADD COLUMN     "externalAuthId" TEXT,
ADD COLUMN     "externalMetadata" JSONB;

CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");
