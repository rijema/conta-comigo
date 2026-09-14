import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { BrowserSpeechEngine, type SpeechRequest, type TitiaSpeechEngine } from "./titia-speech-service";

export class NeuralTitiaSpeechEngine implements TitiaSpeechEngine {
  private audio: HTMLAudioElement | null = null;
  private abort: AbortController | null = null;
  constructor(private readonly fallback = new BrowserSpeechEngine()) {}
  isAvailable() { return typeof window !== "undefined"; }
  speak(request: SpeechRequest) {
    this.cancel();
    this.abort = new AbortController();
    const token = authService.getStoredToken();
    void api.post<{ audioBase64: string }>("/voice/speech", {
      text: request.text, language: request.language, rate: request.rate,
    }, token ?? undefined).then(({ audioBase64 }) => {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      this.audio = audio; audio.onended = request.onEnd;
      audio.onerror = () => this.fallback.speak(request);
      void audio.play().catch(() => this.fallback.speak(request));
    }).catch(() => this.fallback.speak(request));
  }
  cancel() { this.abort?.abort(); this.audio?.pause(); this.audio = null; this.fallback.cancel(); }
}
