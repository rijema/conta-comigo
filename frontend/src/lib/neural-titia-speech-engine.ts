import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { BrowserSpeechEngine, type SpeechRequest, type TitiaSpeechEngine } from "./titia-speech-service";

export class NeuralTitiaSpeechEngine implements TitiaSpeechEngine {
  private audio: HTMLAudioElement | null = null;
  private abort: AbortController | null = null;
  private generation = 0;
  constructor(private readonly fallback = new BrowserSpeechEngine()) {}
  isAvailable() { return typeof window !== "undefined"; }
  speak(request: SpeechRequest) {
    this.cancel();
    const generation = this.generation;
    this.abort = new AbortController();
    const token = authService.getStoredToken();
    console.debug("[TitiA Speech] neural request started");
    void api.post<{ audioBase64: string }>("/voice/speech", {
      text: request.text, language: request.language, rate: request.rate,
    }, token ?? undefined, this.abort.signal).then(({ audioBase64 }) => {
      if (generation !== this.generation) return;
      console.debug("[TitiA Speech] neural audio received");
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audio.volume = request.volume ?? 1;
      this.audio = audio;
      audio.onended = () => {
        if (generation !== this.generation) return;
        console.debug("[TitiA Speech] neural playback finished");
        this.clearAudio(audio);
        request.onEnd();
      };
      audio.onerror = () => this.useFallback(
        generation, audio, request, "[TitiA Speech] neural audio failed — browser fallback",
      );
      void audio.play().then(() => {
        if (generation !== this.generation) { audio.pause(); return; }
        console.debug("[TitiA Speech] neural playback started");
        request.onStart?.();
      }).catch(() => this.useFallback(
        generation, audio, request, "[TitiA Speech] playback blocked — browser fallback",
      ));
    }).catch((error) => {
      if (generation !== this.generation || error?.name === "AbortError") return;
      console.warn("[TitiA Speech] neural request failed — browser fallback", error);
      this.fallback.speak(request);
    });
  }

  cancel() {
    this.generation += 1;
    this.abort?.abort();
    this.abort = null;
    if (this.audio) {
      this.audio.pause();
      this.clearAudio(this.audio);
    }
    this.fallback.cancel();
  }

  private useFallback(generation: number, audio: HTMLAudioElement, request: SpeechRequest, message: string) {
    if (generation !== this.generation) return;
    console.warn(message);
    audio.pause();
    this.clearAudio(audio);
    this.fallback.speak(request);
  }

  private clearAudio(audio: HTMLAudioElement) {
    audio.onended = null;
    audio.onerror = null;
    audio.removeAttribute("src");
    if (this.audio === audio) this.audio = null;
  }
}
