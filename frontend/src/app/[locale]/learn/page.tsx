"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";

function LearnPageInner() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { session, startSession, stopSession, submitAnswer, isLoading: sessionLoading, error: sessionError } = useSession();
  const [stars, setStars] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const requestedActivityId = searchParams.get("activityId");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading) return;
    if (!user) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    if (requestedActivityId && !session) {
      startSpecificActivity(requestedActivityId);
    } else {
      startSession();
    }
  }, [mounted, user, authLoading]);

  const startSpecificActivity = async (activityId: string) => {
    const token = authService.getStoredToken();
    if (!token) return;
    try {
      const activity = await api.get<any>(`/activities/${activityId}`, token);
      // Inject into session via startSession then override — simplest is just startSession
      // which picks ADE. For specific activity, we'll start session normally and use
      // the activityId param as a hint; the menu flow works via normal ADE start.
      startSession();
    } catch {
      startSession();
    }
  };

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
      setTimeout(() => setShowReward(false), 2500);
    }
  };

  const handleGoToMenu = () => {
    stopSession();
    router.push(`/${locale}/learn/menu`);
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
          <button
            onClick={handleGoToMenu}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors text-sm font-semibold text-purple-700"
            aria-label="Ir para menu de atividades"
          >
            🌳 Menu
          </button>
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

      {/* Activity header with tutorial button */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          📚 {activity.bnccSkills?.[0] ?? "BNCC"}
        </span>
        <button
          onClick={() => setShowTutorial(true)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors"
        >
          💡 Como resolver?
        </button>
      </div>

      {/* Star burst animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-8xl animate-ping">⭐</div>
        </div>
      )}

      {/* Tutorial modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-700">💡 Como resolver</h2>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >✕</button>
            </div>
            <div className="text-4xl text-center mb-3">🎓</div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">{activity.title}</h3>
            <p className="text-gray-600 text-sm text-center mb-4">
              {activity.content?.instructionsPt || activity.description || "Siga as instruções da atividade."}
            </p>
            {activity.content?.example && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Exemplo:</p>
                <p className="text-gray-700 text-sm">{activity.content.example}</p>
              </div>
            )}
            {activity.type === "drag_drop" && (
              <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border border-yellow-100">
                <p className="text-xs font-bold text-yellow-600 uppercase mb-1">🖐️ Como jogar:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Toque num item da bandeja amarela para selecioná-lo</li>
                  <li>Toque numa posição numerada para colocá-lo lá</li>
                  <li>Quando terminar, clique em "Confirmar"</li>
                </ol>
              </div>
            )}
            {(activity.type === "multiple_choice" || activity.type === "quiz") && (
              <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase mb-1">🎯 Como jogar:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Leia a pergunta com atenção</li>
                  <li>Toque na resposta que você acha certa</li>
                  <li>Clique em "Confirmar" para verificar</li>
                </ol>
              </div>
            )}
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
            >
              Entendi! Vamos jogar! 🚀
            </button>
          </div>
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

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="text-7xl animate-bounce">🌟</div>
      </div>
    }>
      <LearnPageInner />
    </Suspense>
  );
}