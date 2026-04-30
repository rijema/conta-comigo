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

export default function GuardianDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "bncc" | "ade">("overview");
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
    setActiveTab("overview");
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
            {/* Child header card */}
            <div className="bg-white rounded-3xl shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                  <p className="text-sm text-slate-500">
                    Idade: {selected.age ?? "—"} | TEA:{" "}
                    <span className="font-semibold capitalize">{selected.asdSupportLevel}</span>
                    {" "}| 🔑 Login: <span className="font-mono text-xs text-blue-500">{selected.email}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { icon: "🎯", value: `${selected.accuracy ?? 0}%`, label: "Precisão" },
                    { icon: "🔥", value: selected.currentStreak ?? 0, label: "Sequência" },
                    { icon: "⭐", value: selected.totalPoints ?? 0, label: "Pontos" },
                  ].map((s) => (
                    <div key={s.label} className="bg-purple-50 rounded-2xl px-3 py-2 text-center min-w-[64px]">
                      <div className="text-sm">{s.icon}</div>
                      <div className="font-bold text-purple-700 text-sm">{s.value}</div>
                      <div className="text-xs text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                {(["overview", "bncc", "ade"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {{ overview: "📊 Visão Geral", bncc: "📚 BNCC", ade: "🤖 IA" }[tab]}
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

                    {/* Skill profile */}
                    <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-4">Perfil de Habilidades</h3>
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

                    {/* Progress timeline */}
                    {detail.progressOverTime?.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-3">Evolução Recente</h3>
                        <div className="flex items-end gap-1 h-24">
                          {detail.progressOverTime.slice(-14).map((p: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-purple-400 rounded-t-sm transition-all"
                                style={{ height: `${Math.max(p.accuracy, 4)}%`, minHeight: "4px" }}
                                title={`${p.date}: ${p.accuracy}%`}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 text-center mt-1">Precisão por dia (últimas sessões)</p>
                      </div>
                    )}
                  </div>
                )}

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
