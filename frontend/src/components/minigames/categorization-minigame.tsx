'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';

/**
 * MINIGAME: Categorization Quest
 * BNCC Skills: EF01MA03 (Comparação), EF01MA14 (Contagem)
 * Exercise: "Separe: MAIOR e MENOR"
 * TEA-FRIENDLY: Drag to bins, large targets, clear visual feedback
 */

interface CategorizationMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const CategorizationMinigame: React.FC<CategorizationMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [items, setItems] = useState<Array<{ id: string; value: number; label: string }>>([]);
  const [categorized, setCategorized] = useState<{ greater: string[]; lesser: string[] }>({ greater: [], lesser: [] });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const threshold = 5;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const itemsData = activity?.content?.items || [
      { value: 2, label: '2' },
      { value: 5, label: '5' },
      { value: 3, label: '3' },
      { value: 8, label: '8' },
    ];

    const parsedItems = itemsData.map((item: any, idx: number) => ({
      id: item.id || `item-${idx}`,
      value: typeof item === 'number' ? item : item.value || item.label,
      label: item.label || String(item.value || item),
    }));

    setItems(parsedItems);
  }, [activity]);

  useEffect(() => {
    const allCategorized = items.length > 0 && (categorized.greater.length + categorized.lesser.length === items.length);
    if (allCategorized) {
      const isCorrect = items.every(item => {
        if (Number(item.value) > threshold) return categorized.greater.includes(item.id);
        if (Number(item.value) < threshold) return categorized.lesser.includes(item.id);
        return true;
      });

      setIsComplete(true);
      timeoutRef.current = setTimeout(() => {
        onComplete(isCorrect ? 100 : 50, isCorrect);
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [categorized, items, onComplete]);

  const handleItemDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleBinDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBinDrop = (bin: 'greater' | 'lesser') => {
    if (draggedItem) {
      const alreadyInGreater = categorized.greater.includes(draggedItem);
      const alreadyInLesser = categorized.lesser.includes(draggedItem);

      let newCategorized = { ...categorized };

      if (alreadyInGreater) newCategorized.greater = newCategorized.greater.filter(id => id !== draggedItem);
      if (alreadyInLesser) newCategorized.lesser = newCategorized.lesser.filter(id => id !== draggedItem);

      if (bin === 'greater') {
        newCategorized.greater = [...newCategorized.greater, draggedItem];
      } else {
        newCategorized.lesser = [...newCategorized.lesser, draggedItem];
      }

      setCategorized(newCategorized);
      setDraggedItem(null);
    }
  };

  const availableItems = items.filter(
    item => !categorized.greater.includes(item.id) && !categorized.lesser.includes(item.id)
  );

  const greaterItems = items.filter(item => categorized.greater.includes(item.id));
  const lesserItems = items.filter(item => categorized.lesser.includes(item.id));

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-purple-900 mb-2">Separe: Maior e Menor</h2>
        <p className="text-gray-700">Números maiores que {threshold} e menores que {threshold}</p>
      </motion.div>

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="text-sm text-gray-600 mb-2">
          Progresso: {categorized.greater.length + categorized.lesser.length} de {items.length}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((categorized.greater.length + categorized.lesser.length) / items.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex gap-8 flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-4 text-purple-900">Números Disponíveis</h3>
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {availableItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  draggable
                  onDragStart={() => handleItemDragStart(item.id)}
                  className="cursor-move"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileDrag={{ scale: 0.95, opacity: 0.7 }}
                    className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center shadow hover:shadow-lg transition"
                  >
                    <div className="text-3xl font-bold text-purple-600">{item.label}</div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <motion.div
            onDragOver={handleBinDragOver}
            onDrop={() => handleBinDrop('greater')}
            className={`flex-1 border-4 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition ${
              draggedItem ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'
            }`}
          >
            <div className="text-4xl mb-2">📗</div>
            <h4 className="font-bold text-green-900 text-lg mb-4">MAIOR ({'>'} {threshold})</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              <AnimatePresence>
                {greaterItems.map(item => (
                  <motion.div
                    key={`greater-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-green-200 rounded-lg px-4 py-2 font-bold text-green-900 shadow"
                  >
                    {item.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {greaterItems.length === 0 && <p className="text-gray-400">Arraste aqui</p>}
          </motion.div>

          <motion.div
            onDragOver={handleBinDragOver}
            onDrop={() => handleBinDrop('lesser')}
            className={`flex-1 border-4 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition ${
              draggedItem ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'
            }`}
          >
            <div className="text-4xl mb-2">📘</div>
            <h4 className="font-bold text-blue-900 text-lg mb-4">MENOR ({'<'} {threshold})</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              <AnimatePresence>
                {lesserItems.map(item => (
                  <motion.div
                    key={`lesser-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-blue-200 rounded-lg px-4 py-2 font-bold text-blue-900 shadow"
                  >
                    {item.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {lesserItems.length === 0 && <p className="text-gray-400">Arraste aqui</p>}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-3xl font-bold text-white">Perfeito!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
