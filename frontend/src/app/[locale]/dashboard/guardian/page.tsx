"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const SKILL_LABELS: Record<string, string> = {
  visual: "👁️ Visual",
  auditive: "👂 Auditiva",
  logical: "🧠 Lógica",
  motor: "🖐️ Motora",
  sensory: "✨ Sensorial",
};

const BNCC_AREAS: Record<string, { label: string; color: string; emoji: string }> = {
  EF01MA01: { label: "Contagem 1-10", color: "#818cf8", emoji: "🔢" },
  EF01MA02: { label: "Contagem 1-20", color: "#34d399", emoji: "🔟" },
  EF01MA03: { label: "Comparação", color: "#f59e0b", emoji: "⚖️" },
  EF01MA04: { label: "Ordenação", color: "#ec4899", emoji: "📊" },
  EF01MA05: { label: "Adição", color: "#60a5fa", emoji: "➕" },
  EF01MA06: { label: "Subtração", color: "#f97316", emoji: "➖" },
  EF02MA01: { label: "Numeração", color: "#a78bfa", emoji: "🔣" },
  EF02MA03: { label: "Operações", color: "#10b981", emoji: "🧮" },
};

const ACTIVITY_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  counting:        { label: "Contagem", emoji: "🔢", color: "#818cf8" },
  multiple_choice: { label: "Múltipla Escolha", emoji: "☑️", color: "#34d399" },
  quiz:            { label: "Quiz", emoji: "❓", color: "#f59e0b" },
  drag_drop:       { label: "Arrasta e Solta", emoji: "🖐️", color: "#ec4899" },
  number_line:     { label: "Reta Numérica", emoji: "📏", color: "#60a5fa" },
};

/* ── SVG Bar Chart ──────────────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 300; const H = 120; const pad = 8;
  const barW = (W - pad * 2) / data.length - 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
      {data.map((d, i) => {
        const barH = Math.max(((d.value / max) * (H - 28)), 4);
        const x = pad + i * ((W - pad * 2) / data.length) + 3;
        const y = H - barH - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={d.color ?? "#818cf8"} opacity={0.85} />
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#64748b">{d.label}</text>
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#374151">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG Line Chart ─────────────────────────────────────────────── */
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return <p className="text-xs text-slate-400 text-center py-4">Dados insuficientes</p>;
  const W = 300; const H = 100; const pad = 16;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - (d.value / max) * (H - pad * 2);
    return `${x},${y}`;
  });
  const area = `M${pts.join("L")}L${W - pad},${H - pad}L${pad},${H - pad}Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - (d.value / max) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r={3} fill="#6366f1" />;
      })}
      <text x={pad} y={H - 2} fontSize={8} fill="#94a3b8">{data[0]?.label}</text>
      <text x={W - pad} y={H - 2} textAnchor="end" fontSize={8} fill="#94a3b8">{data[data.length - 1]?.label}</text>
    </svg>
  );
}

/* ── SVG Radar Chart ────────────────────────────────────────────── */
function RadarChart({ axes, values }: { axes: string[]; values: number[] }) {
  const n = axes.length;
  if (n < 3) return null;
  const cx = 90; const cy = 90; const r = 65;
  const levels = 4;
  const angleStep = (2 * Math.PI) / n;
  const pt = (i: number, radius: number) => {
    const a = angleStep * i - Math.PI / 2;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };
  const polyPts = values.map((v, i) => { const p = pt(i, (v / 100) * r); return `${p.x},${p.y}`; }).join(" ");
  return (
    <svg viewBox="0 0 180 180" className="w-40 h-40 mx-auto">
      {/* Grid rings */}
      {Array.from({ length: levels }).map((_, li) => {
        const rr = (r * (li + 1)) / levels;
        const ringPts = axes.map((_, i) => { const p = pt(i, rr); return `${p.x},${p.y}`; }).join(" ");
        return <polygon key={li} points={ringPts} fill="none" stroke="#e2e8f0" strokeWidth={1} />;
      })}
      {/* Spokes */}
      {axes.map((label, i) => {
        const p = pt(i, r);
        const lp = pt(i, r + 16);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#64748b">{label}</text>
          </g>
        );
      })}
      {/* Data polygon */}
      <polygon points={polyPts} fill="#818cf8" fillOpacity={0.35} stroke="#6366f1" strokeWidth={2} />
      {values.map((v, i) => {
        const p = pt(i, (v / 100) * r);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6366f1" />;
      })}
    </svg>
  );
}

export default function GuardianDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "bncc" | "ade">("overview");
  const [showAddChild, setShowAddChild] = useState(false);
  const [addForm, setAddForm] = useState({ childName: "", age: "", childPassword: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    if (user.role !== "guardian") { router.push(`/${locale}/dashboard`); return; }
    const token = authService.getStoredToken();
    if (!token) return;
    api.get<any[]>("/guardian/children-summary", token)
      .then((data) => {
        setChildren(data);
        if (data.length > 0) selectChild(data[0], token);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const selectChild = async (child: any, token?: string | null) => {
    const t = token ?? authService.getStoredToken();
    setSelected(child);
    setDetail(null);
    setDetailLoading(true);
    setActiveTab("overview" as any);
    try {
      const d = await api.get<any>(`/guardian/children/${child.id}`, t ?? undefined);
      setDetail(d);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const token = authService.getStoredToken();
    try {
      await api.post("/guardian/children", {
        childName: addForm.childName,
        age: parseInt(addForm.age),
        childPassword: addForm.childPassword,
      }, token ?? undefined);
      setShowAddChild(false);
      setAddForm({ childName: "", age: "", childPassword: "" });
      const fresh = await api.get<any[]>("/guardian/children-summary", token ?? undefined);
      setChildren(fresh);
      if (fresh.length > 0) selectChild(fresh[fresh.length - 1]);
    } catch (err: any) {
      setAddError(err?.message ?? "Erro ao adicionar criança");
    } finally {
      setAddLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">👪 Painel do Responsável</h1>
            <p className="text-purple-200 text-sm">Olá, {user?.name?.split(" ")[0]}!</p>
          </div>
          <button
            onClick={() => setShowAddChild(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors"
          >
            + Adicionar filho
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Children tabs */}
        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => selectChild(c)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  selected?.id === c.id
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-purple-300"
                }`}
              >
                🧒 {c.name}
              </button>
            ))}
          </div>
        )}

        {children.length === 0 && !showAddChild && (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-dashed border-purple-200">
            <div className="text-5xl mb-3">👶</div>
            <p className="text-slate-500 mb-4">Nenhuma criança vinculada ainda</p>
            <button
              onClick={() => setShowAddChild(true)}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700"
            >
              + Adicionar primeiro filho
            </button>
          </div>
        )}

        {selected && (
          <>
            {/* Child identity card */}
            <div className="bg-white rounded-3xl shadow-sm p-5">
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-200 to-indigo-300 flex items-center justify-center text-3xl font-bold text-white shadow-sm">
                    {selected.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                    <span className="text-sm text-slate-400 font-normal">filho(a) de</span>
                    <span className="text-sm font-semibold text-purple-700">{user?.name?.split(" ")[0]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {selected.age ? `${selected.age} anos` : "Idade não informada"}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                      TEA: {selected.asdSupportLevel ?? "mild"}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono">
                      🔑 {selected.email}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { icon: "🎯", value: `${selected.accuracy ?? 0}%`, label: "Precisão" },
                    { icon: "🔥", value: selected.currentStreak ?? 0, label: "Sequência" },
                    { icon: "⭐", value: selected.totalPoints ?? 0, label: "Pontos" },
                  ].map((s) => (
                    <div key={s.label} className="bg-purple-50 rounded-2xl px-3 py-2 text-center min-w-[56px]">
                      <div className="text-sm">{s.icon}</div>
                      <div className="font-bold text-purple-700 text-sm">{s.value}</div>
                      <div className="text-xs text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 flex-wrap">
                {(["overview", "charts", "bncc", "ade"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {({ overview: "📊 Visão Geral", charts: "📈 Gráficos", bncc: "📚 BNCC", ade: "🤖 IA" } as Record<string,string>)[tab]}
                  </button>
                ))}
              </div>
            </div>

            {detailLoading && (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
              </div>
            )}

            {!detailLoading && detail && (
              <>
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: "🎮", label: "Atividades", value: detail.stats?.totalAttempts ?? 0 },
                        { icon: "✅", label: "Acertos", value: detail.stats?.correct ?? 0 },
                        { icon: "📈", label: "Precisão", value: `${detail.stats?.accuracy ?? 0}%` },
                        { icon: "🔥", label: "Sequência", value: detail.currentStreak ?? 0 },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center border border-slate-100">
                          <div className="text-3xl mb-1">{s.icon}</div>
                          <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                          <div className="text-xs text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Contextual guidance for parents */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4">
                      <h3 className="font-bold text-purple-800 mb-2 text-sm">💡 O que esses dados significam?</h3>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li>🎯 <strong>Precisão</strong>: percentual de atividades respondidas corretamente. Acima de 60% indica bom desempenho.</li>
                        <li>🔥 <strong>Sequência</strong>: dias consecutivos de atividades. Importante para criar hábito.</li>
                        <li>⭐ <strong>Pontos</strong>: recompensas acumuladas por acertos e esforço.</li>
                        <li>🤖 <strong>IA Adaptativa</strong>: o sistema ajusta automaticamente a dificuldade ao perfil de {detail.name}.</li>
                      </ul>
                    </div>

                    {/* Skill profile bars */}
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-1">Perfil de Habilidades</h3>
                      <p className="text-xs text-slate-500 mb-3">Identificado pela IA com base nas atividades realizadas</p>
                      <div className="space-y-3">
                        {Object.keys(SKILL_LABELS).map((skill) => {
                          const isStrength = detail.strengths?.[skill];
                          const isWeakness = detail.weaknesses?.[skill];
                          return (
                            <div key={skill} className="flex items-center gap-3">
                              <span className="w-28 text-sm text-slate-600">{SKILL_LABELS[skill]}</span>
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${
                                  isStrength ? "bg-green-400 w-4/5"
                                  : isWeakness ? "bg-red-400 w-1/5"
                                  : "bg-slate-300 w-2/5"
                                }`} />
                              </div>
                              <span className={`text-xs font-semibold w-16 text-right ${
                                isStrength ? "text-green-600" : isWeakness ? "text-red-500" : "text-slate-400"
                              }`}>
                                {isStrength ? "Força" : isWeakness ? "Fraqueza" : "Neutro"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* CHARTS TAB */}
                {activeTab === "charts" && (() => {
                  const progData = (detail.progressOverTime ?? []).slice(-14).map((p: any) => ({
                    label: p.date?.slice(5) ?? "",
                    value: p.accuracy ?? 0,
                  }));

                  const skillAxes = Object.keys(SKILL_LABELS).map((k) => SKILL_LABELS[k].replace(/^\S+ /, ""));
                  const skillValues = Object.keys(SKILL_LABELS).map((k) => {
                    if (detail.strengths?.[k]) return 80;
                    if (detail.weaknesses?.[k]) return 20;
                    return 45;
                  });

                  const bnccEntries = Object.entries(detail.bnccProgress ?? {});
                  const bnccBarData = bnccEntries.slice(0, 8).map(([skill, d]: [string, any]) => ({
                    label: skill.replace("EF0", "").replace("MA", ""),
                    value: d.attempted ?? 0,
                    color: BNCC_AREAS[skill]?.color ?? "#818cf8",
                  }));

                  return (
                    <div className="space-y-4">
                      {/* Line: precision over time */}
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">📈 Evolução da Precisão</h3>
                        <p className="text-xs text-slate-400 mb-3">Últimas {progData.length} sessões registradas</p>
                        <LineChart data={progData} />
                        <p className="text-xs text-slate-400 text-center mt-1">% de acertos por dia</p>
                      </div>

                      {/* Radar: skill profile */}
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">🕸️ Radar de Habilidades</h3>
                        <p className="text-xs text-slate-400 mb-3">Perfil multidimensional de {detail.name}</p>
                        <RadarChart axes={skillAxes} values={skillValues} />
                        <div className="flex gap-4 justify-center mt-3 text-xs">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" />Força</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />Neutro</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Fraqueza</span>
                        </div>
                      </div>

                      {/* Bar: BNCC skills attempted */}
                      {bnccBarData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                          <h3 className="font-bold text-slate-700 mb-1">📚 Atividades por Habilidade BNCC</h3>
                          <p className="text-xs text-slate-400 mb-3">Quantidade de tentativas por código BNCC</p>
                          <BarChart data={bnccBarData} />
                        </div>
                      )}

                      {/* Activity type distribution */}
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">🎮 Tipos de Jogo na Plataforma</h3>
                        <p className="text-xs text-slate-400 mb-3">Variedade de formatos disponíveis para {detail.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(ACTIVITY_TYPES).map(([type, info]) => (
                            <div key={type} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-2xl">{info.emoji}</span>
                              <div>
                                <p className="text-xs font-bold text-slate-700">{info.label}</p>
                                <p className="text-xs text-slate-400">Formato interativo</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* BNCC TAB */}
                {activeTab === "bncc" && (
                  <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-2">📚 Progresso BNCC</h3>
                    <p className="text-xs text-slate-500 mb-4">Habilidades da Base Nacional Comum Curricular trabalhadas pela IA</p>
                    {Object.keys(detail.bnccProgress ?? {}).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">Nenhuma habilidade BNCC registrada ainda. Comece as atividades!</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(detail.bnccProgress ?? {}).map(([skill, data]: [string, any]) => (
                        <div key={skill} className={`p-3 rounded-2xl border-2 text-center ${
                          data.mastered
                            ? "bg-green-50 border-green-300"
                            : "bg-slate-50 border-slate-200"
                        }`}>
                          <p className="font-bold text-xs text-slate-700">{skill}</p>
                          <p className="text-xl mt-1">{data.mastered ? "✅" : "📖"}</p>
                          <p className="text-xs text-slate-500 mt-1">{data.attempted ?? 0} atividades</p>
                          {data.mastered && <p className="text-xs text-green-600 font-semibold">Dominado!</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADE TAB */}
                {activeTab === "ade" && (
                  <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-1">🤖 Decisões da IA Adaptativa</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      O sistema de IA escolhe atividades personalizadas para {detail.name} com base no perfil de aprendizagem.
                    </p>
                    {detail.recentAdeDecisions?.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">Nenhuma decisão registrada ainda</p>
                    )}
                    <div className="space-y-3">
                      {detail.recentAdeDecisions?.map((dec: any) => (
                        <div key={dec.id} className="border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                {dec.recommendedDifficulty ?? "—"}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                {dec.recommendedModality ?? "—"}
                              </span>
                              {dec.recommendedBnccSkill && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                  {dec.recommendedBnccSkill}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(dec.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {dec.xaiLog?.finalReason && (
                            <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">
                              💬 {dec.xaiLog.finalReason}
                            </p>
                          )}
                          {dec.xaiLog?.confidence != null && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-slate-500">Confiança:</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
                                  style={{ width: `${Math.round((dec.xaiLog.confidence ?? 0) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                {Math.round((dec.xaiLog.confidence ?? 0) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Add child modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-lg">👶 Adicionar filho</h2>
              <button onClick={() => setShowAddChild(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddChild} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Nome da criança</label>
                <input
                  type="text"
                  value={addForm.childName}
                  onChange={(e) => setAddForm((f) => ({ ...f, childName: e.target.value }))}
                  placeholder="Ex: Kevin"
                  required
                  className="w-full mt-1 px-4 py-3 rounded-2xl border-2 border-slate-200 outline-none focus:border-purple-400 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Idade</label>
                <input
                  type="number"
                  min={4} max={12}
                  value={addForm.age}
                  onChange={(e) => setAddForm((f) => ({ ...f, age: e.target.value }))}
                  required
                  className="w-full mt-1 px-4 py-3 rounded-2xl border-2 border-slate-200 outline-none focus:border-purple-400 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">🔑 Senha da criança</label>
                <input
                  type="password"
                  value={addForm.childPassword}
                  onChange={(e) => setAddForm((f) => ({ ...f, childPassword: e.target.value }))}
                  placeholder="Mínimo 4 caracteres"
                  minLength={4}
                  required
                  className="w-full mt-1 px-4 py-3 rounded-2xl border-2 border-slate-200 outline-none focus:border-purple-400 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">A criança usará essa senha para entrar</p>
              </div>
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddChild(false)}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-[2] py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-50"
                >
                  {addLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
