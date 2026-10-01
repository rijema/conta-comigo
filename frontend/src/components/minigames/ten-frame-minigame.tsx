'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Ten Frame Quest
 * BNCC Skills: EF01MA03 (Comparação), EF01MA06 (Composição/Decomposição)
 * Exercise: "Complete o quadro de 10!"
 * TEA-FRIENDLY: Visual 10-frame, click to add, clear counting
 */

interface TenFrameMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const TenFrameMinigame: React.FC<TenFrameMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [filled, setFilled] = useState(0);
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startCount = activity?.content?.items?.length || 7;
  const target = 10;
  const needed = target - startCount;

  useEffect(() => {
    if (selectedBoxes.size === needed) {
      setFilled(startCount + selectedBoxes.size);
      setShowCorrect(true);
      setIsComplete(true);

      timeoutRef.current = setTimeout(() => {
        onComplete(100, true);
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedBoxes.size, needed, onComplete, startCount]);

  const toggleBox = (index: number) => {
    if (index < startCount) return; // Can't click pre-filled boxes

    const newSelected = new Set(selectedBoxes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < needed) {
      newSelected.add(index);
    }
    setSelectedBoxes(newSelected);
  };

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-orange-50 to-yellow-50 rounded-xl min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-orange-900 mb-2">Complete o Quadro de 10!</h2>
        <p className="text-lg text-gray-700">Temos {startCount}. Quantos faltam para 10?</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Você precisa de mais:</p>
          <p className="text-4xl font-bold text-orange-600">{needed}</p>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {Array.from({ length: 10 }).map((_, index) => {
            const isFilled = index < startCount;
            const isSelected = selectedBoxes.has(index);

            return (
              <motion.button
                key={index}
                onClick={() => toggleBox(index)}
                disabled={isFilled}
                whileHover={!isFilled ? { scale: 1.05 } : {}}
                whileTap={!isFilled ? { scale: 0.95 } : {}}
                className={`w-16 h-16 rounded-lg font-bold text-xl transition cursor-pointer ${
                  isFilled
                    ? 'bg-orange-400 text-white shadow-md'
                    : isSelected
                      ? 'bg-yellow-300 text-orange-900 shadow-lg border-3 border-orange-400'
                      : 'bg-gray-100 text-gray-400 border-3 border-dashed border-gray-300 hover:border-orange-300'
                }`}
              >
                {isFilled || isSelected ? '●' : index + 1}
              </motion.button>
            );
          })}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Preenchidos: {startCount + selectedBoxes.size} / {target}
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${((startCount + selectedBoxes.size) / target) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCorrect && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-orange-600">
              Perfeito! {startCount} + {needed} = {target}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
