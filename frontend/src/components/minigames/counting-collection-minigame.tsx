'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Counting Collection Quest
 * BNCC Skills: EF01MA04 (Contagem até 100)
 * Exercise: "Conte até 100!"
 * TEA-FRIENDLY: Large clickable items, grouping by 10s, visual counting
 */

interface CountingCollectionMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const CountingCollectionMinigame: React.FC<CountingCollectionMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [counted, setCounted] = useState(0);
  const [groups, setGroups] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const totalObjects = activity?.content?.totalCount || 47;
  const maxPerGroup = 10;
  const expectedGroups = Math.floor(totalObjects / maxPerGroup);
  const remainder = totalObjects % maxPerGroup;

  const handleAddGroup = () => {
    if (counted + maxPerGroup <= totalObjects) {
      setCounted(counted + maxPerGroup);
      setGroups([...groups, maxPerGroup]);
    }
  };

  const handleAddRemaining = () => {
    if (counted + remainder === totalObjects && remainder > 0) {
      setCounted(totalObjects);
      setGroups([...groups, remainder]);
    }
  };

  const handleSubmit = () => {
    const correct = counted === totalObjects;
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
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-lime-50 to-green-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-lime-900 mb-2">Conte até 100!</h2>
        <p className="text-lg text-gray-700">Conte agrupando de 10 em 10</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Objects Display */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-lg text-lime-900 mb-4">Objetos para Contar</h3>
          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
            {Array.from({ length: totalObjects }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`w-10 h-10 rounded-full font-bold text-white flex items-center justify-center ${
                  i < counted ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                ●
              </motion.div>
            ))}
          </div>
        </div>

        {/* Counting Interface */}
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-lg text-lime-900 mb-4">Seu Agrupamento</h3>
            <div className="space-y-2 mb-6">
              {groups.map((groupSize, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-lime-200 rounded-lg p-3 text-lime-900 font-bold"
                >
                  Grupo {idx + 1}: {groupSize} objetos (Total: {groups.slice(0, idx + 1).reduce((a, b) => a + b, 0)})
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center p-4 bg-lime-100 rounded-lg border-2 border-lime-300">
            <p className="text-sm text-lime-800 mb-2">Contados até agora:</p>
            <p className="text-4xl font-bold text-lime-700">{counted}</p>
          </div>

          <button
            onClick={handleAddGroup}
            disabled={submitted || counted + maxPerGroup > totalObjects}
            className="px-4 py-3 bg-lime-600 text-white rounded-lg font-bold disabled:opacity-50"
          >
            + Grupo de 10
          </button>

          {remainder > 0 && counted + maxPerGroup < totalObjects && (
            <button
              onClick={handleAddRemaining}
              disabled={submitted || counted + remainder !== totalObjects}
              className="px-4 py-3 bg-green-600 text-white rounded-lg font-bold disabled:opacity-50"
            >
              + Restante ({remainder})
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitted || counted !== totalObjects}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
          >
            Verificar {counted}/{totalObjects}
          </button>
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
            {isCorrect ? `Perfeito! Você contou ${totalObjects} objetos!` : `Tente novamente. Total: ${totalObjects}`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
