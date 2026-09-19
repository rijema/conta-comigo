import type { ConversationHistory } from '../../hooks/useHistoryData'; 

interface HistoryListItemProps {
    conversation: ConversationHistory;
    onSelect: (id: string) => void;
    isSelected: boolean;
}

const HistoryListItem: React.FC<HistoryListItemProps> = ({ conversation, onSelect, isSelected }) => {
    const formattedTime = new Date(conversation.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={`history-list-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(conversation.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(conversation.id);
                }
            }}
        >
            <div className="history-item-text-content">
                <span className="history-item-title-preview">{conversation.title}</span>
            </div>
            <span className="history-item-time">{formattedTime}</span>
        </div>
    );
};

export default HistoryListItem;