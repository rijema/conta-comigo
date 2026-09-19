"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { TitiaModal } from "@/components/titia/titia-modal";

interface BridgeResponse {
  token: string;
}

function normalizeAutbotUrl(rawUrl?: string) {
  if (!rawUrl) return "";
  return rawUrl.replace(/\/+$/, "");
}

export function ChatNowCard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const autbotUrl = useMemo(
    () => normalizeAutbotUrl(process.env.NEXT_PUBLIC_AUTBOT_URL),
    [],
  );

  const openTitia = async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken || !autbotUrl) {
      setError(
        !autbotUrl
          ? "A conexão com a TitiA não está configurada neste ambiente."
          : "Sua sessão do Conta Comigo expirou. Entre novamente para continuar.",
      );
      setIsModalOpen(false);
      return;
    }

    setError("");
    setIsLoading(true);
    setIsModalOpen(true);

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

      const url = new URL("/sso/conta-comigo", autbotUrl);
      url.searchParams.set("token", response.token);
      url.searchParams.set("brand", "titia");
      url.searchParams.set("embedded", "1");
      url.searchParams.set("returnUrl", window.location.href);

      setEmbedUrl(url.toString());
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível abrir a TitiA agora.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmbedUrl("");
    setIsLoading(false);
  };

  const subtitleByRole =
    user?.role === "professional"
      ? "Acompanhe conversas acolhedoras para orientar famílias e apoiar intervenções."
      : user?.role === "child"
        ? "Converse com a TitiA com linguagem leve, acessível e acolhedora."
        : "Converse com a TitiA sem sair do Conta Comigo, mantendo a sessão e o histórico.";

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[linear-gradient(135deg,#eef8ff_0%,#f8f0ff_58%,#ffffff_100%)] p-5 shadow-[0_18px_45px_rgba(56,189,248,0.12)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-sky-100">
              <Image
                src="/assets/mainiconfirstpage.png"
                alt="TitiA"
                fill
                className="object-contain p-2 motion-safe:animate-[pulse_4s_ease-in-out_infinite]"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-500">
                TitiA
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Conversa acolhedora dentro do Conta Comigo
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                {subtitleByRole}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                TitiA <span className="opacity-65">(made with AutBot)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={openTitia}
              disabled={isLoading}
              className="rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-6 py-3 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Abrindo a TitiA..." : "Conversar com a TitiA"}
            </button>
            <p className="text-xs text-slate-500">
              A conversa abre em uma janela integrada, com retorno rápido ao seu painel.
            </p>
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          </div>
        </div>
      </section>

      <TitiaModal
        open={isModalOpen}
        title="TitiA integrada ao Conta Comigo"
        subtitle="Sua sessão continua ativa enquanto a TitiA é preparada para conversar."
        status={error ? "error" : embedUrl ? "ready" : "loading"}
        embedUrl={embedUrl}
        error={error}
        onClose={closeModal}
      />
    </>
  );
}
