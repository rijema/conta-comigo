"use client";

import { useCallback, useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { getOrCreateLearningSessionId } from "@/lib/learning-session";
import { titiaSpeechService, type SpokenInstruction } from "@/lib/titia-speech-service";

type SpeechEventType = "instruction_spoken" | "instruction_replayed" |
  "hint_spoken" | "pictogram_spoken" | "speech_disabled";

export function useTitiaSpeech({ activityId }: { activityId?: string } = {}) {
  const { settings, updateSettings, settingsLoaded } = useAccessibility();

  const configure = useCallback(() => {
    titiaSpeechService.configure({
      enabled: settings.voiceEnabled,
      rate: settings.speechRate,
      language: settings.speechLanguage,
    });
  }, [settings.voiceEnabled, settings.speechRate, settings.speechLanguage]);

  useEffect(() => {
    if (settingsLoaded) configure();
  }, [configure, settingsLoaded]);

  const track = useCallback((eventType: SpeechEventType, metadata?: {
    pictogramConceptId?: string;
    stepCount?: number;
  }) => {
    const token = authService.getStoredToken();
    if (!token || typeof window === "undefined") return;
    void api.post("/learning-events/speech", {
      sessionId: getOrCreateLearningSessionId(), eventType,
      ...(activityId ? { activityId } : {}), ...metadata,
    }, token).catch((error) => console.error("Failed to track TitiA speech event", error));
  }, [activityId]);

  const speakInstruction = useCallback((instruction: SpokenInstruction) => {
    configure();
    const spoken = titiaSpeechService.speakInstruction(instruction);
    if (spoken) track("instruction_spoken", { stepCount: instruction.steps.length });
    return spoken;
  }, [configure, track]);

  const repeatLastInstruction = useCallback(() => {
    configure();
    const spoken = titiaSpeechService.repeatLastInstruction();
    if (spoken) track("instruction_replayed");
    return spoken;
  }, [configure, track]);

  const speakHint = useCallback((text: string) => {
    configure();
    const spoken = titiaSpeechService.speakHint(text);
    if (spoken) track("hint_spoken");
    return spoken;
  }, [configure, track]);

  const speakFeedback = useCallback((text: string) => {
    configure();
    return titiaSpeechService.speakFeedback(text);
  }, [configure]);

  const speakPictogram = useCallback((label: string, pictogramConceptId: string) => {
    configure();
    const spoken = titiaSpeechService.speakPictogram(label);
    if (spoken) track("pictogram_spoken", { pictogramConceptId });
    return spoken;
  }, [configure, track]);

  const stopSpeech = useCallback(() => titiaSpeechService.stopSpeech(), []);
  const setVoiceEnabled = useCallback((enabled: boolean) => {
    updateSettings({ voiceEnabled: enabled });
    titiaSpeechService.configure({ enabled });
    if (!enabled) track("speech_disabled");
  }, [track, updateSettings]);

  return { settings, settingsLoaded, speakInstruction, repeatLastInstruction,
    speakHint, speakFeedback, speakPictogram, stopSpeech, setVoiceEnabled };
}
