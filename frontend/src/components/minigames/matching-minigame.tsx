'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { ArasaacPictogram } from '@/components/arasaac/arasaac-pictogram';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';

/**
 * MINIGAME: Matching Quest
 * BNCC Skills: EF01MA03 (Comparação)
 * Exercise: "Ligue o número ao seu valor!"
 *
 * TEA-FRIENDLY: Crianças com TEA são muito concretas — elas precisam VER a
 * ação de "ligar" acontecer, não apenas uma cor acendendo. Este componente
 * desenha uma linha/seta real (SVG, sem dependência externa) conectando os
 * dois itens, e oferece arrastar o dedo de um bloco até o outro (além do
 * toque sequencial, que continua funcionando para quem usa mouse/teclado).
 *
 * CONFIRM-THEN-REVEAL (therapist-requested): while the child is connecting
 * pairs, every connection uses the same neutral "connected" colour — never
 * green or red — so nothing hints at correctness before the child is done.
 * Only after pressing "Confirmar" does each connection turn green (correct)
 * or red (wrong), together with concrete spoken feedback naming how many
 * connections look wrong. Wrong pairs can then be redone individually
 * without losing the ones that were already right.
 */

interface MatchingMinigameProps {
  skill: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  onComplete: (score: number, isCorrect: boolean) => void;
  activity?: Activity;
  isTEAMode?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const MatchingMinigame: React.FC<MatchingMinigameProps> = ({
  onComplete,
  activity,
}) => {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  // `submitted` becomes true only after the child presses "Confirmar" — that
  // is the single moment correctness is revealed (green/red). Before that,
  // connected pairs all share one neutral colour regardless of correctness.
  const [submitted, setSubmitted] = useState(false);
  const [wrongLefts, setWrongLefts] = useState<Set<string>>(new Set());
  const [dragFromId, setDragFromId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [hoveredRightId, setHoveredRightId] = useState<string | null>(null);
  const [, bumpTick] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const spokenRef = useRef(false);
  const speech = useTitiaSpeech({ activityId: activity?.id ?? 'matching-minigame' });
  useEffect(() => {
    if (speech.settings.voiceEnabled && !spokenRef.current) {
      spokenRef.current = true;
      speech.speakInstruction({
        steps: [
          activity?.content?.instructionsPt || activity?.content?.instructions || 'Arraste de um bloco até o outro para ligar os pares certos!',
          'Quando ligar todos, toque em Confirmar.',
        ],
      });
    }
  }, [speech.settings.voiceEnabled, speech, activity]);

  // Default matching: numbers to dots (fallback only used when an activity
  // fails to load; real exercises come entirely from activity.content.items)
  const pairs = (activity?.content?.items ||
    [
      { id: 'pair1', left: '2', right: 'dois cachorros', rightCount: 2, rightConceptId: 'library.dog' },
      { id: 'pair2', left: '4', right: 'quatro bolas', rightCount: 4, rightConceptId: 'library.ball' },
      { id: 'pair3', left: '3', right: 'três gatos', rightCount: 3, rightConceptId: 'library.cat' },
    ]) as Array<{
      id: string; left: string; right: string;
      rightCount?: number; rightConceptId?: string;
      leftCount?: number; leftConceptId?: string;
    }>;

  const correctMatches = pairs.reduce(
    (acc, pair: any) => {
      acc[pair.left] = pair.right;
      return acc;
    },
    {} as Record<string, string>
  );

  // Recompute line positions whenever the window resizes/rotates (tablets).
  useEffect(() => {
    const onResize = () => bumpTick((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getCenter = useCallback((el: HTMLElement | null): Point | null => {
    const container = containerRef.current;
    if (!el || !container) return null;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      x: elRect.left + elRect.width / 2 - containerRect.left,
      y: elRect.top + elRect.height / 2 - containerRect.top,
    };
  }, []);

  // Connecting a pair never judges correctness by itself — it just records
  // the connection with the neutral colour. Correctness is only revealed on
  // "Confirmar" (see handleConfirm below).
  const finalizeMatch = useCallback((leftValue: string, rightValue: string) => {
    setMatches((prev) => ({ ...prev, [leftValue]: rightValue }));
    setSelectedLeft(null);
  }, []);

  const handleConfirm = () => {
    const wrong = new Set(
      Object.entries(matches)
        .filter(([left, right]) => correctMatches[left] !== right)
        .map(([left]) => left)
    );
    setWrongLefts(wrong);
    setSubmitted(true);

    if (wrong.size === 0) {
      setIsComplete(true);
      timeoutRef.current = setTimeout(() => onComplete(100, true), 1500);
      return;
    }

    // Still report the wrong attempt to the backend (keeps the 5-attempt
    // reveal counter accurate), but do NOT lock the UI — the child needs a
    // concrete way to fix just the wrong connections.
    onComplete(50, false);
    if (speech.settings.voiceEnabled) {
      const count = wrong.size;
      speech.speakFeedback(
        count === 1
          ? 'Olha só, uma peça está em um lugar incorreto. Vamos corrigir?'
          : `Olha só, ${count} peças estão em lugares incorretos. Vamos corrigir?`
      );
    }
  };

  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Keep the connections that were already correct; only clear the wrong
    // ones so the child redoes exactly what needs fixing.
    setMatches((prev) => {
      const next = { ...prev };
      wrongLefts.forEach((left) => delete next[left]);
      return next;
    });
    setSubmitted(false);
    setWrongLefts(new Set());
  };

  // ── Tap-to-select (mouse/keyboard-friendly, unchanged behaviour) ──
  const handleLeftClick = (leftValue: string) => {
    if (isComplete) return;
    setSelectedLeft(selectedLeft === leftValue ? null : leftValue);
  };

  const handleRightClick = (rightValue: string) => {
    if (isComplete) return;
    if (selectedLeft) finalizeMatch(selectedLeft, rightValue);
  };

  // ── Drag-to-connect (touch-friendly: puxar o dedo de um bloco a outro) ──
  const DRAG_THRESHOLD = 8;

  const handlePointerDown = (leftValue: string, isMatched: boolean) => (event: React.PointerEvent) => {
    if (isMatched || isComplete) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragging = true;
        setDragFromId(leftValue);
      }
      if (dragging) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          setDragPoint({ x: moveEvent.clientX - rect.left, y: moveEvent.clientY - rect.top });
        }
        const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null;
        const rightEl = target?.closest<HTMLElement>('[data-right-id]');
        setHoveredRightId(rightEl?.dataset.rightId ?? null);
      }
    };

    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      if (dragging) {
        const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY) as HTMLElement | null;
        const rightEl = target?.closest<HTMLElement>('[data-right-id]');
        const rightValue = rightEl?.dataset.rightId;
        const alreadyMatched = rightValue ? Object.values(matches).includes(rightValue) : false;
        if (rightValue && !alreadyMatched) finalizeMatch(leftValue, rightValue);
      } else {
        handleLeftClick(leftValue);
      }
      setDragFromId(null);
      setDragPoint(null);
      setHoveredRightId(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  // ── Line coordinates for the SVG overlay ──
  const connectionLines = Object.entries(matches).map(([leftValue, rightValue]) => {
    const from = getCenter(leftRefs.current[leftValue]);
    const to = getCenter(rightRefs.current[rightValue]);
    return { leftValue, rightValue, from, to };
  });

  const dragPreviewFrom = dragFromId ? getCenter(leftRefs.current[dragFromId]) : null;
  const allPlaced = Object.keys(matches).length === pairs.length;

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-sky-50 to-cyan-50 rounded-xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-sky-900 mb-2">{activity?.title || 'Ligue o Número ao seu Valor!'}</h2>
        <p className="flex items-center justify-center gap-2 text-lg text-gray-700">
          <ArasaacPictogram conceptId="activity.drag" showLabel={false} imageClassName="h-7 w-7" />
          {activity?.content?.instructionsPt || 'Arraste o dedo de um número até sua representação para ligá-los. Depois toque em Confirmar.'}
        </p>
      </motion.div>

      <div ref={containerRef} className="relative bg-white rounded-lg p-8 md:p-12 shadow-lg flex-1">
        {/* SVG overlay draws the actual connecting line/arrow the child needs
            to see — this is the core TEA-friendly fix: the "ligar" action
            must be visible as a real trace, not just a colour change. Every
            line is the same neutral blue until "Confirmar" is pressed. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <marker id="matching-arrow-neutral" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#0284c7" />
            </marker>
            <marker id="matching-arrow-correct" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#059669" />
            </marker>
            <marker id="matching-arrow-wrong" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#dc2626" />
            </marker>
          </defs>
          {connectionLines.map(({ leftValue, rightValue, from, to }) => {
            if (!from || !to) return null;
            const isWrong = submitted && wrongLefts.has(leftValue);
            const isRight = submitted && !wrongLefts.has(leftValue);
            const stroke = isWrong ? '#dc2626' : isRight ? '#059669' : '#0284c7';
            const marker = isWrong ? 'matching-arrow-wrong' : isRight ? 'matching-arrow-correct' : 'matching-arrow-neutral';
            return (
              <motion.line
                key={`${leftValue}-${rightValue}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={stroke} strokeWidth={5} strokeLinecap="round"
                markerEnd={`url(#${marker})`}
              />
            );
          })}
          {dragPreviewFrom && dragPoint && (
            <line
              x1={dragPreviewFrom.x} y1={dragPreviewFrom.y} x2={dragPoint.x} y2={dragPoint.y}
              stroke="#0ea5e9" strokeWidth={5} strokeLinecap="round" strokeDasharray="10 8"
            />
          )}
        </svg>

        <div className="grid grid-cols-2 gap-10 md:gap-20 lg:gap-28">
          {/* Left column - Numbers */}
          <div className="space-y-6 md:space-y-10">
            <h3 className="font-bold text-lg text-sky-900 mb-6">Números</h3>
            {pairs.map((pair: any) => {
              const isSelected = selectedLeft === pair.left;
              const hasMatch = pair.left in matches;
              const isDraggingThis = dragFromId === pair.left;
              const isWrongPair = submitted && wrongLefts.has(pair.left);
              const isCorrectPair = submitted && hasMatch && !wrongLefts.has(pair.left);

              return (
                <motion.button
                  key={`left-${pair.left}`}
                  ref={(el) => { leftRefs.current[pair.left] = el; }}
                  onPointerDown={handlePointerDown(pair.left, hasMatch)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Número ${pair.left}${
                    isWrongPair ? ', ligação errada'
                      : isCorrectPair ? ', ligação certa'
                        : hasMatch ? ', já ligado'
                          : ', arraste até a representação certa'
                  }`}
                  className={`relative z-20 w-full touch-none select-none p-6 rounded-lg font-bold text-2xl transition ${
                    isSelected || isDraggingThis
                      ? 'bg-sky-600 text-white ring-4 ring-sky-300'
                      : isWrongPair
                        ? 'bg-red-200 text-red-900 ring-4 ring-red-500'
                        : isCorrectPair
                          ? 'bg-emerald-400 text-white ring-4 ring-emerald-600'
                          : hasMatch
                            ? 'bg-indigo-200 text-sky-900 ring-2 ring-indigo-400'
                            : 'bg-sky-100 text-sky-900 border-2 border-sky-300 hover:border-sky-500'
                  }`}
                >
                  {/* Supports plain text (e.g. "2") as well as pictogram-based
                      items (e.g. a row of dog/cat/ball icons), same as the
                      right column — lets authors use concrete ARASAAC icons
                      on either side instead of only raw numbers/text. */}
                  {pair.leftConceptId && pair.leftCount ? (
                    <span className="flex flex-wrap items-center justify-center gap-1" aria-label={pair.left}>
                      {Array.from({ length: pair.leftCount }, (_, i) => (
                        <ArasaacPictogram key={i} conceptId={pair.leftConceptId!} showLabel={false} imageClassName="h-8 w-8" />
                      ))}
                    </span>
                  ) : (
                    pair.left
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right column - Representations */}
          <div className="space-y-6 md:space-y-10">
            <h3 className="font-bold text-lg text-sky-900 mb-6">Representações</h3>
            {pairs.map((pair: any) => {
              const matchedLeft = Object.entries(matches).find(([, right]) => right === pair.right)?.[0];
              const isMatched = Boolean(matchedLeft);
              const isCorrectMatch =
                selectedLeft && correctMatches[selectedLeft] === pair.right;
              const isHoveredDropTarget = hoveredRightId === pair.right && !isMatched;
              const isWrongPair = submitted && matchedLeft ? wrongLefts.has(matchedLeft) : false;
              const isCorrectPair = submitted && matchedLeft ? !wrongLefts.has(matchedLeft) : false;

              return (
                <motion.button
                  key={`right-${pair.right}`}
                  ref={(el) => { rightRefs.current[pair.right] = el; }}
                  data-right-id={pair.right}
                  onClick={() => handleRightClick(pair.right)}
                  disabled={!selectedLeft || isMatched || isComplete}
                  whileHover={!isMatched && selectedLeft ? { scale: 1.05 } : {}}
                  whileTap={!isMatched && selectedLeft ? { scale: 0.95 } : {}}
                  className={`relative z-20 w-full touch-none p-6 rounded-lg font-bold text-lg transition ${
                    isWrongPair
                      ? 'bg-red-200 text-red-900 ring-4 ring-red-500'
                      : isCorrectPair
                        ? 'bg-emerald-400 text-white ring-4 ring-emerald-600'
                        : isMatched
                          ? 'bg-indigo-200 text-sky-900 ring-2 ring-indigo-400'
                          : isHoveredDropTarget
                            ? 'bg-sky-300 text-sky-900 ring-4 ring-sky-400 scale-105'
                            : selectedLeft && isCorrectMatch
                              ? 'bg-cyan-300 text-sky-900 border-4 border-cyan-500'
                              : selectedLeft
                                ? 'bg-cyan-100 text-sky-900 border-2 border-cyan-400 hover:border-cyan-500'
                                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                  }`}
                >
                  {/* Render the actual pictogram quantity (e.g. 3 circles)
                      instead of leaking raw text like "três círculos" — the
                      visual count is what the child needs to match to the
                      number, not a text label. */}
                  {pair.rightConceptId && pair.rightCount ? (
                    <span className="flex flex-wrap items-center justify-center gap-1" aria-label={pair.right}>
                      {Array.from({ length: pair.rightCount }, (_, i) => (
                        <ArasaacPictogram key={i} conceptId={pair.rightConceptId!} showLabel={false} imageClassName="h-8 w-8" />
                      ))}
                    </span>
                  ) : (
                    pair.right
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Conectados: {Object.keys(matches).length} / {pairs.length}
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(Object.keys(matches).length / pairs.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* CONFIRM BUTTON (TEA-FRIENDLY): the child needs an explicit,
            concrete action to trigger the "check my answer" step — nothing
            is judged automatically while connecting. */}
        {!submitted && (
          <div className="mt-6 flex justify-center">
            <motion.button
              type="button"
              onClick={handleConfirm}
              disabled={!allPlaced}
              whileHover={allPlaced ? { scale: 1.05 } : {}}
              whileTap={allPlaced ? { scale: 0.95 } : {}}
              className="px-10 py-3 bg-sky-600 text-white rounded-lg font-bold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-sky-600">Perfeito! Todas as conexões certas!</p>
          </motion.div>
        )}
        {submitted && !isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center bg-red-100 text-red-900 rounded-xl p-6"
          >
            <div className="text-4xl mb-2">❌</div>
            <p className="text-xl font-bold mb-4">
              {wrongLefts.size === 1
                ? 'Uma ligação está errada (veja o par vermelho).'
                : `${wrongLefts.size} ligações estão erradas (veja os pares vermelhos).`}
            </p>
            <motion.button
              type="button"
              onClick={handleTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-sky-600 text-white rounded-lg font-bold text-lg shadow-lg"
            >
              Tentar Novamente
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
