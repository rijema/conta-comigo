'use client';

/**
 * MINIGAME: Jogo da Memória (Memory Card Matching)
 *
 * TEA-FRIENDLY:
 * - Sem leitura necessária — puramente visual
 * - Regras simples: encontrar pares iguais
 * - Padrão consistente — os mesmos emojis sempre combinam
 * - Sem timer — sem pressão de tempo
 * - Feedback visual imediato em cada par encontrado
 * - Dificuldade progressiva (mais pares = mais difícil)
 *
 * [PROPOSTA CONTA COMIGO] Jogo de memória visual puro
 * [DECISÃO DE ENGENHARIA] Sem timer, sem pontos explícitos — apenas concluir/não concluir.
 * A celebração é delegada ao learn/page via onComplete para garantir TitiA feedback.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

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

const EMOJI_SETS: Record<MemoryMinigameProps['difficulty'], string[]> = {
  very_easy: ['🍎', '🍊'],           // 2 pares
  easy: ['🍎', '🍊', '🍌'],          // 3 pares
  medium: ['🍎', '🍊', '🍌', '🍇'],  // 4 pares
  hard: ['🍎', '🍊', '🍌', '🍇', '🍓'], // 5 pares
};

export const MemoryMinigame: React.FC<MemoryMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const completedRef = useRef(false);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: `memory-minigame-${skill}` });

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: ['Encontre os pares iguais.'] });
    }
  }, [speech.settings.voiceEnabled, speech]);

  useEffect(() => {
    const emojis = EMOJI_SETS[difficulty] ?? EMOJI_SETS.easy;
    const pairs = emojis.flatMap((emoji) => [
      { emoji, id: `${emoji}-1` },
      { emoji, id: `${emoji}-2` },
    ]);
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((item) => ({
      id: item.id,
      emoji: item.emoji,
      isFlipped: false,
      isMatched: false,
    })));
  }, [difficulty]);

  // Check for pair matches whenever flipped changes
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [first, second] = flipped;
    const firstCard = cards.find((c) => c.id === first);
    const secondCard = cards.find((c) => c.id === second);

    if (firstCard?.emoji === secondCard?.emoji) {
      setMatched((prev) => [...prev, first, second]);
      setFlipped([]);
    } else {
      const timer = setTimeout(() => setFlipped([]), 900);
      return () => clearTimeout(timer);
    }
    setMoves((m) => m + 1);
  }, [flipped, cards]);

  // Game complete — delegate feedback to parent (no internal celebration)
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete(100, true);
  }, [onComplete]);

  useEffect(() => {
    if (matched.length > 0 && cards.length > 0 && matched.length === cards.length) {
      const timer = setTimeout(handleComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [matched, cards.length, handleComplete]);

  const handleCardClick = (cardId: string) => {
    if (flipped.includes(cardId) || matched.includes(cardId) || flipped.length >= 2) return;
    setFlipped((prev) => [...prev, cardId]);
  };

  const completionPercent = cards.length > 0 ? (matched.length / cards.length) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-blue-700">🎮 Jogo da Memória</h2>
        <p className="text-sm text-blue-500">Encontre os pares iguais!</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-3 overflow-hidden rounded-full bg-blue-200">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-blue-600">
          {matched.length / 2}/{cards.length / 2} pares encontrados
        </p>
      </div>

      {/* Game board */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(72px, 1fr))`,
          maxWidth: '360px',
          width: '100%',
        }}
      >
        {cards.map((card) => {
          const isVisible = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.id)}
              disabled={isVisible}
              aria-label={isVisible ? card.emoji : 'Carta virada — toque para revelar'}
              className={`aspect-square rounded-2xl text-4xl font-bold flex items-center justify-center transition-colors
                ${matched.includes(card.id)
                  ? 'bg-green-200 opacity-60'
                  : flipped.includes(card.id)
                    ? 'bg-yellow-200 border-4 border-yellow-400'
                    : 'bg-blue-400 hover:bg-blue-500 cursor-pointer'
                }`}
              whileHover={!isVisible ? { scale: 1.07 } : {}}
              whileTap={{ scale: 0.93 }}
            >
              {isVisible ? card.emoji : '?'}
            </motion.button>
          );
        })}
      </div>

      {/* Move count */}
      <p className="text-sm font-semibold text-blue-600">
        {moves} {moves === 1 ? 'tentativa' : 'tentativas'}
      </p>
    </div>
  );
};

export default MemoryMinigame;
