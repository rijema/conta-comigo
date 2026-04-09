import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { useState, useEffect } from "react";

interface XPDisplayProps {
  xp: number;
  level: number;
  xpForNextLevel: number;
}

export function XPDisplay({ xp, level, xpForNextLevel }: XPDisplayProps) {
  const { reducedMotion } = useAccessibilityStore();
  const [showXPGain, setShowXPGain] = useState(false);
  const [prevXP, setPrevXP] = useState(xp);

  useEffect(() => {
    if (xp > prevXP) {
      setShowXPGain(true);
      const t = setTimeout(() => setShowXPGain(false), 2000);
      setPrevXP(xp);
      return () => clearTimeout(t);
    }
  }, [xp, prevXP]);

  const progressPercent = ((xp % xpForNextLevel) / xpForNextLevel) * 100;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-calm-100">
      {/* Level badge */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-300">
        <span className="text-sm font-bold text-primary-700 font-display">
          {level}
        </span>
      </div>

      {/* XP bar */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-medium text-calm-600">
            {xp % xpForNextLevel} / {xpForNextLevel} XP
          </span>
          <AnimatePresence>
            {showXPGain && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-bold text-success-600"
                transition={reducedMotion ? { duration: 0 } : undefined}
              >
                +{xp - prevXP} XP
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="w-full h-2 bg-calm-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }
            }
          />
        </div>
      </div>

      {/* Star icon */}
      <Star className="w-5 h-5 text-accent-400 fill-accent-400" aria-hidden="true" />
    </div>
  );
}