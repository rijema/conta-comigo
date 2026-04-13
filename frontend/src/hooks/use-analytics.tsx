"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface AnalyticsSummary {
  totalSessions: number;
  totalActivities: number;
  averageScore: number;
  engagementIndex: number;
  streakDays: number;
  progressData: { date: string; score: number; activities: number }[];
  skillMastery: { skill: string; mastery: number; fullMark: number }[];
}

export function useAnalytics(childId?: string) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) return;

    const endpoint = childId
      ? `/analytics/child/${childId}/summary`
      : `/analytics/my-summary`;

    apiClient
      .get<AnalyticsSummary>(endpoint, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [childId]);

  return { data, loading, error };
}