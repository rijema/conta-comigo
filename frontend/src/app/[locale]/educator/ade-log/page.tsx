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
      .get<AdeDecision[]>("/ade/decisions?limit=50")
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