"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface RewardBadgeProps {
  type: "star" | "streak" | "level" | "mastery";
  value?: number | string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const BADGE_CONFIG = {
  star:    { emoji: "⭐", colorClass: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  streak:  { emoji: "🔥", colorClass: "bg-orange-100 border-orange-300 text-orange-700" },
  level:   { emoji: "🏆", colorClass: "bg-purple-100 border-purple-300 text-purple-700" },
  mastery: { emoji: "🎓", colorClass: "bg-green-100  border-green-300  text-green-700"  },
};

const SIZE_CLASSES = {
  sm: "text-sm px-2 py-1 gap-1",
  md: "text-base px-3 py-1.5 gap-2",
  lg: "text-xl px-4 py-2 gap-2",
};

export function RewardBadge({ type, value, size = "md", animate = false }: RewardBadgeProps) {
  const { t } = useTranslation();
  const cfg = BADGE_CONFIG[type];
  const sizeClass = SIZE_CLASSES[size];

  const content = (
    <div
      className={`inline-flex items-center rounded-full border-2 font-semibold select-none
        ${cfg.colorClass} ${sizeClass}`}
      role="img"
      aria-label={t(`badge.${type}`, { value })}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {value !== undefined && <span>{value}</span>}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      {content}
    </motion.div>
  );
}