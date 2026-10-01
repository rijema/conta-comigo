'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Error Detection Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Titia errou! Qual é o erro?"
 * TEA-FRIENDLY: Identify mistakes, TitiA character, learn from errors
 */

interface ErrorDetectionMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const ErrorDetectionMinigame: React.FC<ErrorDetectionMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Default: Titia said "3 is greater than 9" (wrong)
  const errorStatement = activity?.content?.errorStatement || 'A Titia disse: "3 é maior que 9"';
  const options = activity?.content?.options ||
    [
      { id: 'a', text: 'Titia acertou!', isCorrect: false },
      { id: 'b', text: 'Titia errou! Porque 3 < 9', isCorrect: true },
      { id: 'c', text: 'Titia errou! Porque 3 = 9', isCorrect: false },
    ];

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-violet-50 to-purple-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-violet-900 mb-2">Titia errou!</h2>
        <p className="text-lg text-gray-700">Qual é o erro?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 flex items-center gap-6"
        >
          <div className="text-6xl">🧙‍♀️</div>
          <div className="flex-1 p-6 bg-violet-100 rounded-lg border-4 border-violet-300">
            <p className="text-xl font-bold text-violet-900">{errorStatement}</p>
          </div>
        </motion.div>

        <div className="border-t-2 border-gray-200 pt-6">
          <p className="text-center text-lg font-bold text-violet-900 mb-6">Ela acertou ou errou?</p>

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
                    ? 'bg-violet-600 text-white ring-4 ring-violet-300'
                    : submitted
                      ? option.isCorrect
                        ? 'bg-green-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                      : 'bg-gray-100 text-gray-800 border-2 border-violet-200 hover:border-violet-400'
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
            className="w-full mt-6 px-8 py-3 bg-violet-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
          >
            Verificar Resposta
          </motion.button>
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-lg text-center ${
            isCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="text-4xl mb-2">{isCorrect ? '✅' : '❌'}</div>
          <p className="text-xl font-bold">
            {isCorrect
              ? 'Correto! 3 é menor que 9, não maior!'
              : 'A resposta correta é: Titia errou porque 3 é menor que 9'}
          </p>
        </motion.div>
      )}
    </div>
  );
};
