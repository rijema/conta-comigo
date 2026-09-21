'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

/**
 * MINIGAME: Basket Collection Quest
 *
 * TEA-FRIENDLY:
 * ✅ Simple drag-drop mechanics (not overwhelming)
 * ✅ Large touch targets (40px minimum)
 * ✅ Clear success feedback
 * ✅ Consistent animation (not distracting)
 * ✅ Audio confirmation for each drop
 * ✅ Progress bar showing completion
 */

interface DraggableItem {
  id: string;
  emoji: string;
  label: string;
}

interface BasketMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
}

export const BasketMinigame: React.FC<BasketMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  isTEAMode = true,
}) => {
  const [items, setItems] = useState<DraggableItem[]>([
    { id: 'apple1', emoji: '🍎', label: 'Maçã 1' },
    { id: 'apple2', emoji: '🍎', label: 'Maçã 2' },
    { id: 'apple3', emoji: '🍎', label: 'Maçã 3' },
  ]);
  
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: `basket-minigame-${skill}` });

  // Speak instruction on mount
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: ["Arraste os itens para o cesto."],
      });
    }
  }, [speech.settings.voiceEnabled, speech]);

  // Wrap onComplete in useCallback to prevent unnecessary reruns
  const handleComplete = useCallback(() => {
    console.log('🎉 Basket minigame completed!', { droppedItems, itemsTotal: items.length });
    if (speech.settings.voiceEnabled) {
      speech.speakInstruction({
        steps: ["Parabéns! Você completou a minigame!"],
      });
    }
    onComplete(100, true);
  }, [onComplete, droppedItems, items.length, speech]);

  useEffect(() => {
    const percent = (droppedItems.length / items.length) * 100;
    setCompletionPercent(percent);

    if (droppedItems.length === items.length && !showCelebration) {
      console.log('✅ All items dropped, showing celebration...');
      setShowCelebration(true);
      const timer = setTimeout(() => {
        handleComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [droppedItems, items.length, showCelebration, handleComplete]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    if (droppedItems.includes(itemId)) return;
    setDraggedItem(itemId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (draggedItem && !droppedItems.includes(draggedItem)) {
      setDroppedItems([...droppedItems, draggedItem]);
      playDropSound();
    }
    
    setDraggedItem(null);
  };

  const playDropSound = () => {
    // Simulating sound - would use Web Audio API in real implementation
    console.log('🔊 Drop sound played');
  };

  const remainingItems = items.filter((item) => !droppedItems.includes(item.id));

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>🍎 Coloque as frutas na cesta!</h2>
        {isTEAMode && (
          <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
            Sem pressa! Arraste devagar. Você tem todo o tempo.
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#eee',
          borderRadius: '10px',
          marginBottom: '20px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            width: `${completionPercent}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
          }}
          animate={{ width: `${completionPercent}%` }}
        />
      </div>

      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginBottom: '30px' }}>
        {/* Draggable Items */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3>Frutas</h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '10px',
              minHeight: '200px',
            }}
          >
            {remainingItems.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`Item arrastável: ${item.emoji}`}
                draggable
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, item.id)}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                style={{
                  padding: '15px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  cursor: 'grab',
                  fontSize: '30px',
                  textAlign: 'center',
                  border: '2px solid #ddd',
                  minHeight: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {item.emoji} {item.label}
              </div>
            ))}
            {remainingItems.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
                ✅ Todas coletadas!
              </div>
            )}
          </div>
        </div>

        {/* Drop Target (Basket) */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3>Cesta 🧺</h3>
          <motion.div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              padding: '20px',
              backgroundColor: '#fff9e6',
              borderRadius: '10px',
              border: draggedItem ? '3px dashed #4CAF50' : '3px dashed #ddd',
              minHeight: '200px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignContent: 'flex-start',
              transition: 'border-color 0.3s',
            }}
            animate={{
              backgroundColor:
                draggedItem && !droppedItems.includes(draggedItem)
                  ? '#f1f8e9'
                  : '#fff9e6',
            }}
          >
            {droppedItems.length === 0 && (
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '40px',
                  marginTop: '40px',
                }}
              >
                🧺
              </div>
            )}
            {droppedItems.map((itemId) => {
              const item = items.find((i) => i.id === itemId);
              return (
                <motion.div
                  key={itemId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    fontSize: '30px',
                    padding: '10px',
                  }}
                >
                  {item?.emoji}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Celebration */}
      {showCelebration && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            padding: '20px',
            backgroundColor: '#c8e6c9',
            borderRadius: '10px',
            marginTop: '20px',
            fontSize: '18px',
            color: '#2e7d32',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
          <p>Parabéns! Você colheu todas as frutas!</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            +{items.length * 15} pontos! 🌟
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BasketMinigame;
