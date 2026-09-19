import prisma from '../../prisma'; 
import { sendPrompt } from './chatService'; 
import { UserType } from '@prisma/client';
import { getSimilarityScores } from './embeddingService'; 

const CACHE_EXPIRATION_MS = Number(process.env.CACHE_EXPIRATION_MS);
const SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD);


function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getResponseWithSemanticCache(
  userId: string,
  userType: UserType,
  question: string
): Promise<string> {
  const now = new Date();
  const cleanQuestion = cleanText(question);

  const cachedList = await prisma.chatCache.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const cachedQuestions = cachedList.map(item => cleanText(item.question));

  if (cachedQuestions.length > 0) {
    const similarityScores = await getSimilarityScores(cleanQuestion, cachedQuestions);

    let bestScore = 0;
    let bestIndex = -1;

    similarityScores.forEach((score, i) => {
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    if (bestScore >= SIMILARITY_THRESHOLD && bestIndex !== -1) {
      console.log('Resposta retornada do cache semântico com similaridade:', bestScore.toFixed(3));
      return cachedList[bestIndex].answer;
    }
  }

  const answer = await sendPrompt(userType, question);

  await prisma.chatCache.create({
    data: {
      userId,
      question,
      answer,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CACHE_EXPIRATION_MS),
      publicKey: userType,
    },
  });

  console.log('Resposta criada e salva no cache semântico.');
  return answer;
}
