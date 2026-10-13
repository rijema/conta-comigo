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

  // Real problem statement from the database. Each exercise tells a
  // different story (library, market, kitchen, collection...) — the UI
  // must not hardcode one specific scenario (e.g. "Maria vs João"), or
  // every contextual problem ends up looking identical to the child.
  const title = activity?.title || 'Resolva o Problema!';
  const statement =
    activity?.content?.instructionsPt ||
    activity?.content?.instructions ||
    'Leia o problema com atenção.';
  const context: string | undefined = activity?.content?.semantic?.context;

  const CONTEXT_EMOJI: Record<string, string> = {
    biblioteca: '📚',
    escola: '🏫',
    coleta: '🗳️',
    cozinha: '🍳',
    coleção: '🧸',
    compras: '🛒',
    medidas: '📏',
  };
  const emoji = (context && CONTEXT_EMOJI[context]) || '🧮';

  const options = activity?.content?.options ||
    [
      { id: 'a', text: 'Maria', isCorrect: false },
      { id: 'b', text: 'João', isCorrect: true },
      { id: 'c', text: 'Iguais', isCorrect: false },
    ];

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
        <h2 className="text-3xl font-bold text-rose-900 mb-2">{title}</h2>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 bg-rose-50 rounded-lg border-4 border-rose-200 flex flex-col items-center gap-3"
        >
          <span className="text-5xl" aria-hidden="true">{emoji}</span>
          <p className="text-xl font-bold text-center text-rose-900 leading-relaxed">{statement}</p>
        </motion.div>

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
              ? `Isso mesmo! A resposta é ${correctOption?.text ?? ''}.`
              : `A resposta correta é ${correctOption?.text ?? ''}.`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
