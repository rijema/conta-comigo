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