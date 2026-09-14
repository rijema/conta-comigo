"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

interface Props {
  activity: Activity;
  onAnswer: (answer: { selectedOption: string; selectedText?: string; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

const SHAPE_SYMBOLS = /[○◯⭕●⬜□△▲🔺]/g;

export function MultipleChoiceActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const speech = useTitiaSpeech({ activityId: activity.id });
  const options = activity.options ?? activity.content?.options ?? [];
  const items: string[] = activity.content?.items ?? [];
  const displayItems = items.filter((item) => !["+", "=", "?"].includes(item));
  const question = activity.content?.question || activity.content?.instructionsPt || "";
  const isShapeActivity = /^EF01MA1[345]$/.test(activity.bnccSkills?.[0] ?? "") || activity.type === "representation_matching";
  const targetShape = isShapeActivity ? question.match(SHAPE_SYMBOLS)?.[0] : null;
  const visibleQuestion = isShapeActivity ? question.replace(SHAPE_SYMBOLS, "").trim() : question;

  const select = (option: any) => {
    setSelected(option.id);
    if (option.text) speech.speakPictogram(option.text, `option.${option.id}`);
  };

  const handleSubmit = () => {
    const option = options.find((candidate: any) => candidate.id === selected);
    if (!option) return;
    onAnswer({ selectedOption: option.id, selectedText: option.text, isCorrect: Boolean(option.isCorrect) });
    if (!option.isCorrect) setSelected(null);
  };

  return (
    <div>
      {targetShape && <div className="mb-1 text-center text-6xl" aria-hidden="true">{targetShape}</div>}
      <div className="mb-3 text-center text-xl font-semibold leading-relaxed text-gray-800">{visibleQuestion}</div>
      {displayItems.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-center gap-2 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-3">
          {displayItems.map((item, index) => <span key={index} className="select-none text-4xl">{item}</span>)}
        </div>
      )}
      {activity.content?.imageUrl && <div className="mb-4 flex justify-center"><img src={activity.content.imageUrl} alt={activity.content.imageAlt || "Imagem da questão"} className="max-h-40 rounded-lg" /></div>}
      <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-blue-700">
        <ArasaacPictogram conceptId="activity.touch" showLabel={false} imageClassName="h-6 w-6" />
        <span className="ml-2">Toque na resposta certa</span>
      </p>
      <div className={`mb-4 grid gap-3 ${options.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option: any) => {
          const active = selected === option.id;
          return <button key={option.id} type="button" onClick={() => select(option)} aria-pressed={active} aria-label={`Opção: ${option.text}`}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-4 px-3 py-3 text-xl font-bold shadow-sm transition-all duration-150 focus:ring-4 focus:ring-blue-300 hover:scale-[1.025] active:scale-[.97] motion-reduce:transform-none ${active ? "scale-[1.02] border-blue-500 bg-blue-100 text-blue-800 shadow-md" : sensoryProfile?.lowStimulationMode ? "border-gray-200 bg-white text-gray-800" : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50"}`}>
            {!isShapeActivity && option.emoji && <span className="text-4xl">{option.emoji}</span>}
            <span>{option.text}</span>
          </button>;
        })}
      </div>
      <button type="button" onClick={handleSubmit} disabled={!selected} aria-label="Confirmar resposta"
        className="w-full rounded-xl bg-blue-600 py-3 text-lg font-bold text-white transition-all hover:scale-[1.01] hover:bg-blue-700 active:scale-[.98] focus:ring-4 focus:ring-blue-300 motion-reduce:transform-none disabled:cursor-not-allowed disabled:bg-gray-300">
        <ArasaacPictogram conceptId="state.confirm" showLabel={false} imageClassName="h-7 w-7" />
        <span className="ml-2">Confirmar</span>
      </button>
    </div>
  );
}
