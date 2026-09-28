'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';
import type { Activity } from '@/types';

/**
 * MINIGAME: Basket Collection Quest
 *
 * TEA-FRIENDLY:
 * ✅ Simple drag-drop mechanics (not overwhelming)
 * ✅ Large touch targets (40px minimum)
 * ✅ Uses real activity data (items and pictograms from content)
 * ✅ Falls back to generic items when no activity data available
 * ✅ Delegates celebration to learn/page (TitiA green flash)
 * ✅ Progress bar showing completion
 *
 * [DECISÃO DE ENGENHARIA] onComplete is called immediately after all items
 * are collected — the parent (learn/page) is responsible for showing the
 * TitiA celebration overlay, not this component.
 */

interface DraggableItem {
  id: string;
  pictogramConceptId?: string;
  label: string;
}

// Fallback items when activity has no items in content
const FALLBACK_ITEMS: Record<string, DraggableItem[]> = {
  very_easy: [
    { id: 'a1', pictogramConceptId: 'arasaac.15195', label: 'Maçã' },
    { id: 'a2', pictogramConceptId: 'arasaac.14560', label: 'Banana' },
  ],
  easy: [
    { id: 'a1', pictogramConceptId: 'arasaac.15195', label: 'Maçã' },
    { id: 'a2', pictogramConceptId: 'arasaac.14560', label: 'Banana' },
    { id: 'a3', pictogramConceptId: 'arasaac.15358', label: 'Uva' },
  ],
  medium: [
    { id: 'a1', pictogramConceptId: 'arasaac.15195', label: 'Maçã' },
    { id: 'a2', pictogramConceptId: 'arasaac.14560', label: 'Banana' },
    { id: 'a3', pictogramConceptId: 'arasaac.15358', label: 'Uva' },
    { id: 'a4', pictogramConceptId: 'arasaac.15532', label: 'Pêssego' },
  ],
  hard: [
    { id: 'a1', pictogramConceptId: 'arasaac.15195', label: 'Maçã' },
    { id: 'a2', pictogramConceptId: 'arasaac.14560', label: 'Banana' },
    { id: 'a3', pictogramConceptId: 'arasaac.15358', label: 'Uva' },
    { id: 'a4', pictogramConceptId: 'arasaac.15532', label: 'Pêssego' },
    { id: 'a5', pictogramConceptId: 'library.circle', label: 'Laranja' },
  ],
};

interface BasketMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
  activity?: Activity;
}

export const BasketMinigame: React.FC<BasketMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  isTEAMode = true,
  activity,
}) => {
  // Build items from activity content if available, otherwise use fallback
  const initialItems: DraggableItem[] = (() => {
    const contentItems = activity?.content?.items as Array<{ id: string; label: string; pictogramConceptId?: string }> | undefined;
    if (contentItems && contentItems.length > 0) {
      return contentItems.map((item) => ({
        id: item.id,
        pictogramConceptId: item.pictogramConceptId,
        label: item.label,
      }));
    }
    return FALLBACK_ITEMS[difficulty] ?? FALLBACK_ITEMS.easy;
  })();

  const question = activity?.content?.question ?? activity?.content?.instructionsPt ?? 'Coloque os itens na cesta!';

  const [items] = useState<DraggableItem[]>(initialItems);
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const completedRef = useRef(false);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity?.id ?? `basket-minigame-${skill}` });

  // Speak instruction on mount
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: [question] });
    }
  }, [speech.settings.voiceEnabled, speech, question]);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    // Delegate feedback to learn/page (TitiA green flash)
    onComplete(100, true);
  }, [onComplete]);

  useEffect(() => {
    const percent = items.length > 0 ? (droppedItems.length / items.length) * 100 : 0;
    setCompletionPercent(percent);
    if (droppedItems.length > 0 && droppedItems.length === items.length) {
      // Small delay so the last item animates into the basket before advancing
      const timer = setTimeout(handleComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [droppedItems, items.length, handleComplete]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    if (droppedItems.includes(itemId)) return;
    setDraggedItem(itemId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedItem && !droppedItems.includes(draggedItem)) {
      setDroppedItems((current) => [...current, draggedItem]);
    }
    setDraggedItem(null);
  };

  // Tap to collect (touch-friendly)
  const handleItemTap = (itemId: string) => {
    if (droppedItems.includes(itemId)) return;
    setDroppedItems((current) => [...current, itemId]);
  };

  const remainingItems = items.filter((item) => !droppedItems.includes(item.id));

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Instruction */}
      <p className="text-center text-lg font-bold text-slate-700">{question}</p>
      {isTEAMode && (
        <p className="text-center text-sm text-slate-500 italic">Sem pressa! Arraste devagar. Você tem todo o tempo.</p>
      )}

      {/* Progress bar */}
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-center text-xs font-semibold text-emerald-700">
        {droppedItems.length}/{items.length} na cesta
      </p>

      <div className="flex gap-4">
        {/* Remaining items to drag */}
        <div className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-center text-sm font-bold text-slate-500">Itens</p>
          <div className="flex flex-wrap justify-center gap-3 min-h-24">
            {remainingItems.map((item) => (
              <motion.div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e as React.DragEvent<HTMLDivElement>, item.id)}
                onClick={() => handleItemTap(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemTap(item.id); }}
                role="button"
                tabIndex={0}
                aria-label={`Adicionar ${item.label} à cesta`}
                className="flex cursor-grab flex-col items-center gap-1 rounded-xl border-2 border-yellow-300 bg-white p-2 select-none active:scale-95"
                whileHover={{ scale: 1.08 }}
                whileDrag={{ scale: 1.15, opacity: 0.7 }}
              >
                {item.pictogramConceptId
                  ? <ArasaacPictogram conceptId={item.pictogramConceptId} showLabel={false} imageClassName="h-12 w-12" />
                  : <span className="text-3xl">🍎</span>
                }
                <span className="text-xs font-bold text-slate-600">{item.label}</span>
              </motion.div>
            ))}
            {remainingItems.length === 0 && (
              <p className="text-sm font-bold text-emerald-600">✅ Todos coletados!</p>
            )}
          </div>
        </div>

        {/* Basket drop target */}
        <motion.div
          className={`flex-1 rounded-2xl border-4 border-dashed p-3 min-h-32 flex flex-col items-center justify-start gap-2 transition-colors ${
            draggedItem ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-yellow-50'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => {
            if (draggedItem) handleItemTap(draggedItem);
          }}
        >
          <p className="text-sm font-bold text-slate-600">🧺 Cesta</p>
          <div className="flex flex-wrap justify-center gap-2">
            {droppedItems.map((itemId) => {
              const item = items.find((i) => i.id === itemId);
              return (
                <motion.div
                  key={itemId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center"
                >
                  {item?.pictogramConceptId
                    ? <ArasaacPictogram conceptId={item.pictogramConceptId} showLabel={false} imageClassName="h-10 w-10" />
                    : <span className="text-2xl">🍎</span>
                  }
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BasketMinigame;
