export interface TitiaSpeechConfiguration {
  enabled: boolean;
  rate: number;
  language: string;
  volume?: number;
}

export interface SpeechRequest {
  text: string;
  rate: number;
  language: string;
  volume?: number;
  onEnd: () => void;
  onStart?: () => void;
  onFailure?: () => void;
}

export interface TitiaSpeechEngine {
  isAvailable(): boolean;
  speak(request: SpeechRequest): void;
  cancel(): void;
}

export interface SpokenInstruction {
  introduction?: string;
  steps: string[];
}

// TitiA is established in the product as a female character ("a titia"), so
// every voice she uses — exercise narration, hints, feedback, explanations —
// must sound female. The Web Speech API has no "gender" property on
// SpeechSynthesisVoice, so this is a best-effort match against voice names
// known to be female across the engines commonly available for pt-BR
// (Chrome/Google, Microsoft/Edge, Safari/macOS, Android TTS). Without this,
// speak() falls back to whatever voice happens to be the OS/browser default
// for the language, which is not guaranteed to be female.
const FEMALE_VOICE_NAME_HINTS = [
  "female", "mulher", "luciana", "joana", "maria", "camila", "vitória", "vitoria",
  "fernanda", "raquel", "francisca", "ines", "inês", "helena", "carla", "isabela",
];
const MALE_VOICE_NAME_HINTS = [
  "male", "homem", "daniel", "ricardo", "diego", "felipe", "fred", "miguel", "thiago", "bruno", "jorge",
];

function scorePortugueseVoice(voice: SpeechSynthesisVoice): number {
  const lang = (voice.lang || "").toLowerCase();
  const name = (voice.name || "").toLowerCase();
  let score: number;
  if (lang === "pt-br") score = 10;
  else if (lang.startsWith("pt")) score = 5;
  else return -100;
  if (FEMALE_VOICE_NAME_HINTS.some((hint) => name.includes(hint))) score += 20;
  if (MALE_VOICE_NAME_HINTS.some((hint) => name.includes(hint))) score -= 30;
  return score;
}

function pickFemalePortugueseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => scorePortugueseVoice(b) - scorePortugueseVoice(a));
  const best = ranked[0];
  return best && scorePortugueseVoice(best) > -100 ? best : null;
}

let cachedFemaleVoice: SpeechSynthesisVoice | null = null;
let voiceListenerAttached = false;

function refreshCachedVoice() {
  const voice = pickFemalePortugueseVoice();
  if (voice) cachedFemaleVoice = voice;
}

function ensureVoiceListener() {
  if (voiceListenerAttached || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voiceListenerAttached = true;
  refreshCachedVoice();
  // Chrome/Edge load voices asynchronously — the first getVoices() call often
  // returns an empty list, so we must react once the real list is ready.
  window.speechSynthesis.addEventListener("voiceschanged", refreshCachedVoice);
}

export class BrowserSpeechEngine implements TitiaSpeechEngine {
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined";
  }

  speak({ text, rate, language, volume, onEnd, onStart, onFailure }: SpeechRequest): void {
    if (!this.isAvailable()) { onFailure?.(); return; }
    ensureVoiceListener();
    if (!cachedFemaleVoice) refreshCachedVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.volume = volume ?? 1;
    utterance.pitch = 1.05;
    if (cachedFemaleVoice) utterance.voice = cachedFemaleVoice;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    this.activeUtterance = utterance;
    onStart?.();
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.isAvailable()) window.speechSynthesis.cancel();
    this.activeUtterance = null;
  }
}

const DEFAULT_CONFIGURATION: TitiaSpeechConfiguration = {
  enabled: true,
  rate: 0.9,
  language: "pt-BR",
  volume: 0.7,
};

export class TitiaSpeechService {
  private configuration = DEFAULT_CONFIGURATION;
  private lastInstruction: SpokenInstruction | null = null;
  private playbackGeneration = 0;
  private speaking = false;
  private readonly listeners = new Set<() => void>();

  constructor(private engine: TitiaSpeechEngine = new BrowserSpeechEngine()) {}

  configure(configuration: Partial<TitiaSpeechConfiguration>): void {
    const rate = configuration.rate === undefined
      ? this.configuration.rate
      : Math.min(2, Math.max(0.5, configuration.rate));
    const volume = configuration.volume === undefined ? this.configuration.volume : Math.min(1, Math.max(0, configuration.volume));
    this.configuration = { ...this.configuration, ...configuration, rate, volume };
    if (!this.configuration.enabled) this.stopSpeech();
  }

  replaceEngine(engine: TitiaSpeechEngine): void {
    this.stopSpeech();
    this.engine = engine;
  }

  speakInstruction(instruction: SpokenInstruction, onPlaybackStart?: () => void): boolean {
    const normalized = this.normalizeInstruction(instruction);
    if (normalized.steps.length === 0 && !normalized.introduction) return false;
    this.lastInstruction = normalized;
    return this.speakSequence([
      ...(normalized.introduction ? [normalized.introduction] : []),
      ...normalized.steps,
    ], onPlaybackStart);
  }

  speakHint(text: string, onPlaybackStart?: () => void): boolean {
    return this.speakSequence([this.toConcisePhrase(text)], onPlaybackStart);
  }

  speakFeedback(text: string, onPlaybackStart?: () => void): boolean {
    return this.speakSequence([this.toConcisePhrase(text)], onPlaybackStart);
  }

  speakPictogram(label: string, onPlaybackStart?: () => void): boolean {
    return this.speakSequence([this.toConcisePhrase(label)], onPlaybackStart);
  }

  speakExplanation(text: string, onPlaybackStart?: () => void): boolean {
    return this.speakSequence([this.toConcisePhrase(text)], onPlaybackStart);
  }

  repeatLastInstruction(onPlaybackStart?: () => void): boolean {
    if (!this.lastInstruction) return false;
    const instruction = this.lastInstruction;
    return this.speakSequence([
      ...(instruction.introduction ? [instruction.introduction] : []),
      ...instruction.steps,
    ], onPlaybackStart);
  }

  stopSpeech(): void {
    this.playbackGeneration += 1;
    this.engine.cancel();
    this.setSpeaking(false);
  }

  isSpeaking(): boolean { return this.speaking; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private speakSequence(rawParts: string[], onPlaybackStart?: () => void): boolean {
    const parts = rawParts.map((part) => this.toConcisePhrase(part)).filter(Boolean);
    if (!this.configuration.enabled || !this.engine.isAvailable() || parts.length === 0) {
      return false;
    }

    this.stopSpeech();
    const generation = this.playbackGeneration;
    let playbackStarted = false;
    const speakAt = (index: number) => {
      if (generation !== this.playbackGeneration || index >= parts.length) return;
      this.engine.speak({
        text: parts[index],
        rate: this.configuration.rate,
        language: this.configuration.language,
        volume: this.configuration.volume,
        onStart: () => {
          if (!playbackStarted && generation === this.playbackGeneration) {
            playbackStarted = true;
            this.setSpeaking(true);
            onPlaybackStart?.();
          }
        },
        onEnd: () => {
          if (index === parts.length - 1) this.setSpeaking(false);
          speakAt(index + 1);
        },
        onFailure: () => this.setSpeaking(false),
      });
    };
    speakAt(0);
    return true;
  }

  private setSpeaking(value: boolean): void {
    if (this.speaking === value) return;
    this.speaking = value;
    this.listeners.forEach((listener) => listener());
  }

  private normalizeInstruction(instruction: SpokenInstruction): SpokenInstruction {
    return {
      introduction: instruction.introduction
        ? this.toConcisePhrase(instruction.introduction)
        : undefined,
      steps: instruction.steps.map((step) => this.toConcisePhrase(step)).filter(Boolean),
    };
  }

  private toConcisePhrase(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }
}

export const titiaSpeechService = new TitiaSpeechService();
