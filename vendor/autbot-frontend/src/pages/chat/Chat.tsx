import { useEffect, useState, useRef } from "react";
import "./Chat.css";
import { FaPaperPlane } from "react-icons/fa";
import { IoMdSearch, IoMdChatboxes } from "react-icons/io";
import { useHistoryData } from "../../hooks/useHistoryData";
import HistoryListItem from "../../components/historico/HistoryListItem";
import FrequentlyAskedQuestions from "../../components/faq/FrequentlyAskedQuestions";
import ConversationDetailView from "../../components/historico/ConversationDetailView";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { StreamingMessage } from "../../components/chat/StreamingMessage";
import { TypingIndicator } from "../../components/chat/TypingIndicator";
import { fetchUserData } from "../../service/User";
import { useBrand } from "../../contexts/BrandContext";

interface ActiveConversationMessage {
  id: string;
  author: "user" | "autbot";
  text: string;
  timestamp: string;
}

const Chat = () => {
  const chatStorageKey = `titia-chat-live-${localStorage.getItem("id") ?? "anonymous"}`;
  const tabStorageKey = `titia-chat-tab-${localStorage.getItem("id") ?? "anonymous"}`;
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [activeChatMessages, setActiveChatMessages] = useState<
    ActiveConversationMessage[]
  >([]);

  const [currentView, setCurrentView] = useState<"chat" | "history">(
    () => (localStorage.getItem(tabStorageKey) === "history" ? "history" : "chat")
  );

  const {
    loading: historyLoading,
    error: historyError,
    selectedConversationId,
    setSelectedConversationId,
    groupedConversations,
    selectedConversation,
  } = useHistoryData();

  const [isTyping, setIsTyping] = useState(false);
  const [botStreamingMessage, setBotStreamingMessage] = useState<string>("");
  const [userType, setUserType] = useState<string>("");
  const [socketError, setSocketError] = useState<string>("");
  const { assistantName, footerText, brand } = useBrand();

  const socketRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authToken = localStorage.getItem("authToken") ?? "";
  const userId = localStorage.getItem("id") ?? "";

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(chatStorageKey);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          setActiveChatMessages(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar mensagens salvas:", error);
    }
  }, [chatStorageKey]);

  useEffect(() => {
    localStorage.setItem(chatStorageKey, JSON.stringify(activeChatMessages));
  }, [activeChatMessages, chatStorageKey]);

  useEffect(() => {
    localStorage.setItem(tabStorageKey, currentView);
  }, [currentView, tabStorageKey]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages, botStreamingMessage]);

  const connectWebSocket = () => {
    if (!authToken) {
      console.error("Token não encontrado no localStorage");
      setSocketError("Sua sessão da TitiA não está pronta para conversar.");
      return;
    }

    let apiUrl = import.meta.env.VITE_API_URL || "";
    if (apiUrl.endsWith("/api")) {
      apiUrl = apiUrl.slice(0, -4);
    }
    const wsUrl = apiUrl.replace(/^http/, "ws");

    const ws = new WebSocket(
      `${wsUrl}/ws?token=${encodeURIComponent(authToken)}`
    );

    ws.onopen = () => {
      console.log("WebSocket conectado!");
      hasConnectedRef.current = true;
      setIsTyping(false);
      setSocketError("");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("Mensagem recebida do WS:", data);

        if (data.type === "partial") {
          setBotStreamingMessage((prev) => prev + data.content);
          setIsTyping(true);
        } else if (data.type === "complete") {
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
        } else if (data.role === "assistant" && data.content) {
          const contentWithoutStars = data.content.replace(/\*\*/g, "");

          const botMessage: ActiveConversationMessage = {
            id: Date.now().toString(),
            author: "autbot",
            text: contentWithoutStars,
            timestamp: new Date().toISOString(),
          };
          setActiveChatMessages((prev) => [...prev, botMessage]);
          setBotStreamingMessage("");
          setIsTyping(false);
        } else if (data.error) {
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
      console.log("WebSocket desconectado.");
      setIsTyping(false);
      setBotStreamingMessage("");
      if (hasConnectedRef.current) {
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

    const messagePayload = {
      userId,
      pergunta: userMessage.text,
      publico: userType,
    };

    console.log("Enviando mensagem:", messagePayload);

    socketRef.current.send(JSON.stringify(messagePayload));

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
    if (
      !selectedConversationId &&
      Object.keys(groupedConversations).length > 0
    ) {
      setSelectedConversationId(Object.values(groupedConversations)[0][0].id);
    }
  };

  const handleFaqQuestionSelect = (question: string) => {
    setCurrentMessage(question);
  };

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
            <button title="criar um novo chat" className="send-button">
              <IoMdChatboxes />
            </button>
          </div>

          {currentView === "chat" ? (
            <div className="conversations-list">
              <p className="no-conversations-message">
                Inicie uma nova conversa para que ela apareça aqui.
              </p>
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
              ) : Object.keys(groupedConversations).length === 0 ? (
                <p className="no-conversations-message">
                  Você ainda não teve nenhuma conversa salva.
                  <br />
                  Interaja com o AutBot para começar!
                </p>
              ) : (
                <div className="history-list-groups">
                  {Object.keys(groupedConversations).map((groupName) => (
                    <div key={groupName} className="history-group">
                      <h3 className="history-group-title">{groupName}</h3>
                      <div className="history-group-items">
                        {groupedConversations[groupName].map((conv) => (
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
          <header className="chat-header">
            {currentView === "chat" ? (
              <div>Chat Ativo</div>
            ) : (
              <div>Histórico de Conversas</div>
            )}
          </header>

          <main className="chat-body">
            {currentView === "chat" ? (
              <>
                <div className="chat-messages-live">
                  {activeChatMessages.length === 0 && !isTyping ? (
                    <div className="empty-chat-container">
                      <FrequentlyAskedQuestions
                        onQuestionClick={handleFaqQuestionSelect}
                      />
                      <div className="chat-card">
                        <h2>Em que a {assistantName} pode ajudar?</h2>
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeChatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`chat-bubble ${message.author}`}
                        >
                          <p className="message-text">{message.text}</p>
                          <span className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      ))}

                      {isTyping && botStreamingMessage && (
                        <div className="chat-bubble autbot">
                          <StreamingMessage
                            message={botStreamingMessage}
                            onComplete={() => {}}
                          />
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
                    {isTyping ? (
                      <div className="loading-spinner" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </div>
                {socketError && (
                  <div className="chat-inline-error" role="status">
                    {socketError}
                  </div>
                )}
                {footerText && (
                  <div className={`brand-footer brand-footer-${brand}`}>
                    <img src="/AutBot_Logo.png" alt="AutBot" className="h-4 w-4" />
                    <span>{footerText}</span>
                  </div>
                )}
              </>
            ) : (
              <ConversationDetailView
                conversation={selectedConversation ?? null}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Chat;
