import { FaRobot } from "react-icons/fa";
import styles from "./TypingIndicator.module.css";

export const TypingIndicator = () => (
  <div className="chat-bubble autbot thinking">
    <FaRobot className="icon" />
    <span className={styles.typingIndicator}>
      <span></span><span></span><span></span>
    </span>
  </div>
);
