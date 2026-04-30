"use client";

import { useState, useRef, useEffect } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { arrangement: string[]; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function DragDropActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const items: any[] = activity.content?.items || [];
  const slotCount: number = activity.content?.slotCount || items.length;

  const [slots, setSlots] = useState<(string | null)[]>(new Array(slotCount).fill(null));
  const [available, setAvailable] = useState<string[]>(items.map((i: any) => i.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getItem = (id: string) => items.find((i: any) => i.id === id);

  const resetForRetry = () => {
    setSlots(new Array(slotCount).fill(null));
    setAvailable(items.map((i: any) => i.id));
    setSelected(null);
    setSubmitted(false);
    setFeedback(null);
    setCountdown(null);
  };

  // Tap an available item to select it
  const handleSelectItem = (id: string) => {
    if (submitted) return;
    setSelected((prev) => (prev === id ? null : id));
  };

  // Tap a slot to place the selected item, or tap to remove placed item back to available
  const handleTapSlot = (slotIndex: number) => {
    if (submitted) return;
    const currentInSlot = slots[slotIndex];

    if (selected) {
      // Place selected item into this slot
      const newSlots = [...slots];
      const prevSlotIndex = newSlots.indexOf(selected);
      if (prevSlotIndex !== -1) {
        // Move from another slot
        newSlots[prevSlotIndex] = currentInSlot; // swap
      } else {
        // Coming from available tray
        setAvailable((av) => av.filter((id) => id !== selected));
        if (currentInSlot) {
          setAvailable((av) => [...av, currentInSlot]);
        }
        newSlots[slotIndex] = selected;
      }
      if (prevSlotIndex !== -1) {
        newSlots[slotIndex] = selected;
      }
      setSlots(newSlots);
      setSelected(null);
    } else if (currentInSlot) {
      // No item selected — tap slot to remove back to available
      const newSlots = [...slots];
      newSlots[slotIndex] = null;
      setSlots(newSlots);
      setAvailable((av) => [...av, currentInSlot]);
    }
  };

  const handleSubmit = () => {
    if (slots.some((s) => s === null) || submitted) return;
    setSubmitted(true);
    const correctOrder: string[] = activity.content?.correctOrder || [];
    const isCorrect = slots.every((s, i) => s === correctOrder[i]);
    setFeedback(isCorrect ? "correct" : "wrong");

    setCountdown(3);
    let secs = 3;
    countdownRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        if (isCorrect) {
          onAnswer({ arrangement: slots as string[], isCorrect: true });
        } else {
          onAnswer({ arrangement: slots as string[], isCorrect: false });
          resetForRetry();
        }
      } else {
        setCountdown(secs);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const allFilled = slots.every((s) => s !== null);

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-4">
        {activity.content?.question || "Organize os itens na ordem correta"}
      </p>

      {/* Instruction */}
      <p className="text-sm font-semibold text-blue-700 mb-3 text-center tracking-wide uppercase">
        👆 Toque num item e depois toque na posição
      </p>

      {/* Available items tray */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-yellow-50 rounded-2xl border-2 border-yellow-200 min-h-16 justify-center">
        {available.length === 0 && (
          <span className="text-gray-400 text-sm self-center">Todos os itens foram colocados</span>
        )}
        {available.map((id) => {
          const item = getItem(id);
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => handleSelectItem(id)}
              disabled={submitted}
              className={`px-5 py-3 rounded-2xl border-4 text-2xl font-bold transition-all duration-150 active:scale-95
                ${isSelected
                  ? "border-blue-500 bg-blue-100 text-blue-800 scale-110 shadow-lg"
                  : "border-yellow-300 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
                }`}
              aria-pressed={isSelected}
              aria-label={`Item: ${item?.label}`}
            >
              {item?.emoji ? `${item.emoji} ` : ""}{item?.label}
            </button>
          );
        })}
      </div>

      {/* Drop slots */}
      <div className="flex gap-3 mb-6 justify-center flex-wrap">
        {slots.map((slotContent, i) => {
          const item = slotContent ? getItem(slotContent) : null;
          const isTarget = selected !== null && !submitted;
          return (
            <button
              key={i}
              onClick={() => handleTapSlot(i)}
              disabled={submitted && !slotContent}
              className={`min-w-20 min-h-20 px-3 py-3 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center
                         text-2xl font-bold transition-all duration-150 active:scale-95
                         ${slotContent
                           ? "border-blue-400 bg-blue-50 text-blue-800"
                           : isTarget
                           ? "border-blue-400 bg-blue-50 animate-pulse"
                           : "border-gray-300 bg-gray-50 text-gray-300"
                         }`}
              aria-label={`Posição ${i + 1}${slotContent ? `: ${item?.label}` : ": vazia"}`}
            >
              {slotContent ? (
                <>
                  {item?.emoji && <span>{item.emoji}</span>}
                  <span className="text-base">{item?.label}</span>
                </>
              ) : (
                <span>{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className="w-full py-3 bg-blue-600 text-white text-lg font-bold rounded-xl
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     focus:ring-4 focus:ring-blue-300 transition-colors"
        >
          Confirmar ✓
        </button>
      )}

      {/* Feedback popup overlay */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className={`flex flex-col items-center gap-3 px-10 py-8 rounded-3xl shadow-2xl text-center pointer-events-auto
            ${feedback === "correct" ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}
          >
            <span className="text-6xl">{feedback === "correct" ? "🎉" : "💙"}</span>
            <p className="text-2xl font-extrabold">
              {feedback === "correct" ? "Muito bem!" : "Quase lá!"}
            </p>
            {countdown !== null && (
              <>
                <p className="text-base font-medium opacity-90">
                  {feedback === "correct" ? "Próxima atividade em..." : "Tentando novamente em..."}
                </p>
                <div className="relative flex items-center justify-center w-16 h-16">
                  <svg className="absolute" width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
                    <circle
                      cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - countdown / 3)}
                      transform="rotate(-90 32 32)"
                      style={{ transition: "stroke-dashoffset 0.9s linear" }}
                    />
                  </svg>
                  <span className="text-2xl font-extrabold">{countdown}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}