"use client";

import { useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { getOrCreateLearningSessionId } from "@/lib/learning-session";

export type VisualCommunicationEventType =
  | "pictogram_opened"
  | "visual_library_opened"
  | "visual_library_item_selected";

export function useVisualCommunicationAnalytics() {
  const sessionId = useMemo(() => typeof window === "undefined" ? "server" : getOrCreateLearningSessionId(), []);

  return useCallback((eventType: VisualCommunicationEventType, metadata?: {
    pictogramConceptId?: string;
    category?: string;
  }) => {
    const token = authService.getStoredToken();
    if (!token) return;
    void api.post("/learning-events/visual-communication", {
      sessionId,
      eventType,
      ...metadata,
    }, token).catch((error) => {
      console.error("Failed to track visual communication event", error);
    });
  }, [sessionId]);
}
