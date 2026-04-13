"use client";

import { useState } from "react";
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

  const handleSelect = (optionId: string) => {
    if (submitted) return;
    setSelected(optionId);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);

    const selectedOption = activity.options?.find((o) => o.id === selected);
    const isCorrect = selectedOption?.isCorrect || false;
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      onAnswer({ selectedOption: selected, isCorrect });
    }, 1500);
  };

  const lowStimulation = sensoryProfile?.lowStimulationMode;

  return (
    <div>
      {/* Question */}
      <div className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
        {activity.content?.question || activity.content?.instructionsPt}
      </div>

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

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {activity.options?.map((option) => {
          const isSelected = selected === option.id;
          const showResult = submitted && isSelected;

          let buttonClass =
            "p-4 rounded-xl border-3 text-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-blue-300 ";

          if (showResult) {
            buttonClass += option.isCorrect
              ? "border-green-500 bg-green-50 text-green-800 scale-105"
              : "border-red-400 bg-red-50 text-red-800";
          } else if (isSelected) {
            buttonClass +=
              "border-blue-500 bg-blue-50 text-blue-800 scale-102";
          } else {
            buttonClass += lowStimulation
              ? "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50";
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
                <span className="text-2xl mr-2">{option.emoji}</span>
              )}
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-center py-3 px-4 rounded-xl text-lg font-bold ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Muito bem!" : "💙 Tente novamente!"}
        </div>
      )}

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
    </div>
  );
}