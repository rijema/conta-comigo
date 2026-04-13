"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { ADEDecisionLog } from "@/components/educator/ade-decision-log";
import { BNCCCoverageMap } from "@/components/educator/bncc-coverage-map";
import { LearnerProfileCard } from "@/components/educator/learner-profile-card";
import { EngagementBarChart } from "@/components/charts/engagement-bar-chart";

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
                    <EngagementBarChart data={[]} />
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