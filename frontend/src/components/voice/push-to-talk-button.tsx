"use client";
import type { VoiceState } from "@/hooks/use-voice-command";

const labels: Record<VoiceState, string> = { idle: "Falar com a TitiA", listening: "Ouvindo...",
  processing: "Pensando...", error: "Vamos tentar de novo" };

export function PushToTalkButton({ state, onStart, onStop, onReset }: {
  state: VoiceState; onStart: () => void; onStop: () => void; onReset: () => void;
}) {
  const action = state === "listening" ? onStop : state === "error" ? onReset : onStart;
  return <button type="button" onClick={action} disabled={state === "processing"}
    aria-label={labels[state]} aria-pressed={state === "listening"}
    className="min-h-10 rounded-2xl bg-sky-100 border-2 border-sky-200 px-3 text-sm font-bold text-sky-800 transition-all hover:scale-[1.025] active:scale-[.97] motion-reduce:transform-none disabled:opacity-60">
    <span aria-hidden="true">🎤</span> <span>{labels[state]}</span>
  </button>;
}
