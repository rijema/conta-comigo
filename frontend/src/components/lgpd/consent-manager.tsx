"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

export function ConsentManager() {
  const [consent, setConsent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConsent();
  }, []);

  const loadConsent = async () => {
    try {
      const data = await api.get("/users/consent");
      setConsent(data);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (type: string, value: boolean) => {
    await api.patch("/users/consent", { [type]: value });
    setConsent((prev: any) => ({ ...prev, [type]: value }));
  };

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        🔒 Privacidade dos Dados (LGPD)
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Seus dados são protegidos conforme a Lei Geral de Proteção de Dados
        (LGPD). Gerencie suas preferências abaixo.
      </p>

      <div className="space-y-3">
        {[
          {
            key: "analyticsConsent",
            label: "Dados de uso para melhorar a plataforma",
            desc: "Permite análise anônima de padrões de aprendizado",
          },
          {
            key: "researchConsent",
            label: "Uso em pesquisa acadêmica",
            desc: "Dados anonimizados podem ser usados em pesquisas sobre TEA",
          },
          {
            key: "notificationsConsent",
            label: "Notificações de progresso",
            desc: "Receber alertas sobre o desenvolvimento",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <div className="text-sm font-medium text-gray-700">
                {item.label}
              </div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
            <button
              onClick={() => updateConsent(item.key, !consent?.[item.key])}
              className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
                consent?.[item.key] ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={consent?.[item.key]}
              aria-label={item.label}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  consent?.[item.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Para exportar ou excluir seus dados, entre em contato:{" "}
        <a href="mailto:privacidade@mathasd.edu.br" className="underline">
          privacidade@mathasd.edu.br
        </a>
      </div>
    </div>
  );
}