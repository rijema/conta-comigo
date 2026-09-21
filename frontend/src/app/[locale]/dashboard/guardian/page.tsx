"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChatNowCard } from "@/components/titia/chat-now-card";

const SKILL_LABELS: Record<string, string> = {
  visual: "👁️ Visual",
  auditive: "👂 Auditiva",
  logical: "🧠 Lógica",
  motor: "🖐️ Motora",
  sensory: "✨ Sensorial",
};

const BNCC_AREAS: Record<string, { label: string; color: string; emoji: string }> = {
  EF01MA01: { label: "Números no cotidiano", color: "#818cf8", emoji: "🔢" },
  EF01MA02: { label: "Contagem", color: "#34d399", emoji: "🔟" },
  EF01MA03: { label: "Comparação de quantidades", color: "#f59e0b", emoji: "⚖️" },
  EF01MA06: { label: "Adição", color: "#60a5fa", emoji: "➕" },
  EF01MA07: { label: "Montar e separar números", color: "#a78bfa", emoji: "🔣" },
  EF01MA08: { label: "Problemas de somar e tirar", color: "#f97316", emoji: "🧮" },
  EF01MA14: { label: "Formas planas", color: "#ec4899", emoji: "🔷" },
  EF02MA01: { label: "Comparar e ordenar números", color: "#10b981", emoji: "📊" },
  EF02MA05: { label: "Adição e subtração", color: "#eab308", emoji: "🧮" },
};

const ACTIVITY_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  counting:        { label: "Contagem", emoji: "🔢", color: "#818cf8" },
  multiple_choice: { label: "Múltipla Escolha", emoji: "☑️", color: "#34d399" },
  quiz:            { label: "Quiz", emoji: "❓", color: "#f59e0b" },
  drag_drop:       { label: "Arrasta e Solta", emoji: "🖐️", color: "#ec4899" },
  number_line:     { label: "Reta Numérica", emoji: "📏", color: "#60a5fa" },
};

const HOME_IDEAS: Record<string, string> = {
  EF01MA01: 'Contem juntos objetos da casa, um de cada vez.',
  EF01MA02: 'Separem pequenos grupos de objetos e contem cada grupo.',
  EF01MA03: 'Compare dois grupos de objetos: qual tem mais ou menos?',
  EF01MA06: 'Juntem dois pequenos grupos de objetos e contem o total.',
  EF01MA07: 'Montem o mesmo número de duas formas usando objetos.',
  EF01MA08: 'Criem uma história simples de juntar ou tirar objetos.',
  EF01MA14: 'Procurem círculos, quadrados e triângulos pela casa.',
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
  const { user, isLoading: authLoading, logout } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [longitudinal, setLongitudinal] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "bncc" | "ade" | "chat">("overview");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [addForm, setAddForm] = useState({ childName: "", age: "", childPassword: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [accessForm, setAccessForm] = useState({ childName: "", childPassword: "" });
  const [accessMessage, setAccessMessage] = useState("");
  const [accessSaving, setAccessSaving] = useState(false);
  const [guardianPasswords, setGuardianPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [guardianPasswordMessage, setGuardianPasswordMessage] = useState("");
  const [guardianPasswordSaving, setGuardianPasswordSaving] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const saveChildAccess = async () => {
    if (!selected || accessForm.childPassword.length < 4 || !accessForm.childName.trim()) return;
    setAccessSaving(true); setAccessMessage("");
    try {
      const token = authService.getStoredToken();
      const updated = await api.put<{ id: string; name: string }>(`/guardian/children/${selected.id}/access`, accessForm, token ?? undefined);
      setSelected((current: any) => current ? { ...current, name: updated.name } : current);
      setDetail((current: any) => current ? { ...current, name: updated.name } : current);
      setChildren((current) => current.map((child) => child.id === updated.id ? { ...child, name: updated.name } : child));
      setAccessForm({ childName: updated.name, childPassword: "" });
      setAccessMessage("Nome e senha da criança atualizados.");
    } catch { setAccessMessage("Não foi possível atualizar os dados de acesso."); }
    finally { setAccessSaving(false); }
  };

  const saveGuardianPassword = async () => {
    if (!guardianPasswords.currentPassword || guardianPasswords.newPassword.length < 8) return;
    setGuardianPasswordSaving(true); setGuardianPasswordMessage("");
    try {
      const token = authService.getStoredToken();
      await api.put('/guardian/password', guardianPasswords, token ?? undefined);
      setGuardianPasswords({ currentPassword: "", newPassword: "" });
      setGuardianPasswordMessage('Sua senha foi atualizada.');
    } catch { setGuardianPasswordMessage('Não foi possível alterar sua senha. Confira a senha atual.'); }
    finally { setGuardianPasswordSaving(false); }
  };

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
    setAccessForm({ childName: child.name ?? "", childPassword: "" });
    setAccessMessage("");
    setDetail(null);
    setLongitudinal(null);
    setDetailLoading(true);
    setActiveTab("overview" as any);
    setChatAnswer(null);
    setChatQuestion("");
    try {
      const [d, longitudinalReport] = await Promise.all([
        api.get<any>(`/guardian/children/${child.id}`, t ?? undefined),
        api.get<any>(`/guardian/children/${child.id}/longitudinal-analytics`, t ?? undefined),
      ]);
      setDetail(d);
      setLongitudinal(longitudinalReport);
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
            <p className="text-white text-sm">Olá, {user?.name?.split(" ")[0]}!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddChild(true)}
              className="px-4 py-2 bg-white/30 hover:bg-white/40 rounded-xl text-sm font-semibold transition-colors"
            >
              + Adicionar filho
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 bg-white/30 hover:bg-white/40 rounded-xl text-sm font-semibold transition-colors text-white hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <ChatNowCard />

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
                    { icon: "🎯", value: longitudinal?.observedData?.accuracy == null ? "—" : `${Math.round(longitudinal.observedData.accuracy * 100)}%`, label: "Precisão observada" },
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
                {(["overview", "charts", "bncc", "ade", "chat"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {({ overview: "📊 Visão Geral", charts: "📈 Gráficos", bncc: "📚 BNCC", ade: "🤖 IA", chat: "💬 Perguntar à IA" } as Record<string,string>)[tab]}
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
                        { icon: "🎮", label: "Atividades concluídas", value: longitudinal?.observedData?.activitiesCompleted ?? "—" },
                        { icon: "✅", label: "Respostas corretas", value: longitudinal?.observedData?.correctAnswers ?? "—" },
                        { icon: "📈", label: "Precisão observada", value: longitudinal?.observedData?.accuracy == null ? "Dados insuficientes" : `${Math.round(longitudinal.observedData.accuracy * 100)}%` },
                        { icon: "💡", label: "Pedidos de ajuda", value: longitudinal?.observedData?.hints ?? "—" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center border border-slate-100">
                          <div className="text-3xl mb-1">{s.icon}</div>
                          <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                          <div className="text-xs text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm" aria-labelledby="family-summary-title">
                      <h3 id="family-summary-title" className="text-lg font-bold text-slate-800">O que {detail.name} praticou</h3>
                      <p className="mt-1 text-sm text-slate-600">Um resumo das atividades registradas recentemente, sem classificar domínio.</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <p className="rounded-xl bg-purple-50 p-3 text-sm"><strong className="block text-xl text-purple-800">{detail.stats?.sessionCount ?? 0}</strong>Sessões nas últimas atividades</p>
                        <p className="rounded-xl bg-amber-50 p-3 text-sm"><strong className="block text-xl text-amber-800">{detail.totalPoints ?? 0}</strong>Pontos acumulados</p>
                        <p className="rounded-xl bg-emerald-50 p-3 text-sm"><strong className="block text-xl text-emerald-800">{detail.currentStreak ?? 0}</strong>Dias de sequência registrados</p>
                      </div>
                      <h4 className="mt-5 font-bold text-slate-700">🌱 Está aprendendo e praticando</h4>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(detail.practicedSkills ?? []).length === 0 && <p className="text-sm text-slate-500">Ainda não há atividades suficientes para este resumo.</p>}
                        {(detail.practicedSkills ?? []).map(({ code, count }: { code: string; count: number }) => (
                          <p key={code} className="rounded-xl border border-slate-200 p-3 text-sm"><strong className="block text-slate-800">{BNCC_AREAS[code]?.label ?? 'Matemática'}</strong>Praticou em {count} {count === 1 ? 'atividade' : 'atividades'}.</p>
                        ))}
                      </div>
                      <h4 className="mt-5 font-bold text-slate-700">✨ Já conseguiu em atividades recentes</h4>
                      <p className="mt-1 text-sm text-slate-600">Acertos observados, sem concluir que a habilidade foi dominada.</p>
                      <div className="mt-2 flex flex-wrap gap-2">{(detail.recentlySuccessfulSkills ?? []).length ? detail.recentlySuccessfulSkills.map(({ code, count }: { code: string; count: number }) => <span key={code} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{BNCC_AREAS[code]?.label ?? 'Matemática'} · {count} {count === 1 ? 'acerto' : 'acertos'}</span>) : <span className="text-sm text-slate-500">Ainda não há acertos registrados nesta amostra.</span>}</div>
                      <h4 className="mt-5 font-bold text-slate-700">🎮 Formatos mais usados</h4>
                      <p className="mt-1 text-sm text-slate-600">{(detail.favoriteFormats ?? []).length ? detail.favoriteFormats.map(({ type, count }: { type: string; count: number }) => `${ACTIVITY_TYPES[type]?.label ?? type} (${count})`).join(' · ') : 'Ainda sem atividades concluídas.'}</p>
                      <h4 className="mt-5 font-bold text-slate-700">🕘 Atividades recentes</h4>
                      <ul className="mt-2 space-y-2">{(detail.recentActivities ?? []).map((activity: any) => (
                        <li key={activity.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>{activity.title}</strong> · {new Date(activity.date).toLocaleDateString('pt-BR')} · {activity.correct ? 'Concluída com acerto' : 'Em prática'}</li>
                      ))}</ul>
                      {(detail.recentActivities ?? []).length === 0 && <p className="text-sm text-slate-500">Nenhuma atividade registrada ainda.</p>}
                      <h4 className="mt-5 font-bold text-slate-700">🏠 Ideia para praticar juntos</h4>
                      <p className="mt-1 rounded-xl bg-sky-50 p-3 text-sm text-slate-700">{HOME_IDEAS[detail.practicedSkills?.[0]?.code] ?? 'Escolham objetos da casa para contar e comparar juntos, no ritmo da criança.'}</p>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="child-access-title">
                      <h3 id="child-access-title" className="font-bold text-slate-800">Dados de acesso da criança</h3>
                      <p className="mt-1 text-sm text-slate-600">O nome é usado para entrar. Para alterar o nome, informe também uma nova senha curta.</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">Nome da criança<input value={accessForm.childName} onChange={(event) => setAccessForm((current) => ({ ...current, childName: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
                        <label className="text-sm font-semibold">Nova senha da criança<input type="password" minLength={4} value={accessForm.childPassword} onChange={(event) => setAccessForm((current) => ({ ...current, childPassword: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
                      </div>
                      <button type="button" onClick={() => void saveChildAccess()} disabled={accessSaving || !accessForm.childName.trim() || accessForm.childPassword.length < 4} className="mt-3 min-h-11 rounded-xl bg-purple-700 px-5 font-bold text-white disabled:opacity-50">{accessSaving ? 'Salvando...' : 'Salvar nome e senha'}</button>
                      {accessMessage && <p role="status" className="mt-2 text-sm text-slate-700">{accessMessage}</p>}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="guardian-password-title">
                      <h3 id="guardian-password-title" className="font-bold text-slate-800">Minha senha</h3>
                      <p className="mt-1 text-sm text-slate-600">Para trocar sua senha, informe a atual e escolha outra com pelo menos oito caracteres.</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">Senha atual<input type="password" autoComplete="current-password" value={guardianPasswords.currentPassword} onChange={(event) => setGuardianPasswords((current) => ({ ...current, currentPassword: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
                        <label className="text-sm font-semibold">Nova senha<input type="password" autoComplete="new-password" minLength={8} value={guardianPasswords.newPassword} onChange={(event) => setGuardianPasswords((current) => ({ ...current, newPassword: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
                      </div>
                      <button type="button" onClick={() => void saveGuardianPassword()} disabled={guardianPasswordSaving || !guardianPasswords.currentPassword || guardianPasswords.newPassword.length < 8} className="mt-3 min-h-11 rounded-xl bg-slate-800 px-5 font-bold text-white disabled:opacity-50">{guardianPasswordSaving ? 'Salvando...' : 'Atualizar minha senha'}</button>
                      {guardianPasswordMessage && <p role="status" className="mt-2 text-sm text-slate-700">{guardianPasswordMessage}</p>}
                    </section>

                    {longitudinal?.adaptations && (
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">🔄 Mudanças de atividade</h3>
                        <p className="text-sm text-slate-600">{longitudinal.adaptations.message}</p>
                      </div>
                    )}

                    {/* Contextual guidance for parents */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4">
                      <h3 className="font-bold text-purple-800 mb-2 text-sm">💡 O que esses dados significam?</h3>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li>🎯 <strong>Precisão observada</strong>: percentual de respostas corretas nas atividades registradas; não prova melhora isoladamente.</li>
                        <li>🔥 <strong>Sequência</strong>: dias consecutivos de atividades. Importante para criar hábito.</li>
                        <li>⭐ <strong>Pontos</strong>: recompensas acumuladas por acertos e esforço.</li>
                        <li>🔄 <strong>Adaptação</strong>: quando necessário, o sistema pode oferecer outro formato para o mesmo objetivo de aprendizagem.</li>
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
                  const progData = (longitudinal?.longitudinal?.sessions ?? [])
                    .filter((session: any) => session.accuracy != null)
                    .slice(-14)
                    .map((session: any) => ({
                      label: String(session.date ?? "").slice(5),
                      value: Math.round(session.accuracy * 100),
                    }));

                  const bnccEntries = Object.entries(detail.bnccProgress ?? {});
                  const bnccBarData = bnccEntries.slice(0, 8).map(([skill, d]: [string, any]) => ({
                    label: BNCC_AREAS[skill]?.emoji ?? "🔢",
                    value: d.attempted ?? 0,
                    color: BNCC_AREAS[skill]?.color ?? "#818cf8",
                  }));

                  return (
                    <div className="space-y-4">
                      {/* Line: precision over time */}
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">📈 Precisão observada por sessão</h3>
                        <p className="text-xs text-slate-400 mb-3">Últimas {progData.length} sessões registradas</p>
                        <LineChart data={progData} />
                        <p className="text-xs text-slate-400 text-center mt-1">% de acertos por dia</p>
                        <p className="text-xs text-slate-400 text-center mt-1">Esta linha, isoladamente, não demonstra melhora.</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">📚 Habilidades praticadas</h3>
                        <p className="text-xs text-slate-400 mb-3">Resumo simples das habilidades presentes nas atividades registradas.</p>
                        {(longitudinal?.learningProgress?.skillsPracticed ?? []).length === 0 ? (
                          <p className="text-sm text-slate-400">Dados ainda insuficientes.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">{longitudinal.learningProgress.skillsPracticed.map((skill: string) => <span key={skill} className="text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1">{skill}</span>)}</div>
                        )}
                      </div>

                      {/* Bar: BNCC skills attempted */}
                      {bnccBarData.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                          <h3 className="font-bold text-slate-700 mb-1">📚 Atividades por Habilidade BNCC</h3>
                          <p className="text-xs text-slate-400 mb-3">Quantidade de tentativas por código BNCC</p>
                          <BarChart data={bnccBarData} />
                          <ul className="mt-3 space-y-1 text-sm text-slate-600">{bnccEntries.slice(0, 8).map(([skill, data]: [string, any]) => <li key={skill}>{BNCC_AREAS[skill]?.emoji ?? '🔢'} {BNCC_AREAS[skill]?.label ?? 'Matemática'}: {data.attempted ?? 0} tentativas</li>)}</ul>
                        </div>
                      )}

                      {/* Activity type distribution */}
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-1">🎮 Formatos praticados</h3>
                        <p className="text-xs text-slate-400 mb-3">Formatos observados nas atividades concluídas por {detail.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(longitudinal?.observedData?.activityFormats ?? []).map(({ type, count }: any) => {
                            const info = ACTIVITY_TYPES[type] ?? { label: type, emoji: "🎮" };
                            return (
                            <div key={type} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-2xl">{info.emoji}</span>
                              <div>
                                <p className="text-xs font-bold text-slate-700">{info.label}</p>
                                <p className="text-xs text-slate-400">{count} atividade(s) concluída(s)</p>
                              </div>
                            </div>
                          )})}
                          {(longitudinal?.observedData?.activityFormats ?? []).length === 0 && <p className="text-sm text-slate-400">Dados ainda insuficientes.</p>}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* BNCC TAB */}
                {activeTab === "bncc" && (
                  <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-2">📚 Habilidades praticadas</h3>
                    <p className="text-xs text-slate-500 mb-4">Habilidades presentes nas atividades registradas. Este resumo não classifica domínio.</p>
                    {(longitudinal?.learningProgress?.skillsInDevelopment ?? []).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">Dados ainda insuficientes.</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(longitudinal?.learningProgress?.skillsInDevelopment ?? []).map((item: any) => (
                        <div key={item.skillCode} className="p-3 rounded-2xl border-2 text-center bg-slate-50 border-slate-200">
                          <p className="font-bold text-sm text-slate-700">{BNCC_AREAS[item.skillCode]?.label ?? 'Matemática'}</p>
                          <p className="text-xl mt-1">📖</p>
                          <p className="text-xs text-slate-500 mt-1">{item.state}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CHAT TAB */}
                {activeTab === "chat" && (() => {
                  const handleChat = async (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!chatQuestion.trim() || !selected) return;
                    setChatLoading(true);
                    setChatError(null);
                    const token = authService.getStoredToken();
                    try {
                      const res = await api.post<any>("/guardian/chat", {
                        question: chatQuestion.trim(),
                        childId: selected.id,
                      }, token ?? undefined);
                      setChatAnswer(res.answer);
                    } catch (err: any) {
                      setChatError("Não consegui processar sua pergunta. Tente novamente.");
                    } finally {
                      setChatLoading(false);
                    }
                  };

                  const SUGGESTED = [
                    `Como está o progresso de ${detail.name}?`,
                    `O que posso fazer em casa para ajudar ${detail.name}?`,
                    `Quais atividades são mais adequadas para o nível de ${detail.name}?`,
                    `Como a dificuldade é ajustada para ${detail.name}?`,
                  ];

                  return (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">🤖</span>
                          <div>
                            <h3 className="font-bold text-slate-800">Assistente IA</h3>
                            <p className="text-xs text-slate-500">Pergunte sobre {detail.name} — respondo com base nos dados reais</p>
                          </div>
                        </div>

                        {/* Suggested questions */}
                        {!chatAnswer && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Sugestões de perguntas</p>
                            <div className="grid grid-cols-1 gap-2">
                              {SUGGESTED.map((q) => (
                                <button
                                  key={q}
                                  onClick={() => setChatQuestion(q)}
                                  className="text-left text-sm px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 transition-colors font-medium"
                                >
                                  💬 {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Answer display */}
                        {chatAnswer && (
                          <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🦋</span>
                              <span className="text-xs font-bold text-purple-600 uppercase">Resposta da IA</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{chatAnswer}</p>
                            <p className="text-xs text-slate-400 mt-3 italic">
                              Baseado nos dados reais de {detail.name} · Gemini 1.5 Flash
                            </p>
                          </div>
                        )}

                        {/* Question form */}
                        <form onSubmit={handleChat} className="space-y-3">
                          <textarea
                            value={chatQuestion}
                            onChange={(e) => setChatQuestion(e.target.value)}
                            placeholder={`Ex: Como está o progresso de ${detail.name} esta semana?`}
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 outline-none text-sm resize-none transition-colors"
                          />
                          {chatError && <p className="text-red-500 text-xs">{chatError}</p>}
                          <div className="flex gap-2">
                            {chatAnswer && (
                              <button
                                type="button"
                                onClick={() => { setChatAnswer(null); setChatQuestion(""); setChatError(null); }}
                                className="flex-1 py-3 border-2 border-purple-200 text-purple-600 font-bold rounded-2xl hover:bg-purple-50 transition-colors text-sm"
                              >
                                🔄 Fazer outra pergunta
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={chatLoading || !chatQuestion.trim()}
                              className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-all text-sm flex items-center justify-center gap-2"
                            >
                              {chatLoading ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Pensando...
                                </>
                              ) : (
                                <>✨ Perguntar</>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Disclaimer */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                        <p className="text-xs text-amber-700">
                          ⚠️ <strong>Aviso:</strong> As respostas da IA são geradas automaticamente com base nos dados da plataforma.
                          Não substituem a orientação de profissionais de saúde especializados em TEA.
                        </p>
                      </div>
                    </div>
                  );
                })()}

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
                            <strong className="text-sm text-slate-700">{BNCC_AREAS[dec.recommendedBnccSkill]?.label ?? 'Atividade de matemática'}</strong>
                            <span className="text-xs text-slate-400">
                              {new Date(dec.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {dec.guardianExplanation && (
                            <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2">
                              💬 {dec.guardianExplanation}
                            </p>
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
