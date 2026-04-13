"use client";

import { useState } from "react";
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
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);

  const startSession = async () => {
    setIsLoading(true);
    try {
      const token = authService.getStoredToken();
      const sessionId = `session-${Date.now()}`;
      const { activity } = await api.get<{ activity: any; adeDecision: any }>(
        "/activities/next",
        token ?? undefined,
      );
      setSession({
        id: sessionId,
        currentActivity: activity,
        progress: 0,
        activityStartTime: Date.now(),
      });
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (payload: {
    activityId: string;
    answer: any;
    timeSpentMs: number;
  }) => {
    const token = authService.getStoredToken();
    try {
      const result = await api.post<{ attempt: any; feedback: any; nextActivity?: any }>(
        "/activities/attempts",
        {
          activityId: payload.activityId,
          answer: payload.answer,
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
  };
}
