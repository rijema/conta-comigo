"use client";

import { useState } from "react";

export interface SessionState {
  id: string;
  currentActivity: any | null;
  progress: number;
  activityStartTime: number;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startSession = async () => {
    setIsLoading(true);
    // Simulação de início de sessão
    setTimeout(() => {
      setSession({
        id: "session-123",
        currentActivity: {
          id: "act-1",
          bnccSkillCode: "EF01MA01",
          type: "counting",
          question: "Conte as maçãs",
          options: [1, 2, 3, 4],
          correctAnswer: 3,
        },
        progress: 0,
        activityStartTime: Date.now(),
      });
      setIsLoading(false);
    }, 1000);
  };

  const submitAnswer = async (payload: { activityId: string; answer: any; timeSpentMs: number }) => {
    // Simulação de submissão
    const isCorrect = true; // Hardcoded para o stub
    if (isCorrect && session) {
      setSession({
        ...session,
        progress: Math.min(session.progress + 20, 100),
        activityStartTime: Date.now(),
      });
    }
    return { isCorrect };
  };

  return {
    session,
    startSession,
    submitAnswer,
    isLoading,
  };
}
