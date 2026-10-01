"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface CycleOverview {
  cycleNumber: number;
  skillFocus: string;
  status: "active" | "completed" | "pending";
  completionPercentage: number;
}

interface IslandOverview {
  id: string;
  name: string;
  cycles: CycleOverview[];
}

/**
 * IslandsPage: Shows all islands and their cycle structure
 * - 3 islands (Sol, Lua, Terra)
 * - Each island has N cycles (one per BNCC skill)
 * - Each cycle has 10 exercises with progress tracking
 *
 * Scientific UI design (TEA principles):
 * - Clear visual structure (islands, then cycles, then exercises)
 * - Each level shows exactly what's available
 * - Progress bars provide feedback without overwhelming
 * - Predicability: always 10 exercises per cycle
 */
export default function IslandsPage() {
  const locale = useLocale();
  const [islands, setIslands] = useState<IslandOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIslands();
  }, []);

  const loadIslands = async () => {
    setLoading(true);
    try {
      const token = authService.getStoredToken();
      // TODO: Create API endpoint for this
      // For now, mock the data structure
      const mockIslands: IslandOverview[] = [
        {
          id: "island-sol",
          name: "🌞 Ilha do Sol",
          cycles: [
            {
              cycleNumber: 1,
              skillFocus: "EF01MA01",
              status: "active",
              completionPercentage: 60,
            },
            {
              cycleNumber: 2,
              skillFocus: "EF01MA02",
              status: "pending",
              completionPercentage: 0,
            },
            {
              cycleNumber: 3,
              skillFocus: "EF01MA03",
              status: "pending",
              completionPercentage: 0,
            },
            {
              cycleNumber: 4,
              skillFocus: "EF01MA04",
              status: "pending",
              completionPercentage: 0,
            },
          ],
        },
        {
          id: "island-lua",
          name: "🌙 Ilha da Lua",
          cycles: [
            {
              cycleNumber: 1,
              skillFocus: "EF01MA05",
              status: "pending",
              completionPercentage: 0,
            },
            {
              cycleNumber: 2,
              skillFocus: "EF01MA06",
              status: "pending",
              completionPercentage: 0,
            },
          ],
        },
        {
          id: "island-terra",
          name: "🌍 Ilha da Terra",
          cycles: [
            {
              cycleNumber: 1,
              skillFocus: "EF01MA07",
              status: "pending",
              completionPercentage: 0,
            },
          ],
        },
      ];
      setIslands(mockIslands);
    } catch (err) {
      console.error("Failed to load islands:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    status: "active" | "completed" | "pending"
  ): string => {
    switch (status) {
      case "active":
        return "from-blue-100 to-indigo-100 border-blue-300";
      case "completed":
        return "from-green-100 to-emerald-100 border-green-300";
      case "pending":
        return "from-gray-100 to-slate-100 border-gray-300";
    }
  };

  const getStatusBadge = (
    status: "active" | "completed" | "pending"
  ): string => {
    switch (status) {
      case "active":
        return "🎯 Ativo";
      case "completed":
        return "✅ Completo";
      case "pending":
        return "🔒 Bloqueado";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏝️ Ilhas de Aprendizado
          </h1>
          <p className="text-gray-600">
            Explore cada ilha e complete os ciclos de aprendizado para dominar
            as habilidades matemáticas.
          </p>
        </div>

        {/* Islands Grid */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {islands.map((island) => (
              <div key={island.id} className="space-y-4">
                {/* Island Header */}
                <h2 className="text-2xl font-bold text-gray-800">
                  {island.name}
                </h2>

                {/* Cycles Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {island.cycles.map((cycle) => (
                    <Link
                      key={`${island.id}-${cycle.cycleNumber}`}
                      href={`/${locale}/learn/cycle/${island.id}/${cycle.cycleNumber}`}
                    >
                      <div
                        className={`p-4 rounded-lg border-2 bg-gradient-to-br ${getStatusColor(
                          cycle.status
                        )} hover:shadow-lg transition cursor-pointer h-full`}
                      >
                        {/* Cycle Number */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-semibold text-gray-700">
                            Ciclo {cycle.cycleNumber}
                          </span>
                          <span className="text-xs font-bold bg-white px-2 py-1 rounded">
                            {getStatusBadge(cycle.status)}
                          </span>
                        </div>

                        {/* Skill Focus */}
                        <p className="text-lg font-bold text-indigo-600 mb-3">
                          {cycle.skillFocus}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
                              style={{
                                width: `${cycle.completionPercentage}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-700">
                            {cycle.completionPercentage}% completo
                          </p>
                        </div>

                        {/* Exercise Count */}
                        <p className="text-sm text-gray-600 mt-3">
                          10 exercícios
                        </p>

                        {/* CTA Button */}
                        {cycle.status !== "pending" && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <span className="text-sm font-semibold text-indigo-600">
                              {cycle.status === "completed"
                                ? "Revisar Ciclo →"
                                : "Continuar →"}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Learning Tips Section */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md border-l-4 border-indigo-500">
          <h3 className="font-bold text-lg text-gray-800 mb-3">
            💡 Dicas para Melhor Aprendizado
          </h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ Cada ciclo foca em UMA habilidade para melhor concentração</li>
            <li>✓ Complete todos os 10 exercícios de um ciclo antes de avançar</li>
            <li>
              ✓ A dificuldade ajusta automaticamente com base no seu desempenho
            </li>
            <li>✓ Você pode revisar ciclos completados para reforçar o aprendizado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
