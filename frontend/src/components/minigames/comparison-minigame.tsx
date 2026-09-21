'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

/**
 * MINIGAME: Comparison Quest
 *
 * TEA-FRIENDLY FEATURES:
 * ✅ Low sensory load - Simple colors, no flashing
 * ✅ Clear visual feedback - Celebração só quando certo
 * ✅ Extra time - 60 segundos para responder (default 30)
 * ✅ Consistent patterns - Mesma estrutura sempre
 * ✅ Audio + Visual - Reforço multimodal
 */

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

export const ComparisonMinigame: React.FC<ComparisonMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  isTEAMode = true,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(isTEAMode ? 60 : 30);
  const [showCelebration, setShowCelebration] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: `comparison-minigame-${skill}` });

  // Speak instruction on mount
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: ["Qual grupo tem mais itens?"],
      });
    }
  }, [speech.settings.voiceEnabled, speech]);

  // Generate random comparison challenge
  useEffect(() => {
    const generateChallenge = () => {
      const counts = [2, 3, 4, 5, 6];
      const emojis = ['🍎', '🍊', '🌟', '🍰', '🎈'];

      let correctCount = counts[Math.floor(Math.random() * counts.length)];
      let wrongCount = counts.filter((c) => c !== correctCount)[
        Math.floor(Math.random() * (counts.length - 1))
      ];

      // Ensure they're actually different
      while (wrongCount === correctCount) {
        wrongCount = counts[Math.floor(Math.random() * counts.length)];
      }

      const isCorrectFirst = Math.random() > 0.5;
      const first: Item = {
        id: 'first',
        count: isCorrectFirst ? correctCount : wrongCount,
        emoji: emojis[0],
        label: 'Grupo 1',
      };

      const second: Item = {
        id: 'second',
        count: isCorrectFirst ? wrongCount : correctCount,
        emoji: emojis[1],
        label: 'Grupo 2',
      };

      setItems([first, second]);

      // Play audio hint in TEA mode
      if (isTEAMode && !audioPlayed) {
        playAudioHint();
        setAudioPlayed(true);
      }
    };

    generateChallenge();
  }, [audioPlayed, isTEAMode]);

  const playAudioHint = () => {
    // Simulating audio - in real implementation would use Web Audio API
    console.log('🔊 Audio hint played');
  };

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || showCelebration) return;

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showCelebration]);

  const handleSelect = (itemId: string) => {
    if (selected || isCorrect !== null) return;

    const correct =
      itemId === 'first'
        ? items[0].count > items[1].count
        : items[0].count < items[1].count;

    setSelected(itemId);
    setIsCorrect(correct);

    if (correct) {
      setShowCelebration(true);
      setTimeout(() => {
        onComplete(100, true);
      }, 2000);
    } else {
      setTimeout(() => {
        onComplete(0, false);
      }, 1500);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>🔍 Qual tem MAIS?</h2>
        <div style={{ fontSize: '24px', marginTop: '10px' }}>
          ⏱️ {timeLeft}s {isTEAMode && <span style={{ marginLeft: '10px', backgroundColor: '#e8f5e9', padding: '5px 10px', borderRadius: '5px' }}>🎯 TEA Mode</span>}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '30px',
          justifyContent: 'center',
          marginBottom: '30px',
        }}
      >
        {items.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            disabled={selected !== null}
            whileHover={selected === null ? { scale: 1.05 } : {}}
            whileTap={selected === null ? { scale: 0.95 } : {}}
            style={{
              padding: '20px',
              borderRadius: '10px',
              border: selected === item.id ? '4px solid #4CAF50' : '2px solid #ddd',
              backgroundColor:
                selected === item.id && isCorrect ? '#c8e6c9' : '#fff',
              cursor: selected !== null ? 'not-allowed' : 'pointer',
              minWidth: '120px',
              opacity: selected && selected !== item.id ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>
              {item.label}
            </div>
            <div
              style={{
                fontSize: '40px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              {Array.from({ length: item.count }).map((_, i) => (
                <span key={i}>{item.emoji}</span>
              ))}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {item.count}
            </div>
          </motion.button>
        ))}
      </div>

      {isCorrect !== null && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: isCorrect ? '#c8e6c9' : '#ffebee',
            color: isCorrect ? '#2e7d32' : '#c62828',
            fontSize: '18px',
            marginTop: '20px',
          }}
        >
          {isCorrect ? (
            <>
              <div style={{ fontSize: '40px' }}>🎉</div>
              <p>Parabéns! Você acertou!</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '40px' }}>😊</div>
              <p>Tenta de novo! Você consegue!</p>
            </>
          )}
        </motion.div>
      )}

      {showCelebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '50%',
                fontSize: '30px',
              }}
              animate={{
                y: [0, -100],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
              }}
            >
              ⭐
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonMinigame;
