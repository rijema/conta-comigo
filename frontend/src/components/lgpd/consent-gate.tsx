"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { ConsentTermContent } from "./consent-modal";

/**
 * Blocking variant of the Consent Term, shown app-wide whenever a logged-in
 * user has `lgpdConsentGiven === false`. This mainly covers accounts created
 * via Google OAuth, which previously had consent auto-granted without the
 * user ever reading or accepting the term. Unlike `ConsentModal`, this
 * cannot be dismissed without either accepting or logging out.
 */
export function ConsentGate() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !user || !token || user.lgpdConsentGiven !== false) {
    return null;
  }

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post<void>(`/users/${user.id}/lgpd-consent`, {}, token);
      setAuth({ ...user, lgpdConsentGiven: true }, token);
    } catch {
      setError("Não foi possível confirmar seu consentimento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm">
      <div className="my-auto max-h-[94svh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-black text-slate-900">
          Antes de continuar, confirme o Termo de Consentimento
        </h1>
        <p className="mb-6 text-sm font-semibold text-violet-700">
          Como sua conta foi criada com o Google, ainda precisamos da sua confirmação de leitura e
          aceite do termo abaixo para liberar o uso da plataforma.
        </p>

        <ConsentTermContent />

        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDecline}
            disabled={submitting}
            className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Não aceito (sair)
          </button>
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 font-bold text-white hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? "Confirmando..." : "Li e aceito"}
          </button>
        </div>
      </div>
    </div>
  );
}
