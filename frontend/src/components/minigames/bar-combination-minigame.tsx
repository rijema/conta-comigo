'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';

/**
 * MINIGAME: Bar Combination (Composition)
 * BNCC Skill: EF01MA07 (Composição de números)
 * Each bar represents a quantity rendered as a row of unit squares (so the
 * child can literally count it - no numeric/text labels needed). The child
 * drags bars into the answer area until their combined quantity equals the
 * target number. Any combination of distinct bars that sums to the target
 * is accepted (multiple solutions supported).
 */

interface BarItemData {
  id: string;
  color?: string;
  value: number;
}

const UNIT_SIZE = 22;
const UNIT_GAP = 3;

interface BarCombinationMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

function Bar({ bar, onAction, draggable }: { bar: BarItemData; onAction: () => void; draggable: boolean }) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e: React.DragEvent) => e.dataTransfer?.setData('text/plain', bar.id)}
      onClick={onAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAction(); } }}
      data-bar-id={bar.id}
      className="cursor-pointer rounded-lg bg-white border-2 border-gray-200 p-2 flex items-center gap-[3px] transition-transform hover:scale-105"
    >
      {Array.from({ length: bar.value }, (_, unitIdx) => (
        <span
          key={unitIdx}
          data-unit="true"
          className="rounded-sm"
          style={{ width: UNIT_SIZE, height: UNIT_SIZE, backgroundColor: bar.color || '#45B7D1', marginRight: unitIdx < bar.value - 1 ? UNIT_GAP : 0 }}
        />
      ))}
    </div>
  );
}

export const BarCombinationMinigame: React.FC<BarCombinationMinigameProps> = ({ onComplete, activity }) => {
  const bars = useMemo<BarItemData[]>(() => {
    const raw = activity?.content?.bars as BarItemData[] | undefined;
    if (raw && Array.isArray(raw) && raw.length > 0) {
      return raw.map((bar, idx) => ({ id: bar.id || `bar-${idx}`, color: bar.color, value: bar.value ?? idx + 1 }));
    }
    return Array.from({ length: 8 }, (_, idx) => ({ id: `bar-${idx}`, color: '#45B7D1', value: idx + 1 }));
  }, [activity]);

  const targetValue = (activity?.content?.targetValue as number | undefined) ?? 8;

  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setPlacedIds([]);
    setIsComplete(false);
  }, [activity]);

  const availableBars = bars.filter((bar) => !placedIds.includes(bar.id));
  const placedBars = placedIds.map((id) => bars.find((bar) => bar.id === id)).filter(Boolean) as BarItemData[];
  const currentSum = placedBars.reduce((sum, bar) => sum + bar.value, 0);

  useEffect(() => {
    if (currentSum === targetValue && placedIds.length > 0) {
      setIsComplete(true);
      timeoutRef.current = setTimeout(() => onComplete(100, true), 1500);
    } else {
      setIsComplete(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSum, targetValue, placedIds.length, onComplete]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && !placedIds.includes(id)) setPlacedIds((prev) => [...prev, id]);
  };

  const sumState = currentSum > targetValue ? 'over' : currentSum === targetValue ? 'exact' : 'under';

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ArasaacPictogram conceptId="mathematics.addition" showLabel={false} imageClassName="h-10 w-10" />
          <h2 className="text-2xl font-bold text-purple-900">{activity?.title || 'Combine os Blocos'}</h2>
        </div>
        <p className="text-gray-700">
          {activity?.content?.instructionsPt || activity?.content?.instructions || 'Combine barras para formar o número alvo!'}
        </p>
      </motion.div>

      {activity?.content?.example && (
        <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4 mx-auto max-w-xl text-center">
          <p className="text-xs font-extrabold text-purple-600 uppercase mb-1">Exemplo</p>
          <p className="text-gray-700 text-sm">{activity.content.example}</p>
        </div>
      )}

      {activity?.content?.spokenHint && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mx-auto max-w-xl text-center">
          <p className="text-sm font-bold text-amber-800">💡 {activity.content.spokenHint}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-white p-3 shadow">
          {Array.from({ length: targetValue }, (_, idx) => (
            <span key={idx} className="rounded-sm bg-gray-200" style={{ width: UNIT_SIZE, height: UNIT_SIZE, marginRight: idx < targetValue - 1 ? UNIT_GAP : 0 }} />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-lg mb-3 text-purple-900">Barras Disponíveis</h3>
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {availableBars.map((bar) => (
              <Bar key={bar.id} bar={bar} draggable onAction={() => setPlacedIds((prev) => [...prev, bar.id])} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 text-pink-900">Sua Combinação</h3>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          aria-label="Área de combinação"
          className={`min-h-28 rounded-2xl border-4 border-dashed p-4 flex flex-wrap items-center gap-3 transition ${
            sumState === 'over' ? 'bg-amber-50 border-amber-300' : sumState === 'exact' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-300'
          }`}
        >
          <AnimatePresence>
            {placedBars.map((bar) => (
              <Bar key={bar.id} bar={bar} draggable={false} onAction={() => setPlacedIds((prev) => prev.filter((id) => id !== bar.id))} />
            ))}
          </AnimatePresence>
          {placedBars.length === 0 && <p className="text-gray-400 w-full text-center">Arraste barras aqui</p>}
        </div>
        {sumState === 'over' && (
          <p className="text-amber-700 text-sm font-bold mt-2 text-center">Passou um pouco! Toque numa barra para tirá-la.</p>
        )}
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
