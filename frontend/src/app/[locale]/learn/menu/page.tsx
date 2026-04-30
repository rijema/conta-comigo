"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { authService } from "@/lib/auth";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  hard: "bg-red-100 text-red-700 border-red-300",
};
const TYPE_EMOJI: Record<string, string> = {
  multiple_choice: "🎯",
  quiz: "📝",
  drag_drop: "🖐️",
  counting: "🔢",
  number_line: "📏",
};

export default function ActivityMenuPage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [treeData, setTreeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    api.get<any>("/activities/tree", token)
      .then((data) => {
        setTreeData(data);
        // Auto-expand first skill group
        if (data.tree?.[0]) {
          setExpanded({ [data.tree[0].skill]: true });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleStartActivity = (activityId: string) => {
    router.push(`/${locale}/learn?activityId=${activityId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="text-7xl animate-bounce mb-4">🌳</div>
          <p className="text-2xl font-bold text-blue-700">Carregando sua jornada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/learn`)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Voltar para atividade"
          >
            ▶️
          </button>
          <div>
            <h1 className="text-lg font-bold text-blue-700">🌳 Minha Jornada</h1>
            <p className="text-xs text-gray-500">Escolha uma atividade para começar</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-blue-600">{treeData?.completedTotal ?? 0}</span>
          /{treeData?.totalActivities ?? 0} concluídas
        </div>
      </header>

      {/* Ontology info banner */}
      {treeData?.ontologyInferences?.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-700">
          <p className="font-bold mb-1">🧠 A IA recomenda para você:</p>
          <p className="opacity-80">{treeData.ontologyInferences[0]}</p>
          <p className="font-semibold mt-1">
            Modalidades: {treeData.ontologyModalities?.join(", ")}
          </p>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {treeData?.tree?.map((group: any) => {
          const isOpen = expanded[group.skill];
          const pct = group.totalActivities > 0
            ? Math.round((group.completedCount / group.totalActivities) * 100)
            : 0;

          return (
            <div key={group.skill} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [group.skill]: !isOpen }))}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-bold text-gray-800">{group.skill}</p>
                    <p className="text-xs text-gray-500">
                      {group.completedCount}/{group.totalActivities} atividades
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{pct}%</span>
                  <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {group.activities.map((act: any) => (
                    <div
                      key={act.id}
                      className={`px-5 py-3 flex items-center gap-3 ${
                        act.completed ? "opacity-60" : ""
                      }`}
                    >
                      <span className="text-2xl">
                        {act.completed ? "✅" : act.recommended ? "⭐" : "⬜"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{act.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg">{TYPE_EMOJI[act.type] ?? "🎮"}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              DIFFICULTY_COLOR[act.difficulty] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {DIFFICULTY_LABEL[act.difficulty] ?? act.difficulty}
                          </span>
                          {act.recommended && !act.completed && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-200">
                              IA recomenda
                            </span>
                          )}
                        </div>
                      </div>
                      {!act.completed && (
                        <button
                          onClick={() => handleStartActivity(act.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                            act.recommended
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          Jogar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
