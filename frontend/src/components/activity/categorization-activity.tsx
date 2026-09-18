"use client";

import { useState } from "react";
import type { Activity } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";

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

  const assign = (binId: string) => {
    if (!selected) return;
    setPlacements((current) => ({ ...current, [selected]: binId }));
    setSelected(null);
  };

  return (
    <div>
      <p className="mb-4 text-center text-xl font-bold">{activity.content?.question ?? activity.content?.instructionsPt}</p>
      <div className="mb-5 flex flex-wrap justify-center gap-3" aria-label="Itens para agrupar">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item.id)}
            aria-pressed={selected === item.id}
            className={`min-h-24 rounded-2xl border-4 p-3 font-bold ${selected === item.id ? "border-blue-600 bg-blue-100" : "border-yellow-300 bg-white"}`}>
            <span className="flex justify-center gap-1">
              {(item.pictogramConceptIds?.length ? item.pictogramConceptIds : [item.pictogramConceptId]).map((conceptId, index) => (
                <span key={`${conceptId}-${index}`} className="inline-flex h-20 w-20 items-center justify-center" style={{ transform: `scale(${item.visualScale ?? 1})` }}><ArasaacPictogram conceptId={conceptId} showLabel={false} imageClassName="h-12 w-12" /></span>
              ))}
            </span>
            <span className="block">{item.label}</span>
            {placements[item.id] && <span className="block text-sm text-blue-700">{bins.find((bin) => bin.id === placements[item.id])?.label}</span>}
          </button>
        ))}
      </div>
      <p className="mb-2 text-center text-sm">Toque em um item e depois no grupo.</p>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {bins.map((bin) => (
          <button key={bin.id} type="button" onClick={() => assign(bin.id)}
            disabled={!selected} className="min-h-28 rounded-2xl border-4 border-blue-200 bg-blue-50 p-3 font-bold disabled:opacity-70">
            <span style={{ transform: `scale(${bin.visualScale ?? 1})` }}><ArasaacPictogram conceptId={bin.pictogramConceptId} showLabel={false} imageClassName="h-12 w-12" /></span>
            <span className="block">{bin.label}</span>
            <span className="block text-sm">{Object.values(placements).filter((value) => value === bin.id).length} item(ns)</span>
          </button>
        ))}
      </div>
      <button type="button" disabled={items.some((item) => !placements[item.id])}
        onClick={() => onAnswer(items.map((item) => placements[item.id]))}
        className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:bg-gray-300">
        <ArasaacPictogram conceptId="activity.complete" showLabel={false} imageClassName="h-7 w-7" /> Confirmar
      </button>
    </div>
  );
}
