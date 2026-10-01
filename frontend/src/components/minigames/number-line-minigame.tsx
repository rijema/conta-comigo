'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Number Line Quest
 *
 * BNCC Skills: EF01MA03 (Comparação), EF01MA08 (Ordenação)
 *
 * TEA-FRIENDLY:
 * ✅ Visual number line with clear positions
 * ✅ Click to select position on the line
 * ✅ Large touch targets (numbers 50px)
 * ✅ Progressive difficulty (line ranges increase)
 * ✅ Color-coded feedback (green = correct)
 */

interface NumberLineProblem {
  lineStart: number;
  lineEnd: number;
  targetNumber: number;
  correctPosition: number; // 0-100 percentage on the line
}

interface NumberLineMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

const generateProblem = (difficulty: string): NumberLineProblem => {
  const ranges: Record<string, [number, number]> = {
    very_easy: [0, 5],
    easy: [0, 10],
    medium: [0, 20],
    hard: [0, 50],
  };

  const [start, end] = ranges[difficulty] || [0, 10];
  const range = end - start;

  const targetNumber = start + Math.floor(Math.random() * (range + 1));
  const correctPosition = (targetNumber - start) / range * 100;

  return {
    lineStart: start,
    lineEnd: end,
    targetNumber,
    correctPosition,
  };
};

export const NumberLineMinigame: React.FC<NumberLineMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [problem, setProblem] = useState<NumberLineProblem | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const newProblem = generateProblem(difficulty);
    setProblem(newProblem);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [difficulty]);

  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnswered || !problem || !lineRef.current) return;

    const rect = lineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;

    setSelectedPosition(percentage);

    const tolerance = 10;
    const isCorrect = Math.abs(percentage - problem.correctPosition) < tolerance;

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnswered(true);

    timeoutRef.current = setTimeout(() => {
      const score = isCorrect ? 100 : 50;
      onComplete(score, isCorrect);
    }, 2000);
  };

  if (!problem) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  const tickCount = problem.lineEnd - problem.lineStart + 1;
  const ticks = Array.from({ length: tickCount }, (_, i) => ({
    number: problem.lineStart + i,
    position: (i / (tickCount - 1)) * 100,
  }));

  return (
    <div className="flex flex-col gap-8 p-8 bg-gradient-to-b from-purple-50 to-blue-50 rounded-xl min-h-screen justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-purple-900 mb-4">Reta Numérica</h2>
        <p className="text-xl text-gray-700 mb-2">Onde fica o número</p>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl font-bold text-purple-600"
        >
          {problem.targetNumber}
        </motion.div>
        <p className="text-lg text-gray-600 mt-4">
          na reta de {problem.lineStart} até {problem.lineEnd}?
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-2xl">
          <motion.div
            ref={lineRef}
            onClick={handleLineClick}
            className={`relative h-24 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200 rounded-xl p-8 cursor-pointer transition ${
              feedback === 'correct' ? 'ring-4 ring-green-400' :
              feedback === 'incorrect' ? 'ring-4 ring-red-400' :
              'ring-2 ring-gray-300'
            }`}
            whileHover={!isAnswered ? { scale: 1.02 } : {}}
          >
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-400 transform -translate-y-1/2" />

            {ticks.map((tick, idx) => (
              <motion.div
                key={tick.number}
                className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${tick.position}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="h-6 w-1 bg-gray-600" />
                <span className="text-sm font-bold text-gray-700 mt-2">
                  {tick.number}
                </span>
              </motion.div>
            ))}

            {selectedPosition !== null && (
              <motion.div
                className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition ${
                  feedback === 'correct' ? 'text-green-600' : 'text-red-600'
                }`}
                style={{ left: `${selectedPosition}%` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-4xl">📍</div>
              </motion.div>
            )}

            {isAnswered && (
              <motion.div
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 text-green-600"
                style={{ left: `${problem.correctPosition}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-4xl">✅</div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center p-6 rounded-xl ${
              feedback === 'correct'
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-red-100 border-2 border-red-400'
            }`}
          >
            {feedback === 'correct' ? (
              <>
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-xl font-bold text-green-700">
                  Parabéns! O número {problem.targetNumber} fica exatamente aí!
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-2">😊</p>
                <p className="text-xl font-bold text-red-700">
                  O número {problem.targetNumber} deveria estar na posição correta mostrada com ✅
                </p>
              </>
            )}
          </motion.div>
        )}

        {!isAnswered && (
          <p className="text-center text-gray-600 text-lg">
            Clique na reta para indicar onde fica o número
          </p>
        )}
      </div>
    </div>
  );
};
