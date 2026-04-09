WHERE ARE WE IN THE PRODUCT?
Copy╔══════════════════════════════════════════════════════════════════════╗
║           ASD ADAPTIVE MATH PLATFORM — COMPLETION STATUS             ║
╠══════════════════════════════════════════════════════════════════════╣
║  Backend (NestJS)           ████████████████████░░  90%  ✅ DONE     ║
║  ML Service (FastAPI/BKT)   ████████████████████░░  90%  ✅ DONE     ║
║  Frontend (Next.js)         █████████████████░░░░░  78%  🔄 PARTIAL  ║
║  Database Schema            ████████████████████░░  90%  ✅ DONE     ║
║  Ontology Integration       ████████████████░░░░░░  75%  ✅ DONE     ║
║  Event System (Kafka)       ████████████████████░░  88%  ✅ DONE     ║
║  CI/CD & Deployment         ████████████████░░░░░░  72%  🔄 PARTIAL  ║
║  Auth & Security            ████████████████████░░  88%  ✅ DONE     ║
║  i18n (PT/EN)               ████████████████░░░░░░  70%  🔄 PARTIAL  ║
║  Observability/Logging      ████████████████░░░░░░  72%  🔄 PARTIAL  ║
╠══════════════════════════════════════════════════════════════════════╣
║  OVERALL                    ████████████████████░░  81%              ║
╚══════════════════════════════════════════════════════════════════════╝

  REMAINING THIS SESSION:
  → CI/CD deploy completion (Railway/Vercel configs)
  → Frontend: Guardian portal, Educator dashboard, activity renderer
  → i18n messages files
  → Observability (Prometheus metrics endpoint)
  → README + local run instructions
  → Docker Compose (local dev)
  → Academic value notes

Continuing from where the CI/CD workflow was cut off. Generating all remaining files now.

yamlCopy//# FILE: .github/workflows/deploy.yml  (COMPLETION — was cut mid-file)
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
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy ML to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ml-service

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Backend to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    needs: [deploy-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install frontend deps
        working-directory: frontend
        run: npm ci
      - name: Build frontend
        working-directory: frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_WS_URL: ${{ secrets.NEXT_PUBLIC_WS_URL }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: "--prod"
yamlCopy//# FILE: .github/workflows/pr-checks.yml
name: PR Quality Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
        working-directory: backend
      - run: npm run lint
        working-directory: backend
      - run: npm run format:check
        working-directory: backend

  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
        working-directory: backend
      - run: npm run build
        working-directory: backend

typescriptCopy//# FILE: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MathASD — Plataforma Adaptativa de Matemática",
  description:
    "Plataforma educacional adaptativa para crianças com TEA, alinhada à BNCC",
  keywords: ["autismo", "matemática", "educação adaptativa", "TEA", "BNCC"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
typescriptCopy//# FILE: frontend/src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (user.role === "child") {
        router.replace("/learn");
      } else if (user.role === "guardian") {
        router.replace("/guardian");
      } else if (user.role === "educator") {
        router.replace("/educator");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gentle-blue">
      <LoadingSpinner size="lg" label="Carregando..." />
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(data.email, data.password);
      if (user.role === "child") router.push("/learn");
      else if (user.role === "guardian") router.push("/guardian");
      else router.push("/educator");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="text-6xl mb-4"
            role="img"
            aria-label="Planeta com estrelas"
          >
            🌍✨
          </div>
          <h1 className="text-3xl font-bold text-blue-800">MathASD</h1>
          <p className="text-gray-500 mt-2">
            Aprendendo matemática do nosso jeito
          </p>
        </div>

        <Card className="p-6 shadow-lg border-2 border-blue-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className="text-lg p-3"
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
                className="text-lg p-3"
              />
              {errors.password && (
                <p id="password-error" className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
              aria-label="Entrar na plataforma"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/auth/register"
              className="text-blue-600 hover:underline focus:ring-2 focus:ring-blue-300 rounded"
            >
              Criar nova conta
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/app/learn/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StarReward } from "@/components/ui/star-reward";
import { SensoryControls } from "@/components/ui/sensory-controls";
import { BNCCBadge } from "@/components/ui/bncc-badge";
import { api } from "@/lib/api-client";
import type { Activity, SessionState } from "@/types";

export default function LearnPage() {
  const { user } = useAuth();
  const { session, startSession, submitAnswer, isLoading } = useSession();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    if (user && !session) {
      startSession();
    }
  }, [user, session]);

  useEffect(() => {
    if (session?.currentActivity) {
      setCurrentActivity(session.currentActivity);
    }
  }, [session]);

  const handleAnswer = async (answer: any) => {
    if (!currentActivity) return;

    const result = await submitAnswer({
      activityId: currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session?.activityStartTime || Date.now()),
    });

    if (result.isCorrect) {
      setStars((s) => s + 1);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
    }
  };

  if (isLoading || !currentActivity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🌟</div>
          <p className="text-xl text-blue-700 font-bold">
            Preparando sua atividade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-learn-bg transition-all duration-300">
      {/* Top Bar */}
      <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">MathASD</span>
          <BNCCBadge skillCode={currentActivity.bnccSkillCode} />
        </div>

        <div className="flex items-center gap-3">
          {/* Stars counter */}
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-yellow-700">{stars}</span>
          </div>
          <SensoryControls />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-3">
        <ProgressBar
          value={session?.progress || 0}
          max={100}
          label={`Progresso: ${session?.progress || 0}%`}
        />
      </div>

      {/* Activity Area */}
      <main className="max-w-2xl mx-auto p-4">
        <ActivityRenderer
          activity={currentActivity}
          onAnswer={handleAnswer}
          sensoryProfile={user?.childProfile?.sensoryProfile}
        />
      </main>

      {/* Reward animation */}
      {showReward && <StarReward />}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/app/guardian/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { ProgressChart } from "@/components/charts/progress-chart";
import { SessionHistoryTable } from "@/components/tables/session-history-table";
import { SkillMasteryGrid } from "@/components/charts/skill-mastery-grid";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConsentManager } from "@/components/lgpd/consent-manager";
import type { LearnerReport } from "@/types";

export default function GuardianPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<LearnerReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (user?.guardianChildren?.length > 0) {
      setSelectedChild(user.guardianChildren[0].id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchReport(selectedChild);
    }
  }, [selectedChild]);

  const fetchReport = async (childId: string) => {
    setIsLoading(true);
    try {
      const data = await api.get(`/reports/guardian/${childId}`);
      setReport(data);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Portal do Responsável
        </h1>
        <p className="text-gray-500 text-sm">
          Acompanhe o progresso do seu filho
        </p>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Child selector */}
        {user?.guardianChildren?.length > 1 && (
          <div className="flex gap-2">
            {user.guardianChildren.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-full border-2 transition-colors ${
                  selectedChild === child.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
                aria-pressed={selectedChild === child.id}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* Alerts */}
        {report?.alerts?.map((alert: any, i: number) => (
          <AlertBanner key={i} alert={alert} />
        ))}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="🎯"
            label="Atividades Hoje"
            value={report?.todayActivities || 0}
          />
          <StatCard
            icon="⭐"
            label="Estrelas Total"
            value={report?.totalStars || 0}
          />
          <StatCard
            icon="📚"
            label="Habilidades Dominadas"
            value={report?.masteredSkills || 0}
          />
          <StatCard
            icon="🔥"
            label="Dias Consecutivos"
            value={report?.streakDays || 0}
          />
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Progresso Semanal
          </h2>
          <ProgressChart data={report?.weeklyProgress || []} />
        </div>

        {/* BNCC Skill Mastery */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Habilidades BNCC
          </h2>
          <SkillMasteryGrid skills={report?.bnccSkills || []} />
        </div>

        {/* Session History */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Histórico de Sessões
          </h2>
          <SessionHistoryTable sessions={report?.recentSessions || []} />
        </div>

        {/* LGPD */}
        <ConsentManager />
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/app/educator/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { ADEDecisionLog } from "@/components/educator/ade-decision-log";
import { BNCCCoverageMap } from "@/components/educator/bncc-coverage-map";
import { LearnerProfileCard } from "@/components/educator/learner-profile-card";
import { EngagementChart } from "@/components/charts/engagement-chart";

export default function EducatorPage() {
  const { user } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [adeDecisions, setAdeDecisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLearners();
  }, []);

  useEffect(() => {
    if (selectedLearner) {
      fetchADEDecisions(selectedLearner);
    }
  }, [selectedLearner]);

  const fetchLearners = async () => {
    try {
      const data = await api.get("/users/educator/learners");
      setLearners(data);
      if (data.length > 0) setSelectedLearner(data[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchADEDecisions = async (learnerId: string) => {
    const data = await api.get(`/ade/decisions/${learnerId}?limit=20`);
    setAdeDecisions(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Painel do Educador
        </h1>
        <p className="text-slate-500 text-sm">
          Analytics e decisões adaptativas
        </p>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Learner List Sidebar */}
          <aside className="col-span-3">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-slate-700 mb-3">Alunos</h2>
              <div className="space-y-2">
                {learners.map((learner) => (
                  <button
                    key={learner.id}
                    onClick={() => setSelectedLearner(learner.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedLearner === learner.id
                        ? "bg-blue-50 border-2 border-blue-300"
                        : "hover:bg-slate-50 border-2 border-transparent"
                    }`}
                    aria-pressed={selectedLearner === learner.id}
                  >
                    <div className="font-medium text-slate-800">
                      {learner.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Nível {learner.supportLevel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-9 space-y-6">
            {selectedLearner && (
              <>
                <LearnerProfileCard learnerId={selectedLearner} />

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="font-semibold text-slate-700 mb-3">
                      Engajamento
                    </h3>
                    <EngagementChart learnerId={selectedLearner} />
                  </div>

                  <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="font-semibold text-slate-700 mb-3">
                      Cobertura BNCC
                    </h3>
                    <BNCCCoverageMap learnerId={selectedLearner} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-5">
                  <h3 className="font-semibold text-slate-700 mb-3">
                    Log de Decisões ADE{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      (XAI)
                    </span>
                  </h3>
                  <ADEDecisionLog decisions={adeDecisions} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/activity/activity-renderer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MultipleChoiceActivity } from "./multiple-choice-activity";
import { DragDropActivity } from "./drag-drop-activity";
import { CountingActivity } from "./counting-activity";
import { NumberLineActivity } from "./number-line-activity";
import type { Activity, SensoryProfile } from "@/types";

interface ActivityRendererProps {
  activity: Activity;
  onAnswer: (answer: any) => void;
  sensoryProfile?: SensoryProfile;
}

export function ActivityRenderer({
  activity,
  onAnswer,
  sensoryProfile,
}: ActivityRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());

  // Apply sensory adjustments
  const containerStyle: React.CSSProperties = {
    fontSize: sensoryProfile?.fontSize || "1.125rem",
    lineHeight: sensoryProfile?.lineHeight || "1.75",
    backgroundColor: sensoryProfile?.backgroundColor || "#fafafa",
  };

  // Auto-focus for accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, [activity.id]);

  const handleAnswer = (answer: any) => {
    onAnswer({
      ...answer,
      timeSpentMs: Date.now() - startTime,
    });
  };

  const renderActivity = () => {
    switch (activity.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "drag_drop":
        return (
          <DragDropActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "counting":
        return (
          <CountingActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "number_line":
        return (
          <NumberLineActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      default:
        return (
          <MultipleChoiceActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      style={containerStyle}
      className="outline-none"
      aria-label={`Atividade: ${activity.title}`}
      role="main"
    >
      {/* Activity Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {activity.bnccSkillCode}
          </span>
          <DifficultyIndicator level={activity.difficulty} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{activity.title}</h2>
        {activity.instructions && (
          <p className="text-gray-600 mt-1">{activity.instructions}</p>
        )}
      </div>

      {/* Activity Content */}
      <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-50">
        {renderActivity()}
      </div>
    </div>
  );
}

function DifficultyIndicator({ level }: { level: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < level);
  return (
    <div
      className="flex gap-0.5"
      aria-label={`Dificuldade: ${level} de 5 estrelas`}
    >
      {stars.map((filled, i) => (
        <span key={i} className={filled ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/activity/multiple-choice-activity.tsx
"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { selectedOption: string; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function MultipleChoiceActivity({
  activity,
  onAnswer,
  sensoryProfile,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const handleSelect = (optionId: string) => {
    if (submitted) return;
    setSelected(optionId);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);

    const selectedOption = activity.options?.find((o) => o.id === selected);
    const isCorrect = selectedOption?.isCorrect || false;
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      onAnswer({ selectedOption: selected, isCorrect });
    }, 1500);
  };

  const lowStimulation = sensoryProfile?.lowStimulationMode;

  return (
    <div>
      {/* Question */}
      <div className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
        {activity.content?.question}
      </div>

      {/* Visual representation (if any) */}
      {activity.content?.imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={activity.content.imageUrl}
            alt={activity.content.imageAlt || "Imagem da questão"}
            className="max-h-48 rounded-lg"
          />
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {activity.options?.map((option) => {
          const isSelected = selected === option.id;
          const showResult = submitted && isSelected;

          let buttonClass =
            "p-4 rounded-xl border-3 text-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-blue-300 ";

          if (showResult) {
            buttonClass += option.isCorrect
              ? "border-green-500 bg-green-50 text-green-800 scale-105"
              : "border-red-400 bg-red-50 text-red-800";
          } else if (isSelected) {
            buttonClass +=
              "border-blue-500 bg-blue-50 text-blue-800 scale-102";
          } else {
            buttonClass += lowStimulation
              ? "border-gray-200 bg-white text-gray-800 hover:border-blue-300"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={buttonClass}
              aria-pressed={isSelected}
              aria-label={`Opção: ${option.text}`}
              disabled={submitted}
            >
              {option.emoji && (
                <span className="text-2xl mr-2">{option.emoji}</span>
              )}
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-center py-3 px-4 rounded-xl text-lg font-bold ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Muito bem!" : "💙 Tente novamente!"}
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full mt-4 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl 
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     focus:ring-4 focus:ring-blue-300 transition-colors"
          aria-label="Confirmar resposta"
        >
          Confirmar ✓
        </button>
      )}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/activity/counting-activity.tsx
"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { count: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function CountingActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const items = activity.content?.items || [];
  const targetCount = activity.content?.targetCount || items.length;
  const itemEmoji = activity.content?.itemEmoji || "🍎";

  const handleCount = () => {
    if (submitted) return;
    if (count < items.length) {
      setCount((c) => c + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect = count === targetCount;
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => onAnswer({ count, isCorrect }), 1500);
  };

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-6">
        {activity.content?.question || `Quantos ${itemEmoji} você vê?`}
      </p>

      {/* Items to count */}
      <div
        className="flex flex-wrap gap-3 justify-center mb-8 p-4 bg-blue-50 rounded-xl"
        role="group"
        aria-label="Itens para contar"
      >
        {items.map((_: any, i: number) => (
          <span
            key={i}
            className={`text-4xl cursor-pointer select-none transition-transform ${
              i < count ? "scale-110 opacity-100" : "opacity-40"
            }`}
            onClick={handleCount}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCount()}
            aria-label={`Item ${i + 1}${i < count ? " contado" : ""}`}
          >
            {itemEmoji}
          </span>
        ))}
      </div>

      {/* Counter display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-blue-700">{count}</div>
        <p className="text-gray-500 mt-1">Você contou {count}</p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-center py-3 rounded-xl text-lg font-bold mb-4 ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Correto!" : `💙 A resposta é ${targetCount}`}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setCount(0)}
          disabled={submitted}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50"
        >
          Recomeçar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitted || count === 0}
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
        >
          Confirmar ✓
        </button>
      </div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/activity/drag-drop-activity.tsx
"use client";

import { useState } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { arrangement: string[]; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function DragDropActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const items = activity.content?.items || [];
  const [slots, setSlots] = useState<(string | null)[]>(
    new Array(activity.content?.slotCount || items.length).fill(null)
  );
  const [available, setAvailable] = useState<string[]>(
    items.map((item: any) => item.id)
  );
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const handleDrop = (slotIndex: number) => {
    if (!dragItem || submitted) return;
    const newSlots = [...slots];
    const prevSlotIndex = newSlots.indexOf(dragItem);
    if (prevSlotIndex !== -1) newSlots[prevSlotIndex] = null;
    else setAvailable((av) => av.filter((id) => id !== dragItem));
    if (newSlots[slotIndex]) {
      setAvailable((av) => [...av, newSlots[slotIndex]!]);
    }
    newSlots[slotIndex] = dragItem;
    setSlots(newSlots);
    setDragItem(null);
  };

  const handleSubmit = () => {
    if (slots.some((s) => s === null)) return;
    setSubmitted(true);
    const correctOrder = activity.content?.correctOrder || [];
    const isCorrect = slots.every((s, i) => s === correctOrder[i]);
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => onAnswer({ arrangement: slots as string[], isCorrect }), 1500);
  };

  const getItem = (id: string) => items.find((i: any) => i.id === id);

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-6">
        {activity.content?.question || "Organize os itens na ordem correta"}
      </p>

      {/* Available items */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-yellow-50 rounded-xl min-h-16">
        {available.map((id) => {
          const item = getItem(id);
          return (
            <div
              key={id}
              draggable={!submitted}
              onDragStart={() => setDragItem(id)}
              className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg cursor-grab 
                         text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
              role="button"
              tabIndex={0}
              aria-label={`Item: ${item?.label}`}
            >
              {item?.emoji && <span className="mr-1">{item.emoji}</span>}
              {item?.label}
            </div>
          );
        })}
      </div>

      {/* Drop slots */}
      <div className="flex gap-3 mb-6 justify-center">
        {slots.map((slotContent, i) => (
          <div
            key={i}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className={`w-20 h-20 border-3 border-dashed rounded-xl flex items-center justify-center
                       transition-colors ${
                         slotContent
                           ? "border-blue-400 bg-blue-50"
                           : "border-gray-300 bg-gray-50"
                       }`}
            aria-label={`Posição ${i + 1}${slotContent ? `: ${getItem(slotContent)?.label}` : ": vazia"}`}
            role="region"
          >
            {slotContent ? (
              <span className="text-sm font-medium text-blue-700">
                {getItem(slotContent)?.label}
              </span>
            ) : (
              <span className="text-gray-300 text-2xl">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {feedback && (
        <div
          role="status"
          className={`text-center py-3 rounded-xl text-lg font-bold mb-4 ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct" ? "🎉 Perfeito!" : "💙 Quase lá!"}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitted || slots.some((s) => s === null)}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl 
                   hover:bg-blue-700 disabled:bg-gray-300 focus:ring-4 focus:ring-blue-300"
      >
        Confirmar ✓
      </button>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/activity/number-line-activity.tsx
"use client";

import { useState, useRef } from "react";
import type { Activity, SensoryProfile } from "@/types";

interface Props {
  activity: Activity;
  onAnswer: (answer: { value: number; isCorrect: boolean }) => void;
  sensoryProfile?: SensoryProfile;
}

export function NumberLineActivity({ activity, onAnswer, sensoryProfile }: Props) {
  const { min = 0, max = 10, target, step = 1 } = activity.content || {};
  const [value, setValue] = useState(min);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const marks = [];
  for (let i = min; i <= max; i += step) marks.push(i);

  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect = value === target;
    setFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => onAnswer({ value, isCorrect }), 1500);
  };

  return (
    <div>
      <p className="text-xl font-semibold text-gray-800 mb-8">
        {activity.content?.question || `Marque o número ${target} na reta numérica`}
      </p>

      {/* Number line */}
      <div className="relative mb-8 px-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !submitted && setValue(Number(e.target.value))}
          disabled={submitted}
          className="w-full h-4 accent-blue-500 cursor-pointer"
          aria-label={`Reta numérica de ${min} a ${max}. Valor atual: ${value}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        {/* Marks */}
        <div className="flex justify-between mt-2">
          {marks.map((m) => (
            <span
              key={m}
              className={`text-sm font-medium ${
                m === value ? "text-blue-700 font-bold" : "text-gray-500"
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Current value display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-700">{value}</div>
        <p className="text-gray-500 mt-1">Número selecionado</p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`text-center py-3 rounded-xl text-lg font-bold mb-4 ${
            feedback === "correct"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {feedback === "correct"
            ? "🎉 Correto!"
            : `💙 O número correto é ${target}`}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitted}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl 
                   hover:bg-blue-700 disabled:bg-gray-300 focus:ring-4 focus:ring-blue-300"
      >
        Confirmar ✓
      </button>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/sensory-controls.tsx
"use client";

import { useState } from "react";
import { useSensoryProfile } from "@/hooks/use-sensory-profile";

export function SensoryControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, updateProfile } = useSensoryProfile();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors 
                   focus:ring-2 focus:ring-blue-300"
        aria-label="Configurações de acessibilidade"
        aria-expanded={isOpen}
      >
        ⚙️
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border p-4 w-72 z-50"
          role="dialog"
          aria-label="Configurações sensoriais"
        >
          <h3 className="font-semibold text-gray-800 mb-4">
            Personalização Visual
          </h3>

          {/* Low Stimulation Mode */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-600">
              Modo baixa estimulação
            </label>
            <button
              onClick={() =>
                updateProfile({
                  lowStimulationMode: !profile.lowStimulationMode,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                profile.lowStimulationMode ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={profile.lowStimulationMode}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  profile.lowStimulationMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Font size */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-2">
              Tamanho do texto
            </label>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateProfile({ fontSize: size })}
                  className={`flex-1 py-1 rounded border text-xs ${
                    profile.fontSize === size
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                  aria-pressed={profile.fontSize === size}
                >
                  {size === "small" ? "A" : size === "medium" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>

          {/* High contrast */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-600">Alto contraste</label>
            <button
              onClick={() =>
                updateProfile({ highContrast: !profile.highContrast })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                profile.highContrast ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={profile.highContrast}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  profile.highContrast ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Background color */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Cor de fundo
            </label>
            <div className="flex gap-2">
              {["#ffffff", "#fef9c3", "#dbeafe", "#f0fdf4"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateProfile({ backgroundColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    profile.backgroundColor === color
                      ? "border-blue-500 scale-110"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Cor de fundo ${color}`}
                  aria-pressed={profile.backgroundColor === color}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/progress-bar.tsx
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  color = "bg-blue-500",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100));

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`${color} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/star-reward.tsx
"use client";

import { useEffect, useState } from "react";

export function StarReward() {
  const [stars, setStars] = useState<
    { x: number; y: number; delay: number }[]
  >([]);

  useEffect(() => {
    const s = Array.from({ length: 8 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setStars(s);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      aria-live="polite"
      aria-label="Ótimo trabalho! Você ganhou uma estrela!"
      role="status"
    >
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute text-4xl animate-bounce"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
          }}
        >
          ⭐
        </div>
      ))}
      <div className="text-6xl animate-pulse">🎉</div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/bncc-badge.tsx
interface BNCCBadgeProps {
  skillCode?: string;
}

export function BNCCBadge({ skillCode }: BNCCBadgeProps) {
  if (!skillCode) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 
                 text-purple-700 text-xs font-mono rounded border border-purple-200"
      title={`Habilidade BNCC: ${skillCode}`}
    >
      📚 {skillCode}
    </span>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/loading-spinner.tsx
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  label = "Carregando...",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  return (
    <div className="flex flex-col items-center gap-2" role="status">
      <div
        className={`${sizeClass} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/ui/alert-banner.tsx
interface Alert {
  type: "info" | "warning" | "success";
  message: string;
}

export function AlertBanner({ alert }: { alert: Alert }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const icons = { info: "ℹ️", warning: "⚠️", success: "✅" };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles[alert.type]}`}
      role="alert"
    >
      <span aria-hidden="true">{icons[alert.type]}</span>
      <span className="text-sm">{alert.message}</span>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/lgpd/consent-manager.tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

export function ConsentManager() {
  const [consent, setConsent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConsent();
  }, []);

  const loadConsent = async () => {
    try {
      const data = await api.get("/users/consent");
      setConsent(data);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (type: string, value: boolean) => {
    await api.patch("/users/consent", { [type]: value });
    setConsent((prev: any) => ({ ...prev, [type]: value }));
  };

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        🔒 Privacidade dos Dados (LGPD)
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Seus dados são protegidos conforme a Lei Geral de Proteção de Dados
        (LGPD). Gerencie suas preferências abaixo.
      </p>

      <div className="space-y-3">
        {[
          {
            key: "analyticsConsent",
            label: "Dados de uso para melhorar a plataforma",
            desc: "Permite análise anônima de padrões de aprendizado",
          },
          {
            key: "researchConsent",
            label: "Uso em pesquisa acadêmica",
            desc: "Dados anonimizados podem ser usados em pesquisas sobre TEA",
          },
          {
            key: "notificationsConsent",
            label: "Notificações de progresso",
            desc: "Receber alertas sobre o desenvolvimento",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <div className="text-sm font-medium text-gray-700">
                {item.label}
              </div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
            <button
              onClick={() => updateConsent(item.key, !consent?.[item.key])}
              className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
                consent?.[item.key] ? "bg-blue-500" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={consent?.[item.key]}
              aria-label={item.label}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  consent?.[item.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Para exportar ou excluir seus dados, entre em contato:{" "}
        <a href="mailto:privacidade@mathasd.edu.br" className="underline">
          privacidade@mathasd.edu.br
        </a>
      </div>
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/language-switcher.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1">
      {["pt", "en"].map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            locale === l
              ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
          aria-pressed={locale === l}
          aria-label={`Mudar idioma para ${l === "pt" ? "Português" : "English"}`}
        >
          {l === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
        </button>
      ))}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/educator/ade-decision-log.tsx
"use client";

interface ADEDecision {
  id: string;
  createdAt: string;
  input: any;
  output: any;
  xaiRecord: {
    rules_applied: string[];
    ml_confidence: number;
    ontology_state: Record<string, any>;
    reasoning_steps: string[];
  };
}

interface Props {
  decisions: ADEDecision[];
}

export function ADEDecisionLog({ decisions }: Props) {
  if (decisions.length === 0) {
    return (
      <p className="text-gray-400 text-sm">Nenhuma decisão registrada ainda.</p>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {decisions.map((decision) => (
        <details key={decision.id} className="border rounded-lg">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-mono">
                {new Date(decision.createdAt).toLocaleString("pt-BR")}
              </span>
              <span className="text-sm font-medium text-gray-700">
                → Atividade:{" "}
                {decision.output?.nextActivity?.type || "N/A"} | Dificuldade:{" "}
                {decision.output?.difficultyAdjustment}
              </span>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
              {(decision.xaiRecord?.ml_confidence * 100 || 0).toFixed(0)}%
              confiança
            </span>
          </summary>

          <div className="px-4 pb-4">
            {/* Reasoning steps */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Passos do Raciocínio
              </h4>
              <ol className="list-decimal list-inside space-y-1">
                {decision.xaiRecord?.reasoning_steps?.map((step, i) => (
                  <li key={i} className="text-xs text-gray-600">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Rules applied */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Regras Aplicadas
              </h4>
              <div className="flex flex-wrap gap-1">
                {decision.xaiRecord?.rules_applied?.map((rule, i) => (
                  <span
                    key={i}
                    className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200"
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>

            {/* Raw JSON (collapsed) */}
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer">
                Ver JSON completo
              </summary>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(decision, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/educator/bncc-coverage-map.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

const BNCC_UNITS = [
  "Números",
  "Álgebra",
  "Geometria",
  "Grandezas e Medidas",
  "Probabilidade e Estatística",
];

interface Props {
  learnerId: string;
}

export function BNCCCoverageMap({ learnerId }: Props) {
  const [coverage, setCoverage] = useState<Record<string, number>>({});

  useEffect(() => {
    api
      .get(`/reports/bncc-coverage/${learnerId}`)
      .then((data) => setCoverage(data));
  }, [learnerId]);

  return (
    <div className="space-y-3">
      {BNCC_UNITS.map((unit) => {
        const pct = coverage[unit] || 0;
        const color =
          pct >= 70
            ? "bg-green-500"
            : pct >= 40
              ? "bg-yellow-400"
              : "bg-red-400";
        return (
          <div key={unit}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{unit}</span>
              <span className="font-medium">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
typescriptCopy//# FILE: frontend/src/components/educator/learner-profile-card.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export function LearnerProfileCard({ learnerId }: { learnerId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.get(`/users/child-profile/${learnerId}`).then(setProfile);
  }, [learnerId]);

  if (!profile) return null;

  const supportLevelColor = {
    mild: "bg-green-100 text-green-700 border-green-300",
    moderate: "bg-yellow-100 text-yellow-700 border-yellow-300",
    substantial: "bg-red-100 text-red-700 border-red-300",
  }[profile.supportLevel as string] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-slate-500 text-sm">
            {profile.age} anos • {profile.schoolYear}º ano
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${supportLevelColor}`}
        >
          Suporte {profile.supportLevel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">
            {profile.masteryLevel}%
          </div>
          <div className="text-xs text-gray-500">Domínio BKT</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-700">
            {profile.engagementScore}
          </div>
          <div className="text-xs text-gray-500">Engajamento</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">
            {profile.totalSessions}
          </div>
          <div className="text-xs text-gray-500">Sessões</div>
        </div>
      </div>

      {/* Strengths/Weaknesses from ontology */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Pontos Fortes
          </h3>
          <div className="flex flex-wrap gap-1">
            {profile.ontologyStrengths?.map((s: string) => (
              <span
                key={s}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Áreas de Atenção
          </h3>
          <div className="flex flex-wrap gap-1">
            {profile.ontologyWeaknesses?.map((w: string) => (
              <span
                key={w}
                className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
