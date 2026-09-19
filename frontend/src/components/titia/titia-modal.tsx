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
        <header className="flex items-center justify-between border-b border-sky-100 bg-[linear-gradient(135deg,#eef8ff_0%,#f7f0ff_100%)] px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100">
              <Image
                src="/assets/mainiconfirstpage.png"
                alt="TitiA"
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-500">
                TitiA
              </p>
              <h2
                id="titia-modal-title"
                className="truncate text-xl font-black text-slate-900"
              >
                {title}
              </h2>
              <p className="truncate text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              Voltar ao Conta Comigo
            </button>
          </div>
        </header>

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
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
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
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {error || "Tivemos um problema ao conectar a conversa agora."}
                </p>
                <button
                  type="button"
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

        <footer className="border-t border-sky-100 bg-white/80 px-5 py-3 text-center text-xs font-semibold text-slate-400">
          TitiA <span className="opacity-65">(made with AutBot)</span>
        </footer>
      </section>
    </div>
  );
}
