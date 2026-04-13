"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressChart } from "@/components/charts/progress-chart";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";

interface ChildSummary {
  id: string;
  name: string;
  email: string;
  age?: number;
  totalSessions: number;
  averageScore: number;
  engagementIndex: number;
  lastActivityAt: string;
  progressData: { date: string; score: number; activities: number }[];
}

export default function GuardianDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "guardian")) {
      router.push(`/${locale}/auth/login`);
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
              <p className="text-xs text-blue-500 mt-1">
                Login da criança: <span className="font-mono">{child.email}</span>
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
