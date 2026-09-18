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

export class BrowserSpeechEngine implements TitiaSpeechEngine {
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined";
  }

  speak({ text, rate, language, volume, onEnd, onStart, onFailure }: SpeechRequest): void {
    if (!this.isAvailable()) { onFailure?.(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.volume = volume ?? 1;
    utterance.pitch = 1.05;
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
