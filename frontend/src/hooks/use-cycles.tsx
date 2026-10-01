"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

export interface CycleContext {
  cycleNumber: number;
  islandId: string;
  skillFocus: string;
  currentPosition: number;
  isActive: boolean;
}

export interface CycleProgress {
  cycle: CycleContext;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  nextPosition: number;
  status: "active" | "completed" | "pending";
}

export function useCycles(islandId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCycle, setActiveCycle] = useState<CycleContext | null>(null);
  const [cycleProgress, setCycleProgress] = useState<CycleProgress | null>(
    null
  );

  // Load active cycle for an island
  const loadCycleProgress = useCallback(
    async (island: string, cycle: number) => {
      setLoading(true);
      setError(null);
      try {
        const token = authService.getStoredToken();
        const result = await apiClient.get<CycleProgress>(
          `/cycles/${island}/${cycle}/progress`,
          token ?? undefined
        );
        setCycleProgress(result);
        setActiveCycle(result.cycle);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load cycle progress");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load all cycles for an island
  const loadIslandCycles = useCallback(
    async (island: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = authService.getStoredToken();
        // Fetch first active cycle for island
        const result = await apiClient.get<CycleProgress>(
          `/cycles/${island}/1/progress`,
          token ?? undefined
        );
        setCycleProgress(result);
        setActiveCycle(result.cycle);
      } catch (err: any) {
        // Silent fail if no cycles yet (will be auto-initialized on first activity)
        setActiveCycle(null);
        setCycleProgress(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-load when island changes
  useEffect(() => {
    if (islandId) {
      loadIslandCycles(islandId);
    }
  }, [islandId, loadIslandCycles]);

  return {
    loading,
    error,
    activeCycle,
    cycleProgress,
    loadCycleProgress,
    loadIslandCycles,
  };
}
