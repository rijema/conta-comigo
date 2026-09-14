"use client";

import { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

const PRESETS = {
  instruction: "Oi! Eu sou a TitiA. Vamos aprender juntos?",
  success: "Muito bem! Você conseguiu!",
  retry: "Não tem problema. Vamos tentar mais uma vez?",
  hint: "Olhe com calma para as figuras. Qual delas combina com a resposta?",
};

export function TitiaVoiceLab() {
  const [text, setText] = useState(PRESETS.instruction);
  const { settings, updateSettings } = useAccessibility();
  const speech = useTitiaSpeech();

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-8">
      <h1 className="text-3xl font-extrabold text-purple-800">TitiA Voice Lab</h1>
      <p className="text-slate-600">Ferramenta local de QA. Não cria dados da criança nem eventos sem autenticação.</p>
      <textarea value={text} onChange={(event) => setText(event.target.value)}
        className="min-h-32 w-full rounded-2xl border-2 border-purple-200 p-4" aria-label="Texto de teste" />
      <label className="block font-bold">Velocidade: {settings.speechRate.toFixed(2)}
        <input type="range" min="0.6" max="1.2" step="0.05" value={settings.speechRate}
          onChange={(event) => updateSettings({ speechRate: Number(event.target.value) })}
          className="mt-2 block w-full" />
      </label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([name, phrase]) => (
          <button key={name} type="button" onClick={() => setText(phrase)}
            className="rounded-xl border-2 border-purple-200 px-3 py-2 font-bold">{name}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button onClick={() => speech.speakInstruction({ steps: [text] })}>Testar instrução</button>
        <button onClick={() => speech.speakHint(text)}>Testar dica</button>
        <button onClick={() => speech.speakFeedback(PRESETS.success)}>Testar sucesso</button>
        <button onClick={() => speech.speakFeedback(PRESETS.retry)}>Testar nova tentativa</button>
        <button onClick={() => speech.speakPictogram("contar", "mathematics.count")}>Testar pictograma</button>
        <button onClick={speech.stopSpeech}>Parar</button>
      </div>
    </main>
  );
}
