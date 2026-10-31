"use client";

import { useState, useRef, useEffect } from "react";
import type { Activity } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

interface CategoryItem {
  id: string;
  label: string;
  pictogramConceptId: string;
  pictogramConceptIds?: string[];
  visualScale?: number;
}

interface CategoryBin {
  id: string;
  label: string;
  pictogramConceptId: string;
  visualScale?: number;
}

export function CategorizationActivity({ activity, onAnswer }: {
  activity: Activity;
  onAnswer: (answer: string[]) => void;
}) {
  const items = (activity.content?.items ?? []) as unknown as CategoryItem[];
  const bins = (activity.content?.bins ?? []) as CategoryBin[];
  const [selected, setSelected] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  // Announced politely to screen readers after each placement (WCAG 4.1.3).
  const [status, setStatus] = useState("");
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity.id });

  const question = activity.content?.question ?? activity.content?.instructionsPt ?? "Agrupe os itens.";
  const spokenQuestion = activity.content?.spokenQuestion || question;

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [spokenQuestion],
      });
    }
  }, [speech.settings.voiceEnabled, spokenQuestion, speech]);

  const selectItem = (item: CategoryItem) => {
    setSelected(item.id);
    speech.speakPictogram(item.label, `item.${item.id}`);
  };

  const assign = (bin: CategoryBin) => {
    // Bins stay focusable (aria-disabled instead of disabled) so keyboard and
    // screen-reader users can reach them; without a selected item they only
    // explain what to do.
    if (!selected) {
      setStatus("Primeiro toque em um item.");
      return;
    }
    const item = items.find((candidate) => candidate.id === selected);
    setPlacements((current) => ({ ...current, [selected]: bin.id }));
    setSelected(null);
    setStatus(`${item?.label ?? "Item"} colocado no grupo ${bin.label}.`);
  };

  const handleSubmit = () => {
    const answer = items.map((item) => placements[item.id]);
    onAnswer(answer);
    if (speech.settings.voiceEnabled) {
      const feedback = "Sua resposta foi registrada.";
      speech.speakInstruction({ steps: [feedback] });
    }
  };

  const allPlaced = items.every((item) => placements[item.id]);

  return (
    <div>
      <p id={`categorize-question-${activity.id}`} className="mb-4 text-center text-xl font-bold">{question}</p>
      <div className="mb-5 flex flex-wrap justify-center gap-3" role="group" aria-label="Itens para agrupar">
        {items.map((item) => {
          const binLabel = bins.find((bin) => bin.id === placements[item.id])?.label;
          return (
            <button key={item.id} type="button" onClick={() => selectItem(item)}
              aria-pressed={selected === item.id}
              aria-label={`${item.label}${binLabel ? `, no grupo ${binLabel}` : ""}`}
              className={`min-h-24 rounded-2xl border-4 p-3 font-bold transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 active:scale-95 motion-reduce:transform-none ${selected === item.id ? "border-blue-600 bg-blue-100" : "border-yellow-300 bg-white"}`}>
              <span className="flex justify-center gap-1" aria-hidden="true">
                {(item.pictogramConceptIds?.length ? item.pictogramConceptIds : [item.pictogramConceptId]).map((conceptId, index) => (
                  <span key={`${conceptId}-${index}`} className="inline-flex h-20 w-20 items-center justify-center" style={{ transform: `scale(${item.visualScale ?? 1})` }}><ArasaacPictogram conceptId={conceptId} showLabel={false} imageClassName="h-12 w-12" /></span>
                ))}
              </span>
              <span className="block">{item.label}</span>
              {binLabel && <span className="block text-sm text-blue-800">{binLabel}</span>}
            </button>
          );
        })}
      </div>
      <p className="mb-2 text-center text-sm">Toque em um item e depois no grupo.</p>
      <div className="mb-5 grid grid-cols-2 gap-3" role="group" aria-label="Grupos">
        {bins.map((bin) => {
          const count = Object.values(placements).filter((value) => value === bin.id).length;
          return (
            <button key={bin.id} type="button" onClick={() => assign(bin)}
              aria-disabled={!selected}
              aria-label={`Grupo ${bin.label}: ${count} ${count === 1 ? "item" : "itens"}`}
              className={`min-h-28 rounded-2xl border-4 bg-blue-50 p-3 font-bold text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 ${selected ? "border-blue-500" : "border-blue-200"}`}>
              <span aria-hidden="true" style={{ transform: `scale(${bin.visualScale ?? 1})` }}><ArasaacPictogram conceptId={bin.pictogramConceptId} showLabel={false} imageClassName="h-12 w-12" /></span>
              <span className="block">{bin.label}</span>
              <span className="block text-sm" aria-hidden="true">{count} item(ns)</span>
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" className="sr-only">{status}</p>
      <button type="button" disabled={!allPlaced}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:bg-gray-300 disabled:text-gray-700">
        <ArasaacPictogram conceptId="activity.complete" showLabel={false} imageClassName="h-7 w-7" /> Confirmar
      </button>
    </div>
  );
}
