"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Props {
  correctAnswers: number;
  starsEarned: number;
  practiceLabel: string;
  lowStimulation: boolean;
  onReturnToMap: () => void;
  onSpeak: (message: string) => void;
}

const CONGRATULATIONS = "Você terminou o exercício! Parabéns!";

export function ExerciseCelebration({ correctAnswers, starsEarned, practiceLabel, lowStimulation, onReturnToMap, onSpeak }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const returnRef = useRef(onReturnToMap);
  const speakRef = useRef(onSpeak);
  returnRef.current = onReturnToMap;
  speakRef.current = onSpeak;

  useEffect(() => {
    speakRef.current(CONGRATULATIONS);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 10 - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) { window.clearInterval(timer); returnRef.current(); }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={`flex min-h-screen items-center justify-center p-4 text-slate-900 ${lowStimulation ? "bg-emerald-50" : "bg-gradient-to-br from-yellow-100 via-pink-100 to-emerald-100"}`}>
      <section aria-labelledby="completion-title" className="w-full max-w-2xl rounded-[2rem] border-4 border-emerald-300 bg-white p-5 text-center shadow-xl sm:p-8">
        <Image src="/assets/correctanswer.png" width={520} height={390} alt="TitiA comemorando" className="mx-auto h-32 w-auto object-contain sm:h-44" priority />
        <h1 id="completion-title" className="mt-2 text-2xl font-black text-emerald-800 sm:text-3xl">{CONGRATULATIONS}</h1>
        {!lowStimulation && <div aria-hidden="true" className="my-3 text-3xl motion-safe:animate-bounce">⭐ ✨ ⭐</div>}
        <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
          <p className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-lg font-bold">⭐ Você acertou {correctAnswers}!</p>
          <p className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 text-lg font-bold">🎯 Você praticou {practiceLabel}.</p>
          <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-lg font-bold sm:col-span-2">✨ Você ganhou {starsEarned} estrelas!</p>
        </div>
        <p className="mt-5 text-base font-semibold text-slate-600" role="status">Voltando para o mapa em {secondsLeft} {secondsLeft === 1 ? "segundo" : "segundos"}...</p>
        <button type="button" onClick={onReturnToMap} className="mt-4 min-h-14 w-full rounded-2xl bg-emerald-600 px-6 py-3 text-lg font-extrabold text-white shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-800">
          Voltar para o mapa agora
        </button>
      </section>
    </main>
  );
}
