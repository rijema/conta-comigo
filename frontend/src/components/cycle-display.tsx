"use client";

import React from "react";
import { CycleContext, CycleProgress } from "@/hooks/use-cycles";

interface CycleDisplayProps {
  cycle?: CycleContext | null;
  progress?: CycleProgress | null;
  loading?: boolean;
}

/**
 * CycleDisplay: Shows cycle position and progress bar
 * Scientific basis: Visual structure reduces cognitive load (Baron-Cohen, TEA)
 * - Clear position indicator (1-10) ensures predictability
 * - Progress bar shows learner progress through skill focus
 * - Skill name reinforces focus on single concept
 */
export function CycleDisplay({
  cycle,
  progress,
  loading,
}: CycleDisplayProps) {
  if (!cycle || loading) {
    return (
      <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  const percentage = progress
    ? Math.round((progress.completedCount / progress.totalCount) * 100)
    : 0;

  return (
    <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Cycle Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Ciclo {cycle.cycleNumber}
          </p>
          <p className="text-lg font-bold text-indigo-600">
            {cycle.skillFocus}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Posição</p>
          <p className="text-2xl font-bold text-indigo-600">
            {cycle.currentPosition}/10
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 text-right">
          {progress?.completedCount ?? 0}/{progress?.totalCount ?? 10}
          exercícios concluídos
        </p>
      </div>

      {/* Status Badge */}
      {progress?.status === "completed" && (
        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-700 font-semibold">
          ✅ Ciclo Concluído! Próxima etapa desbloqueada.
        </div>
      )}

      {progress?.status === "active" && (
        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-sm text-blue-700">
          🎯 Continue neste ciclo para melhorar suas habilidades em{" "}
          <strong>{cycle.skillFocus}</strong>
        </div>
      )}
    </div>
  );
}
