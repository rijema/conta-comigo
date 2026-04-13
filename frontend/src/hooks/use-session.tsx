"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";

export interface SessionState {
  id: string;
  currentActivity: any | null;
  progress: number;
  activityStartTime: number;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (startedRef.current) return;
    const token = authService.getStoredToken();
    if (!token) return; // wait until token is available
    startedRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = `session-${Date.now()}`;
      const { activity } = await api.get<{ activity: any; adeDecision: any }>(
        "/activities/next",
        token,
      );
      setSession({
        id: sessionId,
        currentActivity: activity,
        progress: 0,
        activityStartTime: Date.now(),
      });
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(err?.message ?? "Erro ao carregar atividade");
      startedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = async (payload: {
    activityId: string;
    answer: any;
    timeSpentMs: number;
  }) => {
    const token = authService.getStoredToken();
    try {
      const rawAnswer = payload.answer;
      const normalizedAnswer =
        rawAnswer?.arrangement ??
        rawAnswer?.selectedOption ??
        rawAnswer?.count ??
        rawAnswer;

      const result = await api.post<{ attempt: any; feedback: any; nextActivity?: any }>(
        "/activities/attempts",
        {
          activityId: payload.activityId,
          answer: normalizedAnswer,
          timeSpentSeconds: Math.round(payload.timeSpentMs / 1000),
          sessionId: session?.id,
        },
        token ?? undefined,
      );

      const completed = activitiesCompleted + 1;
      setActivitiesCompleted(completed);

      if (session) {
        const nextActivity = result.nextActivity ?? null;
        setSession({
          ...session,
          currentActivity: nextActivity ?? session.currentActivity,
          progress: Math.min(completed * 10, 100),
          activityStartTime: Date.now(),
        });
      }

      return { isCorrect: result.attempt.isCorrect, feedback: result.feedback };
    } catch (err) {
      console.error("Failed to submit answer:", err);
      return { isCorrect: false, feedback: null };
    }
  };

  return {
    session,
    startSession,
    submitAnswer,
    isLoading,
    error,
  };
}
