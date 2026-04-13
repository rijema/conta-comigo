"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

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
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<EducatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "professional")) {
      router.push(`/${locale}/auth/login`);
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
