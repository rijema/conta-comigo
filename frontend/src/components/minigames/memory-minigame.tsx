'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * MINIGAME: Memory Card Matching
 *
 * TEA-FRIENDLY:
 * ✅ No reading required - pure visual
 * ✅ Simple rules - find matching pairs
 * ✅ Consistent patterns - same emojis always match
 * ✅ No timer pressure
 * ✅ Satisfying feedback on each match
 * ✅ Progressive difficulty (more pairs = harder)
 *
 * [PROPOSTA CONTA COMIGO] Jogo de memória visual puro
 * [DECISÃO DE ENGENHARIA] Sem timer, sem pontos - apenas conseguir/não conseguir
 */

interface Card {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
}

const EMOJI_SETS = {
  very_easy: ['🍎', '🍊'], // 2 pairs
  easy: ['🍎', '🍊', '🍌'], // 3 pairs
  medium: ['🍎', '🍊', '🍌', '🍇'], // 4 pairs
  hard: ['🍎', '🍊', '🍌', '🍇', '🍓'], // 5 pairs
};

export const MemoryMinigame: React.FC<MemoryMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  isTEAMode = true,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [moves, setMoves] = useState(0);

  // Initialize cards on mount
  useEffect(() => {
    const emojis = EMOJI_SETS[difficulty] || EMOJI_SETS.easy;
    const pairs = emojis.flatMap((emoji) => [
      { emoji, id: `${emoji}-1` },
      { emoji, id: `${emoji}-2` },
    ]);

    // Shuffle cards
    const shuffled = pairs.sort(() => Math.random() - 0.5);

    setCards(
      shuffled.map((item) => ({
        id: item.id,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false,
      }))
    );
  }, [difficulty]);

  // Check for matches
  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        // Match found!
        setMatched([...matched, first, second]);
        setMatchesCount(matchesCount + 1);

        // Play match sound
        if (typeof window !== 'undefined') {
          const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
          audio.play().catch(() => {});
        }

        setFlipped([]);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }

      setMoves(moves + 1);
    }
  }, [flipped, cards, matched, matchesCount, moves]);

  // Check if game is complete
  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length && cards.length > 0) {
      setShowCelebration(true);
      setTimeout(() => {
        onComplete(100, true);
      }, 1500);
    }
  }, [matched, cards.length, onComplete]);

  const handleCardClick = (cardId: string) => {
    if (flipped.includes(cardId) || matched.includes(cardId) || flipped.length >= 2) {
      return;
    }

    setFlipped([...flipped, cardId]);
  };

  const completionPercent = cards.length > 0 ? (matched.length / cards.length) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">🎮 Memory Match!</h1>
        <p className="text-lg text-blue-500">Find the matching pairs!</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center mt-2 text-sm text-blue-600">
          {matched.length}/{cards.length} pairs found
        </p>
      </div>

      {/* Game board - responsive grid */}
      <div className="grid gap-3 mb-8" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))`,
        maxWidth: '400px',
      }}>
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`
              aspect-square rounded-lg font-bold text-4xl
              flex items-center justify-center cursor-pointer
              transition-all duration-200
              ${
                matched.includes(card.id)
                  ? 'bg-green-300 opacity-50'
                  : flipped.includes(card.id)
                    ? 'bg-yellow-300'
                    : 'bg-blue-400 hover:bg-blue-500'
              }
            `}
            whileHover={{ scale: flipped.includes(card.id) || matched.includes(card.id) ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={flipped.includes(card.id) || matched.includes(card.id)}
          >
            {flipped.includes(card.id) || matched.includes(card.id) ? card.emoji : '?'}
          </motion.button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-center text-blue-600 mb-8">
        <p className="text-lg font-semibold">Moves: {moves}</p>
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

      {/* Reset button (for testing) */}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg text-sm"
      >
        Try Again
      </button>
    </div>
  );
};
