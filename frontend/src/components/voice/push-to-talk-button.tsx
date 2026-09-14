"use client";
import type { VoiceState } from "@/hooks/use-voice-command";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";

const labels: Record<VoiceState, string> = { idle: "Falar com a TitiA", listening: "Ouvindo...",
  processing: "Pensando...", error: "Vamos tentar de novo" };

export function PushToTalkButton({ state, onStart, onStop, onReset, idleLabel }: {
  state: VoiceState; onStart: () => void; onStop: () => void; onReset: () => void; idleLabel?: string;
}) {
  const label = state === "idle" && idleLabel ? idleLabel : labels[state];
  const action = state === "listening" ? onStop : state === "error" ? onReset : onStart;
  return <button type="button" onClick={action} disabled={state === "processing"}
    aria-label={label} aria-pressed={state === "listening"}
    className="min-h-10 rounded-2xl bg-sky-100 border-2 border-sky-200 px-3 text-sm font-bold text-sky-800 transition-all hover:scale-[1.025] active:scale-[.97] motion-reduce:transform-none disabled:opacity-60">
    <ArasaacPictogram conceptId="activity.listen" showLabel={false} imageClassName="h-6 w-6" /> <span>{label}</span>
  </button>;
}
