// Learner progress page
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { ArrowLeft, TrendingUp, BookOpen, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";

interface ProgressData {
  weeklyAccuracy: Array<{ day: string; accuracy: number; attempts: number }>;
  skillMastery: Array<{ skill: string; mastery: number; bnccCode: string }>;
  totalSessions: number;
  totalMinutes: number;
  currentLevel: number;
}

export default function ProgressPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }

    apiClient
      .get<ProgressData>(`/analytics/progress/${user.childProfileId || user.id}`)
      .then(setData)
      .catch(() => {
        // Placeholder for demo
        setData({
          weeklyAccuracy: [
            { day: "Seg", accuracy: 70, attempts: 12 },
            { day: "Ter", accuracy: 80, attempts: 15 },
            { day: "Qua", accuracy: 65, attempts: 10 },
            { day: "Qui", accuracy: 85, attempts: 18 },
            { day: "Sex", accuracy: 90, attempts: 14 },
            { day: "Sáb", accuracy: 75, attempts: 9 },
            { day: "Dom", accuracy: 88, attempts: 11 },
          ],
          skillMastery: [
            { skill: t("skill.addition"), mastery: 85, bnccCode: "EF01MA06" },
            { skill: t("skill.subtraction"), mastery: 72, bnccCode: "EF02MA05" },
            { skill: t("skill.counting"), mastery: 95, bnccCode: "EF01MA04" },
            { skill: t("skill.shapes"), mastery: 60, bnccCode: "EF01MA14" },
            { skill: t("skill.patterns"), mastery: 45, bnccCode: "EF02MA10" },
          ],
          totalSessions: 24,
          totalMinutes: 180,
          currentLevel: 3,
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-4 z-30">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label={t("nav.back")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={22} aria-hidden />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{t("progress.title")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <BookOpen size={20} aria-hidden />, value: data.totalSessions, label: t("progress.sessions"), color: "text-blue-600" },
            { icon: <Clock size={20} aria-hidden />, value: `${data.totalMinutes}m`, label: t("progress.minutes"), color: "text-purple-600" },
            { icon: <TrendingUp size={20} aria-hidden />, value: `Nv.${data.currentLevel}`, label: t("progress.level"), color: "text-green-600" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className={`flex justify-center mb-1 ${card.color}`}>{card.icon}</div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly accuracy chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
        >
          <h2 className="font-bold text-gray-800 mb-4">{t("progress.weeklyPerformance")}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.weeklyAccuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, t("progress.accuracy")]}
                contentStyle={{ borderRadius: 12 }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Skill mastery */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
        >
          <h2 className="font-bold text-gray-800 mb-4">{t("progress.skillMastery")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.skillMastery} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(value) => [`${value}%`, t("progress.mastery")]}
                contentStyle={{ borderRadius: 12 }}
              />
              <Bar dataKey="mastery" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* BNCC codes reference */}
          <div className="mt-4 flex flex-wrap gap-2">
            {data.skillMastery.map((s) => (
              <span
                key={s.bnccCode}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-mono"
                title={s.skill}
              >
                {s.bnccCode}
              </span>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
