"use client";

/**
 * Pictogram Debug Panel — Sandbox only
 *
 * Shows every pictogram conceptId found inside an activity's content,
 * with its label, ARASAAC ID, resolved image URL, and a field to swap it
 * in the database in real-time.
 *
 * [DECISÃO DE ENGENHARIA] The panel walks the content JSON recursively to
 * find any string matching a known pictogram pattern. This is intentionally
 * broad so it catches IDs in items, options, visualGroups, correctAnswer, etc.
 */

import { useState, useCallback } from "react";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { pictogramRegistry, ARASAAC_PICTOGRAM_BASE_URL } from "@/lib/pictograms";
import type { Activity } from "@/types";

const SANDBOX_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api") + "/dev/k7x9-sandbox";

// ─── Extractor ───────────────────────────────────────────────────────────────

export interface ExtractedPictogram {
  conceptId: string;
  /** Human-readable label from the registry (or "desconhecido") */
  label: string;
  /** Numeric ARASAAC ID, if resolved */
  arasaacId: number | null;
  /** Where in the content structure this ID was found (dot-path) */
  sourcePath: string;
  /** Resolved image URL, or null when unknown */
  imageUrl: string | null;
}

const PICTOGRAM_PATTERN =
  /^(?:arasaac\.\d+|library\.[a-z0-9_]+|mathematics\.[a-z_]+|number\.\d+|state\.[a-z_]+|navigation\.[a-z_]+|activity\.[a-z_]+|communication\.[a-z_]+|\d{4,6})$/;

function walkContent(
  node: unknown,
  path: string,
  out: Map<string, ExtractedPictogram>,
): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => walkContent(child, `${path}[${i}]`, out));
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key;
    if (typeof value === "string" && PICTOGRAM_PATTERN.test(value)) {
      // Always record the path. If the conceptId was already seen, append the
      // new path to the existing entry instead of skipping it.
      const entry = pictogramRegistry.get(value);
      if (out.has(value)) {
        const existing = out.get(value)!;
        existing.sourcePath = `${existing.sourcePath}, ${childPath}`;
      } else {
        out.set(value, {
          conceptId: value,
          label: entry?.labelPt ?? "desconhecido",
          arasaacId: entry?.arasaacId ?? null,
          sourcePath: childPath,
          imageUrl: entry?.arasaacId
            ? `${ARASAAC_PICTOGRAM_BASE_URL}/${entry.arasaacId}/${entry.arasaacId}_300.png`
            : null,
        });
      }
    } else {
      walkContent(value, childPath, out);
    }
  }
}

export function extractPictogramsFromActivity(activity: Activity): ExtractedPictogram[] {
  const found = new Map<string, ExtractedPictogram>();
  walkContent(activity.content, "", found);
  return Array.from(found.values());
}

// ─── Panel component ──────────────────────────────────────────────────────────

interface PictogramPanelProps {
  activity: Activity;
  onActivityUpdated: (updated: Activity) => void;
}

interface SwapState {
  conceptId: string;
  newValue: string;
  status: "idle" | "saving" | "saved" | "error";
  error?: string;
}

export function PictogramPanel({ activity, onActivityUpdated }: PictogramPanelProps) {
  const pictograms = extractPictogramsFromActivity(activity);
  const [swaps, setSwaps] = useState<Record<string, SwapState>>({});

  const getSwap = (conceptId: string): SwapState =>
    swaps[conceptId] ?? { conceptId, newValue: conceptId, status: "idle" };

  const setSwap = (conceptId: string, patch: Partial<SwapState>) =>
    setSwaps((prev) => ({
      ...prev,
      [conceptId]: { ...getSwap(conceptId), ...patch },
    }));

  const handleSave = useCallback(
    async (oldConceptId: string) => {
      const swap = getSwap(oldConceptId);
      const newConceptId = swap.newValue.trim();
      if (!newConceptId || newConceptId === oldConceptId) return;

      setSwap(oldConceptId, { status: "saving" });
      try {
        const res = await fetch(`${SANDBOX_BASE}/activities/${activity.id}/pictogram`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldConceptId, newConceptId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message ?? `HTTP ${res.status}`);
        }
        const { content } = await res.json();
        setSwap(oldConceptId, { status: "saved" });
        // Notify parent with updated activity content
        onActivityUpdated({ ...activity, content });
        setTimeout(() => setSwap(oldConceptId, { status: "idle", newValue: newConceptId }), 1500);
      } catch (err: unknown) {
        setSwap(oldConceptId, {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, swaps],
  );

  if (pictograms.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
        Nenhum pictograma encontrado no content desta atividade.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {pictograms.length} pictograma{pictograms.length !== 1 ? "s" : ""} encontrado{pictograms.length !== 1 ? "s" : ""}
      </p>
      {pictograms.map((pic) => {
        const swap = getSwap(pic.conceptId);
        const isDirty = swap.newValue.trim() !== pic.conceptId;
        return (
          <div
            key={pic.conceptId}
            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            {/* Preview */}
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
              <ArasaacPictogram
                conceptId={swap.status === "saved" ? swap.newValue : pic.conceptId}
                showLabel={false}
                imageClassName="h-14 w-14"
              />
            </div>

            {/* Info + swap */}
            <div className="flex flex-1 flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-mono text-xs font-bold text-slate-700 truncate">{pic.conceptId}</span>
                {pic.arasaacId && (
                  <a
                    href={`https://arasaac.org/pictograms/${pic.arasaacId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 hover:underline"
                  >
                    ARASAAC #{pic.arasaacId}
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-600">{pic.label}</span>
                {" · "}
                <span className="font-mono text-slate-400">{pic.sourcePath}</span>
              </p>

              {/* Swap input */}
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="text"
                  value={swap.newValue}
                  onChange={(e) => setSwap(pic.conceptId, { newValue: e.target.value, status: "idle" })}
                  placeholder="Novo conceptId ou arasaac.12345"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs focus:border-blue-400 focus:outline-none min-w-0"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(pic.conceptId); }}
                />
                <button
                  type="button"
                  disabled={!isDirty || swap.status === "saving"}
                  onClick={() => handleSave(pic.conceptId)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    swap.status === "saved"
                      ? "bg-emerald-100 text-emerald-700"
                      : swap.status === "error"
                      ? "bg-red-100 text-red-700"
                      : isDirty
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {swap.status === "saving" ? "…" : swap.status === "saved" ? "✓ Salvo" : swap.status === "error" ? "Erro" : "Salvar"}
                </button>
              </div>
              {swap.status === "error" && swap.error && (
                <p className="text-xs text-red-600">{swap.error}</p>
              )}
              {/* Live preview of new value while editing */}
              {isDirty && swap.newValue.trim() && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Preview:</span>
                  <ArasaacPictogram
                    conceptId={swap.newValue.trim()}
                    showLabel={false}
                    imageClassName="h-8 w-8"
                  />
                  <span className="font-mono text-xs text-slate-500">
                    {pictogramRegistry.get(swap.newValue.trim())?.labelPt ?? "ID desconhecido no registro local"}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
