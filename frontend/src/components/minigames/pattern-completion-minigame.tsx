'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

/**
 * MINIGAME: Pattern Completion Quest
 * BNCC Skills: EF01MA03 (Comparação), EF01MA02 (Contagem)
 * Exercise: "Ordene: 2, 4, 6, ?, 10"
 * TEA-FRIENDLY: Identify pattern, multiple choice, visual sequence
 */

interface PatternCompletionMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const PatternCompletionMinigame: React.FC<PatternCompletionMinigameProps> = ({
  // skill/difficulty/isTEAMode are part of the shared minigame prop
  // contract (used by other minigames / the renderer) but aren't needed
  // by this component's own rendering logic.
  skill: _skill,
  difficulty: _difficulty,
  onComplete,
  activity,
  isTEAMode: _isTEAMode = false,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Real exercise data from the database — falls back to a safe generic
  // example only if the activity truly has no content (should not happen
  // in production, but keeps the component usable in isolation/tests).
  const title = activity?.title || 'Complete o Padrão!';
  const question =
    activity?.content?.instructionsPt ||
    activity?.content?.instructions ||
    'Veja a sequência: o que vem a seguir?';
  const spokenHint = activity?.content?.spokenHint;
  const pictogramConceptId = activity?.content?.pictogramConceptIds?.[0];

  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity?.id ?? 'pattern-completion-minigame' });
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: [question] });
    }
  }, [speech.settings.voiceEnabled, speech, question]);

  const options = activity?.content?.options ||
    [
      { id: 'a', text: '3', isCorrect: false },
      { id: 'b', text: '8', isCorrect: true },
      { id: 'c', text: '5', isCorrect: false },
    ];

  // The question text always marks the missing slot with "__" in the seed
  // data (e.g. "Continue: azul, vermelho, azul, __"). Split around it so we
  // can render the sequence with a highlighted blank, matching whatever the
  // real pattern is (colors, shapes, numbers, objects) instead of a fixed
  // hardcoded numeric sequence.
  const [beforeBlank, afterBlank] = question.includes('__')
    ? question.split('__')
    : [question, null];

  const correctOption = options.find((o: any) => o.isCorrect);

  const handleSelect = (optionId: string) => {
    if (!submitted) {
      setSelected(optionId);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;

    const option = options.find(o => o.id === selected);
    const correct = option?.isCorrect || false;
    setIsCorrect(correct);
    setSubmitted(true);

    timeoutRef.current = setTimeout(() => {
      onComplete(correct ? 100 : 50, correct);
    }, 2000);
  };

  // RETRY (TEA-FRIENDLY): see error-detection-minigame.tsx for rationale.
  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-cyan-50 to-teal-50 rounded-xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-cyan-900 mb-2">{title}</h2>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center gap-4 mb-8">
          {pictogramConceptId && (
            <ArasaacPictogram conceptId={pictogramConceptId} showLabel={false} imageClassName="w-16 h-16" />
          )}
          <p className="text-2xl font-bold text-center text-cyan-900 leading-relaxed">
            {afterBlank !== null ? (
              <>
                {beforeBlank}
                <span className="inline-flex items-center justify-center w-12 h-12 mx-1 align-middle rounded-lg bg-yellow-300 border-4 border-yellow-400 text-yellow-700 font-black">
                  ?
                </span>
                {afterBlank}
              </>
            ) : (
              beforeBlank
            )}
          </p>
        </div>

        {spokenHint && (
          <div className="text-center mb-6 p-4 bg-cyan-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Dica:</p>
            <p className="text-lg font-bold text-cyan-700">{spokenHint}</p>
          </div>
        )}

        <div className="space-y-3">
          {options.map((option: any) => (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={submitted}
              whileHover={!submitted ? { scale: 1.02 } : {}}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              className={`w-full p-4 rounded-lg font-bold text-lg transition ${
                selected === option.id
                  ? 'bg-cyan-600 text-white ring-4 ring-cyan-300'
                  : submitted
                    ? option.isCorrect
                      ? 'bg-green-400 text-white'
                      : 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-800 border-2 border-cyan-200 hover:border-cyan-400'
              }`}
            >
              {option.text}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={submitted || !selected}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full mt-6 px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
        >
          Verificar Resposta
        </motion.button>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-lg text-center max-w-2xl mx-auto w-full ${
            isCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="text-4xl mb-2">{isCorrect ? '✅' : '❌'}</div>
          <p className="text-xl font-bold">
            {isCorrect
              ? `Correto! A resposta é ${correctOption?.text ?? ''}!`
              : `A resposta correta é ${correctOption?.text ?? ''}`}
          </p>
          {!isCorrect && (
            <motion.button
              type="button"
              onClick={handleTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold text-lg shadow-lg"
            >
              Tentar Novamente
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
};
