import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { BrowserSpeechEngine, type SpeechRequest, type TitiaSpeechEngine } from "./titia-speech-service";

function createSilentWavDataUrl(): string {
  const samples = 441;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const writeText = (offset: number, text: string) =>
    { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeText(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); writeText(8, "WAVE");
  writeText(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 22050, true); view.setUint32(28, 44100, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeText(36, "data"); view.setUint32(40, samples * 2, true);
  return `data:audio/wav;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`;
}

export class NeuralTitiaSpeechEngine implements TitiaSpeechEngine {
  // A single element reused for every phrase: Safari/iPadOS only allows play()
  // after an async fetch if this same element was already played during a tap.
  private player: HTMLAudioElement | null = null;
  private unlocked = false;
  private audio: HTMLAudioElement | null = null;
  private abort: AbortController | null = null;
  private generation = 0;
  constructor(private readonly fallback = new BrowserSpeechEngine()) {}
  isAvailable() { return typeof window !== "undefined"; }
  speak(request: SpeechRequest) {
    this.cancel();
    this.unlockPlayback();
    const generation = this.generation;
    this.abort = new AbortController();
    const token = authService.getStoredToken();
    console.debug("[TitiA Speech] neural request started");
    void api.post<{ audioBase64: string }>("/voice/speech", {
      text: request.text, language: request.language, rate: request.rate,
    }, token ?? undefined, this.abort.signal).then(({ audioBase64 }) => {
      if (generation !== this.generation) return;
      console.debug("[TitiA Speech] neural audio received");
      const audio = this.getPlayer();
      audio.src = `data:audio/wav;base64,${audioBase64}`;
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

  private getPlayer(): HTMLAudioElement {
    if (!this.player) {
      this.player = new Audio();
      this.player.preload = "auto";
    }
    return this.player;
  }

  /** Must run synchronously inside the click/tap that requested speech. */
  private unlockPlayback() {
    if (this.unlocked || typeof window === "undefined") return;
    const player = this.getPlayer();
    player.src = createSilentWavDataUrl();
    const attempt = player.play();
    if (!attempt) { this.unlocked = true; return; }
    attempt.then(() => { this.unlocked = true; }).catch(() => undefined);
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
