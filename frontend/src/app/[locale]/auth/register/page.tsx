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
                  📋 {t("lgpdTitle")}
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  {t("lgpdDescription")}
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.lgpdConsent}
                    onChange={(e) => update("lgpdConsent", e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-blue-600"
                    aria-required="true"
                  />
                  <span className="text-xs text-gray-700">
                    {t("lgpdConsentText")}
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
    </div>
  );
}