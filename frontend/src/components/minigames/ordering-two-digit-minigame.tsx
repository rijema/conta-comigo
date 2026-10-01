'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Ordering Two-Digit Numbers Quest
 * BNCC Skills: EF01MA05 (Ordenação de números até 100)
 * Exercise: "Ordene os números!"
 * TEA-FRIENDLY: Drag to reorder, visual number line, clear feedback
 */

interface OrderingTwoDigitMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const OrderingTwoDigitMinigame: React.FC<OrderingTwoDigitMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [items, setItems] = useState<Array<{ id: string; label: string; value: number }>>([]);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const itemsData = activity?.content?.items || [
      { id: 'num34', label: '34', value: 34 },
      { id: 'num12', label: '12', value: 12 },
      { id: 'num56', label: '56', value: 56 },
      { id: 'num23', label: '23', value: 23 },
    ];

    const parsed = itemsData.map((item: any) => ({
      id: item.id || `item-${item.value}`,
      label: item.label || String(item.value),
      value: item.value || parseInt(item.label),
    }));

    // Shuffle for initial display
    const shuffled = [...parsed].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  }, [activity]);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnOrderedSlot = (index: number) => {
    if (!draggedId) return;

    // Remove if already in ordered
    const newOrdered = ordered.filter(id => id !== draggedId);

    // Insert at position
    newOrdered.splice(index, 0, draggedId);
    setOrdered(newOrdered);
    setDraggedId(null);
  };

  const handleDropOnUnordered = () => {
    if (draggedId) {
      const newOrdered = ordered.filter(id => id !== draggedId);
      setOrdered(newOrdered);
      setDraggedId(null);
    }
  };

  const handleSubmit = () => {
    if (ordered.length !== items.length) return;

    const correct = ordered.every((id, idx) => {
      const item = items.find(i => i.id === id);
      const sortedItems = [...items].sort((a, b) => a.value - b.value);
      return sortedItems[idx].id === id;
    });

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

  const availableItems = items.filter(item => !ordered.includes(item.id));
  const orderedItems = ordered.map(id => items.find(item => item.id === id)!);

  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-b from-fuchsia-50 to-pink-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-fuchsia-900 mb-2">Ordene os Números!</h2>
        <p className="text-lg text-gray-700">Do menor para o maior (crescente)</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Available Items */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-lg text-fuchsia-900 mb-4">Números para Ordenar</h3>
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {availableItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDropOnUnordered}
                  className="cursor-move"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileDrag={{ scale: 0.9, opacity: 0.7 }}
                    className="bg-gradient-to-br from-fuchsia-400 to-pink-400 text-white rounded-lg p-6 text-center font-bold text-2xl shadow-lg"
                  >
                    {item.label}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Ordering Area */}
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col">
          <h3 className="font-bold text-lg text-fuchsia-900 mb-4">Sequência</h3>
          <div className="space-y-3 flex-1">
            {Array.from({ length: items.length }).map((_, idx) => (
              <motion.div
                key={`slot-${idx}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnOrderedSlot(idx)}
                className={`p-4 rounded-lg border-4 border-dashed min-h-16 flex items-center justify-center transition ${
                  draggedId ? 'bg-fuchsia-100 border-fuchsia-400' : 'bg-gray-50 border-gray-300'
                }`}
              >
                {idx < orderedItems.length ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    draggable
                    onDragStart={() => handleDragStart(orderedItems[idx].id)}
                    className="cursor-move"
                  >
                    <div className="bg-fuchsia-500 text-white rounded-lg px-6 py-2 font-bold text-xl">
                      {orderedItems[idx].label}
                    </div>
                  </motion.div>
                ) : (
                  <span className="text-gray-400 text-sm">Posição {idx + 1}</span>
                )}
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={submitted || ordered.length !== items.length}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-6 py-3 bg-fuchsia-600 text-white rounded-lg font-bold disabled:opacity-50"
          >
            Verificar Sequência
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
              ? 'Ordem correta! 12, 23, 34, 56 (crescente)'
              : 'Tente novamente. Ordem: 12, 23, 34, 56'}
          </p>
        </motion.div>
      )}
    </div>
  );
};
