"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const SKILLS = ["visual", "auditive", "logical", "motor", "sensory"] as const;
type Skill = typeof SKILLS[number];
const SKILL_LABELS: Record<Skill, string> = {
  visual: "👁️ Visual",
  auditive: "👂 Auditiva",
  logical: "🧠 Lógica",
  motor: "🖐️ Motora",
  sensory: "✨ Sensorial",
};
const SUPPORT_LEVELS = [
  { value: "mild", label: "Leve", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "moderate", label: "Moderado", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "strong", label: "Intenso", color: "bg-red-100 text-red-700 border-red-300" },
];

export default function EducatorDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adeHistory, setAdeHistory] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "ade" | "report">("overview");
  const [savedMsg, setSavedMsg] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    const role = user.role?.toLowerCase();
    if (role !== "professional" && role !== "educator") {
      router.push(`/${locale}/dashboard`);
      return;
    }
    const token = authService.getStoredToken();
    if (!token) return;
    api.get<any[]>("/educator/learners", token)
      .then((data) => {
        setLearners(data);
        if (data.length > 0) handleSelectLearner(data[0], token);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleSelectLearner = async (learner: any, token?: string | null) => {
    const t = token ?? authService.getStoredToken();
    setSelected(learner);
    setProfileLoading(true);
    setProfile(null);
    setAdeHistory([]);
    setReport(null);
    setActiveTab("overview");
    try {
      const [prof, ade] = await Promise.all([
        api.get<any>(`/educator/learners/${learner.id}/profile`, t ?? undefined),
        api.get<any[]>(`/educator/learners/${learner.id}/ade-history`, t ?? undefined),
      ]);
      setProfile(prof);
      setAdeHistory(ade);
    } catch (e) { console.error(e); }
    finally { setProfileLoading(false); }
  };

  const handleLoadReport = async () => {
    const token = authService.getStoredToken();
    if (!selected || !token) return;
    try {
      const data = await api.get<any>(`/educator/learners/${selected.id}/report`, token);
      setReport(data);
      setActiveTab("report");
    } catch (e) { console.error(e); }
  };

  const handleSaveSkills = async (updates: any) => {
    const token = authService.getStoredToken();
    if (!selected || !token) return;
    setSaving(true);
    try {
      await api.put(`/educator/learners/${selected.id}/skills`, updates, token);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
      // Refresh profile
      const prof = await api.get<any>(`/educator/learners/${selected.id}/profile`, token);
      setProfile(prof);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handlePrint = () => { window.print(); };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🎓 Painel do Profissional</h1>
            <p className="text-indigo-200 text-sm">Olá, {user?.name?.split(" ")[0]}!</p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="text-indigo-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 flex gap-4">
        {/* Learner sidebar */}
        <aside className="w-56 flex-shrink-0 print:hidden">
          <div className="bg-white rounded-2xl shadow-sm p-3">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 px-1">Alunos ({learners.length})</p>
            <div className="space-y-1">
              {learners.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleSelectLearner(l)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors text-sm ${
                    selected?.id === l.id
                      ? "bg-indigo-50 border-2 border-indigo-300 text-indigo-800 font-semibold"
                      : "hover:bg-slate-50 border-2 border-transparent text-slate-700"
                  }`}
                >
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{l.asdSupportLevel}</div>
                </button>
              ))}
              {learners.length === 0 && (
                <p className="text-xs text-slate-400 px-2 py-4 text-center">Nenhum aluno cadastrado</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {!selected && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="text-5xl mb-3">👈</div>
              <p className="text-slate-500">Selecione um aluno para ver os dados</p>
            </div>
          )}

          {selected && (
            <>
              {/* Learner header */}
              <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                    <p className="text-sm text-slate-500">
                      Idade: {selected.age ?? "—"} | Nível de suporte:{" "}
                      <span className="font-semibold capitalize">{selected.asdSupportLevel}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadReport}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors print:hidden"
                    >
                      📄 Gerar Relatório
                    </button>
                    {report && (
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors print:hidden"
                      >
                        🖨️ Imprimir
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 print:hidden">
                  {(["overview", "skills", "ade", "report"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        activeTab === tab
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {{ overview: "📊 Visão Geral", skills: "🧠 Habilidades", ade: "🤖 IA/ADE", report: "📄 Relatório" }[tab]}
                    </button>
                  ))}
                </div>
              </div>

              {profileLoading && (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
                </div>
              )}

              {!profileLoading && profile && (
                <>
                  {/* OVERVIEW TAB */}
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      {/* Stats row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { icon: "🎯", label: "Tentativas", value: profile.stats?.totalAttempts ?? 0 },
                          { icon: "✅", label: "Acertos", value: profile.stats?.correctAttempts ?? 0 },
                          { icon: "📈", label: "Precisão", value: `${profile.stats?.accuracy ?? 0}%` },
                          { icon: "🔥", label: "Sequência", value: profile.currentStreak ?? 0 },
                        ].map((s) => (
                          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Skill strengths/weaknesses visual */}
                      <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h3 className="font-bold text-slate-700 mb-4">Perfil de Habilidades</h3>
                        <div className="space-y-3">
                          {SKILLS.map((skill) => {
                            const isStrength = profile.strengths?.[skill];
                            const isWeakness = profile.weaknesses?.[skill];
                            return (
                              <div key={skill} className="flex items-center gap-3">
                                <span className="w-28 text-sm text-slate-600">{SKILL_LABELS[skill]}</span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isStrength ? "bg-green-400 w-4/5" : isWeakness ? "bg-red-400 w-1/5" : "bg-slate-300 w-2/5"
                                    }`}
                                  />
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

                      {/* BNCC Progress */}
                      {Object.keys(profile.bnccProgress ?? {}).length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                          <h3 className="font-bold text-slate-700 mb-4">Progresso BNCC</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(profile.bnccProgress).map(([skill, data]: [string, any]) => (
                              <div
                                key={skill}
                                className={`p-3 rounded-xl border-2 text-center ${
                                  data.mastered ? "bg-green-50 border-green-300" : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <p className="text-xs font-bold text-slate-700">{skill}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {data.attempted} tentativas{data.mastered ? " ✅" : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SKILLS TAB */}
                  {activeTab === "skills" && (
                    <SkillEditor
                      profile={profile}
                      onSave={handleSaveSkills}
                      saving={saving}
                      savedMsg={savedMsg}
                    />
                  )}

                  {/* ADE TAB */}
                  {activeTab === "ade" && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                      <h3 className="font-bold text-slate-700 mb-4">
                        🤖 Histórico de Decisões ADE — IA Adaptativa
                      </h3>
                      {adeHistory.length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-8">Nenhuma decisão registrada ainda</p>
                      )}
                      <div className="space-y-3">
                        {adeHistory.map((dec: any) => (
                          <div key={dec.id} className="border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <div className="flex gap-2 flex-wrap">
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                                  {dec.recommendedDifficulty}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                  {dec.recommendedModality}
                                </span>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                  {dec.recommendedBnccSkill}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {new Date(dec.createdAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            {dec.xaiLog && (
                              <div className="text-xs text-slate-600 space-y-1">
                                <p><span className="font-semibold">Raciocínio:</span> {dec.xaiLog.finalReason}</p>
                                <p><span className="font-semibold">Confiança:</span> {Math.round((dec.xaiLog.confidence ?? 0) * 100)}%</p>
                                {dec.xaiLog.rulesFired?.length > 0 && (
                                  <p><span className="font-semibold">Regras:</span> {dec.xaiLog.rulesFired.join("; ")}</p>
                                )}
                                {dec.xaiLog.ontologyInferences?.length > 0 && (
                                  <p><span className="font-semibold">Ontologia:</span> {dec.xaiLog.ontologyInferences[0]}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REPORT TAB */}
                  {activeTab === "report" && report && (
                    <ReportView report={report} onPrint={handlePrint} />
                  )}
                  {activeTab === "report" && !report && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-slate-500 mb-4">Clique em "Gerar Relatório" para criar o relatório completo</p>
                      <button
                        onClick={handleLoadReport}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                      >
                        Gerar Relatório
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SkillEditor({ profile, onSave, saving, savedMsg }: {
  profile: any;
  onSave: (data: any) => void;
  saving: boolean;
  savedMsg: boolean;
}) {
  const [strengths, setStrengths] = useState<Record<string, boolean>>(profile.strengths ?? {});
  const [weaknesses, setWeaknesses] = useState<Record<string, boolean>>(profile.weaknesses ?? {});
  const [asdLevel, setAsdLevel] = useState(profile.asdSupportLevel ?? "mild");
  const [uiPrefs, setUiPrefs] = useState(profile.uiPreferences ?? {});

  const toggleStrength = (skill: Skill) => {
    setStrengths((prev) => ({ ...prev, [skill]: !prev[skill] }));
    if (!strengths[skill]) setWeaknesses((prev) => ({ ...prev, [skill]: false }));
  };
  const toggleWeakness = (skill: Skill) => {
    setWeaknesses((prev) => ({ ...prev, [skill]: !prev[skill] }));
    if (!weaknesses[skill]) setStrengths((prev) => ({ ...prev, [skill]: false }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-1">🧠 Nível de Suporte TEA</h3>
        <p className="text-xs text-slate-500 mb-3">Influencia a dificuldade e ritmo das atividades escolhidas pela IA</p>
        <div className="flex gap-2">
          {SUPPORT_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setAsdLevel(level.value)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                asdLevel === level.value ? level.color + " scale-105 shadow" : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-1">⚡ Forças e Dificuldades</h3>
        <p className="text-xs text-slate-500 mb-4">
          Essas configurações alimentam diretamente a ontologia LASDONT que guia a escolha de atividades.
        </p>
        <div className="space-y-3">
          {SKILLS.map((skill) => (
            <div key={skill} className="flex items-center gap-3">
              <span className="w-32 text-sm font-medium text-slate-700">{SKILL_LABELS[skill]}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStrength(skill)}
                  className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    strengths[skill]
                      ? "bg-green-100 border-green-400 text-green-700 scale-105"
                      : "border-slate-200 text-slate-500 hover:border-green-300"
                  }`}
                >
                  ✅ Força
                </button>
                <button
                  onClick={() => toggleWeakness(skill)}
                  className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    weaknesses[skill]
                      ? "bg-red-100 border-red-400 text-red-700 scale-105"
                      : "border-slate-200 text-slate-500 hover:border-red-300"
                  }`}
                >
                  ⚠️ Dificuldade
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-3">🎨 Preferências de Interface</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "lowStimulation", label: "Baixa Estimulação" },
            { key: "highContrast", label: "Alto Contraste" },
            { key: "animationsEnabled", label: "Animações" },
            { key: "soundEnabled", label: "Sons" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={uiPrefs[key] ?? false}
                onChange={(e) => setUiPrefs((p: any) => ({ ...p, [key]: e.target.checked }))}
                className="w-5 h-5 rounded accent-indigo-600"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSave({ strengths, weaknesses, asdSupportLevel: asdLevel, uiPreferences: uiPrefs })}
          disabled={saving}
          className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvando..." : "💾 Salvar Configurações"}
        </button>
        {savedMsg && (
          <span className="text-green-600 font-semibold text-sm animate-pulse">✅ Salvo!</span>
        )}
      </div>
    </div>
  );
}

function ReportView({ report, onPrint }: { report: any; onPrint: () => void }) {
  const learner = report.learner;
  return (
    <div className="space-y-4 print:space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 print:shadow-none print:border print:rounded-none">
        <div className="flex items-start justify-between print:hidden mb-4">
          <h3 className="font-bold text-slate-700 text-lg">📄 Relatório Completo</h3>
          <button onClick={onPrint} className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700">
            🖨️ Imprimir
          </button>
        </div>

        {/* Print header */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-2xl font-bold">MathASD — Relatório de Aprendizagem</h1>
          <p className="text-slate-500 text-sm">Gerado em: {new Date(report.generatedAt).toLocaleString("pt-BR")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div><p className="text-xs text-slate-500">Aluno</p><p className="font-bold">{learner.name}</p></div>
          <div><p className="text-xs text-slate-500">Idade</p><p className="font-bold">{learner.age ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Nível TEA</p><p className="font-bold capitalize">{learner.asdSupportLevel}</p></div>
          <div><p className="text-xs text-slate-500">Total Atividades</p><p className="font-bold">{report.totalAttempts}</p></div>
          <div><p className="text-xs text-slate-500">Precisão</p><p className="font-bold">{learner.stats?.accuracy ?? 0}%</p></div>
          <div><p className="text-xs text-slate-500">Engajamento</p><p className="font-bold">{Math.round((learner.stats?.engagementIndex ?? 0) * 100)}%</p></div>
        </div>

        {/* BNCC Chart (simple bar) */}
        {report.bnccChart?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-slate-700 mb-3">Desempenho por Habilidade BNCC</h4>
            <div className="space-y-2">
              {report.bnccChart.map((item: any) => (
                <div key={item.skill} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-600 truncate">{item.skill}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                      style={{ width: `${item.accuracy}%` }}
                    >
                      <span className="text-white text-xs font-bold">{item.accuracy}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">{item.attempts} tent.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill profile */}
        <div className="mb-6">
          <h4 className="font-semibold text-slate-700 mb-3">Perfil de Habilidades (LASDONT)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SKILLS.map((skill) => {
              const isStrength = learner.strengths?.[skill];
              const isWeakness = learner.weaknesses?.[skill];
              return (
                <div key={skill} className={`p-3 rounded-xl text-center text-xs font-semibold border-2 ${
                  isStrength ? "bg-green-50 border-green-300 text-green-700"
                  : isWeakness ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  {SKILL_LABELS[skill]}<br />
                  <span className="font-normal">{isStrength ? "Força" : isWeakness ? "Dificuldade" : "Neutro"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADE summary */}
        {report.adeDecisions?.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-700 mb-3">Últimas Decisões da IA Adaptativa</h4>
            <div className="space-y-2">
              {report.adeDecisions.slice(0, 5).map((dec: any) => (
                <div key={dec.id} className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex gap-2 mb-1 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{dec.recommendedDifficulty}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{dec.recommendedModality}</span>
                  </div>
                  <p className="text-slate-600">{dec.xaiLog?.finalReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6 text-center print:block hidden">
          MathASD — Sistema Adaptativo para Ensino de Matemática com TEA | Relatório gerado automaticamente
        </p>
      </div>
    </div>
  );
}
