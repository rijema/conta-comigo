import { useEffect, useRef, useState } from "react";
import "./Chat.css";
import { FaPaperPlane } from "react-icons/fa";
import { IoMdSearch, IoMdChatboxes } from "react-icons/io";
import { useHistoryData, type ConversationHistory } from "../../hooks/useHistoryData";
import HistoryListItem from "../../components/historico/HistoryListItem";
import FrequentlyAskedQuestions from "../../components/faq/FrequentlyAskedQuestions";
import ConversationDetailView from "../../components/historico/ConversationDetailView";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { StreamingMessage } from "../../components/chat/StreamingMessage";
import { TypingIndicator } from "../../components/chat/TypingIndicator";
import MessageToolbar from "../../components/chat/MessageToolbar";
import { fetchUserData } from "../../service/User";
import { useBrand } from "../../contexts/BrandContext";

interface ActiveConversationMessage {
  id: string;
  author: "user" | "autbot";
  text: string;
  timestamp: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const Chat = () => {
  const chatStorageKey = `titia-chat-live-${localStorage.getItem("id") ?? "anonymous"}`;
  const tabStorageKey = `titia-chat-tab-${localStorage.getItem("id") ?? "anonymous"}`;
  const draftMetaStorageKey = `titia-chat-draft-meta-${localStorage.getItem("id") ?? "anonymous"}`;

  const [currentMessage, setCurrentMessage] = useState("");
  const [activeChatMessages, setActiveChatMessages] = useState<ActiveConversationMessage[]>([]);
  const [currentView, setCurrentView] = useState<"chat" | "history">("chat");
  const [isTyping, setIsTyping] = useState(false);
  const [botStreamingMessage, setBotStreamingMessage] = useState("");
  const [userType, setUserType] = useState("");
  const [socketError, setSocketError] = useState("");
  const [hasDraftConversation, setHasDraftConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftStartedAt, setDraftStartedAt] = useState<string | null>(null);

  const {
    loading: historyLoading,
    error: historyError,
    selectedConversationId,
    setSelectedConversationId,
    groupedConversations,
    selectedConversation,
    refreshHistory,
  } = useHistoryData();

  const { assistantName, footerText, brand } = useBrand();
  const socketRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authToken = localStorage.getItem("authToken") ?? "";
  const userId = localStorage.getItem("id") ?? "";

  const filteredConversationGroups = Object.entries(groupedConversations).reduce(
    (accumulator, [groupName, groupConversations]) => {
      const filtered = groupConversations.filter((conversation) =>
        conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.messages.some((message) =>
          message.text.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      if (filtered.length > 0) {
        accumulator[groupName] = filtered;
      }

      return accumulator;
    },
    {} as Record<string, ConversationHistory[]>
  );

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(chatStorageKey);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          setActiveChatMessages(parsed);
        }
      }

      const storedDraftMeta = localStorage.getItem(draftMetaStorageKey);
      if (storedDraftMeta) {
        const parsedMeta = JSON.parse(storedDraftMeta);
        if (parsedMeta?.startedAt) {
          setDraftStartedAt(parsedMeta.startedAt);
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar mensagens salvas:", error);
    }
  }, [chatStorageKey, draftMetaStorageKey]);

  useEffect(() => {
    localStorage.setItem(chatStorageKey, JSON.stringify(activeChatMessages));
    setHasDraftConversation(activeChatMessages.length > 0);

    if (activeChatMessages.length > 0) {
      const nextStartedAt =
        draftStartedAt ?? activeChatMessages[0]?.timestamp ?? new Date().toISOString();
      if (nextStartedAt !== draftStartedAt) {
        setDraftStartedAt(nextStartedAt);
      }
      localStorage.setItem(
        draftMetaStorageKey,
        JSON.stringify({ startedAt: nextStartedAt })
      );
      return;
    }

    if (draftStartedAt !== null) {
      setDraftStartedAt(null);
    }
    localStorage.removeItem(draftMetaStorageKey);
  }, [activeChatMessages, chatStorageKey, draftMetaStorageKey, draftStartedAt]);

  useEffect(() => {
    localStorage.setItem(tabStorageKey, currentView);
  }, [currentView, tabStorageKey]);

  useEffect(() => {
    const storedView = localStorage.getItem(tabStorageKey);
    if (storedView === "history") {
      setCurrentView("history");
      return;
    }

    setCurrentView("chat");
  }, [tabStorageKey]);

  useEffect(() => {
    if (!userId) {
      console.error("User ID não encontrado no localStorage.");
      return;
    }

    fetchUserData(userId)
      .then((userData) => {
        if (userData && userData.userType) {
          setUserType(userData.userType);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar dados do usuário:", err);
      });
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages, botStreamingMessage]);

  const connectWebSocket = () => {
    if (!authToken) {
      console.error("Token não encontrado no localStorage");
      setSocketError("Sua sessão da TitiA não está pronta para conversar.");
      return;
    }

    let wsApiUrl = import.meta.env.VITE_API_URL || "";
    if (wsApiUrl.endsWith("/api")) {
      wsApiUrl = wsApiUrl.slice(0, -4);
    }

    const wsUrl = wsApiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(authToken)}`);

    ws.onopen = () => {
      hasConnectedRef.current = true;
      setIsTyping(false);
      setSocketError("");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "partial") {
          setBotStreamingMessage((prev) => prev + data.content);
          setIsTyping(true);
          return;
        }

        if (data.type === "complete" || (data.role === "assistant" && data.content)) {
          const contentWithoutStars = (botStreamingMessage + (data.content || "")).replace(/\*\*/g, "");
          const botMessage: ActiveConversationMessage = {
            id: Date.now().toString(),
            author: "autbot",
            text: contentWithoutStars,
            timestamp: new Date().toISOString(),
          };
          setActiveChatMessages((prev) => [...prev, botMessage]);
          setBotStreamingMessage("");
          setIsTyping(false);
          return;
        }

        if (data.error) {
          setSocketError(`Erro do servidor: ${data.error}`);
          setIsTyping(false);
          setBotStreamingMessage("");
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WebSocket:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsTyping(false);
      setSocketError("A conexão da conversa falhou. Tente novamente em alguns segundos.");
    };

    ws.onclose = () => {
      setIsTyping(false);
      setBotStreamingMessage("");
      if (hasConnectedRef.current && document.visibilityState === "visible") {
        setSocketError("A conexão da TitiA foi interrompida.");
      }
    };

    socketRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(event.target.value);
  };

  const persistConversationToHistory = async () => {
    if (!authToken || activeChatMessages.length === 0) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/chat/history/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const historics = await response.json();
      const currentHistoric = Array.isArray(historics)
        ? historics.find((historic: any) => historic.terminated === false)
        : null;

      if (!currentHistoric?.historicId) {
        return;
      }

      await fetch(`${apiUrl}/chat/history/${currentHistoric.historicId}/terminate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      await refreshHistory();
      localStorage.removeItem(chatStorageKey);
      localStorage.removeItem(draftMetaStorageKey);
    } catch (error) {
      console.error("Erro ao salvar histórico ativo:", error);
    }
  };

  const handleCreateNewChat = async () => {
    await persistConversationToHistory();
    setActiveChatMessages([]);
    setCurrentMessage("");
    setBotStreamingMessage("");
    setIsTyping(false);
    setSocketError("");
    setCurrentView("chat");
  };

  const resumeDraftConversation = () => {
    setCurrentView("chat");
    setSocketError("");
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() === "") return;

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setSocketError("A conversa ainda está reconectando. Aguarde um instante.");
      return;
    }

    const userMessage: ActiveConversationMessage = {
      id: Date.now().toString(),
      author: "user",
      text: currentMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setActiveChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setSocketError("");

    socketRef.current.send(
      JSON.stringify({
        userId,
        pergunta: userMessage.text,
        publico: userType,
      })
    );

    setIsTyping(true);
    setBotStreamingMessage("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const showChatView = () => {
    setCurrentView("chat");
  };

  const showHistoryView = () => {
    setCurrentView("history");
    if (!selectedConversationId && Object.keys(groupedConversations).length > 0) {
      setSelectedConversationId(Object.values(groupedConversations)[0][0].id);
    }
  };

  const handleFaqQuestionSelect = (question: string) => {
    setCurrentMessage(question);
  };

  const handleGoToHistoryMessage = async (messageId: string) => {
    // Save current conversation to history first
    await persistConversationToHistory();
    // Then switch to history view
    showHistoryView();
  };

  const draftPreview =
    activeChatMessages.find((message) => message.author === "user")?.text ||
    "Continuar conversa em andamento";

  return (
    <>
      <SharedTopBar
        pageType="chat"
        onShowChatView={showChatView}
        onShowHistoryView={showHistoryView}
        isHistoryViewActive={currentView === "history"}
      />
      <div className="content-area-below-top-bar">
        <aside className="sidebar">
          <div className="icon-section">
            <button title="buscar chat" className="send-button">
              <IoMdSearch />
            </button>
            <button title="criar um novo chat" className="send-button" onClick={handleCreateNewChat}>
              <IoMdChatboxes />
            </button>
          </div>

          <div className="history-search-container">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar no histórico"
              className="history-search-input"
            />
          </div>

          {currentView === "chat" ? (
            <div className="conversations-list">
              {hasDraftConversation ? (
                <button className="draft-conversation-card" onClick={resumeDraftConversation}>
                  <span className="draft-conversation-kicker">Interação atual</span>
                  <strong>{draftPreview}</strong>
                  <small>
                    {draftStartedAt
                      ? `Em andamento desde ${new Date(draftStartedAt).toLocaleString("pt-BR")}`
                      : "Retome de onde parou"}
                  </small>
                </button>
              ) : (
                <p className="no-conversations-message">
                  Inicie uma nova conversa para que ela apareça aqui.
                </p>
              )}
            </div>
          ) : (
            <div className="conversations-list">
              {historyLoading ? (
                <div className="history-section-loading">
                  <div className="loading-spinner"></div>
                  <p>Carregando histórico...</p>
                </div>
              ) : historyError ? (
                <div className="history-section-error">
                  <p>Erro: {historyError}</p>
                </div>
              ) : Object.keys(filteredConversationGroups).length === 0 ? (
                <>
                  {hasDraftConversation && (
                    <button className="draft-conversation-card" onClick={resumeDraftConversation}>
                      <span className="draft-conversation-kicker">Conversa em andamento</span>
                      <strong>{draftPreview}</strong>
                      <small>
                        {draftStartedAt
                          ? new Date(draftStartedAt).toLocaleString("pt-BR")
                          : "Retome de onde parou"}
                      </small>
                    </button>
                  )}
                  <p className="no-conversations-message">
                    {searchTerm
                      ? "Nenhuma conversa encontrada para essa busca."
                      : "Você ainda não teve nenhuma conversa salva.\nInteraja com o AutBot para começar!"}
                  </p>
                </>
              ) : (
                <div className="history-list-groups">
                  {hasDraftConversation && (
                    <button className="draft-conversation-card" onClick={resumeDraftConversation}>
                      <span className="draft-conversation-kicker">Conversa em andamento</span>
                      <strong>{draftPreview}</strong>
                      <small>
                        {draftStartedAt
                          ? new Date(draftStartedAt).toLocaleString("pt-BR")
                          : "Retome de onde parou"}
                      </small>
                    </button>
                  )}

                  {Object.keys(filteredConversationGroups).map((groupName) => (
                    <div key={groupName} className="history-group">
                      <h3 className="history-group-title">{groupName}</h3>
                      <div className="history-group-items">
                        {filteredConversationGroups[groupName].map((conv) => (
                          <HistoryListItem
                            key={conv.id}
                            conversation={conv}
                            onSelect={setSelectedConversationId}
                            isSelected={conv.id === selectedConversationId}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <div className="main-chat">
          <section className="chat-header" aria-label="Seção de chat">
            {currentView === "chat" ? <div>Nova conversa</div> : <div>Histórico de Conversas</div>}
          </section>

          <main className="chat-body">
            {currentView === "chat" ? (
              <>
                <div className="chat-messages-live">
                  {activeChatMessages.length === 0 && !isTyping ? (
                    <div className="empty-chat-container">
                      <div className="chat-card">
                        <h2>Em que a {assistantName} pode ajudar?</h2>
                        <p>
                          Comece uma nova conversa ou volte para uma conversa já salva no histórico.
                        </p>
                      </div>
                      <FrequentlyAskedQuestions onQuestionClick={handleFaqQuestionSelect} />
                    </div>
                  ) : (
                    <>
                      {activeChatMessages.map((message, index) => (
                        <div key={index} className={`chat-bubble ${message.author}`}>
                          <p className="message-text">{message.text}</p>
                         <div className="message-footer">
                           <span className="message-time">
                             {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                               hour: "2-digit",
                               minute: "2-digit",
                             })}
                           </span>
                           <MessageToolbar
                             messageId={message.id}
                             messageText={message.text}
                             onGoToHistory={handleGoToHistoryMessage}
                           />
                         </div>
                       </div>
                     ))}

                      {isTyping && botStreamingMessage && (
                        <div className="chat-bubble autbot">
                          <StreamingMessage message={botStreamingMessage} onComplete={() => {}} />
                        </div>
                      )}

                      {isTyping && !botStreamingMessage && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="chat-input-container">
                  <input
                    type="text"
                    placeholder="Escreva sua mensagem aqui..."
                    value={currentMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                  />
                  <button
                    type="button"
                    className="send-button"
                    onClick={handleSendMessage}
                    title="Enviar mensagem"
                    aria-label="Enviar mensagem"
                    disabled={isTyping || currentMessage.trim() === ""}
                  >
                    {isTyping ? <div className="loading-spinner" /> : <FaPaperPlane />}
                  </button>
                </div>

                {socketError && (
                  <div className="chat-inline-error" role="status">
                    {socketError}
                  </div>
                )}

                {footerText && (
                  <div className={`brand-footer brand-footer-${brand}`}>
                    <a
                      href="https://github.com/App-AutBot/autBot-frontend"
                      target="_blank"
                      rel="noreferrer"
                      className="brand-footer-link"
                    >
                      <img src="/AutBot_Logo.png" alt="AutBot" className="brand-footer-icon" />
                      <span>{footerText}</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="history-return-banner">
                  <button type="button" className="history-return-button" aria-label="Voltar para interação atual" onClick={resumeDraftConversation}>
                    Voltar para interação atual
                  </button>
                  <p>
                    {currentMessage.trim()
                      ? `Texto atual: "${currentMessage.trim()}"`
                      : activeChatMessages.find((message) => message.author === "user")?.text
                        ? `Última mensagem em andamento: "${activeChatMessages.find((message) => message.author === "user")?.text}"`
                        : "Retome a interação atual quando quiser continuar escrevendo."}
                  </p>
                </div>
                <ConversationDetailView conversation={selectedConversation ?? null} />
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Chat;
