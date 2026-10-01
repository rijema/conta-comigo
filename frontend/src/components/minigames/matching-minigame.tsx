'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Matching Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Ligue o número ao seu valor!"
 * TEA-FRIENDLY: Click to connect, drag to link, visual matching
 */

interface MatchingMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const MatchingMinigame: React.FC<MatchingMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Default matching: numbers to dots
  const pairs = (activity?.content?.items ||
    [
      { id: 'pair1', left: '2', right: 'dois círculos' },
      { id: 'pair2', left: '4', right: 'quatro círculos' },
      { id: 'pair3', left: '3', right: 'três círculos' },
    ]) as Array<{ id: string; left: string; right: string }>;

  const correctMatches = pairs.reduce(
    (acc, pair: any) => {
      acc[pair.left] = pair.right;
      return acc;
    },
    {} as Record<string, string>
  );

  const handleLeftClick = (leftValue: string) => {
    setSelectedLeft(selectedLeft === leftValue ? null : leftValue);
  };

  const handleRightClick = (rightValue: string) => {
    if (selectedLeft) {
      const newMatches = { ...matches };
      newMatches[selectedLeft] = rightValue;
      setMatches(newMatches);
      setSelectedLeft(null);

      // Check if all matched
      if (Object.keys(newMatches).length === pairs.length) {
        setTimeout(() => {
          const isCorrect = Object.entries(newMatches).every(
            ([left, right]) => correctMatches[left] === right
          );
          setShowCorrect(true);
          setIsComplete(true);

          timeoutRef.current = setTimeout(() => {
            onComplete(isCorrect ? 100 : 50, isCorrect);
          }, 1500);
        }, 300);
      }
    }
  };

  const getMatchedRight = (leftValue: string) => matches[leftValue];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-sky-50 to-cyan-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-sky-900 mb-2">Ligue o Número ao seu Valor!</h2>
        <p className="text-lg text-gray-700">Clique em um número, depois clique em sua representação</p>
      </motion.div>

      <div className="bg-white rounded-lg p-8 shadow-lg flex-1">
        <div className="grid grid-cols-2 gap-8">
          {/* Left column - Numbers */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-sky-900 mb-6">Números</h3>
            {pairs.map((pair: any) => {
              const isSelected = selectedLeft === pair.left;
              const hasMatch = pair.left in matches;

              return (
                <motion.button
                  key={`left-${pair.left}`}
                  onClick={() => handleLeftClick(pair.left)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full p-6 rounded-lg font-bold text-2xl transition ${
                    isSelected
                      ? 'bg-sky-600 text-white ring-4 ring-sky-300'
                      : hasMatch
                        ? 'bg-emerald-200 text-sky-900'
                        : 'bg-sky-100 text-sky-900 border-2 border-sky-300 hover:border-sky-500'
                  }`}
                >
                  {pair.left}
                </motion.button>
              );
            })}
          </div>

          {/* Right column - Representations */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-sky-900 mb-6">Representações</h3>
            {pairs.map((pair: any) => {
              const isMatched = Object.values(matches).includes(pair.right);
              const isCorrectMatch =
                selectedLeft && correctMatches[selectedLeft] === pair.right;

              return (
                <motion.button
                  key={`right-${pair.right}`}
                  onClick={() => handleRightClick(pair.right)}
                  disabled={!selectedLeft || isMatched}
                  whileHover={!isMatched && selectedLeft ? { scale: 1.05 } : {}}
                  whileTap={!isMatched && selectedLeft ? { scale: 0.95 } : {}}
                  className={`w-full p-6 rounded-lg font-bold text-lg transition ${
                    isMatched
                      ? 'bg-emerald-400 text-white'
                      : selectedLeft && isCorrectMatch
                        ? 'bg-cyan-300 text-sky-900 border-4 border-cyan-500'
                        : selectedLeft
                          ? 'bg-cyan-100 text-sky-900 border-2 border-cyan-400 hover:border-cyan-500'
                          : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                  }`}
                >
                  {pair.right}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Conectados: {Object.keys(matches).length} / {pairs.length}
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(Object.keys(matches).length / pairs.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCorrect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-sky-600">Perfeito! Todas as conexões certas!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
