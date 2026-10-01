'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Contextual Problem Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Problema: Quem tem mais?"
 * TEA-FRIENDLY: Visual word problem, animated characters
 */

interface ContextualProblemMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const ContextualProblemMinigame: React.FC<ContextualProblemMinigameProps> = ({
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

  // Default: Maria tem 5 bolinhas, João tem 7. Quem tem mais?
  const problem = {
    character1: 'Maria',
    value1: 5,
    item: 'bolinhas',
    character2: 'João',
    value2: 7,
  };

  const options = activity?.content?.options ||
    [
      { id: 'a', text: 'Maria', isCorrect: false },
      { id: 'b', text: 'João', isCorrect: true },
      { id: 'c', text: 'Iguais', isCorrect: false },
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
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-rose-50 to-red-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-rose-900 mb-2">Problema!</h2>
        <p className="text-lg text-gray-700">Quem tem mais?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg">
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Character 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <div className="text-5xl mb-4">👧</div>
            <h3 className="text-xl font-bold text-rose-900 mb-4">{problem.character1}</h3>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {Array.from({ length: problem.value1 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-8 h-8 bg-blue-400 rounded-full"
                />
              ))}
            </div>
            <p className="font-bold text-rose-700">{problem.value1} {problem.item}</p>
          </motion.div>

          {/* Character 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <div className="text-5xl mb-4">👦</div>
            <h3 className="text-xl font-bold text-rose-900 mb-4">{problem.character2}</h3>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {Array.from({ length: problem.value2 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-8 h-8 bg-red-400 rounded-full"
                />
              ))}
            </div>
            <p className="font-bold text-rose-700">{problem.value2} {problem.item}</p>
          </motion.div>
        </div>

        <div className="border-t-2 border-gray-200 pt-6">
          <p className="text-center text-lg font-bold text-rose-900 mb-6">Quem tem mais {problem.item}?</p>

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
                    ? 'bg-rose-600 text-white ring-4 ring-rose-300'
                    : submitted
                      ? option.isCorrect
                        ? 'bg-green-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                      : 'bg-gray-100 text-gray-800 border-2 border-rose-200 hover:border-rose-400'
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
            className="w-full mt-6 px-8 py-3 bg-rose-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
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
              ? `João tem mais! ${problem.value2} > ${problem.value1}`
              : `A resposta correta é João (${problem.value2} > ${problem.value1})`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
