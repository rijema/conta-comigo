"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { ExerciseCelebration } from "@/components/activity/exercise-celebration";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { PushToTalkButton } from "@/components/voice/push-to-talk-button";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
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

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  counting: "Contagem com escolha", multiple_choice: "Escolha", quiz: "Perguntas",
  drag_drop: "Arrastar e organizar", number_line: "Reta numérica",
  composition_decomposition: "Composição", missing_number: "Número que falta",
  pattern_completion: "Completar padrão", representation_matching: "Combinar representações",
  error_detection: "Descobrir o erro", contextual_problem_solving: "Resolver problema",
};

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

function playCorrect(volume: number) {
  playTone(523, 0.12, "triangle", 0.3 * volume);
  setTimeout(() => playTone(659, 0.12, "triangle", 0.3 * volume), 110);
  setTimeout(() => playTone(784, 0.25, "triangle", 0.3 * volume), 220);
}
function playWrong(volume: number) {
  playTone(300, 0.15, "sawtooth", 0.2 * volume);
  setTimeout(() => playTone(250, 0.25, "sawtooth", 0.15 * volume), 150);
}
function playStart(volume: number) {
  playTone(440, 0.1, "sine", 0.2 * volume);
  setTimeout(() => playTone(550, 0.15, "sine", 0.2 * volume), 100);
}
function playTap(volume: number) { playTone(620, 0.07, "sine", 0.12 * volume); }

function LearnPageInner() {
  const { user, isLoading: authLoading } = useAuth();
  const { session, startSession, stopSession, submitAnswer, markActivityStarted, requestActivityHelp, requestHint, abandonCurrentActivity, recordFirstInteraction, changeCurrentActivity, isChangingActivity, isLoading: sessionLoading, error: sessionError } = useSession();
  const [showReward, setShowReward] = useState(false);
  const [showAutoHint, setShowAutoHint] = useState(false);
  const [rewardWrong, setRewardWrong] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const startCuePlayedRef = useRef(false);
  const returningRef = useRef(false);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { settings, childPreferencesReady } = useAccessibility();
  const effectVolume = Math.min(settings.volume, settings.audioStimulus === 'low' ? 0.35 : settings.audioStimulus === 'medium' ? 0.7 : 1);
  const feedbackDuration = settings.animationSpeed === 'slow' ? 5500 : settings.animationSpeed === 'fast' ? 2800 : 4200;
  const speech = useTitiaSpeech({ activityId: session?.currentActivity?.id });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading) return;
    if (!user) { router.replace(`/${locale}/auth/login`); return; }
    if (!childPreferencesReady) return;
    startSession(String(user.id));
    if (settings.soundEnabled && settings.soundEffectsEnabled && !settings.lowStimulationMode && !startCuePlayedRef.current) {
      startCuePlayedRef.current = true;
      playStart(effectVolume);
    }
  }, [mounted, user, authLoading, childPreferencesReady, settings.soundEnabled, settings.soundEffectsEnabled, effectVolume, settings.lowStimulationMode, startSession, router, locale]);

  /* rotate background on each new activity */
  useEffect(() => {
    if (session?.currentActivity) {
      if (settings.predictability !== 'high' && settings.visualStimulus !== 'low') setBgIdx((i) => (i + 1) % BG_THEMES.length);
      markActivityStarted(session.currentActivity.id);
    }
  }, [session?.currentActivity, markActivityStarted, settings.predictability, settings.visualStimulus]);

  useEffect(() => {
    setShowAutoHint(false);
    if (!session?.currentActivity?.id || !settings.autoHints || session.progress >= 100) return;
    const activityId = session.currentActivity.id;
    const timer = window.setTimeout(() => {
      requestHint(activityId);
      setShowAutoHint(true);
    }, Math.max(5, settings.helpDelaySeconds) * 1000);
    return () => window.clearTimeout(timer);
  }, [session?.currentActivity?.id, settings.autoHints, settings.helpDelaySeconds]);

  const handleAnswer = useCallback(async (answer: any) => {
    if (!session?.currentActivity) return;
    const result = await submitAnswer({
      activityId: session.currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session.activityStartTime || Date.now()),
    });
    if (result.isCorrect) {
      if (result.completed) return;
      if (settings.soundEnabled && settings.soundEffectsEnabled) playCorrect(effectVolume);
      speech.speakFeedback(
        session.currentActivity.content?.spokenSuccessFeedback || "Muito bem! Você conseguiu.",
      );
      const showCelebration = settings.celebrationFrequency === 'frequent' ||
        (settings.celebrationFrequency === 'normal' && (session.progress / 10) % 2 === 0);
      if (showCelebration && settings.feedbackVisual !== 'minimal' && settings.reinforcementPreference !== 'minimal' && settings.predictability !== 'high' && !settings.lowStimulationMode && !settings.animationsReduced) setShowReward(true);
      setTimeout(() => setShowReward(false), feedbackDuration);
    } else {
      if (settings.soundEnabled && settings.soundEffectsEnabled) playWrong(effectVolume);
      speech.speakFeedback(
        session.currentActivity.content?.spokenRetryFeedback || "Tudo bem. Vamos tentar novamente.",
      );
      if (settings.feedbackVisual !== 'minimal' && settings.predictability !== 'high' && !settings.lowStimulationMode && !settings.animationsReduced) setRewardWrong(true);
      setTimeout(() => setRewardWrong(false), feedbackDuration);
    }
  }, [session, settings, effectVolume, feedbackDuration, speech, submitAnswer]);

  const handleGoToMenu = () => {
    if (settings.soundEnabled && settings.soundEffectsEnabled) playTap(effectVolume);
    abandonCurrentActivity();
    stopSession();
    router.push(`/${locale}/learn/menu`);
  };

  const returnToMap = () => {
    if (returningRef.current) return;
    returningRef.current = true;
    speech.stopSpeech();
    stopSession();
    router.push(`/${locale}/learn/menu`);
  };

  const handleChangeActivity = async () => {
    if (!settings.allowChangeActivity) return;
    if (settings.soundEnabled && settings.soundEffectsEnabled) playTap(effectVolume);
    speech.stopSpeech();
    const changed = await changeCurrentActivity();
    if (changed) speech.speakFeedback("Vamos tentar de outro jeito!");
  };

  const handleOpenTutorial = () => {
    if (!session?.currentActivity) return;
    requestActivityHelp(session.currentActivity.id);
    if (settings.soundEnabled && settings.soundEffectsEnabled) playTap(effectVolume);
    setShowTutorial(true);
    const steps = getTutorialSteps(session.currentActivity).map((step) => step.text);
    speech.speakInstruction({ introduction: "Vamos ver como jogar.", steps });
  };

  const askTitia = async (spokenQuestion?: string) => {
    const question = (spokenQuestion ?? chatQuestion).trim();
    if (!question) return;
    setChatQuestion(question);
    setChatLoading(true);
    try {
      const token = authService.getStoredToken();
      const result = await api.post<{ answer: string }>("/guardian/child-chat", { question }, token ?? undefined);
      setChatAnswer(result.answer);
      speech.speakFeedback(result.answer);
    } catch {
      speech.speakFeedback("Não consegui responder agora. Vamos tentar depois.");
    } finally { setChatLoading(false); }
  };

  const voice = useVoiceCommand({
    sessionId: session?.id, activityId: session?.currentActivity?.id,
    recommendationId: session?.currentRecommendationId,
    onHelp: handleOpenTutorial, onRepeat: speech.repeatLastInstruction,
    onChangeActivity: () => { void handleChangeActivity(); }, onStopSpeech: speech.stopSpeech,
    onUnknown: () => speech.speakFeedback("Não entendi. Vamos tentar novamente."),
    onTranscript: (transcript) => { void askTitia(transcript); },
  });

  const activity = session?.currentActivity;
  const progress = session?.progress ?? 0;

  if (progress >= 100 && session && childPreferencesReady) {
    return <ExerciseCelebration
      correctAnswers={session.roundStats?.correctAnswers ?? 10}
      starsEarned={session.roundStats?.starsEarned ?? 0}
      practiceLabel={session.roundStats?.practiceLabel ?? "matemática"}
      lowStimulation={settings.lowStimulationMode || settings.animationsReduced || settings.predictability === 'high'}
      onReturnToMap={returnToMap}
      onSpeak={speech.speakFeedback}
    />;
  }

  if (authLoading || sessionLoading || !activity) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: settings.lowStimulationMode ? "#ecfdf5" : BG_THEMES[0] }}>
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
              <div className="mb-4">
                <ArasaacPictogram conceptId="state.great" showLabel={false} imageClassName="w-20 h-20" />
              </div>
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
    <div className="min-h-screen motion-safe:transition-all motion-safe:duration-700" onPointerDownCapture={() => recordFirstInteraction(activity.id)} onKeyDownCapture={() => recordFirstInteraction(activity.id)} style={{ background: settings.lowStimulationMode || settings.visualStimulus === 'low' ? "#ecfdf5" : bg, filter: settings.visualStimulus === 'high' ? 'saturate(1.1)' : undefined, transitionDuration: settings.animationsReduced || settings.lowStimulationMode ? '0ms' : settings.animationSpeed === 'slow' ? '1200ms' : settings.animationSpeed === 'fast' ? '350ms' : '700ms' }}>
      <h1 className="sr-only">Atividade: {activity.title}</h1>

      {/* ── Correct answer burst ── */}
      {showReward && (
        <div className="feedback-motion fixed inset-0 z-50 flex items-center justify-center bg-emerald-400/45 pointer-events-none" style={{ animation: `feedbackFlash ${feedbackDuration}ms ease-out` }}>
          <div className="feedback-motion flex w-full items-center justify-center gap-4 border-y-4 border-emerald-200 bg-emerald-600/90 py-4 shadow-2xl" style={{ animation: `feedbackSweep ${feedbackDuration}ms ease-in-out both` }}>
            <Image src="/assets/correctanswer.png" width={520} height={390} alt="TitiA comemorando o acerto" className="h-64 w-auto object-contain sm:h-80" />
            <p className="text-3xl font-extrabold text-white drop-shadow-lg">
              Muito bem!
            </p>
          </div>
        </div>
      )}
      {rewardWrong && (
        <div className="feedback-motion fixed inset-0 z-50 flex items-center justify-center bg-rose-500/45 pointer-events-none" style={{ animation: `feedbackFlash ${feedbackDuration}ms ease-out` }}>
          <div className="feedback-motion flex w-full items-center justify-center border-y-4 border-rose-200 bg-rose-600/90 py-4 shadow-2xl" style={{ animation: `feedbackSweep ${feedbackDuration}ms ease-in-out both` }}>
            <Image src="/assets/tryagain.png" width={440} height={330} alt="TitiA incentivando uma nova tentativa" className="h-64 w-auto object-contain sm:h-80" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeInUp { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        @keyframes feedbackFlash { 0%{opacity:0} 10%,82%{opacity:1} 100%{opacity:0} }
        @keyframes feedbackSweep { 0%{transform:translateX(-105%)} 12%,82%{transform:translateX(0)} 100%{transform:translateX(105%)} }
        @media (prefers-reduced-motion: reduce) { .feedback-motion { animation: none !important; } }
        @media (min-width: 900px) and (orientation: landscape) and (max-height: 850px) {
          .exercise-header { padding-top: .25rem; padding-bottom: .25rem; }
          .exercise-badges { padding-top: .35rem; }
          .exercise-actions { padding-top: .35rem; gap: .5rem; }
          .exercise-main { padding-top: .4rem; padding-bottom: .5rem; }
          .exercise-card-body { padding: .4rem; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="exercise-header sticky top-0 z-20 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md">
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
            <button onClick={handleGoToMenu} className="min-h-11 rounded-lg px-3 py-1 text-sm font-bold text-gray-600 hover:text-purple-700">Sair</button>
          </div>
        </div>
      </header>

      {/* ── Activity type badge + BNCC ── */}
      <div className="exercise-badges mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pt-3">
        {(activity.bnccSkills ?? []).map((skill: string) => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-extrabold text-blue-700 shadow-sm">
            BNCC {skill}
          </span>
        ))}
        {!activity.bnccSkills?.length && <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-extrabold text-amber-800">Sem vínculo BNCC validado</span>}
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-extrabold text-emerald-700 shadow-sm">
          Tipo: {activity.content?.formatLabel ?? ACTIVITY_TYPE_LABELS[activity.type] ?? activity.type}
        </span>
        {session.selectionSource === "recalculated" && <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-white/70 px-3 py-1 text-xs font-extrabold text-purple-700 shadow-sm">↻ Outra opção escolhida pela TitiA</span>}
      </div>
      <div className="exercise-actions mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 pt-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleChangeActivity}
          disabled={isChangingActivity || !settings.allowChangeActivity}
          aria-label="Quero outro exercício"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-teal-400 bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-extrabold text-white shadow-md motion-safe:transition-all motion-safe:hover:scale-[1.04] hover:shadow-lg motion-safe:active:scale-[.96] disabled:opacity-60"
        >
          <ArasaacPictogram
            conceptId="navigation.repeat"
            alt="Mudar para outro exercício"
            showLabel={false}
            imageClassName="w-5 h-5"
          />
          <span>{!settings.allowChangeActivity ? "Outra atividade indisponível" : isChangingActivity ? "Escolhendo..." : "Quero outro"}</span>
        </button>
        <button type="button" onClick={() => { if (settings.soundEnabled && settings.soundEffectsEnabled) playTap(effectVolume); setShowChat(true); }}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-sky-300 bg-gradient-to-r from-sky-100 to-blue-100 px-4 py-2 text-sm font-extrabold text-sky-800 shadow-md transition-all hover:scale-[1.04] hover:shadow-lg active:scale-[.96] motion-reduce:transform-none">
          <ArasaacPictogram conceptId="communication.help_me" showLabel={false} imageClassName="h-7 w-7" />
          <span>Falar com a TitiA</span>
        </button>
        <button type="button" onClick={handleOpenTutorial}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-orange-800 shadow-md motion-safe:transition-all motion-safe:hover:scale-[1.04] hover:shadow-lg motion-safe:active:scale-[.96]"
          aria-label="Abrir ajuda visual sobre como jogar">
          <ArasaacPictogram conceptId="navigation.help" showLabel={false} imageClassName="h-7 w-7" />
          <span>Como jogar</span>
        </button>
      </div>

      {showAutoHint && <div className="mx-auto max-w-5xl px-4 pt-2"><p role="status" className="rounded-2xl border-2 border-sky-200 bg-white p-3 text-sm font-bold text-sky-900">💡 {activity.content?.spokenHint ?? 'Se quiser, toque em Como jogar para ver uma ajuda.'}</p></div>}

      {/* ── Child chat ── */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="button"
          tabIndex={0}
          onClick={(event) => { if (event.target === event.currentTarget) setShowChat(false); }}
          onKeyDown={(event) => { if ((event.key === 'Escape' || event.key === 'Enter') && event.target === event.currentTarget) setShowChat(false); }}
          aria-label="Fechar chat"
        >
          <section role="dialog" aria-modal="true" aria-labelledby="titia-chat-title"
            className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <header className="flex items-center gap-3 bg-gradient-to-r from-sky-500 via-blue-500 to-purple-500 p-4 text-white">
              <Image src="/assets/wildcard.png" width={88} height={72} alt="TitiA" className="h-16 w-20 object-contain" />
              <div className="flex-1"><h2 id="titia-chat-title" className="text-xl font-extrabold">Falar com a TitiA</h2><p className="text-sm text-white/90">Escreva ou use sua voz para fazer uma pergunta.</p></div>
              <button type="button" onClick={() => setShowChat(false)} aria-label="Fechar conversa" className="h-10 w-10 rounded-full bg-white/20 text-xl font-bold hover:bg-white/30">×</button>
            </header>
            <div className="space-y-4 p-5">
              {chatAnswer && <div className="rounded-2xl border-2 border-purple-100 bg-purple-50 p-4 text-sm font-semibold leading-relaxed text-slate-700" aria-live="polite">{chatAnswer}</div>}
              <label className="block font-bold text-slate-700">O que você quer perguntar?
                <textarea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-sky-200 p-3 font-medium focus:border-sky-500 focus:outline-none" />
              </label>
              <div className="flex flex-wrap gap-3">
                {voice.enabled && settings.voiceEnabled && <PushToTalkButton state={voice.state} onStart={voice.start} onStop={voice.stop} onReset={voice.reset} idleLabel="Fazer pergunta por voz" />}
                <button type="button" disabled={!chatQuestion.trim() || chatLoading} onClick={() => { void askTitia(); }}
                  className="min-h-11 flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[.98] disabled:opacity-50">
                  {chatLoading ? "TitiA está pensando..." : "Enviar para a TitiA"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tutorial modal ── */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-blue-700">Como jogar</h2>
              <button onClick={() => setShowTutorial(false)} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
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
                if (settings.soundEnabled && settings.soundEffectsEnabled) playStart(effectVolume);
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
      <main className="exercise-main mx-auto w-full max-w-5xl px-3 pb-6 pt-3 sm:px-4">
        <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-white/80 shadow-xl backdrop-blur-sm">
          {/* Colourful top stripe per activity type */}
          <div className="h-2" style={{
            background: activity.type === "multiple_choice" ? "linear-gradient(90deg,#34d399,#059669)" :
                        activity.type === "counting"        ? "linear-gradient(90deg,#818cf8,#6366f1)" :
                        activity.type === "drag_drop"       ? "linear-gradient(90deg,#f59e0b,#d97706)" :
                        activity.type === "number_line"     ? "linear-gradient(90deg,#ec4899,#db2777)" :
                        "linear-gradient(90deg,#06b6d4,#0284c7)"
          }} />
          <div className="exercise-card-body p-3">
            <ActivityRenderer
              activity={activity}
              onAnswer={handleAnswer}
              onRequestHint={() => requestHint(activity.id)}
              sensoryProfile={{
                lowStimulationMode: settings.lowStimulationMode,
                highContrast: settings.highContrast,
                animationsEnabled: !settings.animationsReduced,
                soundEnabled: settings.soundEnabled,
                voiceEnabled: settings.voiceEnabled,
                speechRate: settings.speechRate,
                automaticInstructionSpeech: settings.automaticInstructionSpeech,
                speechLanguage: settings.speechLanguage,
              }}
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
        <div className="animate-bounce">
          <ArasaacPictogram conceptId="state.great" showLabel={false} imageClassName="w-20 h-20" />
        </div>
      </div>
    }>
      <LearnPageInner />
    </Suspense>
  );
}
