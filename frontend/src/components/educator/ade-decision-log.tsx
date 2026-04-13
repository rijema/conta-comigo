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