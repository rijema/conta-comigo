import React from 'react';
import { FaHistory, FaCopy, FaShare } from 'react-icons/fa';
import './MessageToolbar.css';

interface MessageToolbarProps {
  messageId: string;
  messageText: string;
  onGoToHistory?: (messageId: string) => void;
  onCopy?: (text: string) => void;
}

const MessageToolbar: React.FC<MessageToolbarProps> = ({
  messageId,
  messageText,
  onGoToHistory,
  onCopy,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    onCopy?.(messageText);
  };

  return (
    <div className="message-toolbar">
      <button
        className="toolbar-button copy-button"
        title="Copiar mensagem"
        onClick={handleCopy}
        aria-label="Copiar mensagem"
      >
        <FaCopy size={14} />
      </button>
      
      {onGoToHistory && (
        <button
          className="toolbar-button history-button"
          title="Ver no histórico"
          onClick={() => onGoToHistory(messageId)}
          aria-label="Ver mensagem no histórico"
        >
          <FaHistory size={14} />
        </button>
      )}
    </div>
  );
};

export default MessageToolbar;
