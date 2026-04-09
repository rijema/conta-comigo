"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { count: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function CountingActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const items = activity.content?.items || [];
  const targetCount = activity.content?.targetCount || items.length;
  const itemEmoji = activity.content?.itemEmoji || "🍎";

  const handleCount = () => {
    if (submitted) return;
    if (count < items.length) {
      setCount((c) => c + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect = count === targetCount;
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => onAnswer({ count, isCorrect }), 1500);
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
        {items.map((_: any, i: number) => (
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
            {itemEmoji}
          </span>
        ))}
      </div>

      {/* Counter display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-blue-700">{count}</div>
        <p className="text-gray-500 mt-1">Você contou {count}</p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-center py-3 rounded-xl text-lg font-bold mb-4 ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Correto!" : `💙 A resposta é ${targetCount}`}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setCount(0)}
          disabled={submitted}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50"
        >
          Recomeçar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitted || count === 0}
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
        >
          Confirmar ✓
        </button>
      </div>
    </div>
  );
}