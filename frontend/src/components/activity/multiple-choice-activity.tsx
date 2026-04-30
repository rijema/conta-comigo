"use client";

import { useState, useEffect, useRef } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { selectedOption: string; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function MultipleChoiceActivity({
  activity,
  onAnswer,
  sensoryProfile,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const options = activity.options ?? activity.content?.options ?? [];
  const items: string[] = activity.content?.items ?? [];
  const displayItems = items.filter((i: string) => i !== '+' && i !== '=' && i !== '?');

  const resetForRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setFeedback(null);
    setCountdown(null);
  };

  const handleSelect = (optionId: string) => {
    if (submitted) return;
    setSelected(optionId);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);

    const selectedOption = options.find((o: any) => o.id === selected);
    const isCorrect = selectedOption?.isCorrect || false;
    setFeedback(isCorrect ? "correct" : "wrong");

    // Both correct and wrong use a 3s countdown popup
    setCountdown(3);
    let secs = 3;
    countdownRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        if (isCorrect) {
          onAnswer({ selectedOption: selected, selectedText: selectedOption?.text, isCorrect: true });
        } else {
          onAnswer({ selectedOption: selected, selectedText: selectedOption?.text, isCorrect: false });
          resetForRetry();
        }
      } else {
        setCountdown(secs);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const lowStimulation = sensoryProfile?.lowStimulationMode;

  return (
    <div>
      {/* Question */}
      <div className="text-xl font-semibold text-gray-800 mb-4 leading-relaxed">
        {activity.content?.question || activity.content?.instructionsPt}
      </div>

      {/* Items display (large emojis to count/visualize) */}
      {displayItems.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6 p-4 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
          {displayItems.map((item: string, i: number) => (
            <span key={i} className="text-5xl select-none">{item}</span>
          ))}
        </div>
      )}

      {/* Visual representation (if any) */}
      {activity.content?.imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={activity.content.imageUrl}
            alt={activity.content.imageAlt || "Imagem da questão"}
            className="max-h-48 rounded-lg"
          />
        </div>
      )}

      {/* Instruction label */}
      <p className="text-sm font-semibold text-blue-700 mb-3 text-center tracking-wide uppercase">
        👇 Toque na resposta certa
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {options.map((option: any) => {
          const isSelected = selected === option.id;
          const showResult = submitted && isSelected;

          let buttonClass =
            "flex flex-col items-center justify-center gap-1 py-5 px-3 rounded-2xl border-4 text-xl font-bold transition-all duration-200 focus:ring-4 focus:ring-blue-300 active:scale-95 ";

          if (showResult) {
            buttonClass += option.isCorrect
              ? "border-green-500 bg-green-100 text-green-800 scale-105 shadow-lg"
              : "border-red-400 bg-red-100 text-red-800";
          } else if (isSelected) {
            buttonClass += "border-blue-500 bg-blue-100 text-blue-800 shadow-md scale-105";
          } else {
            buttonClass += lowStimulation
              ? "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={buttonClass}
              aria-pressed={isSelected}
              aria-label={`Opção: ${option.text}`}
              disabled={submitted}
            >
              {option.emoji && (
                <span className="text-4xl">{option.emoji}</span>
              )}
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full mt-4 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl 
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     focus:ring-4 focus:ring-blue-300 transition-colors"
          aria-label="Confirmar resposta"
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
          <div
            className={`flex flex-col items-center gap-3 px-10 py-8 rounded-3xl shadow-2xl text-center pointer-events-auto ${
              feedback === "correct"
                ? "bg-green-500 text-white"
                : "bg-orange-400 text-white"
            }`}
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
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="5"
                    />
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke="white"
                      strokeWidth="5"
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