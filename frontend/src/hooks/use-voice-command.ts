"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";

export type VoiceState = "idle" | "listening" | "processing" | "error";
type VoiceCommand = "REQUEST_HELP" | "REPEAT_INSTRUCTION" | "CHANGE_ACTIVITY" | "NEXT" |
  "CONFIRM" | "DENY" | "STOP_SPEECH" | "UNKNOWN";

interface Options {
  sessionId?: string; activityId?: string; recommendationId?: string | null;
  onHelp: () => void; onRepeat: () => void; onChangeActivity: () => void;
  onNext?: () => void; onConfirm?: () => void; onDeny?: () => void; onStopSpeech: () => void;
  onUnknown?: () => void;
  onTranscript?: (transcript: string) => void;
}

export function useVoiceCommand(options: Options) {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_VOICE_COMMANDS === "true";
  const [state, setState] = useState<VoiceState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportUnknown = useCallback(() => {
    setState("error");
    options.onUnknown?.();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setState("idle"), 1800);
  }, [options]);

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const track = useCallback((eventType: string, extra: Record<string, unknown> = {}) => {
    const token = authService.getStoredToken();
    if (!token || !options.sessionId) return;
    void api.post("/learning-events/voice", { sessionId: options.sessionId,
      ...(options.activityId ? { activityId: options.activityId } : {}),
      ...(options.recommendationId ? { recommendationId: options.recommendationId } : {}),
      eventType, ...extra }, token).catch(() => undefined);
  }, [options.activityId, options.recommendationId, options.sessionId]);

  const execute = useCallback((command: VoiceCommand) => {
    if (command === "REQUEST_HELP") options.onHelp();
    else if (command === "REPEAT_INSTRUCTION") options.onRepeat();
    else if (command === "CHANGE_ACTIVITY") options.onChangeActivity();
    else if (command === "NEXT") options.onNext?.();
    else if (command === "CONFIRM") options.onConfirm?.();
    else if (command === "DENY") options.onDeny?.();
    else if (command === "STOP_SPEECH") options.onStopSpeech();
  }, [options]);

  const start = useCallback(async () => {
    if (!enabled || state !== "idle") return;
    let chunks: Blob[] = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setState("processing");
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          chunks = [];
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let binary = "";
          bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
          const token = authService.getStoredToken();
          const result = await api.post<{ command: VoiceCommand; transcript?: string; recognitionSucceeded: boolean; processingTimeMs: number }>(
            "/voice/command", { audioBase64: btoa(binary), language: "pt-BR" }, token ?? undefined);
          binary = "";
          const recognized = result.command !== "UNKNOWN";
          track(recognized ? "VOICE_COMMAND_RECOGNIZED" : "VOICE_COMMAND_UNKNOWN", {
            command: result.command, recognitionSucceeded: recognized, processingTimeMs: result.processingTimeMs });
          if (result.transcript?.trim() && options.onTranscript) {
            options.onTranscript(result.transcript.trim());
            setState("idle");
          } else if (!recognized) reportUnknown();
          else {
            const semanticEvent = ({ REQUEST_HELP: "VOICE_HELP_REQUESTED", REPEAT_INSTRUCTION: "VOICE_INSTRUCTION_REPLAY_REQUESTED",
              CHANGE_ACTIVITY: "VOICE_ACTIVITY_CHANGE_REQUESTED" } as Partial<Record<VoiceCommand, string>>)[result.command];
            if (semanticEvent) track(semanticEvent, { command: result.command, recognitionSucceeded: true });
            execute(result.command); setState("idle");
          }
        } catch { chunks = []; reportUnknown(); }
      };
      recorder.start(); setState("listening"); track("VOICE_INTERACTION_STARTED");
    } catch { chunks = []; streamRef.current?.getTracks().forEach((track) => track.stop()); reportUnknown(); }
  }, [enabled, execute, reportUnknown, state, track]);

  const stop = useCallback(() => {
    if (state === "listening" && recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, [state]);
  const reset = useCallback(() => setState("idle"), []);
  return { enabled, state, start, stop, reset };
}
