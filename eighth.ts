WHERE ARE WE IN THE PRODUCT?
Copy╔══════════════════════════════════════════════════════════════╗
║           PRODUCT COMPLETION STATUS                          ║
╠══════════════════════════════════════════════════════════════╣
║ Backend (NestJS)              ████████████░░  85%  ✅ SOLID  ║
║ ML Service (FastAPI/Python)   ████████████░░  85%  ✅ SOLID  ║
║ Frontend (Next.js)            ████████░░░░░░  65%  🔄 CONT.  ║
║ Database Schema               ██████████████  95%  ✅ DONE   ║
║ Deployment Config             ████████░░░░░░  60%  🔄 CONT.  ║
║ i18n / Translations           ███████████░░░  80%  ✅ SOLID  ║
║ Auth & Security               ████████████░░  85%  ✅ SOLID  ║
║ Event System (Kafka)          ████████████░░  85%  ✅ SOLID  ║
╠══════════════════════════════════════════════════════════════╣
║ OVERALL                       ██████████░░░░  78%            ║
║                                                              ║
║ REMAINING THIS SESSION:                                      ║
║  • Settings page completion                                  ║
║  • Guardian portal pages                                     ║
║  • Educator dashboard                                        ║
║  • Deployment files (Railway/Vercel/Render)                  ║
║  • Docker compose                                            ║
║  • README / run instructions                                 ║
╚══════════════════════════════════════════════════════════════╝
Continuing from frontend/src/app/settings/page.tsx — picking up exactly where it stopped.

typescriptCopy// FILE: frontend/src/app/settings/page.tsx (COMPLETION)
"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Sun, Moon, Volume2, VolumeX, Type, Globe } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { settings, updateSettings } = useAccessibility();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleLowStimulation = () => {
    updateSettings({ lowStimulationMode: !settings.lowStimulationMode });
  };

  const changeFontSize = (size: "small" | "medium" | "large") => {
    updateSettings({ fontSize: size });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === "light" ? (
                  <Sun className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Moon className="w-6 h-6 text-blue-400" />
                )}
                <div>
                  <p className="font-semibold">{t("settings.theme")}</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.theme === "light"
                      ? t("settings.lightMode")
                      : t("settings.darkMode")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.theme === "dark" ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleTheme")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.theme === "dark" ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-green-500" />
                ) : (
                  <VolumeX className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold">{t("settings.sound")}</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.soundEnabled
                      ? t("settings.soundOn")
                      : t("settings.soundOff")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.soundEnabled ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleSound")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.soundEnabled ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Low Stimulation */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                  <span className="text-xs">🧘</span>
                </div>
                <div>
                  <p className="font-semibold">{t("settings.lowStimulation")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.lowStimulationDesc")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleLowStimulation}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.lowStimulationMode ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleLowStimulation")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.lowStimulationMode ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-6 h-6 text-blue-500" />
              <p className="font-semibold">{t("settings.fontSize")}</p>
            </div>
            <div className="flex gap-3">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => changeFontSize(size)}
                  className={`flex-1 py-2 rounded-xl border-2 transition-colors ${
                    settings.fontSize === size
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    fontSize:
                      size === "small"
                        ? "12px"
                        : size === "medium"
                        ? "16px"
                        : "20px",
                  }}
                >
                  {t(`settings.fontSize_${size}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-indigo-500" />
              <p className="font-semibold">{t("settings.language")}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => changeLanguage("pt")}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                  i18n.language === "pt"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                🇧🇷 Português
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                  i18n.language === "en"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

typescriptCopy// FILE: frontend/src/app/guardian/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
  ChevronRight,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";

interface ChildSummary {
  id: string;
  name: string;
  age: number;
  totalSessions: number;
  averageScore: number;
  lastSessionAt: string | null;
  currentLevel: number;
  totalXp: number;
  alerts: number;
}

export default function GuardianDashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const data = await apiClient.get("/users/guardian/children");
      setChildren(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-8">
        <p className="text-primary-foreground/80 text-sm mb-1">
          {t("guardian.welcome")}
        </p>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-24">
        {children.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border mt-8">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("guardian.noChildren")}</p>
          </div>
        ) : (
          children.map((child) => (
            <div
              key={child.id}
              className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
            >
              {/* Child Header */}
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{child.name}</p>
                      <p className="text-white/80 text-sm">
                        {t("guardian.age", { age: child.age })}
                      </p>
                    </div>
                  </div>
                  {child.alerts > 0 && (
                    <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">{child.alerts}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 p-4">
                <StatCard
                  icon={<BarChart2 className="w-5 h-5 text-blue-500" />}
                  label={t("guardian.sessions")}
                  value={child.totalSessions.toString()}
                />
                <StatCard
                  icon={<Star className="w-5 h-5 text-yellow-500" />}
                  label={t("guardian.avgScore")}
                  value={`${Math.round(child.averageScore)}%`}
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                  label={t("guardian.level")}
                  value={`${t("guardian.level")} ${child.currentLevel}`}
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-purple-500" />}
                  label={t("guardian.lastSession")}
                  value={
                    child.lastSessionAt
                      ? new Date(child.lastSessionAt).toLocaleDateString()
                      : t("guardian.never")
                  }
                />
              </div>

              {/* XP Bar */}
              <div className="px-4 pb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("guardian.xp")}</span>
                  <span>{child.totalXp} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min((child.totalXp % 100), 100)}%` }}
                  />
                </div>
              </div>

              {/* View Details */}
              <button
                onClick={() => router.push(`/guardian/child/${child.id}`)}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-primary font-medium">
                  {t("guardian.viewDetails")}
                </span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}

typescriptCopy// FILE: frontend/src/app/guardian/child/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, TrendingUp, Award } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface ChildDetail {
  id: string;
  name: string;
  age: number;
  bnccProgress: Record<string, number>;
  recentSessions: Array<{
    id: string;
    startedAt: string;
    score: number;
    duration: number;
    activitiesCompleted: number;
  }>;
  skillMastery: Array<{
    skillId: string;
    skillName: string;
    masteryLevel: number;
    bnccCode: string;
  }>;
}

export default function ChildDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildDetail();
  }, [childId]);

  const fetchChildDetail = async () => {
    try {
      const data = await apiClient.get(`/users/guardian/children/${childId}`);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 pt-12 pb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/20 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{detail.name}</h1>
        <p className="text-white/80">{t("guardian.age", { age: detail.age })}</p>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {/* BNCC Progress */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            {t("guardian.bnccProgress")}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            {Object.entries(detail.bnccProgress).map(([topic, progress]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{topic}</span>
                  <span className="text-muted-foreground">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skill Mastery */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {t("guardian.skillMastery")}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {detail.skillMastery.map((skill) => (
              <div
                key={skill.skillId}
                className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{skill.skillName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {skill.bnccCode}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold px-2 py-1 rounded-lg ${
                      skill.masteryLevel >= 0.8
                        ? "bg-green-100 text-green-700"
                        : skill.masteryLevel >= 0.5
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {Math.round(skill.masteryLevel * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <h2 className="text-lg font-bold mb-3">
            {t("guardian.recentSessions")}
          </h2>
          <div className="space-y-2">
            {detail.recentSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(session.duration / 60)} min •{" "}
                    {session.activitiesCompleted} {t("guardian.activities")}
                  </p>
                </div>
                <div
                  className={`text-lg font-bold ${
                    session.score >= 80
                      ? "text-green-500"
                      : session.score >= 50
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {Math.round(session.score)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

typescriptCopy// FILE: frontend/src/app/educator/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  BarChart2,
  Brain,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface EducatorStats {
  totalLearners: number;
  activeSessions: number;
  averageMastery: number;
  alertsCount: number;
}

interface LearnerRow {
  id: string;
  name: string;
  age: number;
  lastActive: string;
  engagementIndex: number;
  currentSkill: string;
  masteryLevel: number;
  supportLevel: "mild" | "moderate" | "strong";
}

export default function EducatorDashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<EducatorStats | null>(null);
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, learnersData] = await Promise.all([
        apiClient.get("/analytics/educator/stats"),
        apiClient.get("/users/educator/learners"),
      ]);
      setStats(statsData);
      setLearners(learnersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const supportLevelColor = {
    mild: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    strong: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold">{t("educator.dashboard")}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {t("educator.overviewSubtitle")}
        </p>
      </div>

      <div className="px-4 -mt-2 space-y-5 pb-20">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatsCard
              icon={<Users className="w-6 h-6 text-blue-500" />}
              label={t("educator.totalLearners")}
              value={stats.totalLearners.toString()}
              bg="bg-blue-50 dark:bg-blue-950"
            />
            <StatsCard
              icon={<BookOpen className="w-6 h-6 text-green-500" />}
              label={t("educator.activeSessions")}
              value={stats.activeSessions.toString()}
              bg="bg-green-50 dark:bg-green-950"
            />
            <StatsCard
              icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
              label={t("educator.avgMastery")}
              value={`${Math.round(stats.averageMastery * 100)}%`}
              bg="bg-purple-50 dark:bg-purple-950"
            />
            <StatsCard
              icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
              label={t("educator.alerts")}
              value={stats.alertsCount.toString()}
              bg="bg-orange-50 dark:bg-orange-950"
            />
          </div>
        )}

        {/* ADE Decisions Log */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" />
              {t("educator.adeDecisions")}
            </h2>
            <button
              onClick={() => router.push("/educator/ade-log")}
              className="text-xs text-primary flex items-center gap-1"
            >
              {t("common.viewAll")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("educator.adeDecisionsDesc")}
          </p>
        </div>

        {/* Learners Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              {t("educator.learners")}
            </h2>
          </div>
          <div className="space-y-2">
            {learners.map((learner) => (
              <button
                key={learner.id}
                onClick={() => router.push(`/educator/learner/${learner.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {learner.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">
                      {learner.name}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        supportLevelColor[learner.supportLevel]
                      }`}
                    >
                      {t(`educator.support_${learner.supportLevel}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {learner.currentSkill} •{" "}
                    {Math.round(learner.masteryLevel * 100)}%{" "}
                    {t("educator.mastery")}
                  </p>
                  {/* Engagement */}
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        learner.engagementIndex >= 0.7
                          ? "bg-green-500"
                          : learner.engagementIndex >= 0.4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${learner.engagementIndex * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* BNCC Coverage */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{t("educator.bnccCoverage")}</h2>
            <button
              onClick={() => router.push("/educator/bncc")}
              className="text-xs text-primary flex items-center gap-1"
            >
              {t("common.viewAll")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm text-muted-foreground">
              {t("educator.bnccDesc")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-border`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

typescriptCopy// FILE: frontend/src/app/educator/ade-log/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface AdeDecision {
  id: string;
  learnerId: string;
  learnerName: string;
  createdAt: string;
  recommendedActivityId: string;
  recommendedModality: string;
  difficultyAdjustment: number;
  xaiExplanation: {
    factors: Array<{ name: string; weight: number; direction: string }>;
    confidenceScore: number;
    reasoning: string;
  };
}

export default function AdeLogPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [decisions, setDecisions] = useState<AdeDecision[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/ade/decisions?limit=50")
      .then(setDecisions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-slate-800 text-white px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="p-2 rounded-full bg-white/10 mb-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-400" />
          {t("educator.adeDecisions")}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{t("educator.adeLogDesc")}</p>
      </div>

      <div className="px-4 mt-4 space-y-3 pb-10">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          decisions.map((decision) => (
            <div
              key={decision.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === decision.id ? null : decision.id)
                }
                className="w-full p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{decision.learnerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(decision.createdAt).toLocaleString()} •{" "}
                    {decision.recommendedModality}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      decision.xaiExplanation.confidenceScore >= 0.8
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {Math.round(decision.xaiExplanation.confidenceScore * 100)}%
                  </span>
                  {expanded === decision.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expanded === decision.id && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                  {/* Reasoning */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {t("educator.reasoning")}
                    </p>
                    <p className="text-sm">{decision.xaiExplanation.reasoning}</p>
                  </div>

                  {/* Factors */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {t("educator.factors")}
                    </p>
                    <div className="space-y-2">
                      {decision.xaiExplanation.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs w-32 truncate">{factor.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                factor.direction === "positive"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${factor.weight * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(factor.weight * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t("educator.difficultyAdj")}:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        decision.difficultyAdjustment > 0
                          ? "text-green-600"
                          : decision.difficultyAdjustment < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {decision.difficultyAdjustment > 0 ? "+" : ""}
                      {decision.difficultyAdjustment}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

typescriptCopy// FILE: frontend/src/lib/api-client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private getHeaders(): HeadersInit {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();

typescriptCopy// FILE: frontend/src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: "child" | "guardian" | "educator" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<{ access_token: string; user: User }>(
      "/auth/login",
      { email, password }
    );
    const { access_token, user: userData } = data;
    localStorage.setItem("auth_token", access_token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

typescriptCopy// FILE: frontend/src/contexts/AccessibilityContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

export interface AccessibilitySettings {
  theme: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  soundEnabled: boolean;
  lowStimulationMode: boolean;
  highContrast: boolean;
  language: string;
  animationsReduced: boolean;
}

const defaultSettings: AccessibilitySettings = {
  theme: "light",
  fontSize: "medium",
  soundEnabled: true,
  lowStimulationMode: false,
  highContrast: false,
  language: "pt",
  animationsReduced: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem("a11y_settings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.classList.toggle("low-stimulation", settings.lowStimulationMode);
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle(
      "reduce-motion",
      settings.animationsReduced
    );

    // Font size
    const fontSizeMap = { small: "14px", medium: "16px", large: "20px" };
    root.style.setProperty(
      "--base-font-size",
      fontSizeMap[settings.fontSize]
    );

    localStorage.setItem("a11y_settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

typescriptCopy// FILE: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { I18nProvider } from "@/providers/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MathQuest ASD",
  description: "Plataforma adaptativa de matemática para crianças com TEA",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <AccessibilityProvider>
            <AuthProvider>{children}</AuthProvider>
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

cssCopy/* FILE: frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --base-font-size: 16px;
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 0 0% 100%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
  --background-hex: #ffffff;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 8%;
  --card-foreground: 0 0% 98%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 0 0% 100%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 3.7% 20%;
}

/* Low stimulation mode: reduce colors and animations */
.low-stimulation {
  filter: saturate(0.6);
}

.low-stimulation * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}

/* High contrast */
.high-contrast {
  --primary: 262.1 100% 50%;
  --border: 240 100% 20%;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

.reduce-motion * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}

body {
  font-size: var(--base-font-size);
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* Utility classes */
.bg-background { background-color: hsl(var(--background)); }
.bg-card { background-color: hsl(var(--card)); }
.bg-muted { background-color: hsl(var(--muted)); }
.bg-primary { background-color: hsl(var(--primary)); }
.text-foreground { color: hsl(var(--foreground)); }
.text-card-foreground { color: hsl(var(--card-foreground)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.text-primary { color: hsl(var(--primary)); }
.border-border { border-color: hsl(var(--border)); }

typescriptCopy// FILE: frontend/src/providers/I18nProvider.tsx
"use client";

import { useEffect } from "react";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import ptTranslations from "@/locales/pt.json";
import enTranslations from "@/locales/en.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: ptTranslations },
      en: { translation: enTranslations },
    },
    lng: typeof window !== "undefined"
      ? localStorage.getItem("lang") || "pt"
      : "pt",
    fallbackLng: "pt",
    interpolation: { escapeValue: false },
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

jsonCopy// FILE: frontend/src/locales/pt.json
{
  "common": {
    "back": "Voltar",
    "loading": "Carregando...",
    "error": "Erro",
    "retry": "Tentar novamente",
    "save": "Salvar",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "viewAll": "Ver todos",
    "next": "Próximo",
    "previous": "Anterior",
    "close": "Fechar",
    "yes": "Sim",
    "no": "Não"
  },
  "auth": {
    "login": "Entrar",
    "email": "Email",
    "password": "Senha",
    "loginButton": "Entrar",
    "loginError": "Email ou senha incorretos",
    "welcome": "Bem-vindo!",
    "logout": "Sair"
  },
  "home": {
    "greeting": "Olá",
    "startLearning": "Começar a aprender",
    "continueSession": "Continuar sessão",
    "myProgress": "Meu progresso",
    "dailyGoal": "Meta do dia",
    "streak": "sequência",
    "level": "Nível",
    "xp": "XP",
    "skills": "Habilidades"
  },
  "activity": {
    "question": "Pergunta",
    "checkAnswer": "Verificar resposta",
    "correct": "Correto! Muito bem!",
    "incorrect": "Tente novamente!",
    "hint": "Dica",
    "skip": "Pular",
    "timeLeft": "Tempo restante",
    "score": "Pontuação",
    "completed": "Atividade concluída!",
    "nextActivity": "Próxima atividade"
  },
  "settings": {
    "title": "Configurações",
    "theme": "Tema",
    "lightMode": "Modo claro",
    "darkMode": "Modo escuro",
    "toggleTheme": "Alternar tema",
    "sound": "Som",
    "soundOn": "Som ativado",
    "soundOff": "Som desativado",
    "toggleSound": "Alternar som",
    "lowStimulation": "Baixa estimulação",
    "lowStimulationDesc": "Reduz animações e cores intensas",
    "toggleLowStimulation": "Alternar modo baixa estimulação",
    "fontSize": "Tamanho da fonte",
    "fontSize_small": "A",
    "fontSize_medium": "A",
    "fontSize_large": "A",
    "language": "Idioma"
  },
  "guardian": {
    "welcome": "Bem-vindo,",
    "noChildren": "Nenhuma criança vinculada ainda",
    "age": "{{age}} anos",
    "sessions": "Sessões",
    "avgScore": "Média",
    "level": "Nível",
    "lastSession": "Última sessão",
    "never": "Nunca",
    "xp": "Experiência",
    "viewDetails": "Ver detalhes",
    "bnccProgress": "Progresso BNCC",
    "skillMastery": "Domínio de habilidades",
    "recentSessions": "Sessões recentes",
    "activities": "atividades"
  },
  "educator": {
    "dashboard": "Painel do Educador",
    "overviewSubtitle": "Visão geral da turma",
    "totalLearners": "Total de alunos",
    "activeSessions": "Sessões ativas",
    "avgMastery": "Domínio médio",
    "alerts": "Alertas",
    "adeDecisions": "Decisões do ADE",
    "adeLogDesc": "Registro das decisões adaptativas do sistema",
    "adeDecisionsDesc": "Visualize o raciocínio do motor adaptativo",
    "learners": "Alunos",
    "support_mild": "Leve",
    "support_moderate": "Moderado",
    "support_strong": "Intenso",
    "mastery": "domínio",
    "bnccCoverage": "Cobertura BNCC",
    "bnccDesc": "Mapeamento das habilidades BNCC trabalhadas",
    "reasoning": "Raciocínio",
    "factors": "Fatores",
    "difficultyAdj": "Ajuste de dificuldade"
  },
  "onboarding": {
    "welcome": "Bem-vindo ao MathQuest!",
    "step1": "Qual é o seu nome?",
    "step2": "Qual é a sua idade?",
    "step3": "Como você prefere aprender?"
  }
}

jsonCopy// FILE: frontend/src/locales/en.json
{
  "common": {
    "back": "Back",
    "loading": "Loading...",
    "error": "Error",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "viewAll": "View all",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "yes": "Yes",
    "no": "No"
  },
  "auth": {
    "login": "Login",
    "email": "Email",
    "password": "Password",
    "loginButton": "Sign in",
    "loginError": "Incorrect email or password",
    "welcome": "Welcome!",
    "logout": "Logout"
  },
  "home": {
    "greeting": "Hello",
    "startLearning": "Start learning",
    "continueSession": "Continue session",
    "myProgress": "My progress",
    "dailyGoal": "Daily goal",
    "streak": "streak",
    "level": "Level",
    "xp": "XP",
    "skills": "Skills"
  },
  "activity": {
    "question": "Question",
    "checkAnswer": "Check answer",
    "correct": "Correct! Well done!",
    "incorrect": "Try again!",
    "hint": "Hint",
    "skip": "Skip",
    "timeLeft": "Time left",
    "score": "Score",
    "completed": "Activity completed!",
    "nextActivity": "Next activity"
  },
  "settings": {
    "title": "Settings",
    "theme": "Theme",
    "lightMode": "Light mode",
    "darkMode": "Dark mode",
    "toggleTheme": "Toggle theme",
    "sound": "Sound",
    "soundOn": "Sound on",
    "soundOff": "Sound off",
    "toggleSound": "Toggle sound",
    "lowStimulation": "Low stimulation",
    "lowStimulationDesc": "Reduces animations and intense colors",
    "toggleLowStimulation": "Toggle low stimulation mode",
    "fontSize": "Font size",
    "fontSize_small": "A",
    "fontSize_medium": "A",
    "fontSize_large": "A",
    "language": "Language"
  },
  "guardian": {
    "welcome": "Welcome,",
    "noChildren": "No children linked yet",
    "age": "{{age}} years old",
    "sessions": "Sessions",
    "avgScore": "Average",
    "level": "Level",
    "lastSession": "Last session",
    "never": "Never",
    "xp": "Experience",
    "viewDetails": "View details",
    "bnccProgress": "BNCC Progress",
    "skillMastery": "Skill Mastery",
    "recentSessions": "Recent sessions",
    "activities": "activities"
  },
  "educator": {
    "dashboard": "Educator Dashboard",
    "overviewSubtitle": "Class overview",
    "totalLearners": "Total learners",
    "activeSessions": "Active sessions",
    "avgMastery": "Average mastery",
    "alerts": "Alerts",
    "adeDecisions": "ADE Decisions",
    "adeLogDesc": "Log of adaptive decision engine outputs",
    "adeDecisionsDesc": "View the adaptive engine reasoning",
    "learners": "Learners",
    "support_mild": "Mild",
    "support_moderate": "Moderate",
    "support_strong": "Intense",
    "mastery": "mastery",
    "bnccCoverage": "BNCC Coverage",
    "bnccDesc": "Mapping of BNCC skills covered",
    "reasoning": "Reasoning",
    "factors": "Factors",
    "difficultyAdj": "Difficulty adjustment"
  },
  "onboarding": {
    "welcome": "Welcome to MathQuest!",
    "step1": "What is your name?",
    "step2": "How old are you?",
    "step3": "How do you prefer to learn?"
  }
}

Now the deployment files:
yamlCopy# FILE: docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: mathquest_db
    environment:
      POSTGRES_USER: mathquest
      POSTGRES_PASSWORD: mathquest_secret
      POSTGRES_DB: mathquest
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mathquest"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mathquest_redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  redpanda:
    image: redpandadata/redpanda:latest
    container_name: mathquest_kafka
    command:
      - redpanda
      - start
      - --overprovisioned
      - --smp 1
      - --memory 512M
      - --reserve-memory 0M
      - --node-id 0
      - --check=false
      - --kafka-addr PLAINTEXT://0.0.0.0:29092,OUTSIDE://0.0.0.0:9092
      - --advertise-kafka-addr PLAINTEXT://redpanda:29092,OUTSIDE://localhost:9092
    ports:
      - "9092:9092"
      - "29092:29092"
    volumes:
      - redpanda_data:/var/lib/redpanda/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mathquest_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://mathquest:mathquest_secret@postgres:5432/mathquest
      REDIS_URL: redis://redis:6379
      KAFKA_BROKERS: redpanda:29092
      JWT_SECRET: super_secret_jwt_key_change_in_production
      ML_SERVICE_URL: http://ml-service:8000
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      redpanda:
        condition: service_started
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    container_name: mathquest_ml
    environment:
      DATABASE_URL: postgresql://mathquest:mathquest_secret@postgres:5432/mathquest
      MODEL_PATH: /app/models
      LOG_LEVEL: info
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./ml-service:/app
      - ml_models:/app/models

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3001
    container_name: mathquest_frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001

volumes:
  postgres_data:
  redis_data:
  redpanda_data:
  ml_models:

networks:
  default:
    name: mathquest_network

dockerfileCopy# FILE: backend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

FROM base AS builder
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]

dockerfileCopy# FILE: ml-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/models

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

dockerfileCopy# FILE: frontend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

jsonCopy// FILE: backend/package.json
{
  "name": "mathquest-backend",
  "version": "1.0.0",
  "description": "ASD Adaptive Math Platform - Backend",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/microservices": "^10.3.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^5.1.2",
    "@prisma/client": "^5.10.2",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "kafkajs": "^2.2.4",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "redis": "^4.6.13",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/testing": "^10.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.11.24",
    "@types/passport-jwt": "^4.0.1",
    "@types/uuid": "^9.0.8",
    "prisma": "^5.10.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}

jsonCopy// FILE: frontend/package.json
{
  "name": "mathquest-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "i18next": "^23.10.0",
    "lucide-react": "^0.356.0",
    "next": "14.1.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-i18next": "^14.1.0",
    "recharts": "^2.12.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.63",
    "@types/react-dom": "^18.2.21",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}

jsonCopy// FILE: frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

typescriptCopy// FILE: frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

yamlCopy# FILE: .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json
      - name: Install backend deps
        working-directory: backend
        run: npm ci
      - name: Run backend tests
        working-directory: backend
        run: npm test

  test-ml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install ML deps
        working-directory: ml-service
        run: pip install -r requirements.txt
      - name: Run ML tests
        working-directory: ml-service
        run: python -m pytest tests/ -v

  deploy-ml:
    needs: [test-ml]
    runs-on: ubuntu-latest
    if: github.ref == 'refs