'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * MINIGAME: Category Sorting
 *
 * TEA-FRIENDLY:
 * ✅ No text - pure visual + colors
 * ✅ Clear rules - drag items to matching box
 * ✅ Color coding - each category has own color
 * ✅ Immediate feedback per drop
 * ✅ Celebratory animation
 * ✅ No timer pressure
 *
 * [PROPOSTA CONTA COMIGO] Agrupamento visual por cor/categoria
 * [DECISÃO DE ENGENHARIA] Drag-drop com validação por emoji type
 */

interface CategoryItem {
  id: string;
  emoji: string;
  category: 'fruits' | 'animals' | 'vehicles';
}

interface CategoryBox {
  id: 'fruits' | 'animals' | 'vehicles';
  color: string;
  bgColor: string;
  items: string[]; // item IDs
}

interface CategoryMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
}

const ITEM_SETS = {
  very_easy: [
    { id: '1', emoji: '🍎', category: 'fruits' as const },
    { id: '2', emoji: '🍊', category: 'fruits' as const },
    { id: '3', emoji: '🐶', category: 'animals' as const },
    { id: '4', emoji: '🐱', category: 'animals' as const },
  ],
  easy: [
    { id: '1', emoji: '🍎', category: 'fruits' as const },
    { id: '2', emoji: '🍊', category: 'fruits' as const },
    { id: '3', emoji: '🍌', category: 'fruits' as const },
    { id: '4', emoji: '🐶', category: 'animals' as const },
    { id: '5', emoji: '🐱', category: 'animals' as const },
    { id: '6', emoji: '🚗', category: 'vehicles' as const },
  ],
  medium: [
    { id: '1', emoji: '🍎', category: 'fruits' as const },
    { id: '2', emoji: '🍊', category: 'fruits' as const },
    { id: '3', emoji: '🍌', category: 'fruits' as const },
    { id: '4', emoji: '🍇', category: 'fruits' as const },
    { id: '5', emoji: '🐶', category: 'animals' as const },
    { id: '6', emoji: '🐱', category: 'animals' as const },
    { id: '7', emoji: '🦁', category: 'animals' as const },
    { id: '8', emoji: '🚗', category: 'vehicles' as const },
    { id: '9', emoji: '✈️', category: 'vehicles' as const },
  ],
  hard: [
    { id: '1', emoji: '🍎', category: 'fruits' as const },
    { id: '2', emoji: '🍊', category: 'fruits' as const },
    { id: '3', emoji: '🍌', category: 'fruits' as const },
    { id: '4', emoji: '🍇', category: 'fruits' as const },
    { id: '5', emoji: '🍓', category: 'fruits' as const },
    { id: '6', emoji: '🐶', category: 'animals' as const },
    { id: '7', emoji: '🐱', category: 'animals' as const },
    { id: '8', emoji: '🦁', category: 'animals' as const },
    { id: '9', emoji: '🐘', category: 'animals' as const },
    { id: '10', emoji: '🚗', category: 'vehicles' as const },
    { id: '11', emoji: '✈️', category: 'vehicles' as const },
    { id: '12', emoji: '🚂', category: 'vehicles' as const },
  ],
};

export const CategoryMinigame: React.FC<CategoryMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  isTEAMode = true,
}) => {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [boxes, setBoxes] = useState<CategoryBox[]>([
    { id: 'fruits', color: '🍎', bgColor: 'bg-red-300', items: [] },
    { id: 'animals', color: '🐶', bgColor: 'bg-blue-300', items: [] },
    { id: 'vehicles', color: '🚗', bgColor: 'bg-yellow-300', items: [] },
  ]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Initialize items
  useEffect(() => {
    const itemSet = ITEM_SETS[difficulty] || ITEM_SETS.easy;
    const shuffled = [...itemSet].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  }, [difficulty]);

  // Check if game is complete
  useEffect(() => {
    if (items.length > 0 && correctCount === items.length) {
      setShowCelebration(true);
      setTimeout(() => {
        onComplete(100, true);
      }, 1500);
    }
  }, [correctCount, items.length, onComplete]);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropOnBox = (boxId: 'fruits' | 'animals' | 'vehicles') => {
    if (!draggedItem) return;

    const item = items.find((i) => i.id === draggedItem);
    if (!item) return;

    // Check if correct category
    if (item.category === boxId) {
      // Correct! Move item to box
      setItems(items.filter((i) => i.id !== draggedItem));
      setBoxes(
        boxes.map((box) =>
          box.id === boxId ? { ...box, items: [...box.items, draggedItem] } : box
        )
      );
      setCorrectCount(correctCount + 1);

      // Play success sound
      if (typeof window !== 'undefined') {
        const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
        audio.play().catch(() => {});
      }
    } else {
      // Wrong category - shake animation
      const boxElement = document.getElementById(`box-${boxId}`);
      if (boxElement) {
        boxElement.classList.add('animate-bounce');
        setTimeout(() => boxElement.classList.remove('animate-bounce'), 600);
      }
    }

    setDraggedItem(null);
  };

  const completionPercent = items.length > 0 
    ? Math.max(0, ((ITEM_SETS[difficulty].length - items.length) / ITEM_SETS[difficulty].length) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">🎯 Sort by Category!</h1>
        <p className="text-lg text-purple-500">Drag each item to the right box</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-3 bg-purple-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center mt-2 text-sm text-purple-600">
          {correctCount}/{ITEM_SETS[difficulty].length} sorted correctly
        </p>
      </div>

      {/* Category boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            id={`box-${box.id}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDropOnBox(box.id)}
            className={`
              ${box.bgColor} rounded-xl p-6 min-h-40 flex flex-col items-center justify-center
              border-4 border-dashed border-gray-400
              transition-all duration-200
            `}
          >
            <div className="text-6xl mb-4">{box.color}</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {box.items.map((itemId) => {
                const item = ITEM_SETS[difficulty].find((i) => i.id === itemId);
                return (
                  <div key={itemId} className="text-3xl">
                    {item?.emoji}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Draggable items */}
      <div className="flex flex-wrap justify-center gap-4 p-6 bg-white rounded-xl shadow-lg w-full max-w-2xl">
        {items.map((item) => (
          <motion.div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            className="cursor-move text-4xl p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileDrag={{ scale: 1.2, opacity: 0.7 }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </div>

      {/* Celebration */}
      {showCelebration && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-8xl"
            animate={{ scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: 3 }}
          >
            🎉
          </motion.div>
        </motion.div>
      )}

      {/* Reset button */}
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-2 bg-purple-500 text-white rounded-lg text-sm"
      >
        Try Again
      </button>
    </div>
  );
};
