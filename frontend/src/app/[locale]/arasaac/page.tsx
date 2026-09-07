"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArasaacAttribution } from "@/components/arasaac/arasaac-attribution";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useVisualCommunicationAnalytics } from "@/hooks/use-visual-communication-analytics";
import { speakPortuguese } from "@/lib/speech";
import {
  VISUAL_LEARNING_LIBRARY,
  type VisualLearningItem,
} from "@/lib/visual-learning-library";

export default function ArasaacPage() {
  const router = useRouter();
  const locale = useLocale();
  const track = useVisualCommunicationAnalytics();
  const openedTracked = useRef(false);
  const [selected, setSelected] = useState<VisualLearningItem | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const category = VISUAL_LEARNING_LIBRARY[activeTab];

  useEffect(() => {
    if (openedTracked.current) return;
    openedTracked.current = true;
    track("visual_library_opened");
  }, [track]);

  const selectItem = (item: VisualLearningItem) => {
    setSelected(item);
    speakPortuguese(item.label);
    track("visual_library_item_selected", {
      pictogramConceptId: item.conceptId,
      category: category.name,
    });
    track("pictogram_opened", {
      pictogramConceptId: item.conceptId,
      category: category.name,
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(155deg,#fef9c3 0%,#fce7f3 40%,#dbeafe 100%)" }}>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/${locale}`)}
              aria-label="Voltar para o início"
              className="min-h-12 bg-white rounded-2xl border-2 border-slate-200 px-3 flex items-center gap-2 hover:bg-slate-50">
              <ArasaacPictogram conceptId="navigation.back" showLabel={false} imageClassName="w-7 h-7" />
              <span className="font-bold text-sm">Voltar</span>
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-800">Aprender com a TitiA</h1>
              <p className="text-xs text-slate-500">Toque em uma figura para ouvir o nome.</p>
            </div>
          </div>
          <a href="https://arasaac.org" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl font-bold hidden sm:block">
            Portal ARASAAC ↗
          </a>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {VISUAL_LEARNING_LIBRARY.map((item, index) => (
            <button key={item.name} onClick={() => { setActiveTab(index); setSelected(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-extrabold ${
                activeTab === index ? `bg-gradient-to-r ${item.gradient} text-white shadow-md` :
                  "bg-white/70 text-slate-600 border border-slate-200"
              }`}>
              <span aria-hidden="true">{item.emoji}</span><span>{item.name}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-16 space-y-4">
        {selected && (
          <div className="bg-white/90 border-2 border-purple-200 rounded-3xl p-4 flex items-center gap-4 shadow-md">
            <ArasaacPictogram conceptId={selected.conceptId} alt={selected.alt}
              showLabel={false} imageClassName="w-20 h-20" />
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold text-purple-800">{selected.label}</p>
              {selected.example && <p className="text-sm text-slate-600 mt-0.5">{selected.example}</p>}
            </div>
            <button onClick={() => {
              speakPortuguese(selected.label);
              track("pictogram_opened", { pictogramConceptId: selected.conceptId, category: category.name });
            }} aria-label={`Ouvir ${selected.label}`}
              className="min-h-14 px-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl flex items-center gap-2 font-bold">
              <ArasaacPictogram conceptId="navigation.listen" showLabel={false} imageClassName="w-7 h-7" />
              <span>Ouvir</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${category.gradient} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white shadow-md`} aria-hidden="true">
            {category.emoji}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{category.name}</h2>
            <p className="text-xs text-slate-500">{category.items.length} conceitos · toque para ouvir</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {category.items.map((item) => (
            <button key={item.conceptId} onClick={() => selectItem(item)}
              className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1.5 active:scale-95 hover:shadow-lg bg-white/80 ${
                selected?.conceptId === item.conceptId ? "border-purple-400 ring-4 ring-purple-200 bg-purple-50" : "border-white hover:border-purple-200"
              }`}
              aria-label={`Abrir ${item.label}`}>
              <ArasaacPictogram conceptId={item.conceptId} alt={item.alt}
                className="w-full" imageClassName="w-full aspect-square" />
            </button>
          ))}
        </div>

        <div className="bg-white/70 border border-orange-100 rounded-2xl p-3 text-center text-orange-700">
          <ArasaacAttribution />
          <p className="text-xs mt-1">Esta biblioteca é um apoio visual exploratório e não é uma atividade adaptativa.</p>
        </div>
      </main>
    </div>
  );
}
