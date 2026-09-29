"use client";

import { useState, useEffect, useRef } from "react";
import type { Activity, SensoryProfile } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";
import { motion } from "framer-motion";

interface Props {
  activity: Activity;
  onAnswer: (answer: { count: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

interface ContentItem {
  id?: string;
  label?: string;
  pictogramConceptId?: string;
  /** Legacy format from exercises-77 seed: raw ARASAAC numeric ID as string */
  arasaacId?: string | number;
  /** Legacy format from exercises-77 seed: visual description (e.g. 'apples:2') */
  visual?: string;
}

export function CountingActivity({ activity, onAnswer }: Props) {
  const [count, setCount] = useState(0);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity.id });

  // Items may be objects {id, label, pictogramConceptId} or plain emoji strings
  const rawItems: (ContentItem | string)[] = activity.content?.items || [];
  // Filter out math symbols used in other activity types
  const items = rawItems.filter((i) => i !== "+" && i !== "=" && i !== "?");

  const targetCount: number = activity.content?.targetCount ?? activity.content?.correctAnswer ?? items.length;
  const question =
    activity.content?.question ||
    activity.content?.instructionsPt ||
    `Conte os itens e diga quantos há.`;
  const spokenQuestion = targetCount
    ? `${question} Conte até ${targetCount}.`
    : question;

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: [spokenQuestion] });
    }
  }, [speech.settings.voiceEnabled, spokenQuestion, speech]);

  const handleSubmit = () => {
    const isCorrect = count === targetCount;
    onAnswer({ count, isCorrect });
    if (!isCorrect) setCount(0);
  };

  const renderItem = (item: ContentItem | string, index: number) => {
    if (typeof item === "string") {
      return (
        <span
          key={index}
          className={`select-none text-5xl transition-all ${index < count ? "opacity-100 scale-110" : "opacity-40"}`}
        >
          {item}
        </span>
      );
    }
    // Normalize legacy arasaacId field (string/number) to a pictogramConceptId
    const conceptId = item.pictogramConceptId
      ?? (item.arasaacId ? `arasaac.${item.arasaacId}` : undefined);
    return (
      <motion.div
        key={item.id ?? index}
        className={`flex flex-col items-center rounded-xl border-2 p-2 transition-all ${
          index < count ? "border-green-400 bg-green-50" : "border-gray-200 bg-white opacity-50"
        }`}
        whileTap={{ scale: 1.1 }}
      >
        {conceptId ? (
          <ArasaacPictogram conceptId={conceptId} showLabel={false} imageClassName="h-14 w-14" />
        ) : (
          <span className="text-4xl">🟡</span>
        )}
        {item.label && <span className="mt-1 text-xs font-bold text-gray-600">{item.label}</span>}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Instruction */}
      <p className="text-center text-xl font-bold text-blue-700">{question}</p>

      {/* Target number hint */}
      {targetCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2">
          <span className="text-sm font-semibold text-gray-500">Conte até:</span>
          <span className="text-4xl font-extrabold text-blue-700">{targetCount}</span>
          <ArasaacPictogram conceptId={`number.${targetCount}`} showLabel={false} imageClassName="h-10 w-10" />
        </div>
      )}

      {/* Items to count */}
      <div
        className="flex flex-wrap justify-center gap-3 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-4"
        role="group"
        aria-label="Itens para contar"
      >
        {items.length > 0 ? (
          items.map((item, i) => renderItem(item, i))
        ) : (
          <span className="text-gray-400">Nenhum item para contar.</span>
        )}
      </div>

      {/* Counter */}
      <motion.div
        className="flex flex-col items-center"
        key={count}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <span className="text-7xl font-extrabold text-blue-700">{count}</span>
        <span className="text-sm text-gray-500">contado(s)</span>
      </motion.div>

      {/* Controls */}
      <div className="flex w-full max-w-xs gap-3">
        <button
          type="button"
          onClick={() => setCount(0)}
          disabled={count === 0}
          className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-600 disabled:opacity-40"
        >
          🔄 Reiniciar
        </button>
        <button
          type="button"
          onClick={() => setCount((c) => Math.min(c + 1, items.length > 0 ? items.length : targetCount))}
          disabled={count >= (items.length > 0 ? items.length : targetCount)}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white disabled:opacity-40"
        >
          +1 Contar
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={count === 0}
        className="w-full max-w-xs rounded-xl bg-green-600 py-3 font-bold text-white disabled:bg-gray-300"
      >
        <ArasaacPictogram conceptId="activity.complete" showLabel={false} imageClassName="h-7 w-7" />
        <span className="ml-2">Confirmar</span>
      </button>
    </div>
  );
}
