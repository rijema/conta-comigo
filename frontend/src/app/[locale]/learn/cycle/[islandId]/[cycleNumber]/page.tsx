"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CycleDisplay } from "@/components/cycle-display";
import { useCycles } from "@/hooks/use-cycles";
import { useActivity } from "@/hooks/use-activity";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";

interface Activity {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  type: string;
  bnccSkills: string[];
  content: any;
  accessibility?: any;
}

/**
 * CycleLearningPage: Integrated cycle + activity view
 * Displays:
 * - Current cycle position and progress
 * - Next activity in cycle
 * - Skill focus (prevents context-switching)
 * - Exercise counter (1-10)
 *
 * Scientific flow:
 * 1. Show cycle context (TEA cognitive load reduction)
 * 2. Display activity
 * 3. On submit: advance position, update cycle
 * 4. Auto-show next activity or completion
 */
export default function CycleLearningPage() {
  const params = useParams();
  const islandId = params?.islandId as string;
  const cycleNumber = parseInt(params?.cycleNumber as string, 10) || 1;

  const { activeCycle, cycleProgress, loading: cycleLoading } = useCycles(
    islandId
  );
  const { submitting, submitAttempt } = useActivity();

  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Load next activity with cycle context
  const loadNextActivity = async () => {
    setLoadingActivity(true);
    try {
      const token = authService.getStoredToken();
      const result = await apiClient.post<{
        activity: Activity;
        cycleContext?: any;
        adeDecision?: any;
      }>(
        "/activities/next",
        {
          sessionId,
          islandId,
          cycleNumber,
        },
        token ?? undefined
      );
      setCurrentActivity(result.activity);
    } catch (err) {
      console.error("Failed to load activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Load initial activity
  useEffect(() => {
    if (islandId && cycleNumber) {
      loadNextActivity();
    }
  }, [islandId, cycleNumber, sessionId]);

  const handleActivitySubmit = async (isCorrect: boolean) => {
    if (!currentActivity) return;

    await submitAttempt({
      activityId: currentActivity.id,
      sessionId,
      isCorrect,
      timeSpentSeconds: 30, // TODO: Use actual timer
      hintsUsed: 0, // TODO: Count actual hints
      islandId,
      cycleNumber,
    });

    // Reload cycle progress and next activity
    setTimeout(() => {
      loadNextActivity();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Cycle Context Display */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🌴 Aprendendo na Ilha {islandId?.replace("island-", "")}
          </h1>
          <CycleDisplay
            cycle={activeCycle}
            progress={cycleProgress}
            loading={cycleLoading}
          />
        </div>

        {/* Activity Display */}
        {loadingActivity ? (
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        ) : currentActivity ? (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentActivity.title}
              </h2>
              <p className="text-gray-600 mt-2">{currentActivity.description}</p>
            </div>

            {/* Activity Content */}
            <div className="min-h-64 bg-gray-50 rounded border-2 border-dashed border-gray-300 p-4">
              {/* TODO: Render activity content based on type */}
              <p className="text-gray-500">
                Activity content renderer (type: {currentActivity.type})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => handleActivitySubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {submitting ? "Enviando..." : "Preciso de Ajuda"}
              </button>
              <button
                onClick={() => handleActivitySubmit(true)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {submitting ? "Enviando..." : "✓ Responder"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-600">Nenhum exercício disponível</p>
          </div>
        )}

        {/* Cycle Completion Message */}
        {cycleProgress?.status === "completed" && (
          <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-500">
            <h3 className="text-xl font-bold text-green-700 mb-2">
              🎉 Parabéns! Você completou este ciclo!
            </h3>
            <p className="text-green-700">
              Você dominou todas as 10 atividades sobre{" "}
              <strong>{activeCycle?.skillFocus}</strong>. Prepare-se para o
              próximo ciclo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
