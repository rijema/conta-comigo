import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { MultipleChoiceActivity } from "./types/MultipleChoiceActivity";
import { CountingActivity } from "./types/CountingActivity";
import { PatternActivity } from "./types/PatternActivity";
import toast from "react-hot-toast";

export type ActivityType =
  | "multiple_choice"
  | "counting"
  | "pattern_recognition"
  | "number_line"
  | "shape_match";

export interface ActivityData {
  id: string;
  type: ActivityType;
  title: string;
  instruction: string;
  content: Record<string, unknown>;
  difficulty: "easy" | "medium" | "hard";
  skill_id: string;
  modality: "visual" | "auditory" | "kinesthetic" | "mixed";
  max_attempts: number;
  hint?: string;
  xp_reward: number;
}

interface ActivityRendererProps {
  activity: ActivityData;
  onComplete: (correct: boolean, responseTime: number, hintsUsed: number) => void;
  onSkip?: () => void;
}

export function ActivityRenderer({
  activity,
  onComplete,
  onSkip,
}: ActivityRendererProps) {
  const { reducedMotion, lowStimulation, highContrast, soundEffects } =
    useAccessibilityStore();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const handleAnswer = (correct: boolean) => {
    const responseTime = (Date.now() - startTime) / 1000;

    if (correct && soundEffects) {
      // Play success sound (handled via Web Audio API or preloaded audio)
      playSound("correct");
    }

    onComplete(correct, responseTime, hintsUsed);
  };

  const handleHintRequest = () => {
    if (activity.hint) {
      setHintsUsed((h) => h + 1);
      setShowHint(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial={reducedMotion ? "visible" : "hidden"}
      animate="visible"
      transition={{ duration: 0.4 }}
      className={`
        rounded-3xl p-6 shadow-sm border
        ${
          highContrast
            ? "bg-black border-white text-white"
            : lowStimulation
            ? "bg-calm-50 border-calm-200"
            : "bg-white border-calm-100"
        }
      `}
    >
      {/* Activity header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`
              text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
              ${
                activity.difficulty === "easy"
                  ? "bg-success-50 text-success-600"
                  : activity.difficulty === "medium"
                  ? "bg-accent-50 text-accent-600"
                  : "bg-red-50 text-red-600"
              }
            `}
          >
            {activity.difficulty}
          </span>
          <span className="text-xs text-calm-400">{activity.skill_id}</span>
        </div>

        <h2
          className={`
            font-display font-bold mb-1
            ${highContrast ? "text-white" : "text-calm-900"}
            text-learner-xl
          `}
        >
          {activity.title}
        </h2>
        <p
          className={`
            text-learner-base
            ${highContrast ? "text-gray-200" : "text-calm-600"}
          `}
        >
          {activity.instruction}
        </p>
      </div>

      {/* Activity content */}
      <div className="my-6">
        {activity.type === "multiple_choice" && (
          <MultipleChoiceActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
        {activity.type === "counting" && (
          <CountingActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
        {activity.type === "pattern_recognition" && (
          <PatternActivity
            content={activity.content}
            onAnswer={handleAnswer}
            highContrast={highContrast}
            reducedMotion={reducedMotion}
          />
        )}
      </div>

      {/* Hint section */}
      {activity.hint && (
        <div className="mt-4">
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-accent-50 border border-accent-200 rounded-xl"
              >
                <p className="text-sm text-accent-800">
                  💡 <strong>Dica:</strong> {activity.hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!showHint && (
            <button
              onClick={handleHintRequest}
              className="
                text-sm text-primary-600 hover:text-primary-800 font-medium
                underline underline-offset-2 transition-colors
                min-h-[44px] flex items-center gap-1
              "
              aria-label="Request hint"
            >
              💡 Ver dica
            </button>
          )}
        </div>
      )}

      {/* Skip option (for accessibility) */}
      {onSkip && (
        <div className="mt-4 text-right">
          <button
            onClick={onSkip}
            className="text-xs text-calm-400 hover:text-calm-600 min-h-[44px] px-2"
          >
            Pular esta atividade
          </button>
        </div>
      )}
    </motion.div>
  );
}

function playSound(type: "correct" | "incorrect") {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

      if (type === "correct") {
            oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
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
          // AudioContext not available (SSR or restricted env) — silent fail
        }
      }