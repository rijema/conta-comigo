import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL;

export interface Message {
  author: "user" | "autoBot";
  text: string;
  timestamp: string;
}

export interface ConversationHistory {
  id: string;
  timestamp: string;
  title: string;
  messages: Message[];
}

const groupConversationsByDate = (conversations: ConversationHistory[]) => {
  const groups: { [key: string]: ConversationHistory[] } = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  conversations.forEach((conv) => {
    const convDate = new Date(conv.timestamp);
    let groupKey: string;

    if (convDate.toDateString() === today.toDateString()) {
      groupKey = "Hoje";
    } else if (convDate.toDateString() === yesterday.toDateString()) {
      groupKey = "Ontem";
    } else {
      const month = convDate.toLocaleString("pt-BR", { month: "long" });
      const year = convDate.getFullYear();
      groupKey = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(conv);
  });

  const orderedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "Hoje") return -2;
    if (b === "Hoje") return 2;
    if (a === "Ontem") return -1;
    if (b === "Ontem") return 1;

    const dateA = groups[a][0] ? new Date(groups[a][0].timestamp).getTime() : 0;
    const dateB = groups[b][0] ? new Date(groups[b][0].timestamp).getTime() : 0;
    return dateB - dateA;
  });

  const orderedGroups: { [key: string]: ConversationHistory[] } = {};
  orderedKeys.forEach((key) => {
    orderedGroups[key] = groups[key].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  return orderedGroups;
};

export const useHistoryData = () => {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("id");

      if (!authToken || !userId) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(`${apiUrl}/chat/history/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 404) {
        setConversations([]);
        setSelectedConversationId(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao buscar histórico");
      }

      const apiData = await response.json();
      const historics = Array.isArray(apiData) ? apiData : [];

      const formattedData: ConversationHistory[] = historics.map((conv: any) => {
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        const firstUserMessage = messages.find((m: any) => m.role === "user");
        const preview =
          typeof firstUserMessage?.content === "string"
            ? firstUserMessage.content.slice(0, 42)
            : "Conversa";

        return {
          id: conv.historicId,
          timestamp: conv.startedAt,
          title: preview.length === 42 ? `${preview}...` : preview,
          messages: messages.map((msg: any) => ({
            author: msg.role === "user" ? "user" : "autoBot",
            text: msg.content,
            timestamp: msg.createdAt,
          })),
        };
      });

      setConversations(formattedData);
      setSelectedConversationId((currentSelectedId) => {
        if (
          currentSelectedId &&
          formattedData.some((conversation) => conversation.id === currentSelectedId)
        ) {
          return currentSelectedId;
        }

        return formattedData.length > 0 ? formattedData[0].id : null;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const groupedConversations = groupConversationsByDate(conversations);
  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

  return {
    conversations,
    loading,
    error,
    selectedConversationId,
    setSelectedConversationId,
    groupedConversations,
    selectedConversation,
    refreshHistory: fetchHistory,
  };
};
