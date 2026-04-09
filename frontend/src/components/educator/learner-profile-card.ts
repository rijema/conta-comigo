"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export function LearnerProfileCard({ learnerId }: { learnerId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.get(`/users/child-profile/${learnerId}`).then(setProfile);
  }, [learnerId]);

  if (!profile) return null;

  const supportLevelColor = {
    mild: "bg-green-100 text-green-700 border-green-300",
    moderate: "bg-yellow-100 text-yellow-700 border-yellow-300",
    substantial: "bg-red-100 text-red-700 border-red-300",
  }[profile.supportLevel as string] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-slate-500 text-sm">
            {profile.age} anos • {profile.schoolYear}º ano
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${supportLevelColor}`}
        >
          Suporte {profile.supportLevel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">
            {profile.masteryLevel}%
          </div>
          <div className="text-xs text-gray-500">Domínio BKT</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-700">
            {profile.engagementScore}
          </div>
          <div className="text-xs text-gray-500">Engajamento</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">
            {profile.totalSessions}
          </div>
          <div className="text-xs text-gray-500">Sessões</div>
        </div>
      </div>

      {/* Strengths/Weaknesses from ontology */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Pontos Fortes
          </h3>
          <div className="flex flex-wrap gap-1">
            {profile.ontologyStrengths?.map((s: string) => (
              <span
                key={s}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Áreas de Atenção
          </h3>
          <div className="flex flex-wrap gap-1">
            {profile.ontologyWeaknesses?.map((w: string) => (
              <span
                key={w}
                className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}