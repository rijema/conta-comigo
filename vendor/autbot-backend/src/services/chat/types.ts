// Types for chat service

export interface ConversationHistoric {
  historicId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date;
  terminated: boolean;
  summary?: ConversationSummary | null;
  messages: Message[];
}

export interface Message {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  historicId: string;
}

export interface ConversationSummary {
  summaryId: string;
  historicId: string;
  summary: string;
  createdAt?: Date;
}

