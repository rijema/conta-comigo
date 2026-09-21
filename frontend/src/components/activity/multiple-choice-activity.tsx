"use client";

import { useState, useEffect, useRef } from "react";
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
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity.id });
  const options = activity.options ?? activity.content?.options ?? [];
  const items: string[] = activity.content?.items ?? [];
  const displayItems = items.filter((item) => !["+", "=", "?"].includes(item));
  const question = activity.content?.question || activity.content?.instructionsPt || "";
  const isShapeActivity = /^EF01MA1[345]$/.test(activity.bnccSkills?.[0] ?? "") || activity.type === "representation_matching";
  const targetShape = isShapeActivity ? question.match(SHAPE_SYMBOLS)?.[0] : null;
  const visibleQuestion = isShapeActivity ? question.replace(SHAPE_SYMBOLS, "").trim() : question;

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current && visibleQuestion) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [visibleQuestion],
      });
    }
  }, [speech.settings.voiceEnabled, visibleQuestion, speech]);

  const select = (option: any) => {
    setSelected(option.id);
    if (option.text) speech.speakPictogram(option.text, `option.${option.id}`);
  };

  const handleSubmit = () => {
    const option = options.find((candidate: any) => candidate.id === selected);
    if (!option) return;
    const isCorrect = Boolean(option.isCorrect);
    onAnswer({ selectedOption: option.id, selectedText: option.text, isCorrect });
    if (!isCorrect) setSelected(null);
    if (speech.settings.voiceEnabled) {
      const feedback = isCorrect ? "Correto! Parabéns!" : "Tente novamente.";
      speech.speakInstruction({ steps: [feedback] });
    }
  };

  return (
    <div>
      {targetShape && <div className="mb-1 text-center text-6xl" aria-hidden="true">{targetShape}</div>}
      <div className="mb-3 text-center text-xl font-semibold leading-relaxed text-gray-800">{visibleQuestion}</div>
      {activity.content?.visualScene && <div className="relative mx-auto mb-4 h-52 w-64 rounded-xl border-2 border-blue-200 bg-blue-50" aria-label={`Objeto ${activity.content.visualScene.relation} da forma`}>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"><ArasaacPictogram conceptId={activity.content.visualScene.referenceConceptId} showLabel={false} imageClassName="h-24 w-24" /></span>
        <span className={`absolute ${({ above: 'left-1/2 top-1 -translate-x-1/2', below: 'left-1/2 bottom-1 -translate-x-1/2', inside: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', outside: 'right-1 bottom-1', left: 'left-1 top-1/2 -translate-y-1/2', right: 'right-1 top-1/2 -translate-y-1/2' } as Record<string, string>)[activity.content.visualScene.relation] ?? ''}`}><ArasaacPictogram conceptId={activity.content.visualScene.objectConceptId} showLabel={false} imageClassName="h-12 w-12" /></span>
      </div>}
      {Array.isArray(activity.content?.visualContainers) && <div className="mb-4 flex justify-center gap-4" aria-label="Recipientes visuais">
        {activity.content.visualContainers.map((container: { label: string; count: number }, index: number) =>
          <div key={index} className="text-center"><div className="flex h-28 w-28 flex-wrap content-end justify-center gap-1 rounded-lg border-4 border-blue-500 p-2">{Array.from({ length: container.count }, (_, itemIndex) => <ArasaacPictogram key={itemIndex} conceptId="library.die" showLabel={false} imageClassName="h-8 w-8" />)}</div><span className="font-bold">{container.label}</span></div>)}</div>}
      {Array.isArray(activity.content?.visualLengths) && <div className="mb-4 flex flex-col items-center gap-3" aria-label="Comparação de comprimentos">
        {activity.content.visualLengths.map((length: { label: string; units: number }, index: number) => <div key={index} className="flex items-center gap-2"><span className="w-5 font-bold">{length.label}</span><div className="flex rounded-lg border-2 border-blue-400 p-1">{Array.from({ length: length.units }, (_, unitIndex) => <ArasaacPictogram key={unitIndex} conceptId="library.domino" showLabel={false} imageClassName="h-9 w-9" />)}</div></div>)}</div>}
      {Array.isArray(activity.content?.visualGroups) && <div className="mb-4 flex flex-wrap justify-center gap-4" aria-label="Grupos visuais">
        {activity.content.visualGroups.map((group: { label?: string; pictogramConceptIds: string[] }, groupIndex: number) =>
          <div key={groupIndex} className="rounded-xl border-2 border-blue-100 p-2 text-center">
            <div className="flex flex-wrap justify-center gap-1">{group.pictogramConceptIds.map((conceptId, index) =>
              <ArasaacPictogram key={`${conceptId}-${index}`} conceptId={conceptId} showLabel={false} imageClassName="h-11 w-11" />)}</div>
            {group.label && <span className="font-semibold">{group.label}</span>}
          </div>)}</div>}
      {displayItems.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-center gap-2 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-3">
          {displayItems.map((item, index) => <span key={index} className="select-none text-4xl">{item}</span>)}
        </div>
      )}
      {activity.content?.imageUrl && (
        <div className="mb-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activity.content.imageUrl} alt={activity.content.imageAlt || "Imagem da questão"} className="max-h-40 rounded-lg" loading="lazy" />
        </div>
      )}
      <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-blue-700">
        <ArasaacPictogram conceptId="activity.touch" showLabel={false} imageClassName="h-6 w-6" />
        <span className="ml-2">Toque na resposta certa</span>
      </p>
      <div className={`mb-4 grid gap-3 ${options.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option: any) => {
          const active = selected === option.id;
          return <button key={option.id} type="button" onClick={() => select(option)} aria-pressed={active} aria-label={`Opção: ${option.text}`}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-4 px-3 py-3 text-xl font-bold shadow-sm transition-all duration-150 focus:ring-4 focus:ring-blue-300 hover:scale-[1.025] active:scale-[.97] motion-reduce:transform-none ${active ? "scale-[1.02] border-blue-500 bg-blue-100 text-blue-800 shadow-md" : sensoryProfile?.lowStimulationMode ? "border-gray-200 bg-white text-gray-800" : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50"}`}>
            {option.pictogramConceptId && <ArasaacPictogram conceptId={option.pictogramConceptId} showLabel={false} imageClassName="h-14 w-14" />}
            {Array.isArray(option.pictogramConceptIds) && <span className="flex flex-wrap justify-center gap-1">{option.pictogramConceptIds.map((conceptId: string, index: number) => <ArasaacPictogram key={`${conceptId}-${index}`} conceptId={conceptId} showLabel={false} imageClassName="h-10 w-10" />)}</span>}
            {!isShapeActivity && !option.pictogramConceptId && !option.pictogramConceptIds && option.emoji && <span className="text-4xl">{option.emoji}</span>}
            <span>{option.text}</span>
          </button>;
        })}
      </div>
      <button type="button" onClick={handleSubmit} disabled={!selected} aria-label="Confirmar resposta"
        className="w-full rounded-xl bg-blue-600 py-3 text-lg font-bold text-white transition-all hover:scale-[1.01] hover:bg-blue-700 active:scale-[.98] focus:ring-4 focus:ring-blue-300 motion-reduce:transform-none disabled:cursor-not-allowed disabled:bg-gray-300">
        <ArasaacPictogram conceptId="activity.complete" showLabel={false} imageClassName="h-7 w-7" />
        <span className="ml-2">Confirmar</span>
      </button>
    </div>
  );
}
