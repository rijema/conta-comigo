"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillData {
  skill: string;
  mastery: number;
  fullMark: number;
}

interface Props {
  data: SkillData[];
}

export function SkillRadarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Dados de habilidades não disponíveis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <Radar
          name="Domínio"
          dataKey="mastery"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, "Domínio"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}