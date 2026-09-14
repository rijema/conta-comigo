"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";

interface Props {
  activity: Activity;
  onAnswer: (answer: { count: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function CountingActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const [count, setCount] = useState(0);

  const rawItems = activity.content?.items || [];
  const items = rawItems.filter((i: any) => i !== '+' && i !== '=' && i !== '?');
  const targetCount = activity.content?.targetCount ?? items.length;
  const itemEmoji = activity.content?.itemEmoji || null;

  const handleCount = () => {
    if (count < items.length) {
      setCount((c) => c + 1);
    }
  };

  const handleSubmit = () => {
    const isCorrect = count === targetCount;
    onAnswer({ count, isCorrect });
    if (!isCorrect) setCount(0);
  };

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-6">
        {activity.content?.question || `Quantos ${itemEmoji} você vê?`}
      </p>

      {/* Items to count */}
      <div
        className="flex flex-wrap gap-3 justify-center mb-8 p-4 bg-blue-50 rounded-xl"
        role="group"
        aria-label="Itens para contar"
      >
        {items.map((item: any, i: number) => (
          <span
            key={i}
            className={`text-4xl cursor-pointer select-none transition-transform ${
              i < count ? "scale-110 opacity-100" : "opacity-40"
            }`}
            onClick={handleCount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCount()}
            aria-label={`Item ${i + 1}${i < count ? " contado" : ""}`}
          >
            {itemEmoji ?? item}
          </span>
        ))}
      </div>

      {/* Counter display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-blue-700">{count}</div>
        <p className="text-gray-500 mt-1">Você contou {count}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCount(0)}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50"
        >
          <ArasaacPictogram conceptId="navigation.try_again" showLabel={false} imageClassName="w-6 h-6" />
          <span className="ml-2">Recomeçar</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={count === 0}
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
        >
          <ArasaacPictogram conceptId="state.confirm" showLabel={false} imageClassName="w-6 h-6" />
          <span className="ml-2">Confirmar</span>
        </button>
      </div>
    </div>
  );
}
