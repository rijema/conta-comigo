import { titiaSpeechService } from "./titia-speech-service";

/** @deprecated Use useTitiaSpeech so settings and analytics are applied. */
export function speakPortuguese(text: string): boolean {
  return titiaSpeechService.speakPictogram(text);
}

export { titiaSpeechService };
