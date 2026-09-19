import { useEffect, useState } from "react";

interface StreamingMessageProps {
  message: string;
  speed?: number; 
  onComplete?: () => void;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  message,
  speed = 30,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + message.charAt(index));
      index++;

      if (index >= message.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [message, speed]);

  return (
    <div className="chat-bubble autbot">
      <span>{displayedText}</span>
    </div>
  );
};
