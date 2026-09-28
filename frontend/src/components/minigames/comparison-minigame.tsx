'use client';

/**
 * MINIGAME: Comparação de Quantidades
 *
 * TEA-FRIENDLY:
 * - Carga sensorial baixa — cores simples, sem piscadas
 * - Feedback visual claro — celebração apenas quando correto
 * - Tempo estendido — 60 segundos para responder
 * - Padrão consistente — mesma estrutura sempre
 * - Reforço multimodal — áudio + visual
 *
 * [DECISÃO DE ENGENHARIA] Celebração delegada ao learn/page via onComplete
 * para garantir TitiA feedback consistente.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

interface Item {
  id: string;
  count: number;
  emoji: string;
  label: string;
}

interface ComparisonMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
}

const COUNTS_BY_DIFFICULTY: Record<ComparisonMinigameProps['difficulty'], number[]> = {
  very_easy: [2, 3, 4],
  easy: [2, 3, 4, 5],
  medium: [3, 4, 5, 6, 7],
  hard: [4, 5, 6, 7, 8, 9],
};

const EMOJIS = ['🍎', '🍊', '🌟', '🍰', '🎈', '🐠', '🐶', '🦋'];
const TIME_LIMIT = 60;

export const ComparisonMinigame: React.FC<ComparisonMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const completedRef = useRef(false);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: `comparison-minigame-${skill}` });

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: ['Qual grupo tem mais itens?'] });
    }
  }, [speech.settings.voiceEnabled, speech]);

  // Generate random comparison challenge
  useEffect(() => {
    const counts = COUNTS_BY_DIFFICULTY[difficulty] ?? COUNTS_BY_DIFFICULTY.easy;
    const shuffled = [...counts].sort(() => Math.random() - 0.5);
    let [correctCount, wrongCount] = shuffled;
    while (wrongCount === correctCount) wrongCount = counts[Math.floor(Math.random() * counts.length)];

    const emoji1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const emoji2 = EMOJIS.filter((e) => e !== emoji1)[Math.floor(Math.random() * (EMOJIS.length - 1))];
    const isCorrectFirst = Math.random() > 0.5;

    setItems([
      { id: 'first',  count: isCorrectFirst ? correctCount : wrongCount, emoji: emoji1, label: 'Grupo 1' },
      { id: 'second', count: isCorrectFirst ? wrongCount : correctCount, emoji: emoji2, label: 'Grupo 2' },
    ]);
  }, [difficulty]);

  const handleFinish = useCallback((correct: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    // Delegate TitiA feedback to parent — no internal celebration
    setTimeout(() => onComplete(correct ? 100 : 0, correct), 800);
  }, [onComplete]);

  // Timer — when it runs out, count as incorrect
  useEffect(() => {
    if (selected !== null || isCorrect !== null) return;
    if (timeLeft <= 0) {
      setIsCorrect(false);
      handleFinish(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, selected, isCorrect, handleFinish]);

  const handleSelect = (itemId: string) => {
    if (selected !== null || isCorrect !== null || items.length < 2) return;
    const correct =
      itemId === 'first'
        ? items[0].count > items[1].count
        : items[1].count > items[0].count;
    setSelected(itemId);
    setIsCorrect(correct);
    handleFinish(correct);
  };

  const urgentTime = timeLeft <= 10;

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Header + timer */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-blue-700">🔍 Qual tem MAIS?</h2>
        <p
          className={`mt-1 text-lg font-bold ${urgentTime ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}
        >
          ⏱️ {timeLeft}s
        </p>
      </div>

      {/* Groups */}
      <div className="flex gap-6 justify-center flex-wrap">
        {items.map((item) => {
          const isSelected = selected === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              disabled={selected !== null}
              aria-label={`${item.label}: ${item.count} itens`}
              whileHover={selected === null ? { scale: 1.05 } : {}}
              whileTap={selected === null ? { scale: 0.95 } : {}}
              className={`flex flex-col items-center rounded-2xl border-4 p-4 transition-all min-w-28
                ${isSelected && isCorrect ? 'border-green-500 bg-green-100'
                  : isSelected && !isCorrect ? 'border-red-400 bg-red-50'
                  : selected !== null ? 'opacity-50 border-gray-200 bg-white'
                  : 'border-blue-200 bg-white hover:border-blue-400 cursor-pointer'
                }`}
            >
              <span className="mb-2 text-sm font-bold text-gray-500">{item.label}</span>
              <div className="flex flex-wrap justify-center gap-1 mb-2" style={{ maxWidth: 120 }}>
                {Array.from({ length: item.count }).map((_, i) => (
                  <span key={i} className="text-3xl">{item.emoji}</span>
                ))}
              </div>
              <span className="text-3xl font-extrabold text-blue-700">{item.count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Inline feedback (TitiA green/red flash handled by parent) */}
      {isCorrect !== null && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-2xl px-6 py-3 text-center font-bold ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {isCorrect ? '✅ Correto!' : '❌ Tente outra vez!'}
        </motion.div>
      )}
    </div>
  );
};

export default ComparisonMinigame;
