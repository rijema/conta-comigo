"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { PushToTalkButton } from "@/components/voice/push-to-talk-button";
import type { Activity } from "@/types";

const TUTORIALS: Partial<Record<Activity["type"], Array<{ conceptId: string; text: string }>>> = {
  drag_drop: [
    { conceptId: "activity.touch", text: "Toque ou segure uma peça." },
    { conceptId: "activity.move", text: "Leve a peça até o lugar escolhido." },
    { conceptId: "activity.complete", text: "Quando terminar, confirme a resposta." },
  ],
  multiple_choice: [
    { conceptId: "activity.look", text: "Observe a pergunta e as figuras." },
    { conceptId: "activity.choose", text: "Toque na resposta que você escolheu." },
    { conceptId: "activity.complete", text: "Confirme para ver como você foi." },
  ],
  quiz: [
    { conceptId: "activity.look", text: "Observe a pergunta e as figuras." },
    { conceptId: "activity.choose", text: "Toque na resposta que você escolheu." },
    { conceptId: "activity.complete", text: "Confirme para ver como você foi." },
  ],
  counting: [
    { conceptId: "activity.look", text: "Olhe todos os objetos com calma." },
    { conceptId: "mathematics.count", text: "Conte um objeto de cada vez." },
    { conceptId: "activity.choose", text: "Escolha ou escreva o total." },
  ],
  number_line: [
    { conceptId: "activity.look", text: "Observe os números na linha." },
    { conceptId: "activity.point", text: "Encontre o lugar pedido." },
    { conceptId: "activity.touch", text: "Toque nesse lugar para responder." },
  ],
};

function getTutorialSteps(activity: Activity) {
  return TUTORIALS[activity.type] ?? [
    { conceptId: "activity.look", text: "Observe a atividade com calma." },
    { conceptId: "activity.choose", text: "Faça ou escolha sua resposta." },
    { conceptId: "activity.complete", text: "Confirme quando terminar." },
  ];
}

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
function playTap() { playTone(620, 0.07, "sine", 0.12); }

function LearnPageInner() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { session, startSession, stopSession, submitAnswer, markActivityStarted, requestActivityHelp, requestHint, skipCurrentActivity, changeCurrentActivity, isChangingActivity, isLoading: sessionLoading, error: sessionError } = useSession();
  const [showReward, setShowReward] = useState(false);
  const [rewardWrong, setRewardWrong] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const startCuePlayedRef = useRef(false);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { settings } = useAccessibility();
  const speech = useTitiaSpeech({ activityId: session?.currentActivity?.id });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading) return;
    if (!user) { router.replace(`/${locale}/auth/login`); return; }
    startSession(String(user.id));
    if (settings.soundEnabled && !startCuePlayedRef.current) {
      startCuePlayedRef.current = true;
      playStart();
    }
  }, [mounted, user, authLoading, settings.soundEnabled]);

  /* rotate background on each new activity */
  useEffect(() => {
    if (session?.currentActivity) {
      setBgIdx((i) => (i + 1) % BG_THEMES.length);
      markActivityStarted(session.currentActivity.id);
    }
  }, [session?.currentActivity?.id, markActivityStarted]);

  const handleAnswer = useCallback(async (answer: any) => {
    if (!session?.currentActivity) return;
    const result = await submitAnswer({
      activityId: session.currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session.activityStartTime || Date.now()),
    });
    if (result.isCorrect) {
      if (settings.soundEnabled) playCorrect();
      speech.speakFeedback(
        session.currentActivity.content?.spokenSuccessFeedback || "Muito bem! Você conseguiu.",
      );
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2200);
    } else {
      if (settings.soundEnabled) playWrong();
      speech.speakFeedback(
        session.currentActivity.content?.spokenRetryFeedback || "Tudo bem. Vamos tentar novamente.",
      );
      setRewardWrong(true);
      setTimeout(() => setRewardWrong(false), 1800);
    }
  }, [session, settings.soundEnabled, speech, submitAnswer]);

  const handleGoToMenu = () => {
    if (settings.soundEnabled) playTap();
    skipCurrentActivity();
    stopSession();
    router.push(`/${locale}/learn/menu`);
  };

  const handleLogout = () => {
    speech.stopSpeech();
    stopSession();
    logout();
  };

  const handleChangeActivity = async () => {
    if (settings.soundEnabled) playTap();
    speech.stopSpeech();
    const changed = await changeCurrentActivity();
    if (changed) speech.speakFeedback("Vamos tentar de outro jeito!");
  };

  const handleOpenTutorial = () => {
    if (!session?.currentActivity) return;
    requestActivityHelp(session.currentActivity.id);
    if (settings.soundEnabled) playTap();
    setShowTutorial(true);
    const steps = getTutorialSteps(session.currentActivity).map((step) => step.text);
    speech.speakInstruction({ introduction: "Vamos ver como jogar.", steps });
  };

  const voice = useVoiceCommand({
    sessionId: session?.id, activityId: session?.currentActivity?.id,
    recommendationId: session?.currentRecommendationId,
    onHelp: handleOpenTutorial, onRepeat: speech.repeatLastInstruction,
    onChangeActivity: () => { void handleChangeActivity(); }, onStopSpeech: speech.stopSpeech,
    onUnknown: () => speech.speakFeedback("Não entendi. Vamos tentar novamente."),
  });

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
                <ArasaacPictogram conceptId="navigation.try_again" showLabel={false} imageClassName="w-7 h-7" />
                <span className="ml-2">Tentar novamente</span>
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
  const tutorialSteps = getTutorialSteps(activity);

  return (
    <div className="min-h-screen transition-all duration-700" style={{ background: bg }}>

      {/* ── Correct answer burst ── */}
      {showReward && (
        <div className="feedback-motion fixed inset-0 z-50 flex items-center justify-center bg-emerald-400/45 pointer-events-none" style={{ animation: "feedbackFlash 1.8s ease-out" }}>
          <div className="feedback-motion flex w-full items-center justify-center gap-4 border-y-4 border-emerald-200 bg-emerald-600/90 py-4 shadow-2xl" style={{ animation: "feedbackSweep 1.8s ease-in-out both" }}>
            <Image src="/assets/correctanswer.png" width={520} height={390} alt="TitiA comemorando o acerto" className="h-64 w-auto object-contain sm:h-80" />
            <p className="text-3xl font-extrabold text-white drop-shadow-lg">
              Muito bem! 🎉
            </p>
          </div>
        </div>
      )}
      {rewardWrong && (
        <div className="feedback-motion fixed inset-0 z-50 flex items-center justify-center bg-rose-500/45 pointer-events-none" style={{ animation: "feedbackFlash 1.6s ease-out" }}>
          <div className="feedback-motion flex w-full items-center justify-center border-y-4 border-rose-200 bg-rose-600/90 py-4 shadow-2xl" style={{ animation: "feedbackSweep 1.6s ease-in-out both" }}>
            <Image src="/assets/tryagain.png" width={440} height={330} alt="TitiA incentivando uma nova tentativa" className="h-64 w-auto object-contain sm:h-80" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeInUp { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        @keyframes feedbackFlash { 0%{opacity:0} 18%{opacity:1} 100%{opacity:0} }
        @keyframes feedbackSweep { 0%{transform:translateX(-105%)} 24%,70%{transform:translateX(0)} 100%{transform:translateX(105%)} }
        @media (prefers-reduced-motion: reduce) { .feedback-motion { animation: none !important; } }
      `}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button
            onClick={handleGoToMenu}
            className="flex items-center gap-1.5 rounded-full border-2 border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 text-sm font-extrabold text-purple-700 shadow-sm transition-all hover:scale-[1.04] hover:border-purple-400 hover:shadow-md active:scale-[.96] motion-reduce:transform-none"
          >
            <ArasaacPictogram conceptId="navigation.home" showLabel={false} imageClassName="w-5 h-5" />
            <span>Mapa</span>
          </button>

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
            <p className="mt-0.5 text-center text-xs font-bold text-slate-500">Progresso {progress}%</p>
          </div>

          <div className="flex items-center gap-2">
            {voice.enabled && <PushToTalkButton state={voice.state} onStart={voice.start} onStop={voice.stop} onReset={voice.reset} />}
            <button
              onClick={handleOpenTutorial}
              className="flex min-h-11 items-center gap-1 rounded-[1.5rem_1.5rem_1.5rem_.65rem] border-2 border-orange-300 bg-gradient-to-br from-orange-100 to-yellow-100 px-3 text-sm font-bold shadow-sm transition-all hover:rotate-1 hover:scale-[1.04] hover:shadow-md active:scale-[.96] motion-reduce:transform-none"
              aria-label="Abrir ajuda: como resolver"
            >
              <ArasaacPictogram conceptId="navigation.help" showLabel={false} imageClassName="w-6 h-6" />
              <span className="hidden sm:inline">Como jogar com a TitiA</span>
            </button>
            <button onClick={handleLogout} className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-transform hover:scale-105 hover:text-red-600">Sair</button>
          </div>
        </div>
      </header>

      {/* ── Activity type badge + BNCC ── */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-white/70 text-blue-700 px-3 py-1 rounded-full border border-blue-200 shadow-sm">
          📚 {activity.bnccSkills?.[0] ?? "BNCC"}
        </span>
        {session.selectionSource === "recalculated" && <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-white/70 px-3 py-1 text-xs font-extrabold text-purple-700 shadow-sm">↻ Outra opção escolhida pela TitiA</span>}
      </div>
      {session?.recommendationExplanation && (
        <p className="mx-auto max-w-5xl px-4 pt-2 text-sm font-bold text-purple-700" aria-live="polite">
          {session.recommendationExplanation}
        </p>
      )}
      <div className="mx-auto max-w-5xl px-4 pt-2">
        <button
          type="button"
          onClick={handleChangeActivity}
          disabled={isChangingActivity}
          aria-label="Quero outro exercício"
          className="inline-flex min-h-11 items-center gap-2 rounded-[.75rem_1.75rem_1.75rem_1.75rem] border-2 border-purple-300 bg-gradient-to-r from-white/90 to-purple-50 px-4 py-2 text-sm font-extrabold text-purple-700 shadow-md transition-all hover:-rotate-1 hover:scale-[1.04] hover:shadow-lg active:scale-[.96] motion-reduce:transform-none disabled:opacity-60"
        >
          <ArasaacPictogram
            conceptId="navigation.repeat"
            alt="Mudar para outro exercício"
            showLabel={false}
            imageClassName="w-5 h-5"
          />
          <span>{isChangingActivity ? "Escolhendo..." : "Quero outro"}</span>
        </button>
      </div>

      {/* ── Tutorial modal ── */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-blue-700">💡 Como jogar</h2>
              <button onClick={() => setShowTutorial(false)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex justify-center">
              <Image src="/assets/wildcard.png" width={180} height={135}
                alt="TitiA mostrando como fazer a atividade" className="h-32 w-auto object-contain" />
            </div>
            <p className="mb-4 text-center text-sm font-bold text-purple-700">
              Vamos aprender como usar esta atividade.
            </p>
            {activity.content?.example && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-4 border-2 border-blue-100">
                <p className="text-xs font-extrabold text-blue-600 uppercase mb-1">Exemplo:</p>
                <p className="text-gray-700 text-sm">{activity.content.example}</p>
              </div>
            )}
            <ol className="mb-5 grid gap-3" aria-label="Tutorial visual da atividade">
              {tutorialSteps.map((step, index) => (
                <li key={step.text}>
                  <button type="button" onClick={() => speech.speakExplanation(step.text)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-blue-100 bg-blue-50 p-3 text-left transition-all hover:scale-[1.015] hover:border-blue-300 hover:bg-blue-100 active:scale-[.985] motion-reduce:transform-none"
                    aria-label={`Ouvir passo ${index + 1}: ${step.text}`}>
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white">
                    {index + 1}
                  </span>
                  <ArasaacPictogram conceptId={step.conceptId} showLabel={false} imageClassName="h-14 w-14" />
                    <span className="text-base font-bold text-slate-700">{step.text}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              onClick={() => {
                setShowTutorial(false);
                if (settings.soundEnabled) playStart();
              }}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold rounded-2xl hover:opacity-90 transition-opacity text-base shadow-lg"
            >
              <ArasaacPictogram conceptId="navigation.start" showLabel={false} imageClassName="w-7 h-7" />
              <span className="ml-2">Entendi! Vamos jogar!</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Activity card ── */}
      <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-3 sm:px-4">
        <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-white/80 shadow-xl backdrop-blur-sm">
          {/* Colourful top stripe per activity type */}
          <div className="h-2" style={{
            background: activity.type === "multiple_choice" ? "linear-gradient(90deg,#34d399,#059669)" :
                        activity.type === "counting"        ? "linear-gradient(90deg,#818cf8,#6366f1)" :
                        activity.type === "drag_drop"       ? "linear-gradient(90deg,#f59e0b,#d97706)" :
                        activity.type === "number_line"     ? "linear-gradient(90deg,#ec4899,#db2777)" :
                        "linear-gradient(90deg,#06b6d4,#0284c7)"
          }} />
          <div className="p-3">
            <ActivityRenderer
              activity={activity}
              onAnswer={handleAnswer}
              onRequestHint={() => requestHint(activity.id)}
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
