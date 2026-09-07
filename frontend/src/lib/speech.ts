export function speakPortuguese(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
