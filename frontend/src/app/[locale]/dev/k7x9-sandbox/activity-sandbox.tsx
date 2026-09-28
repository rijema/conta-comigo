"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { PictogramPanel } from "./pictogram-panel";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const SANDBOX_BASE = `${API_BASE}/dev/k7x9-sandbox`;

type FeedbackState = "idle" | "correct" | "wrong";

const ACTIVITY_TYPES: string[] = [
  "all", "quiz", "drag_drop", "counting", "number_line",
  "representation_matching", "composition_decomposition",
];

export function ActivitySandbox() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filtered, setFiltered] = useState<Activity[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [answered, setAnswered] = useState<Record<string, "correct" | "wrong">>({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState("");
  const [debugTab, setDebugTab] = useState<"pictograms" | "raw">("pictograms");
  // Local overrides for current activity content (after pictogram swaps)
  const [activityOverrides, setActivityOverrides] = useState<Record<string, Activity>>({});

  const current = filtered[index];
  // Use local override when available (e.g. after a pictogram swap)
  const currentActivity = current
    ? (activityOverrides[current.id] ?? current)
    : current;
  const speech = useTitiaSpeech({ activityId: current?.id });

  useEffect(() => {
    fetch(`${SANDBOX_BASE}/activities`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Activity[]) => {
        setActivities(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let list = activities;
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
    if (diffFilter !== "all") list = list.filter((a) => a.difficulty === diffFilter);
    setFiltered(list);
    setIndex(0);
  }, [activities, typeFilter, diffFilter]);

  const handleActivityUpdated = useCallback((updated: Activity) => {
    setActivityOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }, []);

  const handleAnswer = useCallback(async (answer: unknown) => {
    if (!currentActivity) return;
    try {
      const res = await fetch(`${SANDBOX_BASE}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: currentActivity.id, answer }),
      });
      const { isCorrect } = await res.json();
      const state: FeedbackState = isCorrect ? "correct" : "wrong";
      setFeedback(state);
      setAnswered((prev) => ({ ...prev, [currentActivity.id]: isCorrect ? "correct" : "wrong" }));
      if (isCorrect) {
        speech.speakFeedback("Muito bem! Você conseguiu.");
      } else {
        speech.speakFeedback("Tudo bem. Vamos tentar novamente.");
      }
      setTimeout(() => {
        setFeedback("idle");
        if (isCorrect) {
          setIndex((i) => Math.min(i + 1, filtered.length - 1));
        }
      }, 1800);
    } catch {
      // Evaluate locally by moving on without judgment if network is down
      setFeedback("idle");
    }
  }, [current, filtered.length, speech]);

  const goTo = (i: number) => {
    setFeedback("idle");
    setShowTutorial(false);
    setShowChat(false);
    setIndex(Math.max(0, Math.min(i, filtered.length - 1)));
  };

  const handleOpenTutorial = () => {
    if (!currentActivity) return;
    const steps = getTutorialSteps(currentActivity).map((s) => s.text);
    speech.speakInstruction({ introduction: "Vamos ver como jogar.", steps });
    setShowTutorial(true);
  };

  const handleSendChat = () => {
    const text = chatText.trim();
    if (!text) return;
    // Offline: TitiA reads back whatever was typed — no backend call needed in sandbox
    speech.speakFeedback(text);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-xl text-slate-500 animate-pulse">Carregando exercícios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <p className="text-xl font-bold text-red-600">Erro ao carregar exercícios</p>
        <pre className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</pre>
        <p className="text-slate-500 text-sm">Verifique se o backend está rodando em <code>{API_BASE}</code></p>
      </div>
    );
  }

  if (!currentActivity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-xl text-slate-500">Nenhum exercício encontrado para este filtro.</p>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    very_easy: "bg-emerald-100 text-emerald-700",
    easy: "bg-sky-100 text-sky-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Feedback flash overlay */}
      {feedback === "correct" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-400/40 pointer-events-none animate-pulse">
          <div className="flex w-full items-center justify-center gap-4 border-y-4 border-emerald-200 bg-emerald-600/90 py-4 shadow-2xl">
            <Image src="/assets/correctanswer.png" width={520} height={390} alt="Correto" className="h-48 w-auto object-contain" />
            <p className="text-3xl font-extrabold text-white drop-shadow-lg">Muito bem!</p>
          </div>
        </div>
      )}
      {feedback === "wrong" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-500/40 pointer-events-none animate-pulse">
          <div className="flex w-full items-center justify-center border-y-4 border-rose-200 bg-rose-600/90 py-4 shadow-2xl">
            <Image src="/assets/tryagain.png" width={440} height={330} alt="Tente de novo" className="h-48 w-auto object-contain" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-extrabold text-white tracking-widest">SANDBOX</span>
            <span className="text-sm text-slate-500 font-mono">
              {index + 1} / {filtered.length}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t === "all" ? "Todos os tipos" : t}</option>
              ))}
            </select>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm"
            >
              {["all", "very_easy", "easy", "medium", "hard"].map((d) => (
                <option key={d} value={d}>{d === "all" ? "Todas dificuldades" : d}</option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="rounded-xl bg-slate-100 px-4 py-1.5 font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-200"
            >← Anterior</button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === filtered.length - 1}
              className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white disabled:opacity-40 hover:bg-blue-700"
            >Próximo →</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 flex gap-6">
        {/* Sidebar — list */}
        <aside className="hidden lg:flex w-64 flex-col gap-1 shrink-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Todos os exercícios</p>
          <div className="overflow-y-auto max-h-[calc(100vh-120px)] space-y-1 pr-1">
            {filtered.map((a, i) => {
              const result = answered[a.id];
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    i === index
                      ? "bg-blue-600 text-white font-bold shadow"
                      : result === "correct"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : result === "wrong"
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {result === "correct" && <span>✅</span>}
                    {result === "wrong" && <span>❌</span>}
                    <span className="truncate">{a.title}</span>
                  </span>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    i === index ? "bg-white/20 text-white" : (difficultyColors[a.difficulty ?? ""] ?? "bg-slate-100 text-slate-500")
                  }`}>
                    {a.type}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main activity card */}
        <main className="flex-1 min-w-0">
          {/* Activity metadata */}
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{currentActivity.type}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${difficultyColors[currentActivity.difficulty ?? ""] ?? "bg-slate-100 text-slate-500"}`}>
              {currentActivity.difficulty}
            </span>
            {(currentActivity.bnccSkills ?? []).map((skill: string) => (
              <span key={skill} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{skill}</span>
            ))}
            <span className="ml-auto text-xs font-mono text-slate-400 truncate max-w-[160px]" title={currentActivity.id}>
              {currentActivity.id.slice(0, 8)}…
            </span>
          </div>

          {/* Action buttons — mirrors learn/page toolbar */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled
              title="Indisponível no sandbox — requer sessão ADE"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-teal-400 bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-2 text-sm font-extrabold text-white opacity-40 cursor-not-allowed"
            >
              <ArasaacPictogram conceptId="navigation.repeat" showLabel={false} imageClassName="w-5 h-5" />
              <span>Quero outro</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-sky-300 bg-gradient-to-r from-sky-100 to-blue-100 px-3 py-2 text-sm font-extrabold text-sky-800 shadow-md transition-all hover:scale-[1.04] hover:shadow-lg active:scale-[.96]"
            >
              <ArasaacPictogram conceptId="communication.help_me" showLabel={false} imageClassName="h-6 w-6" />
              <span>Falar com a TitiA</span>
            </button>
            <button
              type="button"
              onClick={handleOpenTutorial}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-100 to-yellow-100 px-3 py-2 text-sm font-extrabold text-orange-800 shadow-md transition-all hover:scale-[1.04] hover:shadow-lg active:scale-[.96]"
            >
              <ArasaacPictogram conceptId="navigation.help" showLabel={false} imageClassName="h-6 w-6" />
              <span>Como jogar</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-white/90 shadow-xl backdrop-blur-sm">
            <div className="h-2" style={{
              background:
                currentActivity.type === "quiz" || currentActivity.type === "multiple_choice"
                  ? "linear-gradient(90deg,#34d399,#059669)"
                  : currentActivity.type === "counting"
                  ? "linear-gradient(90deg,#818cf8,#6366f1)"
                  : currentActivity.type === "drag_drop"
                  ? "linear-gradient(90deg,#f59e0b,#d97706)"
                  : currentActivity.type === "number_line"
                  ? "linear-gradient(90deg,#ec4899,#db2777)"
                  : "linear-gradient(90deg,#06b6d4,#0284c7)",
            }} />
            <div className="p-4">
              <ActivityRenderer
                key={currentActivity.id}
                activity={currentActivity}
                onAnswer={handleAnswer}
              />
            </div>
          </div>

          {/* Debug panel */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100">
              <button
                type="button"
                onClick={() => setDebugTab("pictograms")}
                className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                  debugTab === "pictograms"
                    ? "border-b-2 border-blue-500 bg-blue-50 text-blue-700"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                🖼 Pictogramas
              </button>
              <button
                type="button"
                onClick={() => setDebugTab("raw")}
                className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                  debugTab === "raw"
                    ? "border-b-2 border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {"{ }"} JSON bruto
              </button>
            </div>
            <div className="p-4">
              {debugTab === "pictograms" ? (
                <PictogramPanel
                  activity={currentActivity}
                  onActivityUpdated={handleActivityUpdated}
                />
              ) : (
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-emerald-300 max-h-96">
                  {JSON.stringify(currentActivity.content, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Tutorial modal */}
      {showTutorial && currentActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-blue-700">Como jogar</h2>
              <button type="button" onClick={() => setShowTutorial(false)} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="flex justify-center">
              <Image src="/assets/wildcard.png" width={180} height={135} alt="TitiA" className="h-32 w-auto object-contain" />
            </div>
            <p className="mb-4 text-center text-sm font-bold text-purple-700">Vamos aprender como usar esta atividade.</p>
            <ol className="mb-5 grid gap-3">
              {getTutorialSteps(currentActivity).map((step, i) => (
                <li key={step.text}>
                  <button
                    type="button"
                    onClick={() => speech.speakExplanation(step.text)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-blue-100 bg-blue-50 p-3 text-left transition-all hover:scale-[1.015] hover:border-blue-300 hover:bg-blue-100 active:scale-[.985]"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white">{i + 1}</span>
                    <ArasaacPictogram conceptId={step.conceptId} showLabel={false} imageClassName="h-14 w-14" />
                    <span className="text-base font-bold text-slate-700">{step.text}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-base font-extrabold text-white shadow-lg hover:opacity-90"
            >
              Entendi! Vamos jogar!
            </button>
          </div>
        </div>
      )}

      {/* TitiA chat modal — offline: fala o que você digitar */}
      {showChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="button"
          tabIndex={0}
          onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setShowChat(false); }}
          aria-label="Fechar chat"
        >
          <section role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <header className="flex items-center gap-3 bg-gradient-to-r from-sky-500 via-blue-500 to-purple-500 p-4 text-white">
              <Image src="/assets/wildcard.png" width={88} height={72} alt="TitiA" className="h-16 w-20 object-contain" />
              <div className="flex-1">
                <h2 className="text-xl font-extrabold">Falar com a TitiA</h2>
                <p className="text-sm text-white/90">Escreva um texto e a TitiA vai ler para você. (Sandbox — sem IA)</p>
              </div>
              <button type="button" onClick={() => setShowChat(false)} className="h-10 w-10 rounded-full bg-white/20 text-xl font-bold hover:bg-white/30">×</button>
            </header>
            <div className="space-y-4 p-5">
              <label className="block font-bold text-slate-700">
                O que a TitiA deve falar?
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-sky-200 p-3 font-medium focus:border-sky-500 focus:outline-none"
                  placeholder="Ex: Muito bem! Vamos continuar."
                />
              </label>
              <button
                type="button"
                disabled={!chatText.trim()}
                onClick={handleSendChat}
                className="min-h-11 w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[.98] disabled:opacity-50"
              >
                TitiA falar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
