"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { useAccessibility, type AccessibilitySettings } from "@/contexts/AccessibilityContext";
import { useModalFocus } from "@/hooks/use-modal-focus";

/**
 * Child-facing display settings on the exercise screen (gear button).
 * Covers GAIA G05 (customização visual), G06 (informacional), G08 (modo de
 * leitura) and G17 (ampliação de imagens). Choices are big, pictogram-led
 * buttons with a live preview, and are saved on this device.
 */

type Option<T> = { value: T; label: string; preview?: React.ReactNode };

const PICTO_SIZES: Option<AccessibilitySettings["pictogramScale"]>[] = [
  { value: 1, label: "Normal" }, { value: 1.25, label: "Maior" }, { value: 1.5, label: "Grande" }, { value: 2, label: "Gigante" },
];
const ITEM_SIZES: Option<AccessibilitySettings["itemScale"]>[] = [
  { value: 1, label: "Normal" }, { value: 1.15, label: "Maior" }, { value: 1.3, label: "Grande" },
];
const FONTS: Option<AccessibilitySettings["readingFont"]>[] = [
  { value: "default", label: "Padrão", preview: <span className="text-2xl font-bold">Aa</span> },
  { value: "atkinson", label: "Fácil de ler", preview: <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-atkinson)" }}>Aa</span> },
  { value: "lexend", label: "Letra espaçada", preview: <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-lexend)" }}>Aa</span> },
];
const LABELS: Option<AccessibilitySettings["buttonLabels"]>[] = [
  { value: "both", label: "Figura e palavra" }, { value: "icons", label: "Só figura" }, { value: "text", label: "Só palavra" },
];
const THEMES: { value: AccessibilitySettings["colorTheme"] | "contrast"; label: string; swatch: [string, string] }[] = [
  { value: "default", label: "Colorido", swatch: ["#fde68a", "#0f766e"] },
  { value: "cream", label: "Creme (leitura)", swatch: ["#f7f0dc", "#3b4a6b"] },
  { value: "calm", label: "Calmo", swatch: ["#e8eef3", "#3d5a6c"] },
  { value: "contrast", label: "Alto contraste", swatch: ["#ffffff", "#000000"] },
];

function Choice<T>({ legend, options, value, onChange, pictogram }: {
  legend: string; options: Option<T>[]; value: T; onChange: (v: T) => void; pictogram?: (o: Option<T>) => React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border-2 border-slate-200 p-3">
      <legend className="px-1 text-base font-extrabold text-slate-800">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => (
          <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-sm font-bold ${
              value === o.value ? "border-violet-700 bg-violet-100 text-violet-900" : "border-slate-500 bg-white text-slate-800 hover:bg-slate-50"}`}>
            {pictogram?.(o) ?? o.preview}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ChildDisplaySettings({ readingText, readingOptions, onSpeak }: {
  readingText: string;
  readingOptions: string[];
  onSpeak: (text: string) => void;
}) {
  const { settings, updateSettings } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const closeReading = useCallback(() => setReading(false), []);
  const dialogRef = useModalFocus<HTMLElement>(open, close);
  const readingRef = useModalFocus<HTMLElement>(reading, closeReading);
  const theme = settings.highContrast ? "contrast" : settings.colorTheme;
  // Dialogs render in <body>: the sticky header uses backdrop-filter, which
  // would otherwise trap these `fixed` overlays inside its own box.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
        aria-label="Ajustes da tela: tamanho, letra e cores"
        className="cc-action justify-self-end flex min-h-11 items-center gap-1.5 rounded-full border-2 border-slate-500 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-800 shadow-sm hover:bg-slate-50">
        <ArasaacPictogram conceptId="navigation.settings" showLabel={false} imageClassName="h-6 w-6" />
        <span className="hidden sm:inline">Ajustes</span>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-slate-950/45 p-3 sm:items-center" role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="display-settings-title"
            className="my-auto w-full max-w-2xl space-y-3 rounded-[2rem] border-4 border-violet-200 bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="display-settings-title" className="flex items-center gap-2 text-xl font-black text-violet-900">
                <ArasaacPictogram conceptId="navigation.settings" showLabel={false} imageClassName="h-9 w-9" />
                Ajustes da tela
              </h2>
              <button type="button" onClick={close} aria-label="Fechar ajustes" className="h-11 w-11 rounded-full text-2xl font-bold text-slate-700 hover:bg-slate-100">×</button>
            </div>

            <Choice legend="Tamanho das figuras" options={PICTO_SIZES} value={settings.pictogramScale}
              onChange={(v) => updateSettings({ pictogramScale: v })}
              pictogram={(o) => <span style={{ zoom: o.value }}><ArasaacPictogram conceptId="navigation.magnify" showLabel={false} imageClassName="h-6 w-6" /></span>}
            />
            <Choice legend="Tamanho dos botões e textos" options={ITEM_SIZES} value={settings.itemScale}
              onChange={(v) => updateSettings({ itemScale: v })}
              pictogram={(o) => <span className="font-black" style={{ fontSize: `${o.value}rem` }}>A</span>} />
            <Choice legend="Botões" options={LABELS} value={settings.buttonLabels} onChange={(v) => updateSettings({ buttonLabels: v })}
              pictogram={(o) => (
                <span className="flex items-center gap-1 text-sm font-black" aria-hidden="true">
                  {o.value !== "text" && <ArasaacPictogram conceptId="navigation.pause" showLabel={false} imageClassName="h-6 w-6" />}
                  {o.value !== "icons" && <span>Pausa</span>}
                </span>
              )} />
            <Choice legend="Letra" options={FONTS} value={settings.readingFont} onChange={(v) => updateSettings({ readingFont: v })} />
            <Choice legend="Cores" options={THEMES.map((t) => ({ value: t.value, label: t.label,
              preview: <span aria-hidden="true" className="flex h-7 w-12 overflow-hidden rounded-lg border-2 border-slate-500"><span className="flex-1" style={{ background: t.swatch[0] }} /><span className="flex-1" style={{ background: t.swatch[1] }} /></span> }))}
              value={theme}
              onChange={(v) => updateSettings(v === "contrast" ? { highContrast: true, colorTheme: "default" } : { highContrast: false, colorTheme: v as AccessibilitySettings["colorTheme"] })} />

            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => { setOpen(false); setReading(true); }}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-sky-700 bg-sky-50 px-4 py-2 text-base font-extrabold text-sky-900 hover:bg-sky-100">
                <ArasaacPictogram conceptId="navigation.read" showLabel={false} imageClassName="h-8 w-8" />
                Modo leitura
              </button>
              <button type="button" onClick={() => updateSettings({ pictogramScale: 1, itemScale: 1, readingFont: "default", colorTheme: "default", buttonLabels: "both", highContrast: false })}
                className="min-h-14 rounded-2xl border-2 border-slate-500 bg-white px-4 py-2 text-base font-bold text-slate-800 hover:bg-slate-50">
                Voltar ao normal
              </button>
            </div>
            <button type="button" onClick={close}
              className="w-full min-h-14 rounded-2xl bg-violet-700 px-4 py-3 text-lg font-black text-white hover:bg-violet-800">
              Pronto
            </button>
          </section>
        </div>,
        document.body,
      )}

      {/* Reading mode (GAIA G08): only the statement and the choices, large,
          on calm colors, with a button to hear it. */}
      {mounted && reading && createPortal(
        <div className="cc-child fixed inset-0 z-[90] overflow-y-auto bg-[#f7f0dc] p-4">
          <section ref={readingRef} role="dialog" aria-modal="true" aria-labelledby="reading-mode-title"
            className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 py-6 text-[#2b2118]">
            <h2 id="reading-mode-title" className="flex items-center gap-3 text-2xl font-black">
              <ArasaacPictogram conceptId="navigation.read" showLabel={false} imageClassName="h-10 w-10" />
              Modo leitura
            </h2>
            <p className="text-3xl font-bold leading-relaxed">{readingText}</p>
            {readingOptions.length > 0 && (
              <ul className="space-y-3 text-2xl leading-relaxed" aria-label="Opções do exercício">
                {readingOptions.map((o) => <li key={o} className="rounded-2xl border-2 border-[#7a5c2e] bg-[#fffaeb] px-4 py-3">{o}</li>)}
              </ul>
            )}
            <div className="mt-auto grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => onSpeak([readingText, ...readingOptions].join(". "))}
                className="min-h-14 rounded-2xl border-2 border-[#7a5c2e] bg-[#efe3c4] px-4 py-3 text-lg font-extrabold">
                🔊 Ouvir
              </button>
              <button type="button" onClick={closeReading}
                className="min-h-14 rounded-2xl bg-[#3b4a6b] px-4 py-3 text-lg font-extrabold text-[#fffaeb]">
                Voltar ao exercício
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
