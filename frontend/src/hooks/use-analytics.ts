"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface AnalyticsSummary {
  totalSessions: number;
  totalActivities: number;
  averageScore: number;
  engagementIndex: number;
  streakDays: number;
  progressData: { date: string; score: number; activities: number }[];
  skillMastery: { skill: string; mastery: number; fullMark: number }[];
}

export function useAnalytics(childId?: string) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) return;

    const endpoint = childId
      ? `/analytics/child/${childId}/summary`
      : `/analytics/my-summary`;

    apiClient
      .get<AnalyticsSummary>(endpoint, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [childId]);

  return { data, loading, error };
}
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "@/components/charts/progress-chart";
import { SkillRadarChart } from "@/components/charts/skill-radar-chart";
import { useRouter } from "next/navigation";
import { masteryToPercent, scoreToLabel } from "@/lib/utils";

export default function LearnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: analytics, loading: analyticsLoading } = useAnalytics();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  return (
    <div className="min-h-screen bg-indigo-50 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <p className="text-indigo-200 text-sm">Bem-vindo de volta 👋</p>
          <h1 className="text-white text-2xl font-bold mt-1">{firstName}</h1>
          {analytics && (
            <div className="flex gap-3 mt-4">
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {analytics.streakDays}
                </p>
                <p className="text-indigo-200 text-xs">dias seguidos</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {analytics.totalActivities}
                </p>
                <p className="text-indigo-200 text-xs">atividades</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {Math.round((analytics.averageScore || 0) * 100)}%
                </p>
                <p className="text-indigo-200 text-xs">média</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4">
        {/* Start Activity CTA */}
        <Card className="bg-white shadow-lg">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-gray-800">Pronto para aprender?</p>
              <p className="text-sm text-gray-500">Continue de onde parou</p>
            </div>
            <Button
              onClick={() => router.push("/activity")}
              className="shrink-0"
            >
              🚀 Começar
            </Button>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Meu Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={analytics?.progressData || []} />
          </CardContent>
        </Card>

        {/* Skill Radar */}
        {analytics?.skillMastery && analytics.skillMastery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Habilidades BNCC</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillRadarChart data={analytics.skillMastery} />
            </CardContent>
          </Card>
        )}

        {/* Engagement Index */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Engajamento Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.round(analytics.engagementIndex * 100)}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={
                    analytics.engagementIndex >= 0.7
                      ? "success"
                      : analytics.engagementIndex >= 0.4
                      ? "warning"
                      : "error"
                  }
                >
                  {scoreToLabel(analytics.engagementIndex)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActivity } from "@/hooks/use-activity";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Activity {
  id: string;
  title: string;
  description: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "VISUAL_PUZZLE";
  content: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    imageUrl?: string;
    hint?: string;
    bnccSkill?: string;
  };
  difficultyLevel: number;
}

interface Session {
  id: string;
  currentActivityId: string;
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const { submitting, adeDecision, startTimer, getElapsedSeconds, submitAttempt } =
    useActivity();
  const [session, setSession] = useState<Session | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const initSession = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) return;

    try {
      // Start or resume session
      const sess = await apiClient.post<Session>(
        "/sessions/start",
        {},
        token
      );
      setSession(sess);

      // Load current activity
      const act = await apiClient.get<Activity>(
        `/activities/${sess.currentActivityId}`,
        token
      );
      setActivity(act);
      startTimer();
    } catch (e) {
      console.error("Failed to init session", e);
    } finally {
      setPageLoading(false);
    }
  }, [startTimer]);

  useEffect(() => {
    if (user) {
      initSession();
    }
  }, [user, initSession]);

  const handleAnswer = async () => {
    if (selectedAnswer === null || !activity || !session) return;

    const correct =
      String(selectedAnswer) === String(activity.content.correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    await submitAttempt({
      activityId: activity.id,
      sessionId: session.id,
      isCorrect: correct,
      timeSpentSeconds: getElapsedSeconds(),
      hintsUsed,
      interactionSignals: { selectedAnswer, hintsUsed },
    });
  };

  const handleNext = async () => {
    if (!adeDecision?.nextActivityId) {
      router.push("/dashboard");
      return;
    }

    const token = authService.getStoredToken();
    if (!token) return;

    try {
      const nextActivity = await apiClient.get<Activity>(
        `/activities/${adeDecision.nextActivityId}`,
        token
      );
      setActivity(nextActivity);
      setSelectedAnswer(null);
      setShowResult(false);
      setHintsUsed(0);
      setShowHint(false);
      startTimer();
    } catch {
      router.push("/dashboard");
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <Card className="max-w-sm w-full mx-4 text-center p-6">
          <p className="text-2xl mb-3">🎉</p>
          <h2 className="font-bold text-lg text-gray-800">
            Parabéns! Você completou todas as atividades de hoje!
          </h2>
          <Button
            className="mt-4 w-full"
            onClick={() => router.push("/dashboard")}
          >
            Ver meu progresso
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Voltar ao dashboard"
          >
            ← Sair
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Nível {activity.difficultyLevel}
            </span>
            {activity.content.bnccSkill && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                BNCC: {activity.content.bnccSkill}
              </span>
            )}
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-md">
          <CardContent className="pt-4 pb-4">
            {activity.content.imageUrl && (
              <img
                src={activity.content.imageUrl}
                alt="Imagem da atividade"
                className="w-full rounded-lg mb-4 max-h-48 object-contain"
              />
            )}
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {activity.title}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {activity.content.question}
            </p>

            {/* Hint */}
            {activity.content.hint && !showHint && !showResult && (
              <button
                className="mt-3 text-xs text-indigo-500 underline"
                onClick={() => {
                  setShowHint(true);
                  setHintsUsed((h) => h + 1);
                }}
              >
                💡 Ver dica
              </button>
            )}
            {showHint && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                💡 {activity.content.hint}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Options */}
        {!showResult && (
          <>
            {activity.type === "MULTIPLE_CHOICE" &&
              activity.content.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                    selectedAnswer === idx
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                  }`}
                  aria-pressed={selectedAnswer === idx}
                >
                  <span className="mr-2 font-bold text-indigo-400">
                    {["A", "B", "C", "D"][idx]}.
                  </span>
                  {option}
                </button>
              ))}

            {activity.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-2 gap-3">
                {["Verdadeiro", "Falso"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setSelectedAnswer(label)}
                    className={`p-4 rounded-2xl border-2 font-semibold transition-all ${
                      selectedAnswer === label
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    {label === "Verdadeiro" ? "✅" : "❌"} {label}
                  </button>
                ))}
              </div>
            )}

            {activity.type === "FILL_BLANK" && (
              <input
                type="text"
                value={selectedAnswer?.toString() || ""}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Digite sua resposta..."
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-gray-700"
                aria-label="Campo de resposta"
              />
            )}

            <Button
              onClick={handleAnswer}
              disabled={selectedAnswer === null || submitting}
              loading={submitting}
              className="w-full py-3 text-base"
            >
              Confirmar resposta
            </Button>
          </>
        )}

        {/* Result */}
        {showResult && (
          <Card
            className={`border-2 ${
              isCorrect ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"
            }`}
          >
            <CardContent className="py-4 text-center">
              <p className="text-3xl mb-2">{isCorrect ? "🎉" : "🤔"}</p>
              <p
                className={`font-bold text-lg ${
                  isCorrect ? "text-green-700" : "text-red-600"
                }`}
              >
                {isCorrect ? "Correto!" : "Quase lá!"}
              </p>
              {adeDecision && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  {adeDecision.feedback}
                </p>
              )}
              <Button
                onClick={handleNext}
                className="mt-4 w-full"
                variant={isCorrect ? "primary" : "secondary"}
              >
                Próxima atividade →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}