// Types for chat service - aligned with Prisma schema

export interface Message {
  id: string;           // from Prisma
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  historicId: string;
}

export interface ConversationSummary {
  id: string;           // from Prisma (ConversationSummary.id)
  summary: string;
  historicId: string;
}

export interface ConversationHistoric {
  historicId: string;
  startedAt: Date;
  endedAt: Date;
  terminated: boolean;
  userId: string;
  messages: Message[];
  summary?: ConversationSummary | null;
}
