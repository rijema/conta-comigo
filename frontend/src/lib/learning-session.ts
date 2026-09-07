export const LEARNING_SESSION_STORAGE_KEY = "contacomigo.learning-session-id";

export function setCurrentLearningSessionId(sessionId: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(LEARNING_SESSION_STORAGE_KEY, sessionId);
  }
}

export function getOrCreateLearningSessionId(): string {
  const current = window.sessionStorage.getItem(LEARNING_SESSION_STORAGE_KEY);
  if (current) return current;
  const sessionId = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  setCurrentLearningSessionId(sessionId);
  return sessionId;
}
