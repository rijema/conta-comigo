'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

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

  const pattern = [2, 4, 6, null, 10];
  const options = activity?.content?.options ||
    [
      { id: 'a', text: '3', isCorrect: false },
      { id: 'b', text: '8', isCorrect: true },
      { id: 'c', text: '5', isCorrect: false },
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
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-cyan-50 to-teal-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-cyan-900 mb-2">Qual Número Falta?</h2>
        <p className="text-lg text-gray-700">Veja a sequência: qual número completa?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <div className="flex justify-center items-center gap-4 mb-8 flex-wrap">
          {pattern.map((num, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl ${
                num === null
                  ? 'bg-yellow-300 border-4 border-yellow-400 text-yellow-600'
                  : 'bg-cyan-400 text-white'
              }`}
            >
              {num === null ? '?' : num}
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-6 p-4 bg-cyan-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Dica: qual é o padrão?</p>
          <p className="text-xl font-bold text-cyan-700">+2, +2, +2, ...</p>
        </div>

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
            {isCorrect ? 'Correto! A resposta é 8!' : 'A resposta correta é 8 (2, 4, 6, 8, 10)'}
          </p>
        </motion.div>
      )}
    </div>
  );
};
