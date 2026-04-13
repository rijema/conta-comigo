"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";

export default function LearnPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { session, startSession, submitAnswer, isLoading: sessionLoading, error: sessionError } = useSession();
  const [stars, setStars] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    startSession();
  }, [user, authLoading, startSession]);

  const handleAnswer = async (answer: any) => {
    if (!session?.currentActivity) return;
    const result = await submitAnswer({
      activityId: session.currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session.activityStartTime || Date.now()),
    });
    if (result.isCorrect) {
      setStars((s) => s + 1);
      setShowReward(true);
      setLastFeedback("🎉 Muito bem! Você acertou!");
      setTimeout(() => { setShowReward(false); setLastFeedback(null); }, 2500);
    } else {
      setLastFeedback("💙 Quase lá! Tente de novo!");
      setTimeout(() => setLastFeedback(null), 2000);
    }
  };

  const activity = session?.currentActivity;
  const progress = session?.progress ?? 0;

  if (authLoading || sessionLoading || !activity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="text-center">
          {sessionError ? (
            <>
              <div className="text-7xl mb-4">😔</div>
              <p className="text-xl text-red-600 font-bold">Ops! Não consegui carregar a atividade.</p>
              <p className="text-gray-500 mt-2 text-sm">{sessionError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <div className="text-7xl animate-bounce mb-4">🌟</div>
              <p className="text-2xl text-blue-700 font-bold">Preparando sua atividade...</p>
              <p className="text-gray-500 mt-2 text-sm">O sistema está escolhendo a melhor atividade para você!</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      {/* Top Bar */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-700">🌍 MathASD</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
            <span className="text-lg">⭐</span>
            <span className="font-bold text-yellow-700 text-lg">{stars}</span>
          </div>
          <span className="text-sm text-gray-500 font-medium">Olá, {user?.name?.split(" ")[0]}!</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded">
            Sair
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 font-medium">Progresso da sessão</span>
          <span className="text-xs font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* BNCC badge */}
      <div className="px-4 pt-2">
        <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          📚 {activity.bnccSkills?.[0] ?? "BNCC"}
        </span>
      </div>

      {/* Feedback overlay */}
      {lastFeedback && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-4xl font-bold bg-white rounded-2xl shadow-2xl px-10 py-6 animate-bounce text-center">
            {lastFeedback}
          </div>
        </div>
      )}

      {/* Star burst animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-8xl animate-ping">⭐</div>
        </div>
      )}

      {/* Activity */}
      <main className="max-w-2xl mx-auto p-4">
        <ActivityRenderer
          activity={activity}
          onAnswer={handleAnswer}
          sensoryProfile={user?.childProfile?.uiPreferences}
        />
      </main>
    </div>
  );
}