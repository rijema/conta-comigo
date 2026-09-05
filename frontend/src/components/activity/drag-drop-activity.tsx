"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { arrangement: string[]; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

interface DragItem {
  id: string;
  label: string;
  emoji?: string;
}

function DraggableItem({ item, disabled, selected, inSlot = false, onSelect }: {
  item: DragItem;
  disabled: boolean;
  selected: boolean;
  inSlot?: boolean;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect(item.id);
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${item.label}. Arraste ou toque para selecionar.`}
      className={`touch-none select-none rounded-2xl border-4 font-bold shadow-sm
        cursor-grab active:cursor-grabbing active:scale-95
        transition-[border-color,background-color,box-shadow,opacity] duration-150
        ${inSlot ? "min-w-16 px-3 py-2 text-xl" : "px-5 py-3 text-2xl"}
        ${selected
          ? "border-blue-600 bg-blue-100 text-blue-900 ring-4 ring-blue-200 shadow-lg"
          : inSlot
            ? "border-transparent bg-transparent text-blue-800"
            : "border-yellow-300 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50"
        }
        ${isDragging ? "opacity-20" : "opacity-100"}`}
    >
      {item.emoji && <span className="mr-1">{item.emoji}</span>}
      {item.label}
    </button>
  );
}

function DropSlot({ index, item, selectedId, disabled, onSelectItem, onTapSlot }: {
  index: number;
  item: DragItem | null;
  selectedId: string | null;
  disabled: boolean;
  onSelectItem: (id: string) => void;
  onTapSlot: (index: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot-${index}`, disabled });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => onTapSlot(index)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTapSlot(index);
        }
      }}
      aria-label={`Posição ${index + 1}${item ? `: ${item.label}` : ": vazia"}`}
      className={`min-w-24 min-h-24 px-3 py-3 border-4 border-dashed rounded-2xl
        flex flex-col items-center justify-center text-2xl font-bold transition-all duration-150
        ${isOver
          ? "border-blue-600 bg-blue-100 scale-110 shadow-xl"
          : item
            ? "border-blue-400 bg-blue-50"
            : selectedId
              ? "border-blue-400 bg-blue-50 animate-pulse"
              : "border-gray-300 bg-gray-50 text-gray-300"
        }`}
    >
      {item ? (
        <DraggableItem
          item={item}
          disabled={disabled}
          selected={selectedId === item.id}
          inSlot
          onSelect={onSelectItem}
        />
      ) : <span>{index + 1}</span>}
    </div>
  );
}

function AvailableTray({ children, empty }: { children: React.ReactNode; empty: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: "available-tray" });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-wrap gap-3 mb-6 p-4 rounded-2xl border-2 min-h-24 justify-center
        transition-all duration-150
        ${isOver
          ? "border-yellow-500 bg-yellow-100 scale-[1.02] shadow-lg"
          : "border-yellow-200 bg-yellow-50"
        }`}
    >
      {empty ? (
        <span className="text-gray-400 text-sm self-center">
          Arraste uma peça para cá para removê-la
        </span>
      ) : children}
    </div>
  );
}

export function DragDropActivity({ activity, onAnswer }: Props) {
  const items = (activity.content?.items || []) as unknown as DragItem[];
  const slotCount = activity.content?.slotCount || items.length;
  const [slots, setSlots] = useState<(string | null)[]>(new Array(slotCount).fill(null));
  const [available, setAvailable] = useState<string[]>(items.map((item) => item.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const getItem = (id: string | null) =>
    id ? items.find((item) => item.id === id) ?? null : null;

  const moveItemToSlot = (itemId: string, slotIndex: number) => {
    setSlots((currentSlots) => {
      const nextSlots = [...currentSlots];
      const sourceSlot = nextSlots.indexOf(itemId);
      const destinationItem = nextSlots[slotIndex];

      if (sourceSlot !== -1) {
        nextSlots[sourceSlot] = destinationItem;
        nextSlots[slotIndex] = itemId;
        return nextSlots;
      }

      nextSlots[slotIndex] = itemId;
      setAvailable((currentAvailable) => {
        const nextAvailable = currentAvailable.filter((id) => id !== itemId);
        if (destinationItem && !nextAvailable.includes(destinationItem)) {
          nextAvailable.push(destinationItem);
        }
        return nextAvailable;
      });
      return nextSlots;
    });
  };

  const moveItemToTray = (itemId: string) => {
    setSlots((currentSlots) =>
      currentSlots.map((slotItem) => slotItem === itemId ? null : slotItem),
    );
    setAvailable((currentAvailable) =>
      currentAvailable.includes(itemId) ? currentAvailable : [...currentAvailable, itemId],
    );
  };

  const resetForRetry = () => {
    setSlots(new Array(slotCount).fill(null));
    setAvailable(items.map((item) => item.id));
    setSelected(null);
    setActiveId(null);
    setSubmitted(false);
    setFeedback(null);
    setCountdown(null);
  };

  const handleSelectItem = (id: string) => {
    if (!submitted) setSelected((previous) => previous === id ? null : id);
  };

  const handleTapSlot = (slotIndex: number) => {
    if (submitted) return;
    const currentItem = slots[slotIndex];
    if (selected) {
      moveItemToSlot(selected, slotIndex);
      setSelected(null);
    } else if (currentItem) {
      moveItemToTray(currentItem);
    }
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (submitted) return;
    setSelected(null);
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || submitted) return;
    const itemId = String(active.id);
    const target = String(over.id);
    if (target === "available-tray") {
      moveItemToTray(itemId);
    } else if (target.startsWith("slot-")) {
      moveItemToSlot(itemId, Number(target.slice("slot-".length)));
    }
  };

  const handleSubmit = () => {
    if (submitted || slots.some((slot) => slot === null)) return;
    setSubmitted(true);
    const correctOrder = (activity.content?.correctOrder || []) as string[];
    const isCorrect = slots.length === correctOrder.length &&
      slots.every((slot, index) => slot === correctOrder[index]);
    setFeedback(isCorrect ? "correct" : "wrong");
    setCountdown(3);

    let seconds = 3;
    countdownRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        onAnswer({ arrangement: slots as string[], isCorrect });
        if (!isCorrect) resetForRetry();
      } else {
        setCountdown(seconds);
      }
    }, 1000);
  };

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const allFilled = slots.every((slot) => slot !== null);
  const activeItem = getItem(activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div>
        <p className="text-xl font-semibold text-gray-800 mb-4">
          {activity.content?.question || "Organize os itens na ordem correta"}
        </p>
        <p className="text-sm font-semibold text-blue-700 mb-3 text-center">
          Arraste cada item para sua posição
          <span className="block text-xs text-gray-500 mt-1">
            Você também pode tocar no item e depois na posição.
          </span>
        </p>

        <AvailableTray empty={available.length === 0}>
          {available.map((id) => {
            const item = getItem(id);
            return item ? (
              <DraggableItem
                key={id}
                item={item}
                disabled={submitted}
                selected={selected === id}
                onSelect={handleSelectItem}
              />
            ) : null;
          })}
        </AvailableTray>

        <div className="flex gap-4 mb-6 justify-center flex-wrap">
          {slots.map((slotId, index) => (
            <DropSlot
              key={index}
              index={index}
              item={getItem(slotId)}
              selectedId={selected}
              disabled={submitted}
              onSelectItem={handleSelectItem}
              onTapSlot={handleTapSlot}
            />
          ))}
        </div>

        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allFilled}
            className="w-full py-3 bg-blue-600 text-white text-lg font-bold rounded-xl
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            Confirmar ✓
          </button>
        )}

        {feedback && (
          <div role="status" aria-live="polite"
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className={`flex flex-col items-center gap-3 px-10 py-8 rounded-3xl
              shadow-2xl text-center pointer-events-auto
              ${feedback === "correct" ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}>
              <span className="text-6xl">{feedback === "correct" ? "🎉" : "💙"}</span>
              <p className="text-2xl font-extrabold">
                {feedback === "correct" ? "Muito bem!" : "Quase lá!"}
              </p>
              {countdown !== null && (
                <>
                  <p className="text-base font-medium opacity-90">
                    {feedback === "correct" ? "Próxima atividade em..." : "Tentando novamente em..."}
                  </p>
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <svg className="absolute" width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="5"
                        strokeLinecap="round" strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - countdown / 3)}
                        transform="rotate(-90 32 32)"
                        style={{ transition: "stroke-dashoffset 0.9s linear" }} />
                    </svg>
                    <span className="text-2xl font-extrabold">{countdown}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeItem ? (
          <div className="px-5 py-3 rounded-2xl border-4 border-blue-500 bg-white
            text-gray-800 text-2xl font-bold shadow-2xl scale-110 cursor-grabbing">
            {activeItem.emoji && <span className="mr-1">{activeItem.emoji}</span>}
            {activeItem.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
