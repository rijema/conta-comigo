"use client";

import { useState, useRef, useEffect } from "react";
import type { Activity } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

export function QuantityBuilderActivity({ activity, onAnswer }: {
  activity: Activity;
  onAnswer: (answer: { count: number }) => void;
}) {
  const [count, setCount] = useState(0);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity.id });
  const conceptId = activity.content?.buildPictogramConceptId ?? "library.die";
  const maxCount = activity.content?.maxCount ?? 20;
  const question = activity.content?.question ?? activity.content?.instructionsPt ?? "Monte a quantidade.";

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [question],
      });
    }
  }, [speech.settings.voiceEnabled, question, speech]);

  const handleSubmit = () => {
    onAnswer({ count });
    if (speech.settings.voiceEnabled) {
      const feedback = `Você montou ${count} itens.`;
      speech.speakInstruction({ steps: [feedback] });
    }
  };
  return (
    <div>
      <p className="mb-4 text-center text-xl font-bold">{activity.content?.question ?? activity.content?.instructionsPt}</p>
      <div className="mb-5 flex min-h-28 flex-wrap items-center justify-center gap-2 rounded-2xl bg-blue-50 p-3" aria-label={`${count} itens montados`}>
        {Array.from({ length: count }, (_, index) => (
          <ArasaacPictogram key={index} conceptId={conceptId} showLabel={false} imageClassName="h-12 w-12" />
        ))}
        {count === 0 && <span className="text-gray-500">Toque em adicionar para começar</span>}
      </div>
      <p className="mb-3 text-center text-4xl font-bold text-blue-700">{count}</p>
      <div className="mb-4 flex gap-3">
        <button type="button" onClick={() => setCount((value) => Math.max(0, value - 1))}
          disabled={count === 0} className="flex-1 rounded-xl border-2 border-blue-300 p-3 font-bold disabled:opacity-40">
          <ArasaacPictogram conceptId="mathematics.less" showLabel={false} imageClassName="h-7 w-7" /> Tirar um
        </button>
        <button type="button" onClick={() => setCount((value) => Math.min(maxCount, value + 1))}
          disabled={count === maxCount} className="flex-1 rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-40">
          <ArasaacPictogram conceptId="mathematics.more" showLabel={false} imageClassName="h-7 w-7" /> Adicionar um
        </button>
      </div>
      <button type="button" onClick={handleSubmit}
        className="w-full rounded-xl bg-green-600 p-3 font-bold text-white">
        <ArasaacPictogram conceptId="activity.complete" showLabel={false} imageClassName="h-7 w-7" /> Confirmar
      </button>
    </div>
  );
}
