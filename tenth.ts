WHERE ARE WE IN THE PRODUCT?
Recalculated Progress Status
SectionStatus% CompleteBackend (NestJS)Core modules done, ADE service, auth, analytics, Kafka producers/consumers complete85%ML Service (FastAPI/Python)BKT, engagement classifier, prediction endpoints done90%Frontend (Next.js)Learner portal, activity renderer, dashboard, accessibility shell done; charts partially done72%Database SchemaFull PostgreSQL schema with JSONB complete95%Ontology IntegrationJSON-LD ontology loader, LASDONT mapping done80%Event System (Kafka)Producers, consumers, event structures done85%Deployment ConfigDockerfiles, env files, Railway/Vercel configs partially done55%i18nPT/EN structure defined, partial implementation60%Security/LGPDJWT auth done, consent management partial70%ObservabilityStructured logging done, metrics partial65%Overall~78%
Remaining: Complete charts, deployment configs, i18n completion, guardian portal pages, educator dashboard pages, Docker compose, and deployment guide.

Now continuing from where we stopped (completing progress-chart.tsx):

typescriptCopy// FILE: frontend/src/components/charts/progress-chart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: { date: string; score: number; activities: number }[];
}

export function ProgressChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Ainda não há dados de progresso
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(val) => {
            const d = new Date(val);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} domain={[0, 100]} />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "score" ? `${value}%` : value,
            name === "score" ? "Pontuação" : "Atividades",
          ]}
          labelFormatter={(label) => {
            const d = new Date(label);
            return d.toLocaleDateString("pt-BR");
          }}
        />
        <Legend
          formatter={(value) =>
            value === "score" ? "Pontuação" : "Atividades"
          }
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="activities"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
typescriptCopy// FILE: frontend/src/components/charts/skill-radar-chart.tsx
"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillData {
  skill: string;
  mastery: number;
  fullMark: number;
}

interface Props {
  data: SkillData[];
}

export function SkillRadarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Dados de habilidades não disponíveis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <Radar
          name="Domínio"
          dataKey="mastery"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, "Domínio"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
typescriptCopy// FILE: frontend/src/components/charts/engagement-bar-chart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: { label: string; value: number; color?: string }[];
  title?: string;
}

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function EngagementBarChart({ data, title }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Sem dados de engajamento
      </div>
    );
  }

  return (
    <div>
      {title && (
        <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/components/ui/badge.tsx
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
typescriptCopy// FILE: frontend/src/components/ui/card.tsx
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 p-4",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("mb-3", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn("font-semibold text-gray-800 text-base", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("", className)}>{children}</div>;
}
typescriptCopy// FILE: frontend/src/components/ui/button.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
  danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
typescriptCopy// FILE: frontend/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, locale = "pt-BR"): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}min ${secs > 0 ? secs + "s" : ""}`.trim();
}

export function scoreToLabel(score: number): string {
  if (score >= 0.8) return "Excelente";
  if (score >= 0.6) return "Bom";
  if (score >= 0.4) return "Regular";
  return "Precisa de apoio";
}

export function masteryToPercent(mastery: number): string {
  return `${(mastery * 100).toFixed(0)}%`;
}
typescriptCopy// FILE: frontend/src/lib/api-client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "POST", body, token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "PUT", body, token }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: "DELETE", token }),
};
typescriptCopy// FILE: frontend/src/lib/auth.ts
import { apiClient } from "./api-client";

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "CHILD" | "GUARDIAN" | "EDUCATOR";
  lgpdConsent: boolean;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthTokens>("/auth/register", payload),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken }),

  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  storeTokens: (tokens: AuthTokens) => {
    localStorage.setItem("access_token", tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }
  },

  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};
typescriptCopy// FILE: frontend/src/hooks/use-auth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginPayload } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const profile = await apiClient.get<User>("/auth/profile", token);
      setUser(profile);
    } catch {
      authService.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (payload: LoginPayload) => {
    const tokens = await authService.login(payload);
    authService.storeTokens(tokens);
    await fetchProfile();
  };

  const logout = () => {
    authService.clearTokens();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, login, logout };
}
typescriptCopy// FILE: frontend/src/hooks/use-activity.ts
"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface ActivityAttemptPayload {
  activityId: string;
  sessionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  interactionSignals?: Record<string, unknown>;
}

interface ADEDecision {
  nextActivityId: string | null;
  difficultyAdjustment: string;
  modality: string;
  feedback: string;
  xaiExplanation: string;
}

export function useActivity() {
  const [submitting, setSubmitting] = useState(false);
  const [adeDecision, setAdeDecision] = useState<ADEDecision | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const getElapsedSeconds = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const submitAttempt = useCallback(
    async (payload: ActivityAttemptPayload) => {
      setSubmitting(true);
      try {
        const token = authService.getStoredToken();
        const result = await apiClient.post<{
          attempt: unknown;
          adeDecision: ADEDecision;
        }>("/sessions/attempt", payload, token ?? undefined);
        setAdeDecision(result.adeDecision);
        return result;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitting, adeDecision, startTimer, getElapsedSeconds, submitAttempt };
}
typescriptCopy// FILE: frontend/src/hooks/use-analytics.ts
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface AnalyticsSummary {
  totalSessions: number;
  totalActivities: number;
  averageScore: number;
  engagementIndex: number;
  streakDays: number;
  progressData: { date: string; score: number; activities: number }[];
  skillMastery: { skill: string; mastery: number; fullMark: number }[];
}

export function useAnalytics(childId?: string) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) return;

    const endpoint = childId
      ? `/analytics/child/${childId}/summary`
      : `/analytics/my-summary`;

    apiClient
      .get<AnalyticsSummary>(endpoint, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [childId]);

  return { data, loading, error };
}
typescriptCopy// FILE: frontend/src/app/(learner)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "@/components/charts/progress-chart";
import { SkillRadarChart } from "@/components/charts/skill-radar-chart";
import { useRouter } from "next/navigation";
import { masteryToPercent, scoreToLabel } from "@/lib/utils";

export default function LearnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: analytics, loading: analyticsLoading } = useAnalytics();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Aluno";

  return (
    <div className="min-h-screen bg-indigo-50 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <p className="text-indigo-200 text-sm">Bem-vindo de volta 👋</p>
          <h1 className="text-white text-2xl font-bold mt-1">{firstName}</h1>
          {analytics && (
            <div className="flex gap-3 mt-4">
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {analytics.streakDays}
                </p>
                <p className="text-indigo-200 text-xs">dias seguidos</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {analytics.totalActivities}
                </p>
                <p className="text-indigo-200 text-xs">atividades</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white font-bold text-lg">
                  {Math.round((analytics.averageScore || 0) * 100)}%
                </p>
                <p className="text-indigo-200 text-xs">média</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4">
        {/* Start Activity CTA */}
        <Card className="bg-white shadow-lg">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-gray-800">Pronto para aprender?</p>
              <p className="text-sm text-gray-500">Continue de onde parou</p>
            </div>
            <Button
              onClick={() => router.push("/activity")}
              className="shrink-0"
            >
              🚀 Começar
            </Button>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Meu Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={analytics?.progressData || []} />
          </CardContent>
        </Card>

        {/* Skill Radar */}
        {analytics?.skillMastery && analytics.skillMastery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Habilidades BNCC</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillRadarChart data={analytics.skillMastery} />
            </CardContent>
          </Card>
        )}

        {/* Engagement Index */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Engajamento Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.round(analytics.engagementIndex * 100)}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={
                    analytics.engagementIndex >= 0.7
                      ? "success"
                      : analytics.engagementIndex >= 0.4
                      ? "warning"
                      : "error"
                  }
                >
                  {scoreToLabel(analytics.engagementIndex)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/app/(learner)/activity/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActivity } from "@/hooks/use-activity";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Activity {
  id: string;
  title: string;
  description: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "VISUAL_PUZZLE";
  content: {
    question: string;
    options?: string[];
    correctAnswer: string | number;
    imageUrl?: string;
    hint?: string;
    bnccSkill?: string;
  };
  difficultyLevel: number;
}

interface Session {
  id: string;
  currentActivityId: string;
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const { submitting, adeDecision, startTimer, getElapsedSeconds, submitAttempt } =
    useActivity();
  const [session, setSession] = useState<Session | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const initSession = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) return;

    try {
      // Start or resume session
      const sess = await apiClient.post<Session>(
        "/sessions/start",
        {},
        token
      );
      setSession(sess);

      // Load current activity
      const act = await apiClient.get<Activity>(
        `/activities/${sess.currentActivityId}`,
        token
      );
      setActivity(act);
      startTimer();
    } catch (e) {
      console.error("Failed to init session", e);
    } finally {
      setPageLoading(false);
    }
  }, [startTimer]);

  useEffect(() => {
    if (user) {
      initSession();
    }
  }, [user, initSession]);

  const handleAnswer = async () => {
    if (selectedAnswer === null || !activity || !session) return;

    const correct =
      String(selectedAnswer) === String(activity.content.correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    await submitAttempt({
      activityId: activity.id,
      sessionId: session.id,
      isCorrect: correct,
      timeSpentSeconds: getElapsedSeconds(),
      hintsUsed,
      interactionSignals: { selectedAnswer, hintsUsed },
    });
  };

  const handleNext = async () => {
    if (!adeDecision?.nextActivityId) {
      router.push("/dashboard");
      return;
    }

    const token = authService.getStoredToken();
    if (!token) return;

    try {
      const nextActivity = await apiClient.get<Activity>(
        `/activities/${adeDecision.nextActivityId}`,
        token
      );
      setActivity(nextActivity);
      setSelectedAnswer(null);
      setShowResult(false);
      setHintsUsed(0);
      setShowHint(false);
      startTimer();
    } catch {
      router.push("/dashboard");
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <Card className="max-w-sm w-full mx-4 text-center p-6">
          <p className="text-2xl mb-3">🎉</p>
          <h2 className="font-bold text-lg text-gray-800">
            Parabéns! Você completou todas as atividades de hoje!
          </h2>
          <Button
            className="mt-4 w-full"
            onClick={() => router.push("/dashboard")}
          >
            Ver meu progresso
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Voltar ao dashboard"
          >
            ← Sair
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Nível {activity.difficultyLevel}
            </span>
            {activity.content.bnccSkill && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                BNCC: {activity.content.bnccSkill}
              </span>
            )}
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-md">
          <CardContent className="pt-4 pb-4">
            {activity.content.imageUrl && (
              <img
                src={activity.content.imageUrl}
                alt="Imagem da atividade"
                className="w-full rounded-lg mb-4 max-h-48 object-contain"
              />
            )}
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {activity.title}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {activity.content.question}
            </p>

            {/* Hint */}
            {activity.content.hint && !showHint && !showResult && (
              <button
                className="mt-3 text-xs text-indigo-500 underline"
                onClick={() => {
                  setShowHint(true);
                  setHintsUsed((h) => h + 1);
                }}
              >
                💡 Ver dica
              </button>
            )}
            {showHint && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                💡 {activity.content.hint}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Options */}
        {!showResult && (
          <>
            {activity.type === "MULTIPLE_CHOICE" &&
              activity.content.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                    selectedAnswer === idx
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                  }`}
                  aria-pressed={selectedAnswer === idx}
                >
                  <span className="mr-2 font-bold text-indigo-400">
                    {["A", "B", "C", "D"][idx]}.
                  </span>
                  {option}
                </button>
              ))}

            {activity.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-2 gap-3">
                {["Verdadeiro", "Falso"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setSelectedAnswer(label)}
                    className={`p-4 rounded-2xl border-2 font-semibold transition-all ${
                      selectedAnswer === label
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    {label === "Verdadeiro" ? "✅" : "❌"} {label}
                  </button>
                ))}
              </div>
            )}

            {activity.type === "FILL_BLANK" && (
              <input
                type="text"
                value={selectedAnswer?.toString() || ""}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Digite sua resposta..."
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 outline-none text-gray-700"
                aria-label="Campo de resposta"
              />
            )}

            <Button
              onClick={handleAnswer}
              disabled={selectedAnswer === null || submitting}
              loading={submitting}
              className="w-full py-3 text-base"
            >
              Confirmar resposta
            </Button>
          </>
        )}

        {/* Result */}
        {showResult && (
          <Card
            className={`border-2 ${
              isCorrect ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"
            }`}
          >
            <CardContent className="py-4 text-center">
              <p className="text-3xl mb-2">{isCorrect ? "🎉" : "🤔"}</p>
              <p
                className={`font-bold text-lg ${
                  isCorrect ? "text-green-700" : "text-red-600"
                }`}
              >
                {isCorrect ? "Correto!" : "Quase lá!"}
              </p>
              {adeDecision && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  {adeDecision.feedback}
                </p>
              )}
              <Button
                onClick={handleNext}
                className="mt-4 w-full"
                variant={isCorrect ? "primary" : "secondary"}
              >
                Próxima atividade →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Credenciais inválidas"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧩</div>
          <h1 className="text-2xl font-bold text-indigo-700">MathASD</h1>
          <p className="text-gray-500 text-sm mt-1">
            Plataforma Adaptativa de Matemática
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Entrar</h2>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3 text-base"
            >
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Não tem conta?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Cadastrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/app/register/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CHILD" | "GUARDIAN" | "EDUCATOR">("CHILD");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      setError("Você precisa aceitar a política de privacidade para continuar.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const tokens = await apiClient.post<{ access_token: string }>(
        "/auth/register",
        { name, email, password, role, lgpdConsent }
      );
      authService.storeTokens(tokens);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧩</div>
          <h1 className="text-xl font-bold text-indigo-700">MathASD</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Criar conta
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Perfil
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
              >
                <option value="CHILD">Estudante (criança)</option>
                <option value="GUARDIAN">Responsável</option>
                <option value="EDUCATOR">Educador / Terapeuta</option>
              </select>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-600">
                Concordo com a{" "}
                <Link href="/privacy" className="text-indigo-500 underline">
                  Política de Privacidade
                </Link>{" "}
                e autorizo o processamento de dados conforme a LGPD.
              </span>
            </label>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3 text-base"
            >
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MathASD — Plataforma Adaptativa de Matemática",
  description:
    "Plataforma adaptativa de ensino de matemática para crianças com TEA, alinhada à BNCC.",
  authors: [{ name: "MathASD Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
cssCopy/* FILE: frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --font-size-base: 16px;
}

/* Low stimulation mode support */
[data-stimulation="low"] {
  --color-primary: #4b5563;
  filter: saturate(0.6);
}

/* High contrast mode */
[data-contrast="high"] {
  --color-primary: #1e1b4b;
  background: #ffffff;
  color: #000000;
}

/* Focus ring for accessibility */
*:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Base accessible font sizing */
html {
  font-size: var(--font-size-base);
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}
typescriptCopy// FILE: frontend/src/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
typescriptCopy// FILE: frontend/src/app/(guardian)/guardian/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressChart } from "@/components/charts/progress-chart";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface ChildSummary {
  id: string;
  name: string;
  age?: number;
  totalSessions: number;
  averageScore: number;
  engagementIndex: number;
  lastActivityAt: string;
  progressData: { date: string; score: number; activities: number }[];
}

export default function GuardianDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "GUARDIAN")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const token = authService.getStoredToken();
    if (!token) return;

    apiClient
      .get<ChildSummary[]>("/guardian/children-summary", token)
      .then(setChildren)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-indigo-700 px-4 pt-10 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white text-xl font-bold">
            Olá, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            Acompanhe o progresso dos seus filhos
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        {children.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              Nenhuma criança vinculada ainda.
            </CardContent>
          </Card>
        )}

        {children.map((child) => (
          <Card key={child.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{child.name}</CardTitle>
                <Badge
                  variant={
                    child.engagementIndex >= 0.7
                      ? "success"
                      : child.engagementIndex >= 0.4
                      ? "warning"
                      : "error"
                  }
                >
                  {child.engagementIndex >= 0.7
                    ? "Engajado"
                    : child.engagementIndex >= 0.4
                    ? "Regular"
                    : "Precisa de atenção"}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Última atividade:{" "}
                {child.lastActivityAt
                  ? formatDate(child.lastActivityAt)
                  : "Nunca"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-indigo-50 rounded-xl p-2">
                  <p className="font-bold text-indigo-700">
                    {child.totalSessions}
                  </p>
                  <p className="text-xs text-gray-500">sessões</p>
                </div>
                <div className="text-center bg-green-50 rounded-xl p-2">
                  <p className="font-bold text-green-700">
                    {Math.round(child.averageScore * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">média</p>
                </div>
                <div className="text-center bg-purple-50 rounded-xl p-2">
                  <p className="font-bold text-purple-700">
                    {Math.round(child.engagementIndex * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">engajamento</p>
                </div>
              </div>
              <ProgressChart data={child.progressData} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
typescriptCopy// FILE: frontend/src/app/(educator)/educator/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface LearnerProfile {
  id: string;
  name: string;
  supportLevel: "MILD" | "MODERATE" | "STRONG";
  bnccCoverage: number;
  recentAdeDecisions: {
    id: string;
    reasoning: string;
    createdAt: string;
  }[];
}

interface EducatorStats {
  totalLearners: number;
  averageBnccCoverage: number;
  learners: LearnerProfile[];
}

export default function EducatorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<EducatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "EDUCATOR")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const token = authService.getStoredToken();
    if (!token) return;

    apiClient
      .get<EducatorStats>("/educator/stats", token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const supportLevelLabel = (level: string) => {
    const map: Record<string, string> = {
      MILD: "Suporte Leve",
      MODERATE: "Suporte Moderado",
      STRONG: "Suporte Intenso",
    };
    return map[level] || level;
  };

  const supportLevelVariant = (
    level: string
  ): "success" | "warning" | "error" => {
    if (level === "MILD") return "success";
    if (level === "MODERATE") return "warning";
    return "error";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-indigo-800 px-4 pt-10 pb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl font-bold">
            Dashboard do Educador
          </h1>
          {stats && (
            <div className="flex gap-4 mt-4">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-white font-bold">{stats.totalLearners}</p>
                <p className="text-indigo-300 text-xs">alunos</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-white font-bold">
                  {Math.round(stats.averageBnccCoverage * 100)}%
                </p>
                <p className="text-indigo-300 text-xs">cobertura BNCC</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-4">
        {stats?.learners.map((learner) => (
          <Card key={learner.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{learner.name}</CardTitle>
                <Badge variant={supportLevelVariant(learner.supportLevel)}>
                  {supportLevelLabel(learner.supportLevel)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cobertura BNCC:{" "}
                <span className="font-semibold">
                  {Math.round(learner.bnccCoverage * 100)}%
                </span>
              </p>
            </CardHeader>
            {learner.recentAdeDecisions.length > 0 && (
              <CardContent>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Últimas decisões ADE
                </p>
                <div className="space-y-2">
                  {learner.recentAdeDecisions.slice(0, 3).map((dec) => (
                    <div
                      key={dec.id}
                      className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600"
                    >
                      {dec.reasoning}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

Now the deployment and infrastructure files:
yamlCopy# FILE: docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: mathasd_postgres
    environment:
      POSTGRES_DB: mathasd
      POSTGRES_USER: mathasd_user
      POSTGRES_PASSWORD: mathasd_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/database/migrations/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mathasd_user -d mathasd"]
      interval: 10s
      timeout: 5s
      retries: 5

  redpanda:
    image: redpandadata/redpanda:latest
    container_name: mathasd_redpanda
    command:
      - redpanda
      - start
      - --smp 1
      - --memory 512M
      - --reserve-memory 0M
      - --overprovisioned
      - --node-id 0
      - --kafka-addr PLAINTEXT://0.0.0.0:29092,OUTSIDE://0.0.0.0:9092
      - --advertise-kafka-addr PLAINTEXT://redpanda:29092,OUTSIDE://localhost:9092
    ports:
      - "9092:9092"
      - "29092:29092"
    healthcheck:
      test: ["CMD-SHELL", "rpk cluster health | grep -E 'Healthy:.+true'"]
      interval: 15s
      timeout: 10s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mathasd_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://mathasd_user:mathasd_pass@postgres:5432/mathasd
      KAFKA_BROKERS: redpanda:29092
      JWT_SECRET: local_dev_secret_change_in_prod
      ML_SERVICE_URL: http://ml-service:8000
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redpanda:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    container_name: mathasd_ml
    environment:
      DATABASE_URL: postgresql://mathasd_user:mathasd_pass@postgres:5432/mathasd
      MODEL_PATH: /app/models
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
    container_name: mathasd_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  ml_models:
dockerfileCopy# FILE: backend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
dockerfileCopy# FILE: ml-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/models

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
dockerfileCopy# FILE: frontend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
bashCopy# FILE: backend/.env.example
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://mathasd_user:mathasd_pass@localhost:5432/mathasd

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=mathasd-backend
KAFKA_GROUP_ID=mathasd-consumers

# ML Service
ML_SERVICE_URL=http://localhost:8000

# LGPD
ENCRYPTION_KEY=32_char_encryption_key_here_____

# Logging
LOG_LEVEL=debug
bashCopy# FILE: ml-service/.env.example
DATABASE_URL=postgresql://mathasd_user:mathasd_pass@localhost:5432/mathasd
MODEL_PATH=./models
LOG_LEVEL=info
RELOAD=true
bashCopy# FILE: frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=MathASD
NEXT_PUBLIC_VERSION=1.0.0
jsonCopy// FILE: backend/package.json
{
  "name": "mathasd-backend",
  "version": "1.0.0",
  "description": "MathASD Backend — NestJS adaptive learning platform",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "db:migrate": "psql $DATABASE_URL -f src/database/migrations/schema.sql",
    "db:seed": "ts-node src/database/seeds/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.1.16",
    "@nestjs/throttler": "^5.1.1",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "kafkajs": "^2.2.4",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/pg": "^8.11.0",
    "@types/uuid": "^9.0.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
jsonCopy// FILE: frontend/package.json
{
  "name": "mathasd-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
javascriptCopy// FILE: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
javascriptCopy// FILE: frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["localhost", "supabase.co"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
tomlCopy# FILE: railway.toml  (backend deployment config)
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "node dist/main.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "mathasd-backend"
source = "backend"

[[services]]
name = "mathasd-ml"
source = "ml-service"
jsonCopy// FILE: vercel.json  (frontend deployment config)
{
  "framework": "nextjs",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm ci",
  "env": {
    "NEXT_PUBLIC_API_URL": "@mathasd_api_url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
markdownCopy# FILE: README.md

# 🧩 MathASD — Adaptive Math Platform for ASD

A web-based adaptive educational platform for teaching mathematics to children
(ages 6–10) with Autism Spectrum Disorder (ASD), aligned with the Brazilian
BNCC curriculum and grounded in ontology-based user modeling and Learning Analytics.

## 🏗️ Architecture
mathasd/
├── backend/          # NestJS (Node.js + TypeScript)
├── frontend/         # Next.js 14 (React + TypeScript)
├── ml-service/       # FastAPI (Python) — BKT + Engagement ML
├── docker-compose.yml
└── README.md
Copy
## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose (recommended)
- PostgreSQL 15 (or use Docker)

### Option A: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-org/mathasd.git
cd mathasd

# Copy env files
cp backend/.env.example