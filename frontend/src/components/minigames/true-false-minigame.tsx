'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: True/False Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Verdadeiro ou Falso? 7 > 4"
 * TEA-FRIENDLY: Simple binary choice, animated statement
 */

interface TrueFalseMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const TrueFalseMinigame: React.FC<TrueFalseMinigameProps> = ({
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

  // Default: 7 > 4 is true
  const statement = activity?.content?.statement || '7 é MAIOR que 4?';
  const correctAnswer = activity?.content?.correctAnswer || 'true';

  const handleSelect = (answer: string) => {
    if (!submitted) {
      setSelected(answer);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;

    const correct = selected === correctAnswer;
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
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-amber-900 mb-2">Verdadeiro ou Falso?</h2>
        <p className="text-lg text-gray-700">É a afirmação correta?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-6 bg-amber-100 rounded-lg border-4 border-amber-300"
        >
          <p className="text-3xl font-bold text-center text-amber-900">{statement}</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <motion.button
            onClick={() => handleSelect('true')}
            disabled={submitted}
            whileHover={!submitted ? { scale: 1.05 } : {}}
            whileTap={!submitted ? { scale: 0.95 } : {}}
            className={`p-6 rounded-lg font-bold text-2xl transition ${
              selected === 'true'
                ? 'bg-green-600 text-white ring-4 ring-green-300'
                : submitted
                  ? correctAnswer === 'true'
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-200 text-gray-600'
                  : 'bg-green-100 text-green-900 border-4 border-green-300 hover:border-green-500'
            }`}
          >
            ✅ Verdadeiro
          </motion.button>

          <motion.button
            onClick={() => handleSelect('false')}
            disabled={submitted}
            whileHover={!submitted ? { scale: 1.05 } : {}}
            whileTap={!submitted ? { scale: 0.95 } : {}}
            className={`p-6 rounded-lg font-bold text-2xl transition ${
              selected === 'false'
                ? 'bg-red-600 text-white ring-4 ring-red-300'
                : submitted
                  ? correctAnswer === 'false'
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-200 text-gray-600'
                  : 'bg-red-100 text-red-900 border-4 border-red-300 hover:border-red-500'
            }`}
          >
            ❌ Falso
          </motion.button>
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={submitted || !selected}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full mt-8 px-8 py-3 bg-amber-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
        >
          Verificar Resposta
        </motion.button>
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
            {isCorrect ? 'Resposta correta!' : 'Tente novamente!'}
          </p>
        </motion.div>
      )}
    </div>
  );
};
