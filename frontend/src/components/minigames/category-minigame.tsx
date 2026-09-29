'use client';

/**
 * MINIGAME: Agrupamento por Categoria
 *
 * TEA-FRIENDLY:
 * - Pictogramas ARASAAC — visual e acessível
 * - Regras claras — arraste o item para a caixa correta
 * - Código de cores — cada categoria tem sua cor
 * - Feedback imediato por item (não por exercício inteiro)
 * - Sem pressão de tempo
 *
 * [PROPOSTA CONTA COMIGO] Agrupamento visual por categoria
 * [DECISÃO DE ENGENHARIA] Celebração delegada ao learn/page via onComplete
 * para garantir TitiA feedback consistente.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

interface CategoryItem {
  id: string;
  pictogramId: string;
  category: 'fruits' | 'animals' | 'vehicles';
}

interface CategoryBox {
  id: 'fruits' | 'animals' | 'vehicles';
  label: string;
  pictogramId: string;
  bgColor: string;
  placedIds: string[];
}

interface CategoryMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  isTEAMode?: boolean;
}

const ITEM_SETS: Record<CategoryMinigameProps['difficulty'], CategoryItem[]> = {
  very_easy: [
    { id: '1', pictogramId: 'arasaac.15195', category: 'fruits' },
    { id: '2', pictogramId: 'arasaac.14560', category: 'fruits' },
    { id: '3', pictogramId: 'arasaac.15532', category: 'animals' },
    { id: '4', pictogramId: 'arasaac.2507',  category: 'animals' },
  ],
  easy: [
    { id: '1', pictogramId: 'arasaac.15195', category: 'fruits' },
    { id: '2', pictogramId: 'arasaac.14560', category: 'fruits' },
    { id: '3', pictogramId: 'arasaac.15358', category: 'fruits' },
    { id: '4', pictogramId: 'arasaac.15532', category: 'animals' },
    { id: '5', pictogramId: 'arasaac.2507',  category: 'animals' },
    { id: '6', pictogramId: 'arasaac.9810',  category: 'vehicles' },
  ],
  medium: [
    { id: '1',  pictogramId: 'arasaac.15195', category: 'fruits' },
    { id: '2',  pictogramId: 'arasaac.14560', category: 'fruits' },
    { id: '3',  pictogramId: 'arasaac.15358', category: 'fruits' },
    { id: '4',  pictogramId: 'arasaac.15143', category: 'fruits' },
    { id: '5',  pictogramId: 'arasaac.15532', category: 'animals' },
    { id: '6',  pictogramId: 'arasaac.2507',  category: 'animals' },
    { id: '7',  pictogramId: 'arasaac.5221',  category: 'animals' },
    { id: '8',  pictogramId: 'arasaac.9810',  category: 'vehicles' },
    { id: '9',  pictogramId: 'arasaac.36405', category: 'vehicles' },
  ],
  hard: [
    { id: '1',  pictogramId: 'arasaac.15195', category: 'fruits' },
    { id: '2',  pictogramId: 'arasaac.14560', category: 'fruits' },
    { id: '3',  pictogramId: 'arasaac.15358', category: 'fruits' },
    { id: '4',  pictogramId: 'arasaac.15143', category: 'fruits' },
    { id: '5',  pictogramId: 'arasaac.15132', category: 'fruits' },
    { id: '6',  pictogramId: 'arasaac.15532', category: 'animals' },
    { id: '7',  pictogramId: 'arasaac.2507',  category: 'animals' },
    { id: '8',  pictogramId: 'arasaac.5221',  category: 'animals' },
    { id: '9',  pictogramId: 'arasaac.4917',  category: 'animals' },
    { id: '10', pictogramId: 'arasaac.9810',  category: 'vehicles' },
    { id: '11', pictogramId: 'arasaac.36405', category: 'vehicles' },
    { id: '12', pictogramId: 'arasaac.29151', category: 'vehicles' },
  ],
};

const INITIAL_BOXES: CategoryBox[] = [
  { id: 'fruits',   label: 'Frutas',  pictogramId: 'arasaac.15195', bgColor: 'bg-red-100   border-red-300',    placedIds: [] },
  { id: 'animals',  label: 'Animais', pictogramId: 'arasaac.15532', bgColor: 'bg-blue-100  border-blue-300',   placedIds: [] },
  { id: 'vehicles', label: 'Coisas',  pictogramId: 'arasaac.9810',  bgColor: 'bg-yellow-100 border-yellow-300', placedIds: [] },
];

export const CategoryMinigame: React.FC<CategoryMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
}) => {
  const totalItems = ITEM_SETS[difficulty].length;
  const [pending, setPending] = useState<CategoryItem[]>([]);
  const [boxes, setBoxes] = useState<CategoryBox[]>(INITIAL_BOXES.map((b) => ({ ...b, placedIds: [] })));
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null); // tap mode
  const completedRef = useRef(false);
  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: `category-minigame-${skill}` });

  useEffect(() => {
    const shuffled = [...ITEM_SETS[difficulty]].sort(() => Math.random() - 0.5);
    setPending(shuffled);
    setBoxes(INITIAL_BOXES.map((b) => ({ ...b, placedIds: [] })));
    completedRef.current = false;
  }, [difficulty]);

  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({ steps: ['Arraste ou toque em cada item e coloque na caixa correta.'] });
    }
  }, [speech.settings.voiceEnabled, speech]);

  const placedCount = boxes.reduce((sum, b) => sum + b.placedIds.length, 0);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    // Delegate TitiA green flash to parent
    setTimeout(() => onComplete(100, true), 600);
  }, [onComplete]);

  useEffect(() => {
    if (totalItems > 0 && placedCount === totalItems) {
      handleComplete();
    }
  }, [placedCount, totalItems, handleComplete]);

  const tryPlace = (itemId: string, boxId: CategoryBox['id']) => {
    const allItems = ITEM_SETS[difficulty];
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    if (item.category === boxId) {
      // Correct — move to box
      setPending((prev) => prev.filter((i) => i.id !== itemId));
      setBoxes((prev) =>
        prev.map((b) => b.id === boxId ? { ...b, placedIds: [...b.placedIds, itemId] } : b),
      );
      setSelectedId(null);
      setWrongIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    } else {
      // Wrong — flash red briefly
      setWrongIds((prev) => new Set(prev).add(itemId));
      setTimeout(() => setWrongIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; }), 700);
      setSelectedId(null);
    }
  };

  // Drag handlers
  const handleDragStart = (itemId: string) => setDraggedId(itemId);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (boxId: CategoryBox['id']) => {
    if (draggedId) tryPlace(draggedId, boxId);
    setDraggedId(null);
  };

  // Tap handlers (touch / click without drag)
  const handleItemTap = (itemId: string) => {
    setSelectedId((prev) => prev === itemId ? null : itemId);
  };
  const handleBoxTap = (boxId: CategoryBox['id']) => {
    if (selectedId) tryPlace(selectedId, boxId);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-purple-700">🎯 Agrupar por Categoria!</h2>
        <p className="text-sm text-purple-500">Arraste cada item para a caixa correta</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="h-3 overflow-hidden rounded-full bg-purple-200">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(placedCount / totalItems) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-purple-600">
          {placedCount}/{totalItems} organizados corretamente
        </p>
      </div>

      {/* Category boxes */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
        {boxes.map((box) => (
          <div
            key={box.id}
            id={`box-${box.id}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(box.id)}
            onClick={() => handleBoxTap(box.id)}
            role="button"
            tabIndex={0}
            aria-label={`Caixa ${box.label}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBoxTap(box.id); }}
            className={`flex flex-col items-center gap-2 rounded-2xl border-4 border-dashed p-3 min-h-36 cursor-pointer transition-all
              ${box.bgColor}
              ${selectedId ? 'ring-4 ring-purple-400 scale-[1.03]' : ''}`}
          >
            <ArasaacPictogram conceptId={box.pictogramId} showLabel={false} imageClassName="h-10 w-10" />
            <span className="text-xs font-bold text-gray-700">{box.label}</span>
            <div className="flex flex-wrap justify-center gap-1">
              {box.placedIds.map((itemId) => {
                const item = ITEM_SETS[difficulty].find((i) => i.id === itemId);
                return item ? (
                  <ArasaacPictogram key={itemId} conceptId={item.pictogramId} showLabel={false} imageClassName="h-8 w-8" />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pending items */}
      <div className="flex flex-wrap justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 w-full max-w-xl min-h-20">
        {pending.length === 0 ? (
          <span className="text-sm text-gray-400 self-center">Todos os itens foram organizados!</span>
        ) : pending.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onClick={() => handleItemTap(item.id)}
            aria-pressed={selectedId === item.id}
            aria-label={`Item para categorizar`}
            whileHover={{ scale: 1.1 }}
            whileDrag={{ scale: 1.2, opacity: 0.7 }}
            className={`rounded-xl border-4 p-3 transition-all cursor-grab active:cursor-grabbing
              ${wrongIds.has(item.id) ? 'border-red-500 bg-red-100 animate-bounce' :
                selectedId === item.id ? 'border-blue-500 bg-blue-100 ring-4 ring-blue-300' :
                'border-gray-300 bg-gray-100 hover:border-purple-400 hover:bg-purple-50'}`}
          >
            <ArasaacPictogram conceptId={item.pictogramId} showLabel={false} imageClassName="h-12 w-12" />
          </motion.button>
        ))}
      </div>

      {/* Tap mode hint */}
      {selectedId && (
        <p className="text-sm font-bold text-blue-700 animate-pulse">
          Agora toque na caixa correta!
        </p>
      )}
    </div>
  );
};

export default CategoryMinigame;
