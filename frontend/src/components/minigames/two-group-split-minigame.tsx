'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';

/**
 * MINIGAME: Two Group Split (Decomposition)
 * BNCC Skill: EF01MA07 (Decomposição de números)
 * Exercise shape: a set of IDENTICAL unit blocks that the child splits into
 * two groups (drag-and-drop). Any split that uses every block is a valid
 * decomposition (e.g. 7 = 3 + 4, 7 = 2 + 5, ...). If the activity data
 * restricts the valid splits (content.correctAnswers), only those specific
 * splits are accepted.
 * TEA-FRIENDLY: no text size-labels, large touch targets, live numeric
 * feedback showing the equation the child is building.
 */

interface UnitItem {
  id: string;
  color?: string;
}

const UNIT_SIZE = 46;

interface TwoGroupSplitMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

export const TwoGroupSplitMinigame: React.FC<TwoGroupSplitMinigameProps> = ({
  onComplete,
  activity,
}) => {
  const items = useMemo<UnitItem[]>(() => {
    const raw = activity?.content?.items as UnitItem[] | undefined;
    if (raw && Array.isArray(raw) && raw.length > 0) {
      return raw.map((item, idx) => ({ id: item.id || `unit-${idx}`, color: item.color || '#FFD700' }));
    }
    return Array.from({ length: 7 }, (_, idx) => ({ id: `unit-${idx}`, color: '#FFD700' }));
  }, [activity]);

  const correctAnswers = activity?.content?.correctAnswers as string[][] | undefined;

  const [groupAIds, setGroupAIds] = useState<string[]>([]);
  const [groupBIds, setGroupBIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setGroupAIds([]);
    setGroupBIds([]);
    setIsComplete(false);
  }, [activity]);

  const availableItems = items.filter((item) => !groupAIds.includes(item.id) && !groupBIds.includes(item.id));

  useEffect(() => {
    const allPlaced = availableItems.length === 0 && items.length > 0;
    if (!allPlaced) return;

    const isValidSplit = !correctAnswers || correctAnswers.some((combo) => {
      const comboSet = new Set(combo);
      return comboSet.size === groupAIds.length && groupAIds.every((id) => comboSet.has(id));
    });

    if (isValidSplit) {
      setIsComplete(true);
      timeoutRef.current = setTimeout(() => onComplete(100, true), 1500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableItems.length, groupAIds, items.length]);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropOnGroup = (group: 'A' | 'B') => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;
    setGroupAIds((prev) => prev.filter((id) => id !== draggedId));
    setGroupBIds((prev) => prev.filter((id) => id !== draggedId));
    if (group === 'A') setGroupAIds((prev) => [...prev, draggedId]);
    else setGroupBIds((prev) => [...prev, draggedId]);
    setDraggedId(null);
  };

  const handleReturnToAvailable = (id: string) => {
    setGroupAIds((prev) => prev.filter((i) => i !== id));
    setGroupBIds((prev) => prev.filter((i) => i !== id));
  };

  const renderUnit = (item: UnitItem, onClick?: () => void) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      draggable
      onDragStart={() => handleDragStart(item.id)}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      className="cursor-move rounded-md shadow"
      style={{ width: UNIT_SIZE, height: UNIT_SIZE, backgroundColor: item.color }}
    />
  );

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-blue-50 to-green-50 rounded-xl min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ArasaacPictogram conceptId="math.part" showLabel={false} imageClassName="h-10 w-10" />
          <h2 className="text-2xl font-bold text-blue-900">{activity?.title || 'Separe os Blocos'}</h2>
        </div>
        <p className="text-gray-700">
          {activity?.content?.instructionsPt || activity?.content?.instructions || 'Arraste os blocos para os dois grupos!'}
        </p>
      </motion.div>

      {activity?.content?.example && (
        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 mx-auto max-w-xl text-center">
          <p className="text-xs font-extrabold text-blue-600 uppercase mb-1">Exemplo</p>
          <p className="text-gray-700 text-sm">{activity.content.example}</p>
        </div>
      )}

      {activity?.content?.spokenHint && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mx-auto max-w-xl text-center">
          <p className="text-sm font-bold text-amber-800">💡 {activity.content.spokenHint}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow text-center">
        <p className="text-3xl font-extrabold text-blue-900">
          {groupAIds.length}<span className="mx-2 text-gray-400">+</span>{groupBIds.length}
          <span className="mx-2 text-gray-400">=</span>{items.length}
        </p>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-lg mb-3 text-blue-900">Blocos Disponíveis</h3>
        <div className="flex flex-wrap gap-3 min-h-[60px]">
          <AnimatePresence>{availableItems.map((item) => renderUnit(item))}</AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnGroup('A')}
          aria-label="Grupo 1"
          className="min-h-40 rounded-2xl border-4 border-dashed border-red-300 bg-red-50 p-4 flex flex-wrap content-start gap-3"
        >
          <AnimatePresence>
            {groupAIds.map((id) => {
              const item = items.find((i) => i.id === id);
              if (!item) return null;
              return renderUnit(item, () => handleReturnToAvailable(id));
            })}
          </AnimatePresence>
          {groupAIds.length === 0 && <p className="text-red-300 text-sm w-full text-center self-center">Grupo 1</p>}
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnGroup('B')}
          aria-label="Grupo 2"
          className="min-h-40 rounded-2xl border-4 border-dashed border-blue-300 bg-blue-50 p-4 flex flex-wrap content-start gap-3"
        >
          <AnimatePresence>
            {groupBIds.map((id) => {
              const item = items.find((i) => i.id === id);
              if (!item) return null;
              return renderUnit(item, () => handleReturnToAvailable(id));
            })}
          </AnimatePresence>
          {groupBIds.length === 0 && <p className="text-blue-300 text-sm w-full text-center self-center">Grupo 2</p>}
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-xl font-bold text-green-600">Parabéns!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
