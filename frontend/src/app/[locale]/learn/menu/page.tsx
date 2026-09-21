"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { ArasaacLibraryDialog } from "@/components/arasaac/arasaac-library-dialog";

/* ── Island themes — mapped to pictogram concepts with semantic meanings ── */
const ISLAND_THEMES = [
  { grad: "from-yellow-300 to-orange-300",  headerGrad: "from-orange-400 to-amber-400",  border: "border-orange-300",  pictogramId: "library.star", label: "Ilha do Sol",     sub: "Contagem" },
  { grad: "from-blue-300 to-cyan-300",      headerGrad: "from-blue-500 to-cyan-400",     border: "border-blue-300",    pictogramId: "arasaac.16165", label: "Ilha do Mar",     sub: "Adição" },
  { grad: "from-green-300 to-emerald-300",  headerGrad: "from-green-500 to-emerald-400", border: "border-green-300",   pictogramId: "library.learn", label: "Ilha da Floresta", sub: "Subtração" },
  { grad: "from-purple-300 to-fuchsia-300", headerGrad: "from-purple-500 to-pink-400",   border: "border-purple-300",  pictogramId: "arasaac.15532", label: "Ilha das Flores",  sub: "Comparação" },
  { grad: "from-red-300 to-rose-300",       headerGrad: "from-red-500 to-rose-400",      border: "border-red-300",     pictogramId: "arasaac.15195", label: "Ilha das Maçãs",  sub: "Formas" },
  { grad: "from-teal-300 to-sky-300",       headerGrad: "from-teal-500 to-sky-400",      border: "border-teal-300",    pictogramId: "library.play", label: "Ilha dos Animais", sub: "Medidas" },
  { grad: "from-indigo-300 to-violet-300",  headerGrad: "from-indigo-500 to-violet-400", border: "border-indigo-300",  pictogramId: "library.diamond", label: "Ilha Mágica",     sub: "Sequências" },
  { grad: "from-pink-300 to-rose-200",      headerGrad: "from-pink-500 to-rose-400",     border: "border-pink-300",    pictogramId: "arasaac.44702", label: "Ilha do Amor",    sub: "Ordenação" },
];

const CARD_CONFIG: Record<string, { pictogramId: string; label: string }> = {
  counting:        { pictogramId: "mathematics.numbers", label: "Contagem com escolha" },
  multiple_choice: { pictogramId: "activity.choose", label: "Escolher" },
  quiz:            { pictogramId: "activity.look", label: "Perguntas" },
  drag_drop:       { pictogramId: "activity.drag", label: "Arrastar" },
  number_line:     { pictogramId: "mathematics.order", label: "Reta Numérica" },
};

const AI_QUESTIONS = [
  "Por que aprender matemática é tão bom?",
  "Como eu posso melhorar nas atividades?",
  "O que são os números e para que servem?",
  "Por que contar é divertido?",
  "Como a matemática me ajuda no dia a dia?",
];

export default function ActivityMenuPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [treeData, setTreeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [showArasaac, setShowArasaac] = useState(false);

  const [showAI, setShowAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) { router.replace(`/${locale}/auth/login`); return; }
    api.get<any>("/activities/tree", token)
      .then((data) => {
        setTreeData(data);
        if (data.tree?.[0]) setExpandedSkill(data.tree[0].skill);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [locale, router]);

  const handleAsk = async (q?: string) => {
    const question = q ?? aiQuestion.trim();
    if (!question) return;
    setAiQuestion(question);
    setAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    const token = authService.getStoredToken();
    try {
      const res = await api.post<any>("/guardian/child-chat", { question }, token ?? undefined);
      setAiAnswer(res.answer ?? res);
    } catch {
      setAiError("Não consegui responder agora. Tente novamente! 💙");
    } finally {
      setAiLoading(false);
    }
  };

  const openVisualLibrary = () => {
    setShowArasaac(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "linear-gradient(135deg,#fce7f3,#e0f2fe,#d1fae5)" }}>
        <div className="text-center" role="status" aria-live="polite">
          <div className="text-8xl mb-4">🗺️</div>
          <p className="text-2xl font-extrabold text-blue-700">Preparando o mapa...</p>
          <p className="text-gray-500 mt-1 text-sm">As aventuras chegam em instantes!</p>
        </div>
      </div>
    );
  }

  const totalDone  = treeData?.completedTotal ?? 0;
  const totalAll   = treeData?.totalActivities ?? 0;
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const hasAI      = (treeData?.ontologyInferences?.length ?? 0) > 0;
  const firstName  = user?.name?.split(" ")[0] ?? "Aventureiro";
  const groups: any[] = treeData?.tree ?? [];

  /* Build rows of 2 for sine layout */
  const rows: any[][] = [];
  for (let i = 0; i < groups.length; i += 2) {
    rows.push(groups.slice(i, i + 2));
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(155deg,#fef9c3 0%,#fce7f3 40%,#dbeafe 100%)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${locale}/learn`)}
              className="min-h-10 rounded-2xl bg-blue-100 hover:bg-blue-200 flex items-center gap-1 px-2 transition-colors"
            >
              <ArasaacPictogram conceptId="navigation.start" showLabel={false} imageClassName="w-6 h-6" />
              <span className="text-xs font-bold">Jogar</span>
            </button>
            <div>
              <h1 className="text-base font-extrabold text-blue-700 leading-tight">🗺️ Meu Mapa de Aventuras</h1>
              <p className="text-xs text-gray-500">Olá, <strong>{firstName}</strong>! Escolha uma ilha!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{totalDone}/{totalAll}</span>
            <button
              onClick={openVisualLibrary}
              className="hidden sm:flex min-h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-400 items-center gap-1 px-2 shadow-sm hover:scale-105 transition-transform"
            >
              <ArasaacPictogram conceptId="library.learn" showLabel={false} imageClassName="w-6 h-6" />
              <span className="text-xs font-bold text-white">Figuras</span>
            </button>
            <button
              onClick={() => { setShowAI(true); setAiAnswer(null); setAiQuestion(""); }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl shadow-sm hover:scale-105 transition-transform"
              title="Perguntar à TitIA"
            >🦋</button>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">Sair</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%`, background: "linear-gradient(90deg,#818cf8,#ec4899,#f59e0b,#34d399)" }} />
        </div>
      </header>

      {/* ── TitIA full-width banner ── */}
      <button
        onClick={() => { setShowAI(true); setAiAnswer(null); setAiQuestion(""); }}
        className="w-full text-left block"
      >
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7,#ec4899,#f43f5e,#f97316,#eab308,#22c55e,#06b6d4,#3b82f6,#7c3aed)", backgroundSize: "300% 100%", animation: "rainbowBg 6s linear infinite" }}>
          <div className="relative flex items-center gap-4 px-6 py-3 max-w-5xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">🦋</div>
            <div className="flex-1 min-w-0">
             <p className="font-extrabold text-white text-sm md:text-base">TitIA escolheu para você!</p>
              <p className="text-white/85 text-xs hidden sm:block">Sua jornada foi personalizada com carinho pela inteligência artificial!</p>
            </div>
            <div className="flex-shrink-0 bg-white/25 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
             Fazer uma pergunta
            </div>
          </div>
        </div>
      </button>

      <style>{`
        @keyframes rainbowBg {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>

      {/* ── ARASAAC quick strip ── */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <button
          onClick={openVisualLibrary}
          className="w-full bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-200 rounded-3xl px-5 py-3 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className="flex gap-1.5 flex-shrink-0">
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center overflow-hidden">
                <ArasaacPictogram conceptId={`number.${value}`} showLabel={false} imageClassName="w-7 h-7" />
              </div>
            ))}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-extrabold text-orange-700 text-sm">Aprender com a TitiA</p>
            <p className="text-orange-500 text-xs hidden sm:block">Toque para ver os números e símbolos matemáticos</p>
          </div>
          <span className="text-orange-500 text-lg flex-shrink-0">→</span>
        </button>
      </div>

      {/* ── Sine-wave 2-column grid ── */}
      <main className="max-w-7xl mx-auto px-4 pt-6 pb-20">
        {rows.map((row, rowIdx) => {
          /* odd rows: right-aligned = mt-8 on wrapper; even rows: normal */
          const isOdd = rowIdx % 2 === 1;

          return (
            <div key={rowIdx}>
              {/* Sine-curve SVG path connector between rows */}
              {rowIdx > 0 && (
                <div className="w-full overflow-hidden" style={{ height: 56 }}>
                  <svg viewBox="0 0 400 56" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id={`sg${rowIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        {["#818cf8","#a855f7","#ec4899","#f43f5e","#f97316","#eab308","#22c55e"].map((c,i)=>(
                          <stop key={i} offset={`${i*16.6}%`} stopColor={c} />
                        ))}
                      </linearGradient>
                    </defs>
                    {/* Wave path: from right side (row above) curving down-left to left side (new row) or vice-versa */}
                    <path
                      d={isOdd
                        ? "M 380 4 C 280 4, 220 52, 120 52 L 20 52"
                        : "M 20 4 C 120 4, 180 52, 280 52 L 380 52"}
                      fill="none"
                      stroke={`url(#sg${rowIdx})`}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Animated dot travelling the path */}
                    {[0,0.33,0.66].map((offset, i) => (
                      <circle key={i} r="5" fill="white" stroke={`url(#sg${rowIdx})`} strokeWidth="2">
                        <animateMotion dur="2s" repeatCount="indefinite" begin={`${offset}s`}
                          path={isOdd
                            ? "M 380 4 C 280 4, 220 52, 120 52 L 20 52"
                            : "M 20 4 C 120 4, 180 52, 280 52 L 380 52"} />
                      </circle>
                    ))}
                  </svg>
                </div>
              )}

              {/* Row of islands */}
              <div className={`grid grid-cols-2 gap-4 ${isOdd ? "mt-4" : "mt-0"}`}
                style={{ marginLeft: isOdd ? "2rem" : "0", marginRight: isOdd ? "0" : "2rem" }}
              >
                {row.map((group: any, ci: number) => {
                  const gi = rowIdx * 2 + ci;
                  const theme  = ISLAND_THEMES[gi % ISLAND_THEMES.length];
                  const isOpen = expandedSkill === group.skill;
                  const isDimmed = expandedSkill !== null && !isOpen;
                  const pct    = group.totalActivities > 0 ? Math.round((group.completedCount / group.totalActivities) * 100) : 0;
                  const allDone = group.completedCount >= group.totalActivities && group.totalActivities > 0;

                  /* Subtitle: use theme sub or fallback to skill name */
                  const skillPt = theme.sub;

                  return (
                    <div key={group.skill} className={`rounded-[2rem] border-4 ${theme.border} overflow-hidden bg-gradient-to-br ${theme.grad} transition-all duration-300 ${isOpen ? "scale-[1.02] shadow-2xl" : isDimmed ? "scale-[.98] opacity-45 shadow-sm" : "shadow-xl"}`}>
                      <button
                        onClick={() => setExpandedSkill(isOpen ? null : group.skill)}
                        className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[.99] motion-reduce:transform-none"
                        aria-expanded={isOpen}
                      >
                        <div className={`bg-gradient-to-r ${theme.headerGrad} px-4 py-3 flex items-center justify-between gap-2`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
                              <ArasaacPictogram 
                                conceptId={theme.pictogramId} 
                                showLabel={false}
                                imageClassName="w-8 h-8"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-white text-sm drop-shadow truncate">{theme.label}</p>
                              <p className="text-white/80 text-xs font-semibold truncate">{skillPt}</p>
                              <p className="text-white text-xs font-extrabold">{group.skill === 'Exploracao' ? 'Sem vínculo BNCC validado' : `BNCC ${group.skill}`}</p>
                              <p className="text-white/65 text-xs">{group.completedCount}/{group.totalActivities}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {allDone && <span className="text-xl text-yellow-300">•</span>}
                            <span className="text-white text-base">{isOpen ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/20">
                          <div className="h-full bg-white/70 rounded-r-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-2.5 space-y-2">
                          {group.activities.map((act: any) => {
                            const cfg  = CARD_CONFIG[act.type] ?? { emoji: "🎮", label: "Jogo", mascot: "🐶" };
                            const isRec = act.recommended && !act.completed;

                            return (
                              <div key={act.id}
                                className={`relative rounded-2xl border-2 p-3 bg-white/85 shadow-sm transition-all ${
                                  act.completed ? "opacity-60 border-gray-200" :
                                  isRec ? "border-purple-300 ring-2 ring-purple-200" : "border-white/70"
                                }`}
                              >
                                {isRec && (
                                  <span className="absolute -top-2.5 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow">
                                    TitIA recomenda!
                                  </span>
                                )}
                                {act.completed && (
                                  <span className="absolute -top-2.5 right-2 bg-green-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow">
                                    Concluído
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                                    <ArasaacPictogram 
                                      conceptId={cfg.pictogramId} 
                                      showLabel={false}
                                      imageClassName="w-8 h-8"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-slate-800 text-xs leading-tight line-clamp-2">{act.title}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{cfg.label}</span>
                                      {(act.bnccSkills ?? [group.skill]).map((code: string) => (
                                        <span key={code} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{code}</span>
                                      ))}
                                    </div>
                                  </div>
                                  {!act.completed ? (
                                    <button
                                      onClick={() => router.push(`/${locale}/learn?activityId=${act.id}`)}
                                      className={`flex-shrink-0 min-h-11 rounded-2xl flex items-center gap-1 px-2 text-white text-sm font-bold shadow-md active:scale-95 transition-transform ${
                                        isRec ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-600"
                                      }`}
                                    >
                                      <ArasaacPictogram conceptId="navigation.start" showLabel={false} imageClassName="w-5 h-5" />
                                      <span>Começar</span>
                                    </button>
                                  ) : (
                                    <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                      <ArasaacPictogram conceptId="state.correct" showLabel={false} imageClassName="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* If odd number of groups on last row, fill placeholder */}
                {row.length === 1 && <div />}
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">🗺️</div>
            <p className="text-xl font-bold text-gray-600">Nenhuma atividade ainda!</p>
          </div>
        )}

        {groups.length > 0 && (
          <div className="text-center mt-8">
            <div className="inline-flex flex-col items-center gap-2 bg-white/70 rounded-3xl px-10 py-6 shadow-md border-2 border-yellow-200">
              <span className="text-5xl">🏆</span>
              <p className="font-extrabold text-yellow-700">Fim do mapa!</p>
              <p className="text-xs text-slate-500">Complete todas as ilhas para ganhar o troféu!</p>
            </div>
          </div>
        )}
      </main>

      {/* ── TitIA floating button ── */}
      <button
        onClick={() => { setShowAI(true); setAiAnswer(null); setAiQuestion(""); }}
        className="fixed bottom-6 right-6 z-30 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
        title="Perguntar à TitIA"
      >🦋</button>

      {/* ── TitIA Chat Modal ── */}
      {showAI && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          role="button"
          tabIndex={0}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAI(false); }}
          onKeyDown={(e) => { if ((e.key === 'Escape' || e.key === 'Enter') && e.target === e.currentTarget) setShowAI(false); }}
          aria-label="Fechar chat"
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ maxHeight: "90vh" }}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-3xl flex-shrink-0">🦋</div>
              <div className="flex-1">
               <p className="font-extrabold text-white text-base">TitIA</p>
                <p className="text-white/80 text-xs">Pergunte qualquer coisa sobre aprender!</p>
              </div>
              <button onClick={() => setShowAI(false)} className="w-9 h-9 bg-white/30 hover:bg-white/40 rounded-xl flex items-center justify-center text-white text-lg">×</button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {aiAnswer && (
                <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🦋</span>
                    <span className="text-xs font-extrabold text-purple-600 uppercase">TitIA respondeu</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
                </div>
              )}
              {!aiAnswer && (
                <div className="mb-4">
                  <p className="text-xs font-extrabold text-slate-400 uppercase mb-2.5">Perguntas especiais para você</p>
                  <div className="space-y-2">
                    {AI_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => handleAsk(q)}
                        className="w-full text-left text-sm px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-100 text-purple-700 hover:border-purple-300 transition-colors font-semibold">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiError && <div className="mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-xs text-red-600">{aiError}</div>}
              <div className="space-y-2">
                <textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Escreva sua pergunta aqui..." rows={2}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 outline-none text-sm resize-none transition-colors" />
                <div className="flex gap-2">
                  {aiAnswer && (
                    <button onClick={() => { setAiAnswer(null); setAiQuestion(""); setAiError(null); }}
                      className="flex-1 py-3 border-2 border-purple-200 text-purple-600 font-bold rounded-2xl hover:bg-purple-50 text-sm flex items-center justify-center gap-2">
                      <ArasaacPictogram conceptId="navigation.repeat" showLabel={false} imageClassName="w-4 h-4" />
                      <span>Outra pergunta</span>
                    </button>
                  )}
                  <button onClick={() => handleAsk()} disabled={aiLoading || !aiQuestion.trim()}
                    className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold rounded-2xl hover:opacity-90 disabled:opacity-40 text-sm flex items-center justify-center gap-2 shadow-md">
                    {aiLoading ? <><span aria-hidden="true">Pensando...</span></> : <>
                      <ArasaacPictogram conceptId="activity.listen" showLabel={false} imageClassName="w-4 h-4" />
                      <span>Perguntar à TitIA</span>
                    </>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ArasaacLibraryDialog open={showArasaac} onClose={() => setShowArasaac(false)} />
    </div>
  );
}
