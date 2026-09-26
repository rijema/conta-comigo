"use client";

import { useState, useRef, useEffect } from "react";
import type { Activity, SensoryProfile } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

interface Props {
  activity: Activity;
  onAnswer: (answer: { value: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function NumberLineActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const { min = 0, max = 10, target, step = 1 } = activity.content || {};
  const [value, setValue] = useState(min);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity.id });

  const marks = [];
  for (let i = min; i <= max; i += step) marks.push(i);

  const question = activity.content?.question || `Marque o número ${target} na reta numérica`;

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [question],
      });
    }
  }, [speech.settings.voiceEnabled, question, speech]);

  const handleSubmit = () => {
    const isCorrect = value === target;
    onAnswer({ value, isCorrect });
    if (speech.settings.voiceEnabled) {

    }
  };

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-8">
        {activity.content?.question || `Marque o número ${target} na reta numérica`}
      </p>

      {/* Number line */}
      <div className="relative mb-8 px-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-4 accent-blue-500 cursor-pointer"
          aria-label={`Reta numérica de ${min} a ${max}. Valor atual: ${value}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        {/* Marks */}
        <div className="flex justify-between mt-2">
          {marks.map((m) => (
            <span
              key={m}
              className={`text-sm font-medium ${
                m === value ? "text-blue-700 font-bold" : "text-gray-500"
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Current value display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-700">{value}</div>
        <p className="text-gray-500 mt-1">Número selecionado</p>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl 
                   hover:bg-blue-700 disabled:bg-gray-300 focus:ring-4 focus:ring-blue-300"
      >
        <ArasaacPictogram conceptId="state.confirm" showLabel={false} imageClassName="w-7 h-7" />
        <span className="ml-2">Confirmar</span>
      </button>
    </div>
  );
}
