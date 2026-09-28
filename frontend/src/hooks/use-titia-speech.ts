"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { getOrCreateLearningSessionId } from "@/lib/learning-session";
import { titiaSpeechService, type SpokenInstruction } from "@/lib/titia-speech-service";
import { NeuralTitiaSpeechEngine } from "@/lib/neural-titia-speech-engine";

type SpeechEventType = "instruction_spoken" | "instruction_replayed" |
  "hint_spoken" | "pictogram_spoken" | "speech_disabled";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

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
  const isSpeaking = useSyncExternalStore(
    (listener) => titiaSpeechService.subscribe(listener),
    () => titiaSpeechService.isSpeaking(),
    () => false,
  );

  useEffect(initializeRuntimeEngine, []);

  const audioVolume = useMemo(() => 
    Math.min(settings.volume, settings.audioStimulus === 'low' ? 0.35 : settings.audioStimulus === 'medium' ? 0.7 : 1),
    [settings.volume, settings.audioStimulus]
  );

  const configure = useCallback(() => {
    titiaSpeechService.configure({
      enabled: settings.voiceEnabled,
      rate: settings.speechRate,
      language: settings.speechLanguage,
      volume: audioVolume,
    });
  }, [settings.voiceEnabled, settings.speechRate, settings.speechLanguage, audioVolume]);

  useEffect(() => {
    if (settingsLoaded) configure();
  }, [configure, settingsLoaded]);

  const track = useCallback((eventType: SpeechEventType, metadata?: {
    pictogramConceptId?: string;
    stepCount?: number;
  }) => {
    const token = authService.getStoredToken();
    if (!token || typeof window === "undefined") return;

    // Only include activityId if it is a valid UUID — prevents 400 errors from the backend
    const resolvedActivityId = isValidUUID(activityId) ? activityId : undefined;
    if (activityId && !resolvedActivityId) {
      console.warn("[useTitiaSpeech] activityId is not a valid UUID, omitting from speech event:", activityId);
    }

    // Retry with exponential backoff on network errors
    const trackWithRetry = async (attempt = 0) => {
      try {
        await api.post("/learning-events/speech", {
          sessionId: getOrCreateLearningSessionId(), eventType,
          ...(resolvedActivityId ? { activityId: resolvedActivityId } : {}), ...metadata,
        }, token);
      } catch (error: any) {
        // Do not retry on auth errors (401/403) or validation errors (400/422)
        const status = error?.status ?? error?.statusCode;
        if (attempt < 2 && status !== 400 && status !== 401 && status !== 403 && status !== 422) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          setTimeout(() => trackWithRetry(attempt + 1), delay);
        } else if (status === 401 || status === 403) {
          // Silently ignore auth errors — user may not be logged in (e.g. sandbox)
        } else {
          console.error("Failed to track TitiA speech event", error);
        }
      }
    };
    
    void trackWithRetry();
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
    if (!enabled) titiaSpeechService.configure({ enabled: false });
    if (!enabled) track("speech_disabled");
  }, [track, updateSettings]);

  return useMemo(() => ({ 
    settings, settingsLoaded, isSpeaking, speakInstruction, repeatLastInstruction,
    speakHint, speakFeedback, speakPictogram, speakExplanation, stopSpeech, setVoiceEnabled 
  }), [
    settings, settingsLoaded, isSpeaking, speakInstruction, repeatLastInstruction,
    speakHint, speakFeedback, speakPictogram, speakExplanation, stopSpeech, setVoiceEnabled
  ]);
}
