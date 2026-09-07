"use client";

import { useState } from "react";
import type { Activity, ActivityOption, SensoryProfile } from "@/types";
import { resolvePictogram } from "@/lib/pictograms";

interface ParametricOption extends ActivityOption {
  value?: unknown;
  pictogramConceptId?: string;
}

interface ScaffoldHint {
  textLabel: string;
  pictogramConceptId?: string;
}

interface Props {
  activity: Activity;
  onAnswer: (answer: unknown) => void;
  onRequestHint?: () => void;
  sensoryProfile?: SensoryProfile;
}

function Pictogram({ conceptId }: { conceptId: string }) {
  const pictogram = resolvePictogram(conceptId);
  if (!pictogram) return null;
  return (
    <span role="img" aria-label={pictogram.labelPt} className="text-4xl">
      {pictogram.symbol}
    </span>
  );
}

export function ParametricMathActivity({
  activity,
  onAnswer,
  onRequestHint,
  sensoryProfile,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [visibleHints, setVisibleHints] = useState(0);
  const content = activity.content ?? {};
  const options = (content.options ?? []) as ParametricOption[];
  const reasonOptions = (content.reasonOptions ?? []) as ParametricOption[];
  const hints = (content.scaffolding?.hints ?? []) as ScaffoldHint[];
  const pictogramConceptIds = (content.pictogramConceptIds ?? []) as string[];
  const selectedOption = options.find((option) => option.id === selected);
  const selectedReasonOption = reasonOptions.find(
    (option) => option.id === selectedReason,
  );
  const needsReason = reasonOptions.length > 0;
  const usesNumericInput = content.inputMode === "numeric";
  const canSubmit = usesNumericInput
    ? numericAnswer.trim() !== ""
    : Boolean(selectedOption) && (!needsReason || Boolean(selectedReasonOption));
  const lowStimulation = sensoryProfile?.lowStimulationMode;

  const showNextHint = () => {
    if (visibleHints >= hints.length) return;
    setVisibleHints((current) => current + 1);
    onRequestHint?.();
  };

  const submit = () => {
    if (usesNumericInput) {
      if (numericAnswer.trim() === "") return;
      onAnswer({ value: Number(numericAnswer) });
      return;
    }
    if (!selectedOption || (needsReason && !selectedReasonOption)) return;
    if (needsReason) {
      onAnswer({
        value: selectedOption.value ?? selectedOption.text,
        reason: selectedReasonOption?.value ?? selectedReasonOption?.text,
      });
      return;
    }
    onAnswer({
      selectedText: selectedOption.value ?? selectedOption.text,
      isCorrect: Boolean(selectedOption.isCorrect),
    });
  };

  const renderOptions = (
    values: ParametricOption[],
    current: string | null,
    select: (id: string) => void,
    label: string,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={label}>
      {values.map((option) => {
        const active = current === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => select(option.id)}
            aria-pressed={active}
            aria-label={option.text}
            data-spoken-label={option.text}
            className={`min-h-20 rounded-2xl border-4 px-4 py-3 font-bold text-lg
              focus:ring-4 focus:ring-blue-300 transition-colors
              ${active
                ? "border-blue-500 bg-blue-100 text-blue-900"
                : lowStimulation
                  ? "border-gray-200 bg-white text-gray-800"
                  : "border-purple-200 bg-white text-gray-800 hover:bg-purple-50"
              }`}
          >
            {option.pictogramConceptId && (
              <span className="block mb-1" aria-hidden="true">
                <Pictogram conceptId={option.pictogramConceptId} />
              </span>
            )}
            {option.emoji && <span className="block text-4xl mb-1">{option.emoji}</span>}
            <span>{option.text}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {pictogramConceptIds.length > 0 && (
        <div className="flex justify-center gap-3 mb-4" aria-label="Apoios visuais">
          {pictogramConceptIds.map((conceptId) => (
            <Pictogram key={conceptId} conceptId={conceptId} />
          ))}
        </div>
      )}

      <p className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {content.question || content.instructionsPt}
      </p>

      {usesNumericInput ? (
        <div className="flex justify-center">
          <label className="text-center font-bold text-gray-700">
            <span className="block mb-2">Digite o número</span>
            <input
              type="number"
              inputMode="numeric"
              value={numericAnswer}
              onChange={(event) => setNumericAnswer(event.target.value)}
              aria-label="Digite a resposta numérica"
              data-spoken-label="Digite a resposta numérica"
              className="w-36 rounded-2xl border-4 border-blue-200 px-4 py-3
                text-center text-3xl font-bold focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>
      ) : renderOptions(options, selected, setSelected, "Escolha uma resposta")}

      {needsReason && (
        <div className="mt-6">
          <p className="font-bold text-gray-700 mb-3">Por quê?</p>
          {renderOptions(
            reasonOptions,
            selectedReason,
            setSelectedReason,
            "Escolha uma justificativa",
          )}
        </div>
      )}

      {visibleHints > 0 && (
        <div className="mt-5 space-y-2" role="status" aria-live="polite">
          {hints.slice(0, visibleHints).map((hint, index) => (
            <div key={index} className="rounded-xl bg-yellow-50 border-2 border-yellow-200 p-3">
              {hint.pictogramConceptId && <Pictogram conceptId={hint.pictogramConceptId} />}
              <span className="ml-2">{hint.textLabel}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {hints.length > visibleHints && (
          <button
            type="button"
            onClick={showNextHint}
            aria-label="Mostrar uma dica"
            data-spoken-label="Mostrar uma dica"
            className="flex-1 py-3 rounded-xl border-2 border-yellow-300 bg-yellow-50 font-bold"
          >
            💡 Dica
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Confirmar resposta"
          data-spoken-label="Confirmar resposta"
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl
            hover:bg-blue-700 disabled:bg-gray-300 focus:ring-4 focus:ring-blue-300"
        >
          Confirmar ✓
        </button>
      </div>
    </div>
  );
}
