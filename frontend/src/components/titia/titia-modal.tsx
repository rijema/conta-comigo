"use client";

import { useEffect } from "react";
import Image from "next/image";

interface TitiaModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  status: "loading" | "ready" | "error";
  embedUrl?: string;
  error?: string;
  onClose: () => void;
}

export function TitiaModal({
  open,
  title,
  subtitle,
  status,
  embedUrl,
  error,
  onClose,
}: TitiaModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm md:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titia-modal-title"
        className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
      >
        <div className="relative flex-1 bg-[linear-gradient(180deg,#f8fbff_0%,#fff7fb_100%)]">
          {status === "loading" && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="relative mb-5 h-24 w-24">
                <Image
                  src="/assets/mainiconfirstpage.png"
                  alt="TitiA carregando"
                  fill
                  className="object-contain motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]"
                />
              </div>
              <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
              <h3 className="text-2xl font-black text-slate-900">
                Abrindo a TitiA
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-700">
                Estamos conectando sua sessão. Isso costuma levar só alguns segundos.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="max-w-lg rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl">
                  !
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Não foi possível abrir a TitiA
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {error || "Tivemos um problema ao conectar a conversa agora."}
                </p>
                <button
                  type="button"
                  aria-label="Voltar ao painel do Conta Comigo"
                  onClick={onClose}
                  className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-700"
                >
                  Voltar ao painel
                </button>
              </div>
            </div>
          )}

          {status === "ready" && embedUrl && (
            <iframe
              title="TitiA"
              src={embedUrl}
              className="h-full w-full border-0"
              allow="microphone; autoplay"
            />
          )}
        </div>

        <button
         type="button"
         onClick={onClose}
         aria-label="Fechar Titia e voltar ao Conta Comigo"
         className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/95 px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
        >
         Voltar ao Conta Comigo
        </button>
      </section>
    </div>
  );
}
