import prisma from "../../prisma";
import { getSimilarityScores } from "./embeddingService";

const SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD);

export async function updateFrequentQuestion(
  userId: string,
  question: string,
  answer?: string
) {
  try {
    console.log("⚙️ Atualizando pergunta frequente:", question, "para usuário:", userId);
    const existingQuestions = await prisma.frequentQuestion.findMany({
      where: { userId },
      select: { id: true, question: true },
    });

    if (existingQuestions.length > 0) {
      const scores = await getSimilarityScores(
        question,
        existingQuestions.map((q) => q.question)
      );
      const bestMatchIndex = scores.findIndex(
        (score) => score >= SIMILARITY_THRESHOLD
      );

      if (bestMatchIndex !== -1) {
        const matched = existingQuestions[bestMatchIndex];
        await prisma.frequentQuestion.update({
          where: { id: matched.id },
          data: {
            count: { increment: 1 },
            lastAskedAt: new Date(),
          },
        });
        return;
      }
    }

    await prisma.frequentQuestion.create({
      data: {
        userId,
        question,
        answer: answer ?? null,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar pergunta frequente:", error);
  }
}

export async function fetchFrequentQuestions(userId: string, limit = 7) {
  return prisma.frequentQuestion.findMany({
    where: { userId },
    orderBy: [{ count: "desc" }, { lastAskedAt: "desc" }],
    take: limit,
  });
}
