"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface Props {
  learnerId: string;
  decisionIds: string[];
}

interface TraceValue {
  status: "recorded" | "not_recorded";
  value: unknown;
}

interface ResearchExplanation {
  recommendationId: string;
  targetBnccSkill: string | null;
  studentSkillState: TraceValue;
  learningNeed: string;
  challengeFit: TraceValue;
  interactionFit: TraceValue;
  semanticFit: TraceValue;
  novelty: TraceValue;
  rejectionRisk: TraceValue;
  finalScore: TraceValue;
  candidateRanking: TraceValue;
  ontologyCandidateTrace: TraceValue;
  ontologyExclusionTrace: TraceValue;
  semanticInferences: TraceValue;
  evidenceUsed: Record<string, unknown>;
  weights: TraceValue;
  ontologyVersion: TraceValue;
  rankingVersion: TraceValue;
  recommendationOutcome: TraceValue;
}

const LABELS: Array<[keyof ResearchExplanation, string]> = [
  ["recommendationId", "Recommendation ID"],
  ["targetBnccSkill", "Target BNCC skill"],
  ["studentSkillState", "StudentSkillState / mastery"],
  ["learningNeed", "Learning Need"],
  ["challengeFit", "Challenge Fit"],
  ["interactionFit", "Interaction Fit"],
  ["semanticFit", "Semantic Fit"],
  ["novelty", "Novelty"],
  ["rejectionRisk", "Rejection Risk"],
  ["finalScore", "Final Score"],
  ["candidateRanking", "Candidate ranking"],
  ["ontologyCandidateTrace", "Ontology candidate trace"],
  ["ontologyExclusionTrace", "Ontology exclusion trace"],
  ["semanticInferences", "Semantic inferences"],
  ["evidenceUsed", "Evidence used"],
  ["weights", "Weights"],
  ["ontologyVersion", "Ontology version"],
  ["rankingVersion", "Ranking version"],
  ["recommendationOutcome", "Recommendation outcome"],
];

function formatValue(value: unknown): string {
  if (value && typeof value === "object" && "status" in value) {
    const trace = value as TraceValue;
    return trace.status === "not_recorded"
      ? "Not recorded by the current recommendation pipeline"
      : JSON.stringify(trace.value, null, 2);
  }
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function ResearchDebugPanel({ learnerId, decisionIds }: Props) {
  const [selectedId, setSelectedId] = useState(decisionIds[0] ?? "");
  const [trace, setTrace] = useState<ResearchExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const token = authService.getStoredToken();
    setTrace(null);
    setError(null);
    api.get<ResearchExplanation>(
      `/educator/learners/${learnerId}/ade-history/${selectedId}/research-explanation`,
      token ?? undefined,
    ).then(setTrace).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : "Trace unavailable");
    });
  }, [learnerId, selectedId]);

  if (decisionIds.length === 0) return null;

  return (
    <aside data-research-debug="true" className="mt-5 rounded-xl border-2 border-amber-400 bg-slate-950 p-4 text-slate-100">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-amber-300">RESEARCH DEBUG</p>
          <p className="text-xs text-slate-400">Authorized technical view; not part of child or guardian flows.</p>
        </div>
        <select
          aria-label="Recommendation decision"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="rounded bg-slate-800 px-2 py-1 font-mono text-xs"
        >
          {decisionIds.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!trace && !error && <p className="text-sm text-slate-400">Loading trace…</p>}
      {trace && (
        <dl className="grid gap-2 md:grid-cols-2">
          {LABELS.map(([key, label]) => (
            <div key={key} className="rounded border border-slate-800 bg-slate-900 p-2">
              <dt className="font-mono text-xs text-cyan-300">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-slate-300">
                {formatValue(trace[key])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}
