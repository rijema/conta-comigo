"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  color?: string;
}

export function ProgressBar({
  current,
  total,
  label,
  color = "#6366f1",
}: ProgressBarProps) {
  const { t } = useTranslation();
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      {label && (
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
          <span>{label}</span>
          <span aria-live="polite">
            {current}/{total}
          </span>
        </div>
      )}
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="sr-only">
        {t("progress.label", { current, total, percentage: Math.round(percentage) })}
      </span>
    </div>
  );
}