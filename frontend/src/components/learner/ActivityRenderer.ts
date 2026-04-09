// FULL FILE (replacing the partial version)
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, HelpCircle, Volume2, Star } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useSession } from "@/contexts/SessionContext";
import { apiClient } from "@/lib/api-client";
import type { Activity, ActivityAttempt } from "@/types/activity";

interface ActivityRendererProps {
  activity: Activity;
  onComplete: (result: ActivityAttempt) => void;
  onSkip?: () => void;
}

function playSound(type: "correct" | "incorrect") {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "correct") {
      oscillator.frequency.setValueAtTime(523, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } else {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Silent fail in SSR / restricted environments
  }
}

function speakText(text: string) {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

// ─── Multiple Choice Activity ───────────────────────────────────────────────
interface MultipleChoiceProps {
  activity: Activity;
  onAnswer: (answer: string, isCorrect: boolean, responseTimeMs: number) => void;
  lowStimulation: boolean;
}

function MultipleChoiceActivity({ activity, onAnswer, lowStimulation }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const startRef = useRef(Date.now());
  const { t } = useTranslation();

  const content = activity.content as {
    question: string;
    options: Array<{ id: string; text: string; emoji?: string }>;
    correctOptionId: string;
    hint?: string;
  };

  function handleSelect(optionId: string) {
    if (revealed) return;
    const elapsed = Date.now() - startRef.current;
    setSelected(optionId);
    setRevealed(true);
    const isCorrect = optionId === content.correctOptionId;
    playSound(isCorrect ? "correct" : "incorrect");
    setTimeout(() => onAnswer(optionId, isCorrect, elapsed), 900);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <p
          className="text-xl font-semibold leading-relaxed flex-1"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)" }}
        >
          {content.question}
        </p>
        <button
          aria-label={t("activity.listen")}
          onClick={() => speakText(content.question)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Volume2 size={20} aria-hidden />
        </button>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: content.options.length <= 2 ? "1fr 1fr" : "1fr 1fr" }}
        role="group"
        aria-label={t("activity.chooseAnswer")}
      >
        {content.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === content.correctOptionId;
          let btnClass =
            "p-4 rounded-2xl border-2 text-left font-medium transition-all duration-200 focus-visible:ring-4 focus-visible:ring-blue-400 min-h-[64px] flex items-center gap-3 ";

          if (!revealed) {
            btnClass += lowStimulation
              ? "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
              : "border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50 hover:scale-[1.02]";
          } else if (isCorrect) {
            btnClass += "border-green-500 bg-green-50 text-green-800";
          } else if (isSelected && !isCorrect) {
            btnClass += "border-red-400 bg-red-50 text-red-700";
          } else {
            btnClass += "border-gray-200 bg-gray-50 opacity-60";
          }

          return (
            <motion.button
              key={opt.id}
              className={btnClass}
              onClick={() => handleSelect(opt.id)}
              disabled={revealed}
              whileHover={!revealed ? { scale: lowStimulation ? 1 : 1.02 } : {}}
              whileTap={!revealed ? { scale: 0.98 } : {}}
              aria-pressed={isSelected}
            >
              {opt.emoji && (
                <span className="text-2xl" aria-hidden>
                  {opt.emoji}
                </span>
              )}
              <span>{opt.text}</span>
              {revealed && isCorrect && (
                <CheckCircle size={20} className="ml-auto text-green-600" aria-hidden />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle size={20} className="ml-auto text-red-500" aria-hidden />
              )}
            </motion.button>
          );
        })}
      </div>

      {content.hint && !revealed && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <HelpCircle size={16} aria-hidden />
          <span>{content.hint}</span>
        </div>
      )}
    </div>
  );
}

// ─── Number Input Activity ───────────────────────────────────────────────────
interface NumberInputProps {
  activity: Activity;
  onAnswer: (answer: string, isCorrect: boolean, responseTimeMs: number) => void;
}

function NumberInputActivity({ activity, onAnswer }: NumberInputProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const startRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const content = activity.content as {
    question: string;
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
  };

  const tolerance = content.tolerance ?? 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted || value === "") return;
    const elapsed = Date.now() - startRef.current;
    const numVal = parseFloat(value);
    const correct =
      !isNaN(numVal) && Math.abs(numVal - content.correctAnswer) <= tolerance;
    setIsCorrect(correct);
    setSubmitted(true);
    playSound(correct ? "correct" : "incorrect");
    setTimeout(() => onAnswer(value, correct, elapsed), 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <p className="text-xl font-semibold leading-relaxed flex-1">{content.question}</p>
        <button
          type="button"
          aria-label={t("activity.listen")}
          onClick={() => speakText(content.question)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Volume2 size={20} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          placeholder="?"
          aria-label={t("activity.yourAnswer")}
          className={`w-36 text-center text-3xl font-bold py-4 px-3 rounded-2xl border-4 outline-none transition-colors
            ${submitted && isCorrect ? "border-green-500 bg-green-50 text-green-800" : ""}
            ${submitted && !isCorrect ? "border-red-400 bg-red-50 text-red-700" : ""}
            ${!submitted ? "border-gray-300 focus:border-blue-500 bg-white" : ""}
          `}
          style={{ fontSize: "2rem" }}
        />
        {content.unit && (
          <span className="text-2xl text-gray-600 font-medium">{content.unit}</span>
        )}
        {submitted && isCorrect && (
          <CheckCircle size={32} className="text-green-600" aria-label={t("activity.correct")} />
        )}
        {submitted && !isCorrect && (
          <div className="flex items-center gap-2">
            <XCircle size={32} className="text-red-500" aria-label={t("activity.incorrect")} />
            <span className="text-sm text-gray-600">
              {t("activity.correctWas")}: {content.correctAnswer}
              {content.unit}
            </span>
          </div>
        )}
      </div>

      {!submitted && (
        <button
          type="submit"
          disabled={value === ""}
          className="self-start px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold text-lg
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:ring-4 focus-visible:ring-blue-300 transition-all"
        >
          {t("activity.confirm")}
        </button>
      )}
    </form>
  );
}

// ─── Drag & Drop Ordering Activity ──────────────────────────────────────────
interface DragDropProps {
  activity: Activity;
  onAnswer: (answer: string, isCorrect: boolean, responseTimeMs: number) => void;
}

function DragDropActivity({ activity, onAnswer }: DragDropProps) {
  const content = activity.content as {
    question: string;
    items: Array<{ id: string; label: string; emoji?: string }>;
    correctOrder: string[];
  };

  const [items, setItems] = useState([...content.items].sort(() => Math.random() - 0.5));
  const [submitted, setSubmitted] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const startRef = useRef(Date.now());
  const { t } = useTranslation();

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...items];
    const dragged = newItems.splice(dragIndex, 1)[0];
    newItems.splice(index, 0, dragged);
    setItems(newItems);
    setDragIndex(index);
  }

  function handleDrop() {
    setDragIndex(null);
  }

  function handleSubmit() {
    if (submitted) return;
    const elapsed = Date.now() - startRef.current;
    const userOrder = items.map((i) => i.id);
    const isCorrect =
      JSON.stringify(userOrder) === JSON.stringify(content.correctOrder);
    setSubmitted(true);
    playSound(isCorrect ? "correct" : "incorrect");
    setTimeout(() => onAnswer(userOrder.join(","), isCorrect, elapsed), 1000);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl font-semibold leading-relaxed">{content.question}</p>
      <div className="flex flex-col gap-2" role="list" aria-label={t("activity.dragToOrder")}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            role="listitem"
            draggable={!submitted}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing
              transition-all select-none
              ${submitted
                ? item.id === content.correctOrder[idx]
                  ? "border-green-500 bg-green-50"
                  : "border-red-300 bg-red-50"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
              }
              ${dragIndex === idx ? "opacity-50 scale-95" : ""}
            `}
          >
            <span className="text-gray-400 font-bold text-lg w-6">{idx + 1}</span>
            {item.emoji && <span className="text-2xl">{item.emoji}</span>}
            <span className="font-medium text-lg">{item.label}</span>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="self-start px-8 py-3 rounded-2xl bg-purple-600 text-white font-bold text-lg
            hover:bg-purple-700 focus-visible:ring-4 focus-visible:ring-purple-300 transition-all"
        >
          {t("activity.checkOrder")}
        </button>
      )}
    </div>
  );
}

// ─── Main ActivityRenderer ───────────────────────────────────────────────────
export function ActivityRenderer({ activity, onComplete, onSkip }: ActivityRendererProps) {
  const { t } = useTranslation();
  const { settings } = useAccessibility();
  const { sessionId } = useSession();
  const [phase, setPhase] = useState<"intro" | "active" | "feedback">("intro");
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; responseTimeMs: number } | null>(null);
  const startTimeRef = useRef(Date.now());

  // Auto-advance from intro after 1.5s (ASD-friendly: no sudden changes)
  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => setPhase("active"), 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleAnswer = useCallback(
    async (answer: string, isCorrect: boolean, responseTimeMs: number) => {
      setLastResult({ isCorrect, responseTimeMs });
      setPhase("feedback");

      const attempt: Omit<ActivityAttempt, "id"> = {
        activityId: activity.id,
        sessionId: sessionId ?? "",
        answer,
        isCorrect,
        responseTimeMs,
        timestamp: new Date().toISOString(),
        interactionSignals: {
          hesitations: 0,
          focusLostCount: 0,
        },
      };

      try {
        await apiClient.post("/sessions/attempt", attempt);
      } catch {
        // Non-blocking — attempt is best-effort
      }

      setTimeout(() => {
        onComplete({ ...attempt, id: crypto.randomUUID() });
      }, 1800);
    },
    [activity.id, sessionId, onComplete]
  );

  const renderActivityContent = () => {
    switch (activity.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceActivity
            activity={activity}
            onAnswer={handleAnswer}
            lowStimulation={settings.lowStimulation}
          />
        );
      case "number_input":
        return <NumberInputActivity activity={activity} onAnswer={handleAnswer} />;
      case "drag_drop":
        return <DragDropActivity activity={activity} onAnswer={handleAnswer} />;
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <HelpCircle size={48} className="mx-auto mb-3 opacity-40" />
            <p>{t("activity.unsupportedType")}</p>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Activity metadata */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
            {t(`activity.type.${activity.type}`, { defaultValue: activity.type })}
          </span>
          <div className="flex gap-1" aria-label={`${t("activity.difficulty")}: ${activity.difficulty}`}>
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                size={14}
                className={star <= activity.difficulty ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                aria-hidden
              />
            ))}
          </div>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
            aria-label={t("activity.skip")}
          >
            {t("activity.skip")}
          </button>
        )}
      </div>

      {/* Phase transitions */}
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex flex-col items-center py-10 gap-4"
          >
            <motion.span
              className="text-6xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6 }}
              aria-hidden
            >
              {activity.content?.emoji ?? "🧮"}
            </motion.span>
            <p className="text-lg font-medium text-gray-600">{t("activity.getReady")}</p>
          </motion.div>
        )}

        {phase === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {renderActivityContent()}
          </motion.div>
        )}

        {phase === "feedback" && lastResult && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-10 gap-4"
          >
            {lastResult.isCorrect ? (
              <>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle size={72} className="text-green-500" aria-hidden />
                </motion.div>
                <p className="text-2xl font-bold text-green-700">{t("activity.excellent")}</p>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="text-3xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      aria-hidden
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <XCircle size={64} className="text-orange-400" aria-hidden />
                <p className="text-xl font-semibold text-orange-700">{t("activity.tryAgain")}</p>
                <p className="text-sm text-gray-500">{t("activity.keepGoing")}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}