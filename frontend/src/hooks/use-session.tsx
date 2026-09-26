"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { setCurrentLearningSessionId } from "@/lib/learning-session";

export interface SessionState {
  id: string;
  currentActivity: any | null;
  progress: number;
  activityStartTime: number;
  recommendationExplanation: string | null;
  currentRecommendationId: string | null;
  previousDifficulty?: string | null;
  selectionSource: "recommended" | "recalculated";
  roundStats?: { correctAnswers: number; starsEarned: number; practiceLabel: string };
}

const SESSION_STORAGE_KEY = "contacomigo.learning-session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type ActivityLifecycleEventType =
  | "ACTIVITY_PRESENTED"
  | "ACTIVITY_STARTED"
  | "HINT_REQUESTED"
  | "TUTORIAL_OPENED"
  | "INSTRUCTION_REPLAYED"
  | "ACTIVITY_SKIPPED"
  | "ACTIVITY_ABANDONED";

interface ActivityInteractionCounters {
  activityId: string | null;
  attempts: number;
  hints: number;
  tutorialOpens: number;
  firstInteractionAt: number | null;
  lastAttemptAt: number | null;
}

interface SkipContext {
  timeBeforeSkipMs: number;
  attemptsBeforeSkip: number;
  hintsBeforeSkip: number;
  timeBeforeExitMs: number;
  attemptsBeforeExit: number;
  hintsBeforeExit: number;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangingActivity, setIsChangingActivity] = useState(false);
  const activitiesCompletedRef = useRef(0);
  const startedRef = useRef(false);
  const trackedLifecycleEventsRef = useRef(new Set<string>());
  const interactionCountersRef = useRef<ActivityInteractionCounters>({
    activityId: null,
    attempts: 0,
    hints: 0,
    tutorialOpens: 0,
    firstInteractionAt: null,
    lastAttemptAt: null,
  });
  const studentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session || !studentIdRef.current) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      studentId: studentIdRef.current,
      expiresAt: Date.now() + SESSION_TTL_MS,
      session,
    }));
  }, [session]);

  const getInteractionCounters = useCallback((activityId: string) => {
    if (interactionCountersRef.current.activityId !== activityId) {
      interactionCountersRef.current = {
        activityId,
        attempts: 0,
        hints: 0,
        tutorialOpens: 0,
        firstInteractionAt: null,
        lastAttemptAt: null,
      };
    }
    return interactionCountersRef.current;
  }, []);

  const logBlockChange = useCallback((
    label: string,
    payload: {
      sessionId: string;
      currentActivityId?: string | null;
      nextActivityId?: string | null;
      currentRecommendationId?: string | null;
      selected?: {
        activityId: string | null;
        structureId?: string | null;
        activityType?: string | null;
        learningNeed?: number | null;
        challengeFit?: number | null;
        interactionFit?: number | null;
        semanticFit?: number | null;
        novelty?: number | null;
        rejectionRisk?: number | null;
        progressDerivative?: number | null;
        performanceIntegral?: number | null;
        dominanceNormalization?: number | null;
        finalScore?: number | null;
      } | null;
      topCandidates?: Array<{
        activityId: string | null;
        structureId?: string | null;
        activityType?: string | null;
        finalScore?: number | null;
      }>;
      recentActivityIds?: string[];
      repeatedStructure?: boolean;
      repeatedType?: boolean;
      repeatedNiche?: boolean;
    },
  ) => {
    console.log(`[sequence:${label}]`, {
      sessionId: payload.sessionId,
      currentActivityId: payload.currentActivityId ?? null,
      nextActivityId: payload.nextActivityId ?? null,
      currentRecommendationId: payload.currentRecommendationId ?? null,
      selected: payload.selected ?? null,
      topCandidates: payload.topCandidates ?? [],
      recentActivityIds: payload.recentActivityIds ?? [],
      repeatedStructure: payload.repeatedStructure ?? false,
      repeatedType: payload.repeatedType ?? false,
      repeatedNiche: payload.repeatedNiche ?? false,
    });
  }, []);

  const trackActivityLifecycle = useCallback((
    sessionId: string,
    activityId: string,
    eventType: ActivityLifecycleEventType,
    context?: Partial<SkipContext>,
    recommendationId?: string | null,
  ) => {
    const isRenderTransition = eventType === "ACTIVITY_PRESENTED" || eventType === "ACTIVITY_STARTED";
    if (isRenderTransition) {
      const eventKey = `${sessionId}:${activityId}:${eventType}`;
      if (trackedLifecycleEventsRef.current.has(eventKey)) return;
      trackedLifecycleEventsRef.current.add(eventKey);
    }

    const token = authService.getStoredToken();
    const lifecyclePayload = { sessionId, eventType, ...context };
    void api.post(
      `/activities/${activityId}/lifecycle-events`,
      { ...lifecyclePayload, recommendationId: recommendationId ?? undefined },
      token ?? undefined,
    ).catch((err) => {
      console.error(`Failed to track ${eventType}:`, err);
    });
  }, []);

  const trackSessionEvent = useCallback((sessionId: string, eventType: "SESSION_STARTED" | "SESSION_COMPLETED") => {
    void api.post("/learning-events/session", { sessionId, eventType }, authService.getStoredToken() ?? undefined)
      .catch((err) => console.error(`Failed to track ${eventType}:`, err));
  }, []);

  const startSession = useCallback(async (studentId: string) => {
    if (startedRef.current) return;
    const token = authService.getStoredToken();
    if (!token) return; // wait until token is available
    startedRef.current = true;
    studentIdRef.current = String(studentId);
    setIsLoading(true);
    setError(null);
    try {
      const persisted = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (persisted) {
        try {
          const saved = JSON.parse(persisted) as { studentId: string; expiresAt: number; session: SessionState };
          if (saved.studentId === String(studentId) && saved.expiresAt > Date.now() && saved.session?.currentActivity?.id) {
            setCurrentLearningSessionId(saved.session.id);
            setSession(saved.session);
            activitiesCompletedRef.current = Math.floor(saved.session.progress / 10);
            trackedLifecycleEventsRef.current.add(`${saved.session.id}:${saved.session.currentActivity.id}:ACTIVITY_PRESENTED`);
            trackedLifecycleEventsRef.current.add(`${saved.session.id}:${saved.session.currentActivity.id}:ACTIVITY_STARTED`);
            getInteractionCounters(saved.session.currentActivity.id);
            return;
          }
        } catch { /* discard malformed local state below */ }
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      const sessionId = `session-${Date.now()}`;
      setCurrentLearningSessionId(sessionId);
      const { activity, adeDecision } = await api.get<{ activity: any; adeDecision: any }>(
        "/activities/next",
        token,
      );
      trackSessionEvent(sessionId, "SESSION_STARTED");
      setSession({
        id: sessionId,
        currentActivity: activity,
        progress: 0,
        activityStartTime: Date.now(),
        recommendationExplanation: adeDecision?.childExplanation ?? null,
        currentRecommendationId: adeDecision?.id ?? null,
        previousDifficulty: null,
        selectionSource: "recommended",
        roundStats: { correctAnswers: 0, starsEarned: 0, practiceLabel: "matemática" },
      });
      trackActivityLifecycle(sessionId, activity.id, "ACTIVITY_PRESENTED", undefined, adeDecision?.id);
      getInteractionCounters(activity.id);
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(err?.message ?? "Erro ao carregar atividade");
      startedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [getInteractionCounters, trackActivityLifecycle, trackSessionEvent]);

  const recordFirstInteraction = useCallback((activityId: string) => {
    const counters = getInteractionCounters(activityId);
    counters.firstInteractionAt ??= Date.now();
  }, [getInteractionCounters]);

  const markActivityStarted = useCallback((activityId: string) => {
    if (!session?.id) return;
    trackActivityLifecycle(session.id, activityId, "ACTIVITY_STARTED", undefined, session.currentRecommendationId);
  }, [session?.id, session?.currentRecommendationId, trackActivityLifecycle]);

  const requestActivityHelp = useCallback((activityId: string) => {
    if (!session?.id) return;
    const counters = getInteractionCounters(activityId);
    const isReplay = counters.tutorialOpens > 0;
    counters.hints += 1;
    counters.tutorialOpens += 1;

    trackActivityLifecycle(session.id, activityId, "HINT_REQUESTED", undefined, session.currentRecommendationId);
    trackActivityLifecycle(session.id, activityId, "TUTORIAL_OPENED", undefined, session.currentRecommendationId);
    if (isReplay) {
      trackActivityLifecycle(session.id, activityId, "INSTRUCTION_REPLAYED", undefined, session.currentRecommendationId);
    }
  }, [getInteractionCounters, session?.id, session?.currentRecommendationId, trackActivityLifecycle]);

  const requestHint = useCallback((activityId: string) => {
    if (!session?.id) return;
    getInteractionCounters(activityId).hints += 1;
    trackActivityLifecycle(session.id, activityId, "HINT_REQUESTED", undefined, session.currentRecommendationId);
  }, [getInteractionCounters, session?.id, session?.currentRecommendationId, trackActivityLifecycle]);

  const skipCurrentActivity = useCallback(() => {
    if (!session?.id || !session.currentActivity?.id) return;
    const activityId = session.currentActivity.id;
    const counters = getInteractionCounters(activityId);
    trackActivityLifecycle(session.id, activityId, "ACTIVITY_SKIPPED", {
      timeBeforeSkipMs: Math.max(0, Date.now() - session.activityStartTime),
      attemptsBeforeSkip: counters.attempts,
      hintsBeforeSkip: counters.hints,
    }, session.currentRecommendationId);
  }, [getInteractionCounters, session, trackActivityLifecycle]);

  const abandonCurrentActivity = useCallback(() => {
    if (!session?.id || !session.currentActivity?.id || session.progress >= 100) return;
    const activityId = session.currentActivity.id;
    const counters = getInteractionCounters(activityId);
    trackActivityLifecycle(session.id, activityId, "ACTIVITY_ABANDONED", {
      timeBeforeExitMs: Math.max(0, Date.now() - session.activityStartTime),
      attemptsBeforeExit: counters.attempts,
      hintsBeforeExit: counters.hints,
    }, session.currentRecommendationId);
  }, [getInteractionCounters, session, trackActivityLifecycle]);

  const changeCurrentActivity = useCallback(async () => {
    if (!session?.currentActivity?.id || !session.currentRecommendationId || isChangingActivity) return false;
    // [INTEGRATION 3C-FINAL]: Disable "Quero outro" during active review
    if (session.currentActivity?.reviewAssignmentId) {
      console.warn('Cannot change activity during active review');
      return false;
    }
    const token = authService.getStoredToken();
    if (!token) return false;
    const counters = getInteractionCounters(session.currentActivity.id);
    setIsChangingActivity(true);
    try {
      const result = await api.post<{ activity: any; adeDecision: any }>(
        "/activities/change",
        {
          currentActivityId: session.currentActivity.id,
          recommendationId: session.currentRecommendationId,
          sessionId: session.id,
          timeBeforeSkipMs: Math.max(0, Date.now() - session.activityStartTime),
          attemptsBeforeSkip: counters.attempts,
          hintsBeforeSkip: counters.hints,
        },
        token,
      );
      logBlockChange("change", {
        sessionId: session.id,
        currentActivityId: session.currentActivity.id,
        nextActivityId: result.activity.id,
        currentRecommendationId: session.currentRecommendationId,
        selected: {
          activityId: result.activity.id,
          structureId: result.activity?.content?.semantic?.structureId ?? null,
          activityType: result.activity?.type ?? null,
        },
        topCandidates: [],
        recentActivityIds: [],
      });
      trackActivityLifecycle(
        session.id,
        result.activity.id,
        "ACTIVITY_PRESENTED",
        undefined,
        result.adeDecision?.id,
      );
      getInteractionCounters(result.activity.id);
      setSession((previous) => previous ? {
        ...previous,
        currentActivity: result.activity,
        currentRecommendationId: result.adeDecision?.id ?? null,
        previousDifficulty: previous.currentActivity?.difficulty ?? null,
        recommendationExplanation: result.adeDecision?.childExplanation ?? previous.recommendationExplanation,
        activityStartTime: Date.now(),
        selectionSource: "recalculated",
      } : previous);
      return true;
    } catch (changeError) {
      console.error("Failed to change activity:", changeError);
      return false;
    } finally {
      setIsChangingActivity(false);
    }
  }, [getInteractionCounters, isChangingActivity, session, trackActivityLifecycle, logBlockChange]);

  const submitAnswer = async (payload: {
    activityId: string;
    answer: any;
    timeSpentMs: number;
  }) => {
    const token = authService.getStoredToken();
    const counters = getInteractionCounters(payload.activityId);
    const answerAt = Date.now();
    counters.firstInteractionAt ??= answerAt;
    counters.attempts += 1;
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
          responseTimeMs: Math.max(0, answerAt - (counters.lastAttemptAt ?? session?.activityStartTime ?? answerAt)),
          firstInteractionMs: Math.max(0, counters.firstInteractionAt - (session?.activityStartTime ?? counters.firstInteractionAt)),
          totalTimeMs: payload.timeSpentMs,
          hintsUsed: counters.hints,
          sessionId: session?.id,
          recommendationId: session?.currentRecommendationId ?? undefined,
          adeDecisionContext: session?.currentRecommendationId ? { decisionId: session.currentRecommendationId } : undefined,
          previousDifficulty: session?.previousDifficulty ?? undefined,
          // [INTEGRATION 3C-FINAL]: Include review context if this is a review activity
          ...(session?.currentActivity?.reviewAssignmentId && { reviewAssignmentId: session.currentActivity.reviewAssignmentId }),
          ...(session?.currentActivity?.islandId && { islandId: session.currentActivity.islandId }),
          ...(session?.currentActivity?.cycleNumber !== undefined && { cycleNumber: session.currentActivity.cycleNumber }),
        },
        token ?? undefined,
      );

      const isCorrect = result.attempt?.isCorrect ?? false;
      counters.lastAttemptAt = answerAt;

      if (isCorrect) {
        activitiesCompletedRef.current += 1;
        const completed = activitiesCompletedRef.current;
        const roundComplete = completed >= 10;
        if (roundComplete && session?.id) trackSessionEvent(session.id, "SESSION_COMPLETED");
        const nextActivity = result.nextActivity ?? null;
        if (!roundComplete && nextActivity && session?.id) {
          logBlockChange("submit", {
            sessionId: session.id,
            currentActivityId: payload.activityId,
            nextActivityId: nextActivity.id,
            currentRecommendationId: session.currentRecommendationId,
            selected: {
              activityId: nextActivity.id,
              structureId: nextActivity?.content?.semantic?.structureId ?? null,
              activityType: nextActivity?.type ?? null,
            },
            recentActivityIds: [payload.activityId],
          });
          trackActivityLifecycle(
            session.id,
            nextActivity.id,
            "ACTIVITY_PRESENTED",
            undefined,
            result.adeDecision?.id,
          );
          getInteractionCounters(nextActivity.id);
        }
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentActivity: roundComplete ? prev.currentActivity : nextActivity ?? prev.currentActivity,
            progress: Math.min(completed * 10, 100),
            activityStartTime: roundComplete ? prev.activityStartTime : Date.now(),
            recommendationExplanation:
              roundComplete ? prev.recommendationExplanation : result.adeDecision?.childExplanation ?? prev.recommendationExplanation,
            currentRecommendationId: roundComplete ? prev.currentRecommendationId : result.adeDecision?.id ?? null,
            previousDifficulty: roundComplete ? prev.previousDifficulty : prev.currentActivity?.difficulty ?? null,
            selectionSource: "recommended",
            roundStats: {
              correctAnswers: (prev.roundStats?.correctAnswers ?? completed - 1) + 1,
              starsEarned: (prev.roundStats?.starsEarned ?? completed - 1) + 1,
              practiceLabel: String(prev.currentActivity.content?.formatLabel ?? prev.currentActivity.title ?? "matemática"),
            },
          };
        });
      }

      return { isCorrect, completed: isCorrect && activitiesCompletedRef.current >= 10, feedback: result.feedback };
    } catch (err) {
      console.error("Failed to submit answer:", err);
      return { isCorrect: false, completed: false, feedback: null };
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
      firstInteractionAt: null,
      lastAttemptAt: null,
    };
    setSession(null);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    studentIdRef.current = null;
    activitiesCompletedRef.current = 0;
  }, []);

  return {
    session,
    startSession,
    stopSession,
    submitAnswer,
    markActivityStarted,
    requestActivityHelp,
    requestHint,
    skipCurrentActivity,
    abandonCurrentActivity,
    recordFirstInteraction,
    changeCurrentActivity,
    isChangingActivity,
    isLoading,
    error,
  };
}
