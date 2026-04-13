"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle, Clock, Target, TrendingUp } from "lucide-react";
import { RewardBadge } from "./RewardBadge";
import type { SessionResult } from "@/types/session";

interface SessionSummaryProps {
  result: SessionResult;
  onContinue: () => void;
  onHome: () => void;
}

export function SessionSummary({ result, onContinue, onHome }: SessionSummaryProps) {
  const { t } = useTranslation();

  const accuracy =
    result.totalAttempts > 0
      ? Math.round((result.correctAttempts / result.totalAttempts) * 100)
      : 0;

  const avgTime =
    result.totalAttempts > 0
      ? Math.round(result.totalResponseTimeMs / result.totalAttempts / 1000)
      : 0;

  const stats = [
    {
      icon: <CheckCircle size={22} className="text-green-500" aria-hidden />,
      label: t("summary.accuracy"),
      value: `${accuracy}%`,
    },
    {
      icon: <Target size={22} className="text-blue-500" aria-hidden />,
      label: t("summary.completed"),
      value: result.totalAttempts,
    },
    {
      icon: <Clock size={22} className="text-purple-500" aria-hidden />,
      label: t("summary.avgTime"),
      value: `${avgTime}s`,
    },
    {
      icon: <TrendingUp size={22} className="text-orange-500" aria-hidden />,
      label: t("summary.xpEarned"),
      value: `+${result.xpEarned ?? 0}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 py-8 px-4 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          className="text-7xl mb-3"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 0.8 }}
          aria-hidden
        >
          {accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800">
          {accuracy >= 80
            ? t("summary.outstanding")
            : accuracy >= 50
            ? t("summary.goodJob")
            : t("summary.keepPracticing")}
        </h2>
        {result.streakDays && result.streakDays > 1 && (
          <p className="text-sm text-orange-600 mt-1 font-medium">
            {t("summary.streak", { days: result.streakDays })} 🔥
          </p>
        )}
      </div>

      {/* Badges earned */}
      {result.badgesEarned && result.badgesEarned.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {result.badgesEarned.map((badge, i) => (
            <RewardBadge key={i} type={badge.type as any} value={badge.label} animate />
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 bg-gray-50 rounded-2xl p-4 border border-gray-100"
          >
            {stat.icon}
            <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
            <span className="text-xs text-gray-500 text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ADE recommendation hint */}
      {result.nextActivityHint && (
        <div className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">💡 {t("summary.nextUp")}</p>
          <p>{result.nextActivityHint}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onHome}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold
            hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-300 transition-all"
        >
          {t("summary.home")}
        </button>
        <button
          onClick={onContinue}
          className="flex-2 flex-grow py-3 rounded-2xl bg-blue-600 text-white font-bold
            hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-300 transition-all"
        >
          {t("summary.continue")} →
        </button>
      </div>
    </motion.div>
  );
}