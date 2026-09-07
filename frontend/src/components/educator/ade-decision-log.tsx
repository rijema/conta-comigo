"use client";

interface ProfessionalExplanation {
  summary: string;
  learningNeed: string;
  estimatedMastery: string;
  activityFormatReason: string;
}

interface ADEDecision {
  id: string;
  createdAt: string;
  recommendedBnccSkill?: string;
  professionalExplanation?: ProfessionalExplanation;
}

interface Props {
  decisions: ADEDecision[];
}

export function ADEDecisionLog({ decisions }: Props) {
  if (decisions.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma decisão registrada ainda.</p>;
  }

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      {decisions.map((decision) => (
        <article key={decision.id} className="rounded-lg border p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono text-gray-400">
              {new Date(decision.createdAt).toLocaleString("pt-BR")}
            </span>
            <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {decision.recommendedBnccSkill ?? "Habilidade não registrada"}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            {decision.professionalExplanation?.summary ??
              "A explicação pedagógica não está disponível para esta decisão histórica."}
          </p>
          {decision.professionalExplanation && (
            <details className="mt-3 text-xs text-gray-600">
              <summary className="cursor-pointer font-semibold text-blue-700">Ver detalhes</summary>
              <div className="mt-2 space-y-1 rounded bg-gray-50 p-3">
                <p><strong>Necessidade atual:</strong> {decision.professionalExplanation.learningNeed}</p>
                <p><strong>Domínio estimado:</strong> {decision.professionalExplanation.estimatedMastery}</p>
                <p><strong>Formato:</strong> {decision.professionalExplanation.activityFormatReason}</p>
              </div>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
