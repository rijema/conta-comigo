"use client";

import { useCallback, useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { getOrCreateLearningSessionId } from "@/lib/learning-session";
import { titiaSpeechService, type SpokenInstruction } from "@/lib/titia-speech-service";
import { NeuralTitiaSpeechEngine } from "@/lib/neural-titia-speech-engine";

type SpeechEventType = "instruction_spoken" | "instruction_replayed" |
  "hint_spoken" | "pictogram_spoken" | "speech_disabled";

let runtimeEngineInitialized = false;

function initializeRuntimeEngine() {
  if (runtimeEngineInitialized || typeof window === "undefined") return;
  runtimeEngineInitialized = true;
  if (process.env.NEXT_PUBLIC_ENABLE_NEURAL_TTS === "true") {
    titiaSpeechService.replaceEngine(new NeuralTitiaSpeechEngine());
  }
}

export function useTitiaSpeech({ activityId }: { activityId?: string } = {}) {
  const { settings, updateSettings, settingsLoaded } = useAccessibility();

  useEffect(initializeRuntimeEngine, []);

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

  const speakInstruction = useCallback((instruction: SpokenInstruction, onPlaybackStart?: () => void) => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.speakInstruction(instruction, () => {
      track("instruction_spoken", { stepCount: instruction.steps.length });
      onPlaybackStart?.();
    });
  }, [configure, track]);

  const repeatLastInstruction = useCallback(() => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.repeatLastInstruction(() => track("instruction_replayed"));
  }, [configure, track]);

  const speakHint = useCallback((text: string) => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.speakHint(text, () => track("hint_spoken"));
  }, [configure, track]);

  const speakFeedback = useCallback((text: string) => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.speakFeedback(text);
  }, [configure]);

  const speakPictogram = useCallback((label: string, pictogramConceptId: string) => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.speakPictogram(label,
      () => track("pictogram_spoken", { pictogramConceptId }));
  }, [configure, track]);

  const speakExplanation = useCallback((text: string) => {
    initializeRuntimeEngine();
    configure();
    return titiaSpeechService.speakExplanation(text);
  }, [configure]);

  const stopSpeech = useCallback(() => titiaSpeechService.stopSpeech(), []);
  const setVoiceEnabled = useCallback((enabled: boolean) => {
    updateSettings({ voiceEnabled: enabled });
    titiaSpeechService.configure({ enabled });
    if (!enabled) track("speech_disabled");
  }, [track, updateSettings]);

  return { settings, settingsLoaded, speakInstruction, repeatLastInstruction,
    speakHint, speakFeedback, speakPictogram, speakExplanation, stopSpeech, setVoiceEnabled };
}
