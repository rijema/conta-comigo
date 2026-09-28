"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api-client";

/**
 * [PROPOSTA CONTA COMIGO]: Longitudinal Review Evidence Component
 * 
 * Displays session-to-session progression for review activities:
 * - BNCC skill
 * - Baseline vs review performance
 * - Deltas (changes)
 * - Evidence sufficiency
 * - Conservative Portuguese classification
 * - Preserves null as "Não disponível"
 */
interface ReviewOutcome {
  id: string;
  skillId: string;
  baselineMetrics: {
    accuracy: number | null;
    masteryProbability: number | null;
    averageResponseTimeMs: number | null;
  };
  reviewMetrics: {
    accuracy: number | null;
    masteryProbability: number | null;
    averageResponseTimeMs: number | null;
  };
  deltas: {
    accuracyDelta: number | null;
    masteryDelta: number | null;
    responseTimeDelta: number | null;
  };
  progressionClassification: "IMPROVED" | "STABLE" | "NEEDS_SUPPORT" | "INCONCLUSIVE";
  evidenceSignals: string[];
  metadata: {
    daysSinceBaseline: number | null;
  };
}

export function LongitudinalReviewEvidence({ learnerId }: { learnerId: string }) {
  const [outcomes, setOutcomes] = useState<ReviewOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId) return;

    const fetchOutcomes = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<ReviewOutcome[]>(
          `/learning-events/review-outcomes/${learnerId}`
        );
        setOutcomes(data || []);
      } catch (err) {
        setError("Não foi possível carregar dados de evolução");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutcomes();
  }, [learnerId]);

  const classificationLabels = useMemo(() => ({
    IMPROVED: "Progrediu",
    STABLE: "Manteve-se",
    NEEDS_SUPPORT: "Precisa de apoio",
    INCONCLUSIVE: "Dados insuficientes",
  }), []);

  const classificationColors = useMemo(() => ({
    IMPROVED: "bg-green-50 border-green-200",
    STABLE: "bg-blue-50 border-blue-200",
    NEEDS_SUPPORT: "bg-orange-50 border-orange-200",
    INCONCLUSIVE: "bg-gray-50 border-gray-200",
  }), []);

  const getClassificationLabel = (classification: string): string => {
    return classificationLabels[classification as keyof typeof classificationLabels] || classification;
  };

  const getClassificationColor = (classification: string): string => {
    return classificationColors[classification as keyof typeof classificationColors] || "bg-gray-50 border-gray-200";
  };

  const formatMetric = (value: number | null): string => {
    if (value === null) return "Não disponível";
    if (typeof value === "number") {
      if (value < 1) return `${(value * 100).toFixed(0)}%`;
      if (value > 100) return `${value.toFixed(0)}ms`;
      return value.toFixed(2);
    }
    return "Não disponível";
  };

  const formatDelta = (delta: number | null): string => {
    if (delta === null) return "Não disponível";
    const sign = delta > 0 ? "+" : "";
    if (delta < 1) return `${sign}${(delta * 100).toFixed(0)}%`;
    return `${sign}${delta.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (outcomes.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-slate-600 text-sm">
          Nenhuma atividade de revisão completada ainda.
        </p>
      </div>
    );
  }

  const outcomeElements = useMemo(() => 
    outcomes.map((outcome) => (
        <div
          key={outcome.id}
          className={`border rounded-lg p-4 ${getClassificationColor(
            outcome.progressionClassification
          )}`}
        >
          {/* Header: Skill + Classification */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-800">
                Habilidade: {outcome.skillId}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {getClassificationLabel(outcome.progressionClassification)}
              </p>
            </div>
            {outcome.metadata.daysSinceBaseline !== null && (
              <div className="text-xs text-slate-500">
                {outcome.metadata.daysSinceBaseline} dias após
              </div>
            )}
          </div>

          {/* Baseline vs Review Comparison */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <p className="text-slate-600 font-medium mb-2">Linha de base</p>
              <div className="space-y-1 text-slate-700">
                <p>
                  Acurácia:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.baselineMetrics.accuracy)}
                  </span>
                </p>
                <p>
                  Domínio:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.baselineMetrics.masteryProbability)}
                  </span>
                </p>
                <p>
                  Tempo:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.baselineMetrics.averageResponseTimeMs)}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-600 font-medium mb-2">Revisão</p>
              <div className="space-y-1 text-slate-700">
                <p>
                  Acurácia:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.reviewMetrics.accuracy)}
                  </span>
                </p>
                <p>
                  Domínio:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.reviewMetrics.masteryProbability)}
                  </span>
                </p>
                <p>
                  Tempo:{" "}
                  <span className="font-mono">
                    {formatMetric(outcome.reviewMetrics.averageResponseTimeMs)}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-600 font-medium mb-2">Mudança</p>
              <div className="space-y-1 text-slate-700">
                <p>
                  Acurácia:{" "}
                  <span className="font-mono">
                    {formatDelta(outcome.deltas.accuracyDelta)}
                  </span>
                </p>
                <p>
                  Domínio:{" "}
                  <span className="font-mono">
                    {formatDelta(outcome.deltas.masteryDelta)}
                  </span>
                </p>
                <p>
                  Tempo:{" "}
                  <span className="font-mono">
                    {formatDelta(outcome.deltas.responseTimeDelta)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Signals */}
          {outcome.evidenceSignals.length > 0 && (
            <div className="text-xs">
              <p className="text-slate-600 font-medium mb-2">Sinais observados:</p>
              <div className="flex flex-wrap gap-2">
                {outcome.evidenceSignals.map((signal, idx) => (
                  <span
                    key={idx}
                    className="bg-white bg-opacity-60 px-2 py-1 rounded border border-slate-300 text-slate-700"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-3 pt-3 border-t border-slate-300 border-opacity-50 text-xs text-slate-600">
            <p>
              Observação: Esta análise compara desempenho entre sessões. Não implica causalidade.
              Dados insuficientes são preservados como &quot;Não disponível&quot;.
            </p>
          </div>
        </div>
      )),
    [outcomes, getClassificationColor, getClassificationLabel, formatMetric, formatDelta]
  );

  return (
    <div className="space-y-4">
      {outcomeElements}
    </div>
  );
}
