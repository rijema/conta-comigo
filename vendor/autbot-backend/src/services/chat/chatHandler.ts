import { PublicoKey, sendPrompt, generateSummary } from "./chatService";
import { updateFrequentQuestion } from "./faqService";
import { getResponseWithSemanticCache } from "./cacheService";
import prisma from "../../prisma";

interface ClientMessage {
  userId: string;
  publico: PublicoKey;
  pergunta: string;
}

const invalidQuestion =
  "Peço desculpas, mas não disponho de informações para responder a essa pergunta. Posso ajudar com algo relacionado à acessibilidade, inclusão ou Transtorno do Espectro Autista (TEA)?";

export async function handleChatMessage(rawMsg: ClientMessage) {
  const { userId, publico, pergunta } = rawMsg;

  if (
    !userId ||
    typeof userId !== "string" ||
    !publico ||
    !pergunta ||
    typeof pergunta !== "string"
  ) {
    throw new Error("Dados inválidos na mensagem recebida.");
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    throw new Error("Usuário não encontrado.");
  }

  let chatHistoric = await prisma.historic.findFirst({
    where: {
      userId,
      terminated: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chatHistoric) {
    chatHistoric = await prisma.historic.create({
      data: {
        userId,
        endedAt: new Date(),
        terminated: false,
      },
      include: {
        messages: true,
      },
    });
  } else {
  }

  const historicId = chatHistoric.historicId;

  await prisma.message.create({
    data: {
      role: "user",
      content: pergunta,
      createdAt: new Date(),
      historic: {
        connect: { historicId },
      },
    },
  });

  const summaryExists = await prisma.conversationSummary.findUnique({
    where: { historicId },
  });

  if (!summaryExists) {
    let firstQuestion = pergunta;

    if (chatHistoric.messages.length > 0) {
      const firstUserMessage = chatHistoric.messages.find(
        (m) => m.role === "user"
      );
      if (firstUserMessage) {
        firstQuestion = firstUserMessage.content;
      }
    }

    const resumo = await generateSummary(firstQuestion);

    await prisma.conversationSummary.create({
      data: {
        summary: resumo,
        historic: {
          connect: { historicId },
        },
      },
    });
  }

  const respostaCache = await getResponseWithSemanticCache(
    userId,
    publico,
    pergunta
  );

  if (respostaCache) {
    const isRecusaCache = respostaCache.trim() === invalidQuestion;

    if (!isRecusaCache) {
      await prisma.message.create({
        data: {
          role: "assistant",
          content: respostaCache,
          createdAt: new Date(),
          historic: {
            connect: { historicId },
          },
        },
      });

      await updateFrequentQuestion(pergunta, respostaCache);
    } else {
    }

    return { resposta: respostaCache, historicId };
  }

  const resposta = await sendPrompt(publico, pergunta);
  const isRecusa = resposta.trim() === invalidQuestion;

  if (!isRecusa) {
    await updateFrequentQuestion(pergunta, resposta);

    await prisma.message.create({
      data: {
        role: "assistant",
        content: resposta,
        createdAt: new Date(),
        historic: {
          connect: { historicId },
        },
      },
    });

    await prisma.historic.update({
      where: { historicId },
      data: { endedAt: new Date() },
    });
  } else {
  }

  return { resposta, historicId };
}
