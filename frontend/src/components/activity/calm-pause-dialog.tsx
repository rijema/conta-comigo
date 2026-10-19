"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useCalmMusic } from "@/hooks/use-calm-music";
import { useModalFocus } from "@/hooks/use-modal-focus";

const CALM_IDEAS = [
  { conceptId: "library.breathe", text: "Respirar fundo" },
  { conceptId: "library.stretch", text: "Espreguiçar" },
  { conceptId: "library.drink_water", text: "Beber água" },
  { conceptId: "library.rest", text: "Descansar" },
  { conceptId: "library.calm", text: "Ficar tranquilo" },
];

interface CalmPauseDialogProps {
  open: boolean;
  onResume: () => void;
  onSpeak: (text: string) => void;
  soundEnabled: boolean;
  musicVolume: number;
  reducedMotion: boolean;
}

export function CalmPauseDialog({ open, onResume, onSpeak, soundEnabled, musicVolume, reducedMotion }: CalmPauseDialogProps) {
  const [musicOn, setMusicOn] = useState(true);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalFocus<HTMLElement>(open, onResume, resumeRef);
  useCalmMusic(open && soundEnabled && musicOn, musicVolume);

  if (!open) return null;

  return (
    <div data-pause-ui className="fixed inset-0 z-[96] flex items-center justify-center overflow-y-auto bg-teal-950/50 p-4 backdrop-blur-sm">
      <style>{`
        @keyframes calmBreath { 0%,100% { transform: scale(.8); } 50% { transform: scale(1.15); } }
      `}</style>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="calm-pause-title" aria-describedby="calm-pause-description"
        className="my-auto w-full max-w-2xl rounded-[2rem] border-4 border-teal-100 bg-gradient-to-b from-teal-50 to-white p-6 text-center shadow-2xl">
        <div className="flex items-center justify-center gap-3">
          <Image src="/assets/wildcard.png" width={96} height={72} alt="" className="h-16 w-auto object-contain" />
          <div className="text-left">
            <h2 id="calm-pause-title" className="text-2xl font-black text-teal-800">Hora da pausa</h2>
            <p id="calm-pause-description" className="text-sm font-semibold text-slate-600">Sem pressa. O exercício espera por você.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <div
            aria-hidden
            className="h-24 w-24 rounded-full bg-gradient-to-br from-teal-200 to-sky-200 shadow-inner"
            style={reducedMotion ? undefined : { animation: "calmBreath 8s ease-in-out infinite" }}
          />
          {!reducedMotion && <p className="text-sm font-bold text-teal-700">Quando a bolinha cresce, puxe o ar. Quando diminui, solte devagar.</p>}
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Ideias para descansar">
          {CALM_IDEAS.map((idea) => (
            <li key={idea.conceptId}>
              <button type="button" onClick={() => onSpeak(idea.text)} aria-label={`Ouvir: ${idea.text}`}
                className="flex h-full w-full flex-col items-center gap-2 rounded-2xl border-2 border-teal-100 bg-white p-3 hover:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-200">
                <ArasaacPictogram conceptId={idea.conceptId} showLabel={false} imageClassName="h-16 w-16" />
                <span className="text-sm font-bold text-slate-700">{idea.text}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {soundEnabled && (
            <button type="button" onClick={() => setMusicOn((value) => !value)} aria-pressed={musicOn}
              className="min-h-14 flex-1 rounded-2xl border-2 border-teal-200 bg-white px-4 py-3 text-base font-bold text-teal-800 hover:bg-teal-50">
              {musicOn ? "🎵 Desligar música" : "🔇 Ligar música"}
            </button>
          )}
          <button ref={resumeRef} type="button" onClick={onResume}
            className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-base font-black text-white hover:bg-teal-700">
            <ArasaacPictogram conceptId="navigation.start" showLabel={false} imageClassName="h-7 w-7" />
            <span>Voltar a jogar</span>
          </button>
        </div>
      </section>
    </div>
  );
}
