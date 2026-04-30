"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Role = "guardian" | "professional";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  childName: string;
  childAge: string;
  childPassword: string;
  lgpdConsent: boolean;
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    role: "guardian",
    childName: "",
    childAge: "",
    childPassword: "",
    lgpdConsent: false,
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);

  function update(field: keyof RegisterForm, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lgpdConsent) {
      setError("consentRequired");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        childProfile:
          form.role === "guardian" && form.childName
            ? { name: form.childName, age: parseInt(form.childAge) }
            : undefined,
        childPassword: form.role === "guardian" && form.childPassword ? form.childPassword : undefined,
        lgpdConsent: form.lgpdConsent,
        consentTimestamp: new Date().toISOString(),
      });
      router.push("/auth/login?registered=1");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? tCommon("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2" aria-hidden>✨</div>
          <h1 className="text-2xl font-bold text-gray-800">{t("createAccount")}</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300
                  ${s === step ? "w-8 bg-blue-600" : "w-2 bg-gray-200"}`}
                aria-hidden
              />
            ))}
          </div>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}
          className="flex flex-col gap-4" noValidate>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("yourName")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Role selection */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">{t("iAm")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["guardian", "professional"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update("role", r)}
                      className={`py-3 rounded-2xl border-2 font-semibold text-sm transition-all
                        ${form.role === r
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {r === "guardian" ? `👪 ${t("role.guardian")}` : `👩‍🏫 ${t("role.professional")}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!form.name || !form.email || !form.password}
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-40 hover:bg-blue-700"
              >
                {tCommon("next")} →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              {form.role === "guardian" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t("childName")}
                    </label>
                    <input
                      type="text"
                      value={form.childName}
                      onChange={(e) => update("childName", e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t("childAge")}
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={12}
                      value={form.childAge}
                      onChange={(e) => update("childAge", e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      🔑 Senha da criança
                    </label>
                    <input
                      type="password"
                      value={form.childPassword}
                      onChange={(e) => update("childPassword", e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      minLength={4}
                      required
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A criança vai usar essa senha para entrar na plataforma
                    </p>
                  </div>
                </>
              )}

              {/* LGPD Consent */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">
                  📋 Termo de Consentimento e Uso
                </h3>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                  Esta plataforma coleta dados educacionais para fins de pesquisa acadêmica. Todos os dados são protegidos pela LGPD (Lei 13.709/2018).
                </p>
                <button
                  type="button"
                  onClick={() => setShowTermModal(true)}
                  className="text-xs text-blue-600 underline mb-3 hover:text-blue-700"
                >
                  📄 Ler o Termo Completo
                </button>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.lgpdConsent}
                    onChange={(e) => update("lgpdConsent", e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-blue-600"
                    aria-required="true"
                  />
                  <span className="text-xs text-gray-700">
                    Li e aceito o Termo de Consentimento, a Política de Privacidade e autorizo o uso dos dados para fins de pesquisa acadêmica.
                  </span>
                </label>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  ← {tCommon("back")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.lgpdConsent}
                  className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white font-bold
                    hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {t("createAccount")}
                </button>
              </div>
            </motion.div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t("haveAccount")}{" "}
          <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
            {t("login")}
          </Link>
        </p>
      </motion.div>

      {/* Term modal */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg">📋 Termo de Consentimento Livre e Esclarecido</h2>
              <button onClick={() => setShowTermModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Plataforma MathASD — Pesquisa de Mestrado</p>

              <section>
                <p className="font-semibold mb-1">1. Identificação da Pesquisa</p>
                <p>Esta pesquisa tem como objetivo desenvolver e avaliar um sistema educacional adaptativo para o ensino de matemática voltado a crianças com Transtorno do Espectro Autista (TEA), nos anos iniciais do Ensino Fundamental.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">2. Dados Coletados</p>
                <p>A plataforma coleta: dados de cadastro (nome, e-mail), dados de desempenho (tentativas, acertos, tempo por atividade), dados de interação e perfil educacional. Nenhum dado sensível de saúde é coletado diretamente.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">3. Uso dos Dados</p>
                <p>Os dados são utilizados exclusivamente para: personalização das atividades educacionais, geração de relatórios de progresso e análise acadêmica. Os dados não serão vendidos, compartilhados com terceiros para fins comerciais ou utilizados para publicidade.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">4. Proteção de Dados (LGPD)</p>
                <p>Em conformidade com a Lei 13.709/2018 (LGPD), você tem direito a: acesso, correção, exclusão e portabilidade dos seus dados. Para exercer esses direitos, entre em contato pelo e-mail de pesquisa.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">5. Participação Voluntária</p>
                <p>A participação é voluntária. Você pode revogar este consentimento a qualquer momento, sem penalidades, solicitando a exclusão de sua conta e dados.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">6. Responsabilidade</p>
                <p>O pesquisador responsável não se responsabiliza por uso indevido da plataforma por terceiros não autorizados nem por interpretações dos relatórios gerados fora do contexto educacional e de pesquisa para o qual foram concebidos.</p>
              </section>

              <section>
                <p className="font-semibold mb-1">7. Contato</p>
                <p>Dúvidas sobre o uso dos dados ou sobre esta pesquisa podem ser encaminhadas ao pesquisador responsável via e-mail institucional ou ao Comitê de Ética em Pesquisa (CEP) da instituição.</p>
              </section>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  <strong>Ao aceitar este termo</strong>, você declara ter lido, compreendido e concordado com as condições descritas, autorizando o uso dos dados conforme especificado.
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowTermModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-2xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => { update("lgpdConsent", true); setShowTermModal(false); }}
                className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700"
              >
                ✅ Aceitar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}