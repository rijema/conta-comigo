'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

/**
 * MINIGAME: Multi-Select Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Marque os números > 5"
 * TEA-FRIENDLY: Click multiple items, visual feedback, large buttons
 */

interface MultiSelectMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const MultiSelectMinigame: React.FC<MultiSelectMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const threshold = 5;
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Parse items from activity or use defaults
  const items = activity?.content?.items ||
    [
      { id: 'a', value: 2, label: '2' },
      { id: 'b', value: 7, label: '7' },
      { id: 'c', value: 4, label: '4' },
      { id: 'd', value: 9, label: '9' },
      { id: 'e', value: 3, label: '3' },
      { id: 'f', value: 8, label: '8' },
    ];

  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity?.id ?? `multi-select-minigame-${skill}` });
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [activity?.content?.instructionsPt || activity?.content?.instructions || `Toque em todos os números maiores que ${threshold}.`],
      });
    }
  }, [speech.settings.voiceEnabled, speech, activity, threshold]);

  const correctAnswers = items
    .filter((item: any) => Number(item.value || item.label) > threshold)
    .map((item: any) => item.id);

  const handleToggle = (itemId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    const correct = Array.from(selected).every(id => correctAnswers.includes(id)) &&
      correctAnswers.every(id => selected.has(id));

    setIsCorrect(correct);
    setSubmitted(true);

    timeoutRef.current = setTimeout(() => {
      onComplete(correct ? 100 : 50, correct);
    }, 2000);
  };

  // RETRY (TEA-FRIENDLY): see error-detection-minigame.tsx for rationale.
  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSelected(new Set());
    setSubmitted(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-indigo-50 to-blue-50 rounded-xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-indigo-900 mb-2">Marque os Números Maiores que {threshold}!</h2>
        <p className="text-lg text-gray-700">Clique em TODOS os números maiores que {threshold}</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 auto-rows-max">
        <AnimatePresence>
          {items.map((item: any) => {
            const isCorrectAnswer = correctAnswers.includes(item.id);
            const isSelected = selected.has(item.id);
            const label = item.label || String(item.value || item);
            const value = Number(item.value || item.label);

            return (
              <motion.button
                key={item.id}
                layout
                onClick={() => !submitted && handleToggle(item.id)}
                disabled={submitted}
                whileHover={!submitted ? { scale: 1.05 } : {}}
                whileTap={!submitted ? { scale: 0.95 } : {}}
                className={`w-24 h-24 rounded-xl font-bold text-3xl transition shadow-lg ${
                  isSelected
                    ? 'bg-indigo-500 text-white ring-4 ring-indigo-300'
                    : submitted
                      ? isCorrectAnswer
                        ? 'bg-green-400 text-white'
                        : 'bg-red-400 text-white'
                      : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400'
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 justify-center">
        <motion.button
          onClick={handleSubmit}
          disabled={submitted || selected.size === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
        >
          Verificar Resposta
        </motion.button>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg text-center ${
            isCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="text-4xl mb-2">{isCorrect ? '✅' : '❌'}</div>
          <p className="text-xl font-bold">
            {isCorrect
              ? `Perfeito! Todos os números maiores que ${threshold}!`
              : `Quase lá. Números corretos: ${correctAnswers.join(', ')}`}
          </p>
          {!isCorrect && (
            <motion.button
              type="button"
              onClick={handleTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg shadow-lg"
            >
              Tentar Novamente
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
};
