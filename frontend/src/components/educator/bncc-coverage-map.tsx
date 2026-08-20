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
      .get<Record<string, number>>(`/reports/bncc-coverage/${learnerId}`)
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
