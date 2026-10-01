'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Equation Builder Quest
 * BNCC Skills: EF01MA03 (Comparação), EF01MA06 (Composição/Decomposição)
 * Exercise: "Complete: 3 + ? = 8"
 * TEA-FRIENDLY: Fill blanks, multiple choice, visual equation
 */

interface EquationBuilderMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const EquationBuilderMinigame: React.FC<EquationBuilderMinigameProps> = ({
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

  // Default: 3 + ? = 8, answer is 5
  const equation = activity?.content?.equation || { left: 3, operator: '+', right: 8 };
  const options = activity?.content?.options ||
    [
      { id: 'a', text: '4', isCorrect: false },
      { id: 'b', text: '5', isCorrect: true },
      { id: 'c', text: '6', isCorrect: false },
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
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-green-50 to-emerald-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-green-900 mb-2">Complete a Equação!</h2>
        <p className="text-lg text-gray-700">Qual número falta?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-8 bg-green-100 rounded-lg border-4 border-green-300"
        >
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <div className="text-4xl font-bold text-green-900">{equation.left}</div>
            <div className="text-4xl font-bold text-green-600">{equation.operator}</div>
            <div className="text-4xl font-bold text-yellow-500 bg-yellow-100 px-6 py-2 rounded-lg border-4 border-yellow-400">
              ?
            </div>
            <div className="text-4xl font-bold text-green-900">=</div>
            <div className="text-4xl font-bold text-green-900">{equation.right}</div>
          </div>
        </motion.div>

        <div className="space-y-3 mb-6">
          {options.map((option: any) => (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={submitted}
              whileHover={!submitted ? { scale: 1.02 } : {}}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              className={`w-full p-4 rounded-lg font-bold text-2xl transition ${
                selected === option.id
                  ? 'bg-green-600 text-white ring-4 ring-green-300'
                  : submitted
                    ? option.isCorrect
                      ? 'bg-emerald-400 text-white'
                      : 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-800 border-2 border-green-200 hover:border-green-400'
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
          className="w-full px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
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
            {isCorrect
              ? `Perfeito! ${equation.left} ${equation.operator} 5 = ${equation.right}`
              : `A resposta correta é 5 (${equation.left} ${equation.operator} 5 = ${equation.right})`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
