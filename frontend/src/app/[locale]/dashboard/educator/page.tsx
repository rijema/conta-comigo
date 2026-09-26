"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { isResearchDebugEnabled } from "@/lib/research-debug";
import { ResearchDebugPanel } from "@/components/recommendation/research-debug-panel";
import { ChatNowCard } from "@/components/titia/chat-now-card";

const SKILLS = ["visual", "auditive", "logical", "motor", "sensory"] as const;
type Skill = typeof SKILLS[number];
const SKILL_LABELS: Record<Skill, string> = {
  visual: "👁️ Visual",
  auditive: "👂 Auditiva",
  logical: "🧠 Lógica",
  motor: "🖐️ Motora",
  sensory: "Sensorial",
};
const SUPPORT_LEVELS = [
  { value: "mild", label: "Leve", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "moderate", label: "Moderado", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "strong", label: "Intenso", color: "bg-red-100 text-red-700 border-red-300" },
];

const ACTIVITY_FORMATS = [
  ['counting', 'Contagem'], ['multiple_choice', 'Escolha'], ['quiz', 'Perguntas'],
  ['drag_drop', 'Arrastar'], ['number_line', 'Reta numérica'],
  ['composition_decomposition', 'Composição'], ['missing_number', 'Número que falta'],
  ['pattern_completion', 'Padrões'], ['representation_matching', 'Correspondência'],
  ['error_detection', 'Encontrar o erro'], ['contextual_problem_solving', 'Problemas do cotidiano'],
] as const;
const BNCC_OPTIONS = ['EF01MA01', 'EF01MA02', 'EF01MA03', 'EF01MA06', 'EF01MA07', 'EF01MA08', 'EF01MA14', 'EF02MA01', 'EF02MA05', 'EF03MA07', 'EF03MA15'];
const BNCC_PRIORITY_LABELS: Record<string, string> = {
  EF01MA01: 'Números no cotidiano', EF01MA02: 'Contagem', EF01MA03: 'Comparação de quantidades',
  EF01MA06: 'Adição', EF01MA07: 'Composição de números', EF01MA08: 'Problemas de somar e tirar',
  EF01MA14: 'Formas planas', EF02MA01: 'Comparar e ordenar números', EF02MA05: 'Adição e subtração',
  EF03MA07: 'Multiplicação', EF03MA15: 'Classificação de formas',
};
const DEFAULT_EXPERIENCE_PREFERENCES = {
  soundEnabled: true, voiceEnabled: true, soundEffectsEnabled: true,
  animationsEnabled: true, animationsReduced: false, lowStimulation: false, highContrast: false,
  volume: 0.7, speechRate: 0.9, visualStimulus: 'medium', audioStimulus: 'medium',
  animationSpeed: 'normal', feedbackVisual: 'normal', celebrationFrequency: 'frequent',
  predictability: 'standard', reinforcementPreference: 'normal', maxSimultaneousElements: 20,
  autoHints: false, helpDelaySeconds: 30, allowChangeActivity: true,
  disabledActivityTypes: [] as string[], prioritizedBnccSkills: [] as string[],
  adaptiveDifficulty: true, manualDifficulty: 'easy',
};

export default function EducatorDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adeHistory, setAdeHistory] = useState<any[]>([]);
  const [adaptations, setAdaptations] = useState<any[]>([]);
  const [longitudinal, setLongitudinal] = useState<any>(null);
  const [reviewEvidence, setReviewEvidence] = useState<any[]>([]);
  const [skippedEvaluations, setSkippedEvaluations] = useState<Set<string>>(new Set());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "ade" | "report">("overview");
  const [savedMsg, setSavedMsg] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const researchDebugEnabled = isResearchDebugEnabled({
    environmentFlag: process.env.NEXT_PUBLIC_ENABLE_RESEARCH_DEBUG,
    queryValue: searchParams.get("research"),
    role: user?.role,
  });

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
  }, [user, authLoading, locale, router]);

  const handleSelectLearner = async (learner: any, token?: string | null) => {
    const t = token ?? authService.getStoredToken();
    setSelected(learner);
    setProfileLoading(true);
    setProfile(null);
    setAdeHistory([]);
    setAdaptations([]);
    setLongitudinal(null);
    setReport(null);
    setActiveTab("overview");
    try {
      const [prof, ade, adaptiveEvents, longitudinalReport, reviewEvidenceData] = await Promise.all([
        api.get<any>(`/educator/learners/${learner.id}/profile`, t ?? undefined),
        api.get<any[]>(`/educator/learners/${learner.id}/ade-history`, t ?? undefined),
        api.get<any[]>(`/educator/learners/${learner.id}/adaptations`, t ?? undefined),
        api.get<any>(`/educator/learners/${learner.id}/longitudinal-analytics`, t ?? undefined),
        api.get<any[]>(`/learning-events/review/evidence/${learner.id}`, t ?? undefined).catch(() => []),
      ]);
      setProfile(prof);
      setAdeHistory(ade);
      setAdaptations(adaptiveEvents);
      setLongitudinal(longitudinalReport);
      setReviewEvidence(reviewEvidenceData || []);
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

  const submitAdaptationFeedback = async (transitionId: string, rating: string) => {
    const token = authService.getStoredToken();
    if (!token || !selected) return;
    await api.post(`/educator/adaptations/${transitionId}/feedback`, {
      rating,
      reasonCodes: [],
    }, token);
    const updated = await api.get<any[]>(`/educator/learners/${selected.id}/adaptations`, token);
    setAdaptations(updated);
  };

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
            onClick={logout}
            className="text-indigo-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/20"
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
          <div className="mb-4">
            <ChatNowCard />
          </div>

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
                      {{ overview: "📊 Visão Geral", skills: "🎨 Perfil e experiência", ade: "🤖 IA/ADE", report: "📄 Relatório" }[tab]}
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
                      <div className="bg-white rounded-2xl shadow-sm p-5 border border-indigo-100">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">Dados observados</span>
                          <span className="text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">Estimativas do modelo BKT</span>
                        </div>
                        {!longitudinal || longitudinal.evidenceState?.status === "INSUFFICIENT_DATA" ? (
                          <p className="text-sm text-slate-500">Dados ainda insuficientes para uma visão longitudinal.</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div><p className="text-slate-500">Respostas observadas</p><p className="font-bold">{longitudinal.observedData.answers}</p></div>
                              <div><p className="text-slate-500">Precisão observada</p><p className="font-bold">{longitudinal.observedData.accuracy == null ? "Dados insuficientes" : `${Math.round(longitudinal.observedData.accuracy * 100)}%`}</p></div>
                              <div><p className="text-slate-500">Atividades concluídas</p><p className="font-bold">{longitudinal.observedData.activitiesCompleted}</p></div>
                              <div><p className="text-slate-500">Pedidos de ajuda</p><p className="font-bold">{longitudinal.observedData.hints}</p></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3">{longitudinal.longitudinal.trendMessage}</p>
                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-indigo-700 mb-2">Estimativas do modelo por habilidade BNCC</p>
                              <div className="flex flex-wrap gap-2">
                                {longitudinal.learningProgress.masteryEstimates.map((item: any) => (
                                  <span key={item.skillCode} className="text-xs rounded-lg bg-indigo-50 px-2 py-1 text-indigo-800">
                                    {item.skillCode}: {item.estimatedMastery == null ? "dados insuficientes" : `${Math.round(item.estimatedMastery * 100)}% estimado`} ({item.observations} observações)
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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

                      {longitudinal && (
                        <><div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h3 className="font-bold text-slate-700 mb-3">Histórico por sessão</h3>
                            <div className="space-y-2 max-h-64 overflow-auto">
                              {longitudinal.longitudinal.sessions.map((session: any) => (
                                <div key={session.sessionId} className="text-xs rounded-xl bg-slate-50 p-3">
                                  <p className="font-semibold">{session.date}</p>
                                  <p>{session.activitiesCompleted} concluídas · {session.attempts} respostas · {session.hints} ajudas · {session.instructionReplays} repetições</p>
                                  <p>Precisão: {session.accuracy == null ? "dados insuficientes" : `${Math.round(session.accuracy * 100)}%`} · Tempo médio: {session.averageResponseTimeMs == null ? "dados insuficientes" : `${Math.round(session.averageResponseTimeMs)} ms`}</p>
                                </div>
                              ))}
                              {longitudinal.longitudinal.sessions.length === 0 && <p className="text-sm text-slate-400">Dados ainda insuficientes.</p>}
                            </div>
                          </div>
                          <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h3 className="font-bold text-slate-700 mb-3">Desfechos das recomendações</h3>
                            <div className="text-sm space-y-1">
                              <p>Conclusão: {longitudinal.observedData.recommendationSummary.completionRate == null ? "dados insuficientes" : `${Math.round(longitudinal.observedData.recommendationSummary.completionRate * 100)}%`}</p>
                              <p>Pulo: {longitudinal.observedData.recommendationSummary.skipRate == null ? "dados insuficientes" : `${Math.round(longitudinal.observedData.recommendationSummary.skipRate * 100)}%`}</p>
                              <p>“Quero outro”: {longitudinal.adaptations.totalChangeRequests}</p>
                              <p>Trocas mantendo a habilidade: {longitudinal.adaptations.sameSkillReplacements}</p>
                              <p>Fallbacks registrados: {longitudinal.adaptations.items.filter((item: any) => item.fallbackUsed).length}</p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-600">Formatos concluídos</p>
                              <p className="text-xs text-slate-500 mb-2">{longitudinal.observedData.activityFormats.map((item: any) => `${item.type}: ${item.count}`).join(" · ") || "Dados ainda insuficientes."}</p>
                              <p className="text-xs font-semibold text-slate-600">Histórico de avaliação profissional</p>
                              {(longitudinal.professionalFeedback ?? []).map((item: any) => (
                                <p key={item.rating} className="text-xs text-slate-500">{item.rating}: {item.count} · {item.reasonCodes.join(", ") || "sem motivo codificado"}</p>
                              ))}
                              {(longitudinal.professionalFeedback ?? []).length === 0 && <p className="text-xs text-slate-400">Nenhuma avaliação profissional registrada.</p>}
                            </div>
                            <p className="text-xs text-slate-400 mt-3">Sinais observacionais; não constituem diagnóstico nem explicam, sozinhos, o motivo da interação.</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-5 mt-4">
                          <h3 className="font-bold text-slate-700 mb-1">Histórico de interação e suporte</h3>
                          <p className="text-xs text-slate-400 mb-3">Indicadores observacionais; não constituem interpretação clínica.</p>
                          {longitudinal.interactionHistory.status === "INSUFFICIENT_DATA" ? <p className="text-sm text-slate-400">{longitudinal.interactionHistory.message}</p> : (
                            <div className="space-y-1">{longitudinal.interactionHistory.items.slice(0, 8).map((item: any, index: number) => (
                              <p key={index} className="text-xs text-slate-600">Representação: {JSON.stringify(item.representation)} · interação: {JSON.stringify(item.interactionType)} · demanda motora: {item.motorDemand ?? "não informada"} · sensorial: {item.sensoryLoad ?? "não informada"} · {item.count} registro(s)</p>
                            ))}</div>
                          )}
                        </div></>
                      )}

                      {/* [INTEGRATION 3C-FINAL]: Evolução observada entre sessões */}
                      {reviewEvidence && reviewEvidence.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-5 mt-4">
                          <h3 className="font-bold text-slate-700 mb-3">Evolução observada entre sessões</h3>
                          <p className="text-xs text-slate-400 mb-4">Evidência observacional de revisão de habilidades. Não constitui diagnóstico.</p>
                          <div className="space-y-4">
                            {reviewEvidence.map((evidence: any, idx: number) => (
                              <div key={idx} className="border-l-4 border-indigo-300 pl-4 py-2">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold text-slate-700">{evidence.bnccCode} — {evidence.skillDescription}</p>
                                    <p className="text-xs text-slate-500">Ilha: {evidence.islandId} · Ciclo: {evidence.cycleNumber}</p>
                                  </div>
                                  <span className="text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 px-2 py-1">
                                    {evidence.longitudinalClassification}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                  <div><p className="text-slate-500">Precisão</p><p className="font-bold">{evidence.baselineAccuracy ? `${Math.round(evidence.baselineAccuracy * 100)}%` : "Não disponível"} → {evidence.reviewAccuracy ? `${Math.round(evidence.reviewAccuracy * 100)}%` : "Não disponível"}</p></div>
                                  <div><p className="text-slate-500">Tentativas</p><p className="font-bold">{evidence.baselineAttempts ?? "—"} → {evidence.reviewAttempts ?? "—"}</p></div>
                                  <div><p className="text-slate-500">Ajudas</p><p className="font-bold">{evidence.baselineHints ?? "—"} → {evidence.reviewHints ?? "—"}</p></div>
                                  <div><p className="text-slate-500">Domínio</p><p className="font-bold">{evidence.masteryBefore ? `${Math.round(evidence.masteryBefore * 100)}%` : "—"} → {evidence.masteryAfter ? `${Math.round(evidence.masteryAfter * 100)}%` : "—"}</p></div>
                                </div>
                                <p className="text-xs text-slate-600">Tipo: {evidence.reviewType} · Dados: {evidence.evidenceSufficiency}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                      <div className="mb-6 border-b border-slate-200 pb-5">
                        <h3 className="font-bold text-slate-700 mb-2">🔄 Adaptações para revisão pós-sessão</h3>
                        <p className="text-xs text-slate-500 mb-3">A avaliação é opcional e não altera domínio, ontologia ou pesos.</p>
                        <div className="space-y-3">
                          {adaptations.filter((item) => !skippedEvaluations.has(item.id)).map((item) => (
                            <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                              <p className="font-semibold text-slate-800">{item.professionalExplanation}</p>
                              <p className="mt-1 text-xs text-slate-600">
                                {item.previousActivity?.title ?? "Atividade anterior"} → {item.replacementActivity?.title ?? "Substituição pendente"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Resultado anterior: {item.previousOutcome?.status ?? "não registrado"}; substituição: {item.replacementOutcome?.status ?? "não registrada"}
                              </p>
                              {!item.feedback && (
                                <div className="mt-3 flex flex-wrap gap-2" aria-label="Esta adaptação foi adequada?">
                                  {[
                                    ["ADEQUATE", "Adequada"],
                                    ["PARTIALLY_ADEQUATE", "Parcialmente adequada"],
                                    ["INADEQUATE", "Inadequada"],
                                  ].map(([rating, label]) => (
                                    <button key={rating} onClick={() => submitAdaptationFeedback(item.id, rating)}
                                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                                      {label}
                                    </button>
                                  ))}
                                  <button onClick={() => setSkippedEvaluations((current) => new Set(current).add(item.id))}
                                    className="rounded-lg px-3 py-1.5 text-xs text-slate-500">
                                    Pular avaliação
                                  </button>
                                </div>
                              )}
                              {item.feedback && <p className="mt-2 text-xs font-semibold text-green-700">Avaliação registrada: {item.feedback.rating}</p>}
                            </div>
                          ))}
                          {adaptations.length === 0 && <p className="text-xs text-slate-400">Nenhuma adaptação registrada.</p>}
                        </div>
                      </div>
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
                            {dec.professionalExplanation && (
                              <div className="text-sm text-slate-600 space-y-2">
                                <p>{dec.professionalExplanation.summary}</p>
                                <details className="text-xs">
                                  <summary className="cursor-pointer font-semibold text-indigo-700">Ver detalhes</summary>
                                  <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3">
                                    <p><strong>Necessidade atual:</strong> {dec.professionalExplanation.learningNeed}</p>
                                    <p><strong>Domínio estimado:</strong> {dec.professionalExplanation.estimatedMastery}</p>
                                    <p><strong>Motivo do formato:</strong> {dec.professionalExplanation.activityFormatReason}</p>
                                    {dec.professionalExplanation.interactionEvidence?.map((item: string) => <p key={item}>• {item}</p>)}
                                    {dec.professionalExplanation.supportConsiderations?.map((item: string) => <p key={item}>• {item}</p>)}
                                    {dec.professionalExplanation.recentActivityHistory?.map((item: string) => <p key={item}>• {item}</p>)}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {researchDebugEnabled && selected && (
                        <ResearchDebugPanel
                          key={selected.id}
                          learnerId={selected.id}
                          decisionIds={adeHistory.map((decision) => decision.id)}
                        />
                      )}
                    </div>
                  )}

                  {/* REPORT TAB */}
                  {activeTab === "report" && report && (
                    <ReportView report={report} onPrint={handlePrint} />
                  )}
                  {activeTab === "report" && !report && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-slate-500 mb-4">Clique em &quot;Gerar Relatório&quot; para criar o relatório completo</p>
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
  const [uiPrefs, setUiPrefs] = useState({ ...DEFAULT_EXPERIENCE_PREFERENCES, ...(profile.uiPreferences ?? {}) });
  const setPreference = (key: string, value: unknown) => setUiPrefs((current: any) => ({ ...current, [key]: value }));
  const toggleListPreference = (key: string, value: string) => setUiPrefs((current: any) => {
    const selected = Array.isArray(current[key]) ? current[key] : [];
    return { ...current, [key]: selected.includes(value) ? selected.filter((item: string) => item !== value) : [...selected, value] };
  });

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
        <p className="text-xs text-slate-500 mb-4">Observações do profissional sobre a experiência da criança; não definem um grupo sensorial fixo.</p>
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

      <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
        <div><h3 className="font-bold text-slate-800">🎨 Perfil sensorial</h3><p className="text-sm text-slate-600">Ajuste cada dimensão separadamente. Baixa estimulação também pausa efeitos sonoros e movimento intenso; a voz pode continuar ativa. A fórmula de recomendação permanece igual.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['soundEnabled', 'Som geral'], ['voiceEnabled', 'Voz da TitiA'], ['soundEffectsEnabled', 'Efeitos sonoros'],
            ['animationsEnabled', 'Animações'], ['animationsReduced', 'Animações reduzidas'], ['lowStimulation', 'Modo de baixa estimulação'],
            ['highContrast', 'Alto contraste'], ['autoHints', 'Oferecer ajuda automaticamente'],
            ['allowChangeActivity', 'Permitir “Quero outro”'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={uiPrefs[key] ?? !['lowStimulation', 'highContrast', 'animationsReduced', 'autoHints'].includes(key)} onChange={(event) => setPreference(key, event.target.checked)} className="h-5 w-5 accent-indigo-600" />{label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Volume ({Math.round((uiPrefs.volume ?? 0.7) * 100)}%)<input type="range" min="0" max="1" step="0.1" value={uiPrefs.volume ?? 0.7} onChange={(event) => setPreference('volume', Number(event.target.value))} className="mt-2 w-full" /></label>
          <label className="text-sm font-semibold text-slate-700">Velocidade da fala ({uiPrefs.speechRate ?? 0.9}×)<input type="range" min="0.6" max="1.2" step="0.1" value={uiPrefs.speechRate ?? 0.9} onChange={(event) => setPreference('speechRate', Number(event.target.value))} className="mt-2 w-full" /></label>
          {([
            ['visualStimulus', 'Estímulos visuais', [['low', 'Poucos'], ['medium', 'Moderados'], ['high', 'Mais elementos']]],
            ['audioStimulus', 'Intensidade sonora', [['low', 'Baixa'], ['medium', 'Moderada'], ['high', 'Alta']]],
            ['animationSpeed', 'Velocidade das animações', [['slow', 'Lenta'], ['normal', 'Normal'], ['fast', 'Rápida']]],
            ['feedbackVisual', 'Feedback visual', [['minimal', 'Mínimo'], ['normal', 'Normal'], ['reinforced', 'Reforçado']]],
            ['celebrationFrequency', 'Frequência de celebrações', [['round_only', 'Só ao terminar'], ['normal', 'Normal'], ['frequent', 'Frequente']]],
            ['predictability', 'Previsibilidade', [['standard', 'Padrão'], ['high', 'Mais previsível']]],
            ['reinforcementPreference', 'Preferência por reforço', [['minimal', 'Discreto'], ['normal', 'Normal'], ['frequent', 'Frequente']]],
          ] as const).map(([key, label, options]) => (
            <label key={key} className="text-sm font-semibold text-slate-700">{label}
              <select value={uiPrefs[key] ?? options[1]?.[0] ?? options[0][0]} onChange={(event) => setPreference(key, event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
                {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </label>
          ))}
          <label className="text-sm font-semibold text-slate-700">Elementos simultâneos
            <select value={uiPrefs.maxSimultaneousElements ?? 20} onChange={(event) => setPreference('maxSimultaneousElements', Number(event.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
              {[4, 6, 8, 12, 20].map((value) => <option key={value} value={value}>Até {value}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Tempo antes de oferecer ajuda
            <select value={uiPrefs.helpDelaySeconds ?? 30} onChange={(event) => setPreference('helpDelaySeconds', Number(event.target.value))} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
              {[15, 30, 45, 60].map((value) => <option key={value} value={value}>{value} segundos</option>)}
            </select>
          </label>
        </div>
        <div className="border-t border-slate-200 pt-4"><h4 className="font-bold text-slate-800">Atividades e currículo</h4><p className="text-sm text-slate-600">Restrições só se aplicam quando existe atividade compatível; pré-requisitos continuam obrigatórios.</p></div>
        <fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">Tipos de exercício indisponíveis</legend><div className="grid gap-2 sm:grid-cols-2">{ACTIVITY_FORMATS.map(([type, label]) => <label key={type} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={(uiPrefs.disabledActivityTypes ?? []).includes(type)} onChange={() => toggleListPreference('disabledActivityTypes', type)} className="h-5 w-5" />{label}</label>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">Habilidades BNCC a priorizar</legend><div className="flex flex-wrap gap-2">{BNCC_OPTIONS.map((code) => <label key={code} className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm"><input type="checkbox" checked={(uiPrefs.prioritizedBnccSkills ?? []).includes(code)} onChange={() => toggleListPreference('prioritizedBnccSkills', code)} className="h-5 w-5" />{code} · {BNCC_PRIORITY_LABELS[code]}</label>)}</div></fieldset>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={uiPrefs.adaptiveDifficulty !== false} onChange={(event) => setPreference('adaptiveDifficulty', event.target.checked)} className="h-5 w-5" />Dificuldade adaptativa automática</label>
        {uiPrefs.adaptiveDifficulty === false && <label className="block text-sm font-semibold text-slate-700">Dificuldade manual até voltar ao modo adaptativo<select value={uiPrefs.manualDifficulty ?? 'easy'} onChange={(event) => setPreference('manualDifficulty', event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">{[['very_easy', 'Muito fácil'], ['easy', 'Fácil'], ['medium', 'Médio'], ['hard', 'Difícil'], ['extreme', 'Extremo']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
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
          <h1 className="text-2xl font-bold">Conta Comigo — Relatório de Aprendizagem</h1>
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
                  <p className="text-slate-600">{dec.professionalExplanation?.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6 text-center print:block hidden">
          Conta Comigo — Sistema Adaptativo para Ensino de Matemática com TEA | Relatório gerado automaticamente
        </p>
      </div>
    </div>
  );
}
