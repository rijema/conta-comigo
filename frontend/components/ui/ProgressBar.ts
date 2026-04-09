import { motion } from "framer-motion";
import { useAccessibilityStore } from "@/store/accessibility.store";
import { clsx } from "clsx";

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  color?: "primary" | "accent" | "success";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const colorMap = {
  primary: "bg-primary-500",
  accent: "bg-accent-400",
  success: "bg-success-500",
};

const sizeMap = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  color = "primary",
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const { reducedMotion, highContrast } = useAccessibilityStore();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor = highContrast ? "bg-yellow-400" : colorMap[color];

  return (
    <div className={clsx("w-full", className)}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-calm-700">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm text-calm-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          "w-full rounded-full overflow-hidden",
          sizeMap[size],
          highContrast ? "bg-white border border-white" : "bg-calm-200"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <motion.div
          className={clsx("h-full rounded-full", barColor)}
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut" }
          }
        />
      </div>
    </div>
  );
}