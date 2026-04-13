"use client";

interface SkillMastery {
  code: string;
  name: string;
  mastery: number;
}

interface SkillMasteryGridProps {
  skills: SkillMastery[];
  isLoading?: boolean;
}

export function SkillMasteryGrid({ skills, isLoading }: SkillMasteryGridProps) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando habilidades...</div>;
  }

  if (skills.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhuma habilidade registrada</div>;
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return "bg-green-100 border-green-300";
    if (mastery >= 0.6) return "bg-blue-100 border-blue-300";
    if (mastery >= 0.4) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 0.8) return "Dominado";
    if (mastery >= 0.6) return "Bom";
    if (mastery >= 0.4) return "Regular";
    return "Iniciante";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {skills.map((skill) => (
        <div
          key={skill.code}
          className={`p-4 border-2 rounded-lg text-center ${getMasteryColor(skill.mastery)}`}
        >
          <div className="font-semibold text-sm">{skill.code}</div>
          <div className="text-xs text-gray-600 mb-2">{skill.name}</div>
          <div className="text-2xl font-bold">{(skill.mastery * 100).toFixed(0)}%</div>
          <div className="text-xs text-gray-700 mt-1">{getMasteryLabel(skill.mastery)}</div>
        </div>
      ))}
    </div>
  );
}
