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
  const activitiesCompletedRef = useRef(0);
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
        rawAnswer?.selectedText ??
        rawAnswer?.selectedOption ??
        rawAnswer?.count ??
        rawAnswer;

      const result = await api.post<{ attempt: any; feedback: any; nextActivity?: any; adeDecision?: any }>(
        "/activities/attempts",
        {
          activityId: payload.activityId,
          answer: normalizedAnswer,
          timeSpentSeconds: Math.round(payload.timeSpentMs / 1000),
          sessionId: session?.id,
        },
        token ?? undefined,
      );

      const isCorrect = result.attempt?.isCorrect ?? false;

      // ADE / next activity debug log for DevTools Console
      if (result.adeDecision) {
        const ade = result.adeDecision;
        console.groupCollapsed(
          `%c🤖 ADE — próxima atividade via IA`,
          "color: #7c3aed; font-weight: bold; font-size: 13px"
        );
        console.log("📊 Dificuldade recomendada:", ade.recommendedDifficulty);
        console.log("🎨 Modalidade recomendada:", ade.recommendedModality);
        console.log("📚 Habilidade BNCC:", ade.recommendedBnccSkill);
        if (ade.xaiLog) {
          console.groupCollapsed("🔍 Raciocínio (XAI)");
          console.log("Resumo:", ade.xaiLog.finalReason);
          console.log("Confiança:", (ade.xaiLog.confidence * 100).toFixed(0) + "%");
          console.log("Ontologia — inferências:", ade.xaiLog.ontologyInferences);
          console.log("Regras disparadas:", ade.xaiLog.rulesFired);
          console.log("ML — mastery:", ade.xaiLog.mlPredictions?.masteryProbability?.toFixed(2),
            "| engagement:", ade.xaiLog.mlPredictions?.engagementScore?.toFixed(2),
            "| fallback ML?", ade.xaiLog.mlPredictions?.fallback ? "✅ sim" : "❌ não");
          console.groupEnd();
        }
        console.log("➡️ Próxima atividade:", result.nextActivity?.title ?? "(nenhuma)");
        console.groupEnd();
      } else if (result.nextActivity) {
        console.log(
          `%c🎲 Próxima atividade via FALLBACK aleatório: ${result.nextActivity.title}`,
          "color: #d97706; font-weight: bold"
        );
      } else {
        console.warn("⚠️ Nenhuma próxima atividade retornada pelo backend");
      }

      if (isCorrect) {
        activitiesCompletedRef.current += 1;
        const completed = activitiesCompletedRef.current;
        const nextActivity = result.nextActivity ?? null;
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentActivity: nextActivity ?? prev.currentActivity,
            progress: Math.min(completed * 10, 100),
            activityStartTime: Date.now(),
          };
        });
      }

      return { isCorrect, feedback: result.feedback };
    } catch (err) {
      console.error("Failed to submit answer:", err);
      return { isCorrect: false, feedback: null };
    }
  };

  const stopSession = useCallback(() => {
    startedRef.current = false;
    setSession(null);
    activitiesCompletedRef.current = 0;
  }, []);

  return {
    session,
    startSession,
    stopSession,
    submitAnswer,
    isLoading,
    error,
  };
}
