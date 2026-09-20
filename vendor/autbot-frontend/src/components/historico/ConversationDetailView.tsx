
import type { ConversationHistory } from '../../hooks/useHistoryData';
import { FaPaperPlane } from 'react-icons/fa'; 

interface ConversationDetailViewProps {
    conversation: ConversationHistory | null;
}

const ConversationDetailView: React.FC<ConversationDetailViewProps> = ({ conversation }) => {
    const conversationDate = conversation
        ? new Date(conversation.timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : null;

    return (
        <>
            {conversation ? (
                <div className="conversation-detail-view">
                    <div className="conversation-detail-header">
                        <div>
                            <span className="conversation-detail-kicker">Histórico salvo</span>
                            <h2>{conversation.title}</h2>
                        </div>
                        <span className="conversation-detail-date">{conversationDate}</span>
                    </div>
                    <div className="chat-messages-container">
                        {conversation.messages.map((message, index) => {
                            const messageTime = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                            return (
                                <div key={index} className={`chat-bubble ${message.author}`}>
                                    <p className="message-text">{message.text}</p>
                                    <span className="message-time">{messageTime}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chat-input-area-readonly">
                        <input type="text" placeholder="Esta conversa está salva no histórico." disabled />
                        <button disabled>
                            <FaPaperPlane /> {}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chat-area-placeholder">
                    Selecione uma conversa no histórico para visualizá-la.
                </div>
            )}
        </>
    );
};

export default ConversationDetailView;