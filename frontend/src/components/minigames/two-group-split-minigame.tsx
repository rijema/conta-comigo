'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

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

  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity?.id ?? 'two-group-split-minigame' });
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [activity?.content?.instructionsPt || activity?.content?.instructions || 'Arraste os blocos para os dois grupos!'],
      });
    }
  }, [speech.settings.voiceEnabled, speech, activity]);

  const [groupAIds, setGroupAIds] = useState<string[]>([]);
  const [groupBIds, setGroupBIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  // CONFIRM BUTTON (TEA-FRIENDLY): children with autism need an explicit,
  // concrete action to trigger the "check my answer" step — they should
  // never be left guessing whether something happened. Previously this
  // component auto-submitted silently when the split was correct and did
  // absolutely nothing (no button, no message) when a *restricted* split
  // (content.correctAnswers) was wrong, leaving the child stuck with no
  // feedback at all. Now the child always gets an explicit "Confirmar"
  // button once every block is placed, and always gets visible feedback
  // (success or "tente outra combinação") after pressing it.
  const [wasWrong, setWasWrong] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const wrongTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setGroupAIds([]);
    setGroupBIds([]);
    setIsComplete(false);
    setWasWrong(false);
  }, [activity]);

  const availableItems = items.filter((item) => !groupAIds.includes(item.id) && !groupBIds.includes(item.id));
  const allPlaced = availableItems.length === 0 && items.length > 0;

  const handleConfirm = () => {
    if (!allPlaced || isComplete) return;

    const isValidSplit = !correctAnswers || correctAnswers.some((combo) => {
      const comboSet = new Set(combo);
      return comboSet.size === groupAIds.length && groupAIds.every((id) => comboSet.has(id));
    });

    if (isValidSplit) {
      setWasWrong(false);
      setIsComplete(true);
      timeoutRef.current = setTimeout(() => onComplete(100, true), 1500);
    } else {
      // Give clear, concrete feedback and let the child try a different
      // split — do NOT advance to the next activity on a wrong answer.
      setWasWrong(true);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = setTimeout(() => setWasWrong(false), 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
    };
  }, []);

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
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-blue-50 to-green-50 rounded-xl">
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

      <div>
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

      <motion.button
        type="button"
        onClick={handleConfirm}
        disabled={!allPlaced || isComplete}
        whileHover={allPlaced && !isComplete ? { scale: 1.03 } : {}}
        whileTap={allPlaced && !isComplete ? { scale: 0.97 } : {}}
        className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        Confirmar
      </motion.button>

      <AnimatePresence>
        {isComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-xl font-bold text-green-600">Parabéns!</p>
          </motion.div>
        )}
        {wasWrong && !isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -8, 0] }}
            exit={{ opacity: 0 }}
            className="text-center bg-red-100 text-red-900 rounded-xl p-4"
          >
            <div className="text-3xl mb-1">❌</div>
            <p className="text-lg font-bold">Quase lá! Tente outra combinação.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
