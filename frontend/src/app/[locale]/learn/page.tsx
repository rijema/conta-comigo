"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";

/* ── Rotating colourful backgrounds per activity ── */
const BG_THEMES = [
  "linear-gradient(135deg,#fef9c3 0%,#fde68a 40%,#fcd34d 100%)",
  "linear-gradient(135deg,#dbeafe 0%,#bfdbfe 40%,#a5f3fc 100%)",
  "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 40%,#6ee7b7 100%)",
  "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 40%,#f9a8d4 100%)",
  "linear-gradient(135deg,#ede9fe 0%,#ddd6fe 40%,#c4b5fd 100%)",
  "linear-gradient(135deg,#ffedd5 0%,#fed7aa 40%,#fdba74 100%)",
];

/* ── Sound helpers using Web Audio API ── */
function playTone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch { /* silently ignore if AudioContext unavailable */ }
}

function playCorrect() {
  playTone(523, 0.12, "triangle", 0.3);
  setTimeout(() => playTone(659, 0.12, "triangle", 0.3), 110);
  setTimeout(() => playTone(784, 0.25, "triangle", 0.3), 220);
}
function playWrong() {
  playTone(300, 0.15, "sawtooth", 0.2);
  setTimeout(() => playTone(250, 0.25, "sawtooth", 0.15), 150);
}
function playStart() {
  playTone(440, 0.1, "sine", 0.2);
  setTimeout(() => playTone(550, 0.15, "sine", 0.2), 100);
}

function LearnPageInner() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { session, startSession, stopSession, submitAnswer, isLoading: sessionLoading, error: sessionError } = useSession();
  const [stars, setStars] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardWrong, setRewardWrong] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading) return;
    if (!user) { router.replace(`/${locale}/auth/login`); return; }
    startSession();
    playStart();
  }, [mounted, user, authLoading]);

  /* rotate background on each new activity */
  useEffect(() => {
    if (session?.currentActivity) {
      setBgIdx((i) => (i + 1) % BG_THEMES.length);
    }
  }, [session?.currentActivity?.id]);

  const handleAnswer = useCallback(async (answer: any) => {
    if (!session?.currentActivity) return;
    const result = await submitAnswer({
      activityId: session.currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session.activityStartTime || Date.now()),
    });
    if (result.isCorrect) {
      playCorrect();
      setStars((s) => s + 1);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2200);
    } else {
      playWrong();
      setRewardWrong(true);
      setTimeout(() => setRewardWrong(false), 1800);
    }
  }, [session, submitAnswer]);

  const handleGoToMenu = () => { stopSession(); router.push(`/${locale}/learn/menu`); };

  const activity = session?.currentActivity;
  const progress = session?.progress ?? 0;

  if (authLoading || sessionLoading || !activity) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG_THEMES[0] }}>
        <div className="text-center">
          {sessionError ? (
            <>
              <div className="text-7xl mb-4">😔</div>
              <p className="text-xl text-red-600 font-bold">Ops! Não consegui carregar a atividade.</p>
              <p className="text-gray-500 mt-2 text-sm">{sessionError}</p>
              <button onClick={() => window.location.reload()}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700">
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <div className="text-8xl animate-bounce mb-4">🌟</div>
              <p className="text-2xl text-blue-700 font-extrabold">Preparando sua aventura...</p>
              <p className="text-gray-500 mt-2 text-sm">A TitIA está escolhendo a melhor atividade para você!</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const bg = BG_THEMES[bgIdx % BG_THEMES.length];

  return (
    <div className="min-h-screen transition-all duration-700" style={{ background: bg }}>

      {/* ── Correct answer burst ── */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="flex flex-col items-center gap-2">
            <div className="text-9xl" style={{ animation: "bounceIn 0.4s ease-out" }}>⭐</div>
            <p className="text-3xl font-extrabold text-yellow-600 drop-shadow-lg" style={{ animation: "fadeInUp 0.3s ease-out" }}>
              Muito bem! 🎉
            </p>
          </div>
        </div>
      )}
      {rewardWrong && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-7xl" style={{ animation: "shake 0.4s ease-out" }}>💙</div>
        </div>
      )}

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeInUp { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
      `}</style>

      {/* ── Header ── */}
      <header className="bg-white/75 backdrop-blur-md shadow-sm px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handleGoToMenu}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 hover:border-purple-300 transition-colors text-sm font-extrabold text-purple-700"
          >
            🗺️ Mapa
          </button>

          {/* Stars */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xl">⭐</span>
            <span className="font-extrabold text-yellow-700 text-lg leading-none">{stars}</span>
          </div>

          {/* Progress pill */}
          <div className="flex-1 max-w-xs">
            <div className="w-full h-4 bg-white/60 rounded-full overflow-hidden border-2 border-white shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${Math.max(progress, 4)}%`, background: "linear-gradient(90deg,#818cf8,#ec4899,#f59e0b,#34d399)" }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-center font-bold text-slate-500 mt-0.5">{progress}%</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="w-10 h-10 rounded-2xl bg-orange-100 border-2 border-orange-200 hover:bg-orange-200 flex items-center justify-center text-lg transition-colors"
              title="Como resolver?"
            >💡</button>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">Sair</button>
          </div>
        </div>
      </header>

      {/* ── Activity type badge + BNCC ── */}
      <div className="max-w-2xl mx-auto px-4 pt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-white/70 text-blue-700 px-3 py-1 rounded-full border border-blue-200 shadow-sm">
          📚 {activity.bnccSkills?.[0] ?? "BNCC"}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-white/70 text-purple-700 px-3 py-1 rounded-full border border-purple-200 shadow-sm">
          🦋 Selecionado pela TitIA
        </span>
      </div>

      {/* ── Tutorial modal ── */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-blue-700">💡 Como jogar</h2>
              <button onClick={() => setShowTutorial(false)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="text-5xl text-center mb-3">🎮</div>
            <h3 className="text-lg font-extrabold text-gray-800 text-center mb-2">{activity.title}</h3>
            <p className="text-gray-600 text-sm text-center mb-4">
              {activity.content?.instructionsPt || activity.description || "Siga as instruções da atividade."}
            </p>
            {activity.content?.example && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-4 border-2 border-blue-100">
                <p className="text-xs font-extrabold text-blue-600 uppercase mb-1">Exemplo:</p>
                <p className="text-gray-700 text-sm">{activity.content.example}</p>
              </div>
            )}
            {activity.type === "drag_drop" && (
              <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border-2 border-yellow-200">
                <p className="text-xs font-extrabold text-yellow-600 mb-2">🖐️ Como jogar:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Toque num item amarelo para selecionar</li>
                  <li>Toque numa posição para colocá-lo lá</li>
                  <li>Clique em "Confirmar" quando terminar</li>
                </ol>
              </div>
            )}
            {(activity.type === "multiple_choice" || activity.type === "quiz") && (
              <div className="bg-green-50 rounded-2xl p-4 mb-4 border-2 border-green-200">
                <p className="text-xs font-extrabold text-green-600 mb-2">🎯 Como jogar:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Leia a pergunta com atenção</li>
                  <li>Toque na resposta certa</li>
                  <li>Clique em "Confirmar"</li>
                </ol>
              </div>
            )}
            <button
              onClick={() => { setShowTutorial(false); playStart(); }}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold rounded-2xl hover:opacity-90 transition-opacity text-base shadow-lg"
            >
              Entendi! Vamos jogar! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── Activity card ── */}
      <main className="max-w-2xl mx-auto px-4 pt-3 pb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-white/80 overflow-hidden">
          {/* Colourful top stripe per activity type */}
          <div className="h-2" style={{
            background: activity.type === "multiple_choice" ? "linear-gradient(90deg,#34d399,#059669)" :
                        activity.type === "counting"        ? "linear-gradient(90deg,#818cf8,#6366f1)" :
                        activity.type === "drag_drop"       ? "linear-gradient(90deg,#f59e0b,#d97706)" :
                        activity.type === "number_line"     ? "linear-gradient(90deg,#ec4899,#db2777)" :
                        "linear-gradient(90deg,#06b6d4,#0284c7)"
          }} />
          <div className="p-4">
            <ActivityRenderer
              activity={activity}
              onAnswer={handleAnswer}
              sensoryProfile={undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: "linear-gradient(135deg,#fce7f3,#dbeafe,#d1fae5)" }}>
        <div className="text-8xl animate-bounce">🌟</div>
      </div>
    }>
      <LearnPageInner />
    </Suspense>
  );
}