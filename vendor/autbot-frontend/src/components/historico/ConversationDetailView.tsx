
import type { ConversationHistory } from '../../hooks/useHistoryData';

import { FaPaperPlane } from 'react-icons/fa'; 

interface ConversationDetailViewProps {
    conversation: ConversationHistory | null;
}

const ConversationDetailView: React.FC<ConversationDetailViewProps> = ({ conversation }) => {
    return (
        <>
            {conversation ? (
                <div className="conversation-detail-view">
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
                        <input type="text" placeholder="Esta é uma visualização de histórico..." disabled />
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