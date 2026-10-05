'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';

/**
 * MINIGAME: Block Stacking Quest
 * BNCC Skills: EF01MA03 (Comparação), EF01MA06 (Composição/Decomposição)
 * TEA-FRIENDLY: Drag-drop blocks, visual feedback, large touch targets
 */

interface BlockItem {
  id: string;
  color?: string;
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'xxxxlarge';
}

const BLOCK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
const SIZE_MAP = { 
  xsmall: 20, 
  small: 35, 
  medium: 50, 
  large: 70, 
  xlarge: 90,
  xxlarge: 110,
  xxxlarge: 130,
  xxxxlarge: 150
};

interface BlockStackingMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

// Pure helper so block generation is deterministic and usable both as the
// lazy initial React state (SSR/first-paint safe, no empty-state flash) and
// whenever the activity/difficulty changes after mount.
function buildBlocks(
  activity: Activity | undefined,
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard',
): BlockItem[] {
  const activityBlocks = activity?.content?.items as BlockItem[] | undefined;

  if (activityBlocks && Array.isArray(activityBlocks)) {
    return activityBlocks.map((block, idx) => ({
      id: block.id || `block-${idx}`,
      color: block.color || BLOCK_COLORS[idx % BLOCK_COLORS.length],
      size: block.size || 'medium',
    }));
  }

  const blockCount = { very_easy: 2, easy: 3, medium: 4, hard: 5 }[difficulty];
  return Array.from({ length: blockCount }, (_, idx) => ({
    id: `block-${idx}`,
    color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
    size: idx % 2 === 0 ? 'large' : 'medium',
  }));
}

export const BlockStackingMinigame: React.FC<BlockStackingMinigameProps> = ({
  skill,
  difficulty,
  onComplete,
  activity,
  isTEAMode = false,
}) => {
  const [blocks, setBlocks] = useState<BlockItem[]>(() => buildBlocks(activity, difficulty));
  const [stackedBlockIds, setStackedBlockIds] = useState<string[]>([]);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [rejectedBlockId, setRejectedBlockId] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const rejectTimeoutRef = useRef<NodeJS.Timeout>();

  const requiredOrder = activity?.content?.validation?.kind === 'sequence'
    ? (activity?.content?.correctAnswer as string[] | undefined)
    : undefined;

  // Re-derive blocks whenever the activity/difficulty changes after mount
  // (the lazy initial state above only covers the very first render).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setBlocks(buildBlocks(activity, difficulty));
    setStackedBlockIds([]);
    setIsComplete(false);
  }, [difficulty, activity]);

  useEffect(() => {
    if (stackedBlockIds.length > 0 && stackedBlockIds.length === blocks.length) {
      setIsComplete(true);
      timeoutRef.current = setTimeout(() => {
        onComplete(100, true);
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stackedBlockIds.length, blocks.length, onComplete]);

  const handleBlockDragStart = (blockId: string) => {
    if (!stackedBlockIds.includes(blockId)) {
      setDraggedBlockId(blockId);
    }
  };

  const handleStackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleStackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlockId || stackedBlockIds.includes(draggedBlockId)) return;

    // If this exercise requires a specific order (e.g. biggest-to-smallest),
    // only accept the block that is next in that order; otherwise reject
    // with visual feedback so the child tries another block.
    if (requiredOrder) {
      const nextRequiredId = requiredOrder[stackedBlockIds.length];
      if (draggedBlockId !== nextRequiredId) {
        setRejectedBlockId(draggedBlockId);
        setDraggedBlockId(null);
        if (rejectTimeoutRef.current) clearTimeout(rejectTimeoutRef.current);
        rejectTimeoutRef.current = setTimeout(() => setRejectedBlockId(null), 600);
        return;
      }
    }

    setStackedBlockIds([...stackedBlockIds, draggedBlockId]);
    setDraggedBlockId(null);
  };

  const availableBlocks = blocks.filter(b => !stackedBlockIds.includes(b.id));

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-blue-50 to-green-50 rounded-xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <ArasaacPictogram conceptId="library.cube" showLabel={false} imageClassName="h-10 w-10" />
          <h2 className="text-2xl font-bold text-blue-900">{activity?.title || 'Pilha de Blocos'}</h2>
        </div>
        <p className="text-gray-700">
          {activity?.content?.instructionsPt || activity?.content?.instructions || 'Arraste os blocos para a pilha!'}
        </p>
      </motion.div>

      {activity?.content?.example && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 mx-auto max-w-xl text-center"
        >
          <p className="text-xs font-extrabold text-blue-600 uppercase mb-1">Exemplo</p>
          <p className="text-gray-700 text-sm">{activity.content.example}</p>
        </motion.div>
      )}

      {activity?.content?.spokenHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mx-auto max-w-xl text-center"
        >
          <p className="text-sm font-bold text-amber-800">💡 {activity.content.spokenHint}</p>
        </motion.div>
      )}

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="text-sm text-gray-600 mb-2">
          Progresso: {stackedBlockIds.length} de {blocks.length} blocos
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(stackedBlockIds.length / blocks.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex gap-8 flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-4 text-blue-900">Blocos Disponíveis</h3>
          <div className="flex flex-wrap items-end gap-4">
            <AnimatePresence>
              {availableBlocks.map(block => {
                const blockWidth = SIZE_MAP[block.size || 'medium'];
                const blockHeight = blockWidth * 0.6;
                return (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={rejectedBlockId === block.id ? { x: [0, -8, 8, -8, 0] } : { opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    draggable
                    onDragStart={() => handleBlockDragStart(block.id)}
                    className={`cursor-move flex flex-col items-center justify-end bg-white rounded-lg p-3 border-2 ${
                      rejectedBlockId === block.id ? 'border-red-400' : 'border-gray-200'
                    }`}
                    style={{ width: Math.max(110, blockWidth + 24), height: 140 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileDrag={{ scale: 0.95, opacity: 0.7 }}
                      className="rounded-md shadow"
                      style={{
                        backgroundColor: block.color || '#FFD700',
                        width: blockWidth,
                        height: blockHeight,
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h3 className="font-bold text-lg mb-4 text-green-900">Sua Pilha</h3>
          <motion.div
            ref={stackRef}
            onDragOver={handleStackDragOver}
            onDrop={handleStackDrop}
            className={`w-full max-w-xs min-h-64 border-4 border-dashed rounded-xl p-4 flex flex-col justify-end items-center gap-1 transition ${
              draggedBlockId ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'
            }`}
          >
            <AnimatePresence>
              {stackedBlockIds.map((blockId) => {
                const block = blocks.find(b => b.id === blockId);
                if (!block) return null;

                return (
                  <motion.div
                    key={`stacked-${blockId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full flex justify-center"
                  >
                    <div
                      className="rounded-md shadow-lg"
                      style={{
                        backgroundColor: block.color,
                        width: SIZE_MAP[block.size || 'medium'],
                        height: SIZE_MAP[block.size || 'medium'] * 0.6,
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {stackedBlockIds.length === 0 && (
              <p className="text-gray-400 text-center">Arraste blocos aqui</p>
            )}
          </motion.div>

          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-center"
              >
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-xl font-bold text-green-600">Parabéns!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
