"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";
import { ArasaacPictogram } from "@/components/arasaac/arasaac-pictogram";
import { motion } from "framer-motion";

interface Props {
  activity: Activity;
  onAnswer: (answer: { count: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function CountingActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const [count, setCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const rawItems = activity.content?.items || [];
  const items = rawItems.filter((i: any) => i !== '+' && i !== '=' && i !== '?');
  const targetCount = activity.content?.targetCount ?? items.length;
  const itemEmoji = activity.content?.itemEmoji || '🟡';

  const handleCount = () => {
    if (count < items.length) {
      setCount((c) => c + 1);
      // Play click sound
      if (typeof window !== 'undefined') {
        const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
        audio.play().catch(() => {});
      }
    }
  };

  const handleSubmit = () => {
    const isCorrect = count === targetCount;
    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
    onAnswer({ count, isCorrect });
    if (!isCorrect) setCount(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      {/* Header - MINIMAL TEXT */}
      <div className="mb-8">
        <div className="text-6xl mb-4">❓</div>
        <p className="text-2xl font-bold text-blue-600 text-center">
          {itemEmoji} = ?
        </p>
      </div>

      {/* Items to count - LARGE & VISUAL */}
      <div
        className="flex flex-wrap gap-6 justify-center mb-12 p-8 bg-white rounded-2xl shadow-lg max-w-2xl"
        role="group"
        aria-label="Itens para contar"
      >
        {items.map((item: any, i: number) => (
          <motion.div
            key={i}
            onClick={handleCount}
            className={`
              text-6xl cursor-pointer select-none
              transition-all duration-200
              transform hover:scale-125
              ${i < count ? "scale-110 ring-4 ring-green-400" : "opacity-70 hover:opacity-100"}
            `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCount()}
            aria-label={`Item ${i + 1}${i < count ? " contado" : ""}`}
            whileTap={{ scale: 1.2 }}
          >
            {itemEmoji}
          </motion.div>
        ))}
      </div>

      {/* Big counter display - VERY VISUAL */}
      <motion.div className="text-center mb-12">
        <motion.div
          className="text-8xl font-bold text-blue-600 mb-4"
          key={count}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          {count}
        </motion.div>
        {/* Icon showing what number it is */}
        <div className="text-4xl">
          {count === 0 && '❓'}
          {count > 0 && count <= 3 && '👍'}
          {count > 3 && '🚀'}
        </div>
      </motion.div>

      {/* Buttons - LARGE, EMOJI ONLY or MINIMAL TEXT */}
      <div className="flex gap-4 w-full max-w-sm">
        <motion.button
          onClick={() => setCount(0)}
          className="flex-1 py-6 bg-gray-300 text-gray-600 rounded-2xl hover:bg-gray-400 transition-colors text-3xl font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={count === 0}
          className={`
            flex-1 py-6 rounded-2xl transition-colors text-3xl font-bold
            ${count === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : count === targetCount
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
          whileHover={count === 0 ? {} : { scale: 1.05 }}
          whileTap={count === 0 ? {} : { scale: 0.95 }}
        >
          {count === 0 ? '😴' : count === targetCount ? '✅' : '→'}
        </motion.button>
      </div>

      {/* Confetti celebration */}
      {showConfetti && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-8xl"
            animate={{ scale: [1, 1.5, 1], rotate: [0, 20, -20, 0] }}
            transition={{ duration: 0.6 }}
          >
            🎉
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
