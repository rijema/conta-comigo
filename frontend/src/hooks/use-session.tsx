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

type ActivityLifecycleEventType =
  | "ACTIVITY_PRESENTED"
  | "ACTIVITY_STARTED"
  | "HINT_REQUESTED"
  | "TUTORIAL_OPENED"
  | "INSTRUCTION_REPLAYED"
  | "ACTIVITY_SKIPPED";

interface ActivityInteractionCounters {
  activityId: string | null;
  attempts: number;
  hints: number;
  tutorialOpens: number;
}

interface SkipContext {
  timeBeforeSkipMs: number;
  attemptsBeforeSkip: number;
  hintsBeforeSkip: number;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activitiesCompletedRef = useRef(0);
  const startedRef = useRef(false);
  const trackedLifecycleEventsRef = useRef(new Set<string>());
  const interactionCountersRef = useRef<ActivityInteractionCounters>({
    activityId: null,
    attempts: 0,
    hints: 0,
    tutorialOpens: 0,
  });

  const getInteractionCounters = useCallback((activityId: string) => {
    if (interactionCountersRef.current.activityId !== activityId) {
      interactionCountersRef.current = {
        activityId,
        attempts: 0,
        hints: 0,
        tutorialOpens: 0,
      };
    }
    return interactionCountersRef.current;
  }, []);

  const trackActivityLifecycle = useCallback((
    sessionId: string,
    activityId: string,
    eventType: ActivityLifecycleEventType,
    context?: Partial<SkipContext>,
  ) => {
    const isRenderTransition = eventType === "ACTIVITY_PRESENTED" || eventType === "ACTIVITY_STARTED";
    if (isRenderTransition) {
      const eventKey = `${sessionId}:${activityId}:${eventType}`;
      if (trackedLifecycleEventsRef.current.has(eventKey)) return;
      trackedLifecycleEventsRef.current.add(eventKey);
    }

    const token = authService.getStoredToken();
    void api.post(
      `/activities/${activityId}/lifecycle-events`,
      { sessionId, eventType, ...context },
      token ?? undefined,
    ).catch((err) => {
      console.error(`Failed to track ${eventType}:`, err);
    });
  }, []);

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
      trackActivityLifecycle(sessionId, activity.id, "ACTIVITY_PRESENTED");
      getInteractionCounters(activity.id);
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(err?.message ?? "Erro ao carregar atividade");
      startedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [getInteractionCounters, trackActivityLifecycle]);

  const markActivityStarted = useCallback((activityId: string) => {
    if (!session?.id) return;
    trackActivityLifecycle(session.id, activityId, "ACTIVITY_STARTED");
  }, [session?.id, trackActivityLifecycle]);

  const requestActivityHelp = useCallback((activityId: string) => {
    if (!session?.id) return;
    const counters = getInteractionCounters(activityId);
    const isReplay = counters.tutorialOpens > 0;
    counters.hints += 1;
    counters.tutorialOpens += 1;

    trackActivityLifecycle(session.id, activityId, "HINT_REQUESTED");
    trackActivityLifecycle(session.id, activityId, "TUTORIAL_OPENED");
    if (isReplay) {
      trackActivityLifecycle(session.id, activityId, "INSTRUCTION_REPLAYED");
    }
  }, [getInteractionCounters, session?.id, trackActivityLifecycle]);

  const skipCurrentActivity = useCallback(() => {
    if (!session?.id || !session.currentActivity?.id) return;
    const activityId = session.currentActivity.id;
    const counters = getInteractionCounters(activityId);
    trackActivityLifecycle(session.id, activityId, "ACTIVITY_SKIPPED", {
      timeBeforeSkipMs: Math.max(0, Date.now() - session.activityStartTime),
      attemptsBeforeSkip: counters.attempts,
      hintsBeforeSkip: counters.hints,
    });
  }, [getInteractionCounters, session, trackActivityLifecycle]);

  const submitAnswer = async (payload: {
    activityId: string;
    answer: any;
    timeSpentMs: number;
  }) => {
    const token = authService.getStoredToken();
    getInteractionCounters(payload.activityId).attempts += 1;
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
          responseTimeMs: payload.timeSpentMs,
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
        if (nextActivity && session?.id) {
          trackActivityLifecycle(session.id, nextActivity.id, "ACTIVITY_PRESENTED");
          getInteractionCounters(nextActivity.id);
        }
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
    trackedLifecycleEventsRef.current.clear();
    interactionCountersRef.current = {
      activityId: null,
      attempts: 0,
      hints: 0,
      tutorialOpens: 0,
    };
    setSession(null);
    activitiesCompletedRef.current = 0;
  }, []);

  return {
    session,
    startSession,
    stopSession,
    submitAnswer,
    markActivityStarted,
    requestActivityHelp,
    skipCurrentActivity,
    isLoading,
    error,
  };
}
