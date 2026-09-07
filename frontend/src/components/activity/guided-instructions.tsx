"use client";

import { useEffect, useMemo, useState } from "react";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
import { getOrCreateLearningSessionId } from "@/lib/learning-session";
import type { Activity } from "@/types";
import type { SpokenInstruction } from "@/lib/titia-speech-service";

function splitAuthoredInstruction(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]?/g) ?? [])
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getActivitySpokenInstruction(activity: Activity): SpokenInstruction {
  const content = activity.content ?? {};
  const explicitSteps = Array.isArray(content.spokenSteps)
    ? content.spokenSteps.filter((step): step is string => typeof step === "string" && step.trim().length > 0)
    : [];
  const authoredFallback = content.instructionsPt || activity.instructions || content.question || activity.title;
  return {
    introduction: content.spokenIntroduction || "Oi! A TitiA vai te explicar.",
    steps: explicitSteps.length > 0 ? explicitSteps : splitAuthoredInstruction(authoredFallback || ""),
  };
}

export function GuidedInstructions({ activity }: { activity: Activity }) {
  const speech = useTitiaSpeech({ activityId: activity.id });
  const instruction = useMemo(() => getActivitySpokenInstruction(activity), [activity]);
  const [hasSpokenInstruction, setHasSpokenInstruction] = useState(false);

  useEffect(() => {
    if (!speech.settingsLoaded || !speech.settings.voiceEnabled ||
      !speech.settings.automaticInstructionSpeech || instruction.steps.length === 0) return;
    const sessionId = getOrCreateLearningSessionId();
    const key = `contacomigo.auto-instruction-spoken:${sessionId}:${activity.id}`;
    if (window.sessionStorage.getItem(key)) return;
    if (speech.speakInstruction(instruction)) {
      window.sessionStorage.setItem(key, "true");
      setHasSpokenInstruction(true);
    }
  }, [activity.id, instruction, speech]);

  if (instruction.steps.length === 0) return null;

  return (
    <section className="mb-5 rounded-2xl border-2 border-purple-100 bg-purple-50/70 p-4"
      aria-labelledby={`guided-instructions-${activity.id}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={`guided-instructions-${activity.id}`} className="font-extrabold text-purple-800">
          TitiA explica passo a passo
        </h3>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={!speech.settings.voiceEnabled}
            onClick={() => {
              if (speech.speakInstruction(instruction)) setHasSpokenInstruction(true);
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
            <ArasaacPictogram conceptId="navigation.listen" showLabel={false} imageClassName="w-6 h-6" />
            <span>Ouvir</span>
          </button>
          <button type="button" disabled={!speech.settings.voiceEnabled || !hasSpokenInstruction}
            onClick={speech.repeatLastInstruction}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-purple-200 bg-white px-3 py-2 text-sm font-bold text-purple-700 disabled:opacity-40">
            <ArasaacPictogram conceptId="navigation.repeat" showLabel={false} imageClassName="w-6 h-6" />
            <span>Repetir</span>
          </button>
          <button type="button" onClick={speech.stopSpeech}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
            <ArasaacPictogram conceptId="navigation.pause" showLabel={false} imageClassName="w-6 h-6" />
            <span>Parar</span>
          </button>
        </div>
      </div>
      <ol className="mt-3 space-y-2" aria-label="Passos da atividade">
        {instruction.steps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex items-start gap-2 text-slate-700">
            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-extrabold text-purple-800">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
