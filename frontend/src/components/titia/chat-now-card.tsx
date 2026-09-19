"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

interface BridgeResponse {
  token: string;
}

export function ChatNowCard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugMessage, setDebugMessage] = useState("");
  const autbotUrl = process.env.NEXT_PUBLIC_AUTBOT_URL;

  const openTitia = async () => {
    setDebugMessage("Clique detectado. Preparando integração...");
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken || !autbotUrl) {
      setError(
        !autbotUrl
          ? "NEXT_PUBLIC_AUTBOT_URL não está configurada no frontend do Conta Comigo."
          : "Sua sessão não está disponível no navegador."
      );
      setDebugMessage(!autbotUrl ? "Faltando NEXT_PUBLIC_AUTBOT_URL no build atual." : "Token de sessão não encontrado no navegador.");
      return;
    }

    setIsLoading(true);
    setError("");
    setDebugMessage(`Integração pronta. Destino configurado: ${autbotUrl}`);

    try {
      const childId =
        user?.role === "guardian" && user.guardianChildren?.length
          ? user.guardianChildren[0].id
          : undefined;

      const response = await apiClient.post<BridgeResponse>(
        "/auth/bridge/autbot",
        childId ? { childId } : {},
        accessToken,
      );
      setDebugMessage("Token de integração recebido. Redirecionando para a TitiA...");

      const url = new URL("/sso/conta-comigo", autbotUrl);
      url.searchParams.set("token", response.token);
      url.searchParams.set("brand", "titia");

      window.location.assign(url.toString());
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível abrir a TitiA agora.");
      setDebugMessage(reason?.message || "A integração falhou antes do redirecionamento.");
      setIsLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-fuchsia-100 bg-[linear-gradient(135deg,#fff7ed_0%,#fdf2f8_45%,#eef2ff_100%)] p-5 shadow-lg">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <Image
              src="/assets/mainiconfirstpage.png"
              alt="TitiA acenando para iniciar a conversa"
              fill
              className="object-contain motion-safe:animate-[pulse_4s_ease-in-out_infinite]"
            />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-500">
              Chat now with TitiA!
            </p>
            <h2 className="text-2xl font-black text-indigo-950">
              Conversa acolhedora com a TitiA
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Abra o assistente do AutBot em modo TitiA, com identidade visual própria,
              histórico completo e entrada automática depois do login.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <button
            type="button"
            onClick={openTitia}
            disabled={isLoading}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-600 px-6 py-3 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {isLoading ? "Abrindo..." : "Chat now with TitiA"}
          </button>
          <p className="text-xs text-slate-500">
            {autbotUrl ? `Destino: ${autbotUrl}` : "Destino ainda não configurado neste build."}
          </p>
          {debugMessage && <p className="text-xs font-medium text-slate-500">{debugMessage}</p>}
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
