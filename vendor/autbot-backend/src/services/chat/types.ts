// Types for chat service

export interface ClientMessage {
  userId: string;
  publico: string;
  pergunta: string;
}

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

export interface ChatHandlerResponse {
  resposta: string;
  historicId: string;
}

export type MapHistoricsCallback = (historic: ConversationHistoric, index: number) => string;
export type MapMessagesCallback = (message: Message) => string;
