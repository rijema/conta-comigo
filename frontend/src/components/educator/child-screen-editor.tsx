"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import type { PictogramConcept } from "@/lib/pictograms";
import { EXERCISE_CONTROL_IDS, type ExerciseControlId } from "@/contexts/AccessibilityContext";

/**
 * "Ajustar tela de interação da criança": a live replica of the exercise
 * screen with a placeholder exercise. The professional taps the controls to
 * hide or show them for this child, then confirms. Saved as
 * uiPreferences.hiddenControls / holdToChangeActivity on the child profile
 * and applied by the exercise screen (AccessibilityContext).
 */

const CONTROL_LABELS: Record<ExerciseControlId, string> = {
  map: "Mapa (sair da atividade)",
  progress: "Progresso da rodada",
  settings: "Ajustes (tamanho, letra, cores)",
  change: "Quero outro",
  pause: "Quero uma pausa",
  help: "Ajuda",
  guide: "TitiA explica para você",
};

// Placeholder exercises: only for previewing the layout; nothing is recorded.
const PLACEHOLDERS: { question: string; picto: PictogramConcept; count: number; options: string[] }[] = [
  { question: "Quantas maçãs tem na cesta?", picto: "object.apple", count: 4, options: ["3", "4", "5"] },
  { question: "Quantas estrelas você vê?", picto: "library.star", count: 3, options: ["2", "3", "6"] },
  { question: "Quantos biscoitos sobraram?", picto: "library.cookie", count: 5, options: ["5", "7", "4"] },
  { question: "Quantas árvores tem no pomar?", picto: "library.tree", count: 2, options: ["1", "2", "3"] },
];

export function ChildScreenEditor({ learnerName, uiPreferences, onSave, saving, savedMsg }: {
  learnerName: string;
  uiPreferences: Record<string, any>;
  onSave: (next: Record<string, any>) => void;
  saving: boolean;
  savedMsg: boolean;
}) {
  const saved = useMemo(() => new Set<ExerciseControlId>(
    (Array.isArray(uiPreferences.hiddenControls) ? uiPreferences.hiddenControls : [])
      .filter((id: string): id is ExerciseControlId => EXERCISE_CONTROL_IDS.includes(id as ExerciseControlId)),
  ), [uiPreferences.hiddenControls]);
  const [hidden, setHidden] = useState<Set<ExerciseControlId>>(saved);
  const [hold, setHold] = useState(uiPreferences.holdToChangeActivity !== false);
  const [sample, setSample] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const ex = PLACEHOLDERS[sample];
  const dirty = hold !== (uiPreferences.holdToChangeActivity !== false)
    || hidden.size !== saved.size || Array.from(hidden).some((id) => !saved.has(id));

  const toggle = (id: ExerciseControlId) => setHidden((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // A control in the preview is itself the toggle (no nested buttons). A
  // render function (not a nested component) keeps keyboard focus on toggle.
  const toggleButton = (id: ExerciseControlId, className: string, children: React.ReactNode) => {
    const isHidden = hidden.has(id);
    return (
      <button key={id} type="button" onClick={() => toggle(id)} aria-pressed={!isHidden}
        aria-label={`${isHidden ? "Mostrar" : "Ocultar"}: ${CONTROL_LABELS[id]}`}
        className={`relative ${isHidden
          ? "flex min-h-11 items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-600 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)] bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700"
          : className}`}>
        {isHidden ? <><span aria-hidden="true">🙈</span><span>Oculto · {CONTROL_LABELS[id]}</span></> : children}
      </button>
    );
  };

  const visibleActions = (["change", "pause", "help"] as const).filter((id) => !hidden.has(id)).length;

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-800">Ajustar tela de interação da criança</h3>
        <p className="mt-1 text-sm text-slate-600">
          Toque nos botões da prévia para ocultar ou mostrar na tela de exercícios de <strong>{learnerName}</strong>.
          O exercício é só um exemplo; as respostas e o botão Confirmar ficam sempre visíveis.
        </p>
      </div>

      {/* Preview of the exercise screen */}
      <div className="rounded-[1.75rem] border-4 border-slate-700 bg-amber-50 p-3" aria-label="Prévia da tela de exercícios" role="group">
        <div className="grid grid-cols-[1fr_minmax(0,14rem)_1fr] items-center gap-2 rounded-2xl bg-white px-2 py-2 shadow-sm">
          {toggleButton("map", "justify-self-start flex min-h-11 items-center gap-1.5 rounded-full border-2 border-purple-700 bg-purple-100 px-3 py-1.5 text-sm font-extrabold text-purple-800", <>
            <ArasaacPictogram conceptId="navigation.home" showLabel={false} imageClassName="h-5 w-5" /><span>Mapa</span>
          </>)}
          {toggleButton("progress", "flex min-h-11 w-full flex-col items-center justify-center rounded-xl px-2", <>
            <span aria-hidden="true" className="flex w-full justify-between gap-1">{Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-3 flex-1 rounded-full border-2 ${i < 3 ? "border-emerald-600 bg-emerald-400" : "border-slate-400 bg-white"}`} />)}</span>
            <span className="mt-0.5 text-xs font-bold text-slate-700">Atividade 4 de 10</span>
          </>)}
          {toggleButton("settings", "justify-self-end flex min-h-11 items-center gap-1.5 rounded-full border-2 border-slate-500 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-800", <>
            <ArasaacPictogram conceptId="navigation.settings" showLabel={false} imageClassName="h-6 w-6" /><span>Ajustes</span>
          </>)}
        </div>

        <div className={`mt-2 grid gap-2 ${visibleActions === 3 ? "grid-cols-3" : visibleActions === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {(["change", "pause", "help"] as const).map((id) => (
            toggleButton(id, {
              change: "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-teal-800 bg-teal-700 px-2 text-sm font-extrabold text-white",
              pause: "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-teal-700 bg-teal-50 px-2 text-sm font-extrabold text-teal-800",
              help: "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-sky-700 bg-sky-100 px-2 text-sm font-extrabold text-sky-800",
            }[id], <>
              <ArasaacPictogram conceptId={{ change: "navigation.repeat", pause: "navigation.pause", help: "navigation.help" }[id] as PictogramConcept} showLabel={false} imageClassName="h-6 w-6" />
              <span>{{ change: "Quero outro", pause: "Quero uma pausa", help: "Ajuda" }[id]}</span>
            </>)
          ))}
        </div>
        {/* Keeps the action row's place when all three are hidden, so the
            professional can still bring them back. */}
        {visibleActions === 0 && <p className="mt-1 text-xs font-semibold text-slate-700">Todos os botões de ação estão ocultos.</p>}

        <div className="mt-2 space-y-3 rounded-3xl bg-white p-3 shadow">
          {toggleButton("guide", "flex w-full min-h-11 items-center gap-3 rounded-2xl border-2 border-purple-200 bg-purple-50 p-2 text-left font-extrabold text-purple-800", <>
            <Image src="/assets/wildcard.png" width={40} height={30} alt="" className="h-8 w-10 object-contain" /><span>TitiA explica para você</span>
          </>)}
          <p className="text-center text-xl font-bold text-slate-800">{ex.question}</p>
          <div className="flex flex-wrap justify-center gap-1" aria-hidden="true">
            {Array.from({ length: ex.count }, (_, i) => <ArasaacPictogram key={i} conceptId={ex.picto} showLabel={false} imageClassName="h-10 w-10" />)}
          </div>
          <div className="grid grid-cols-3 gap-2" aria-label="Opções de exemplo (sempre visíveis)">
            {ex.options.map((o) => <div key={o} className="flex min-h-14 items-center justify-center rounded-2xl border-4 border-gray-300 bg-white text-xl font-bold text-gray-800">{o}</div>)}
          </div>
          <div className="flex min-h-12 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">Confirmar · sempre visível</div>
        </div>
      </div>

      <button type="button" onClick={() => setSample((s) => (s + 1) % PLACEHOLDERS.length)}
        className="rounded-xl border-2 border-slate-500 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        🔀 Outro exercício de exemplo
      </button>

      <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3 text-sm font-semibold text-slate-800">
        <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} className="mt-0.5 h-5 w-5 accent-indigo-600" />
        <span>
          Pedir para segurar &quot;Quero outro&quot; antes de trocar
          <span className="block font-normal text-slate-600">Evita trocar de exercício por um toque sem querer (GAIA G28). Pelo teclado, a troca continua imediata.</span>
        </span>
      </label>

      {hidden.has("map") && (
        <p role="note" className="rounded-xl border-l-4 border-amber-600 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Com o Mapa oculto, a criança não consegue sair da atividade sozinha. Use só com acompanhamento.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!dirty || saving}
          onClick={() => onSave({ ...uiPreferences, hiddenControls: EXERCISE_CONTROL_IDS.filter((id) => hidden.has(id)), holdToChangeActivity: hold })}
          className="rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400">
          {saving ? "Salvando…" : "Confirmar ajustes"}
        </button>
        <button type="button" disabled={!dirty || saving} onClick={() => { setHidden(new Set(saved)); setHold(uiPreferences.holdToChangeActivity !== false); }}
          className="rounded-xl border-2 border-slate-500 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed">
          Desfazer alterações
        </button>
        {savedMsg && <p role="status" className="text-sm font-semibold text-green-700">✓ Tela da criança atualizada</p>}
      </div>
    </div>
  );
}
