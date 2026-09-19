-- CreateTable
CREATE TABLE "ConversationSummary" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "historicId" TEXT NOT NULL,

    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationSummary_historicId_key" ON "ConversationSummary"("historicId");

-- AddForeignKey
ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_historicId_fkey" FOREIGN KEY ("historicId") REFERENCES "Historic"("historicId") ON DELETE RESTRICT ON UPDATE CASCADE;
