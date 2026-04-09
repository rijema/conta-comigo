"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { arrangement: string[]; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function DragDropActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const items = activity.content?.items || [];
  const [slots, setSlots] = useState<(string | null)[]>(
    new Array(activity.content?.slotCount || items.length).fill(null)
  );
  const [available, setAvailable] = useState<string[]>(
    items.map((item: any) => item.id)
  );
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const handleDrop = (slotIndex: number) => {
    if (!dragItem || submitted) return;
    const newSlots = [...slots];
    const prevSlotIndex = newSlots.indexOf(dragItem);
    if (prevSlotIndex !== -1) newSlots[prevSlotIndex] = null;
    else setAvailable((av) => av.filter((id) => id !== dragItem));
    if (newSlots[slotIndex]) {
      setAvailable((av) => [...av, newSlots[slotIndex]!]);
    }
    newSlots[slotIndex] = dragItem;
    setSlots(newSlots);
    setDragItem(null);
  };

  const handleSubmit = () => {
    if (slots.some((s) => s === null)) return;
    setSubmitted(true);
    const correctOrder = activity.content?.correctOrder || [];
    const isCorrect = slots.every((s, i) => s === correctOrder[i]);
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => onAnswer({ arrangement: slots as string[], isCorrect }), 1500);
  };

  const getItem = (id: string) => items.find((i: any) => i.id === id);

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-6">
        {activity.content?.question || "Organize os itens na ordem correta"}
      </p>

      {/* Available items */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-yellow-50 rounded-xl min-h-16">
        {available.map((id) => {
          const item = getItem(id);
          return (
            <div
              key={id}
              draggable={!submitted}
              onDragStart={() => setDragItem(id)}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg cursor-grab 
                         text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
              role="button"
              tabIndex={0}
              aria-label={`Item: ${item?.label}`}
            >
              {item?.emoji && <span className="mr-1">{item.emoji}</span>}
              {item?.label}
            </div>
          );
        })}
      </div>

      {/* Drop slots */}
      <div className="flex gap-3 mb-6 justify-center">
        {slots.map((slotContent, i) => (
          <div
            key={i}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className={`w-20 h-20 border-3 border-dashed rounded-xl flex items-center justify-center
                       transition-colors ${
                         slotContent
                           ? "border-blue-400 bg-blue-50"
                           : "border-gray-300 bg-gray-50"
                       }`}
            aria-label={`Posição ${i + 1}${slotContent ? `: ${getItem(slotContent)?.label}` : ": vazia"}`}
            role="region"
          >
            {slotContent ? (
              <span className="text-sm font-medium text-blue-700">
                {getItem(slotContent)?.label}
              </span>
            ) : (
              <span className="text-gray-300 text-2xl">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {feedback && (
        <div
          role="status"
          className={`text-center py-3 rounded-xl text-lg font-bold mb-4 ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Perfeito!" : "💙 Quase lá!"}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitted || slots.some((s) => s === null)}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl 
                   hover:bg-blue-700 disabled:bg-gray-300 focus:ring-4 focus:ring-blue-300"
      >
        Confirmar ✓
      </button>
    </div>
  );
}