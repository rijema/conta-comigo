"use client";

import { useEffect, useMemo, useState } from "react";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import Image from "next/image";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
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

  useEffect(() => () => speech.stopSpeech(), [activity.id, speech.stopSpeech]);

  if (instruction.steps.length === 0) return null;

  return (
    <section className="mb-4 overflow-hidden rounded-[2rem] border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 p-4 shadow-sm"
      aria-labelledby={`guided-instructions-${activity.id}`}>
      <div className="flex items-center gap-3">
        <Image
          src="/assets/wildcard.png"
          width={112}
          height={84}
          alt="TitiA pronta para explicar a atividade"
          className="h-24 w-28 flex-none object-contain object-top sm:h-28 sm:w-36"
        />
        <div className="min-w-0 flex-1">
          <h3 id={`guided-instructions-${activity.id}`} className="font-extrabold text-purple-800">
            TitiA explica para você
          </h3>
          <p className="mt-1 hidden text-sm text-purple-700 md:block">
            Toque para ouvir a explicação no seu tempo.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={!speech.settings.voiceEnabled}
            onClick={() => {
              const spoken = hasSpokenInstruction
                ? speech.repeatLastInstruction()
                : speech.speakInstruction(instruction);
              if (spoken) setHasSpokenInstruction(true);
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[.97] motion-reduce:transform-none disabled:opacity-40">
            <ArasaacPictogram conceptId="navigation.repeat" showLabel={false} imageClassName="w-6 h-6" />
            <span>{hasSpokenInstruction ? "Ouvir novamente" : "Ouvir explicação da TitiA"}</span>
          </button>
          <button type="button" onClick={speech.stopSpeech} disabled={!speech.isSpeaking}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-transform hover:scale-[1.03] active:scale-[.97] motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-40">
            <ArasaacPictogram conceptId="navigation.pause" showLabel={false} imageClassName="w-6 h-6" />
            <span>Parar</span>
          </button>
        </div>
      </div>
    </section>
  );
}
