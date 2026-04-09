"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface ActivityAttemptPayload {
  activityId: string;
  sessionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  interactionSignals?: Record<string, unknown>;
}

interface ADEDecision {
  nextActivityId: string | null;
  difficultyAdjustment: string;
  modality: string;
  feedback: string;
  xaiExplanation: string;
}

export function useActivity() {
  const [submitting, setSubmitting] = useState(false);
  const [adeDecision, setAdeDecision] = useState<ADEDecision | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const getElapsedSeconds = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const submitAttempt = useCallback(
    async (payload: ActivityAttemptPayload) => {
      setSubmitting(true);
      try {
        const token = authService.getStoredToken();
        const result = await apiClient.post<{
          attempt: unknown;
          adeDecision: ADEDecision;
        }>("/sessions/attempt", payload, token ?? undefined);
        setAdeDecision(result.adeDecision);
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitting, adeDecision, startTimer, getElapsedSeconds, submitAttempt };
}