"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { ActivityRenderer } from "@/components/activity/activity-renderer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StarReward } from "@/components/ui/star-reward";
import { SensoryControls } from "@/components/ui/sensory-controls";
import { BNCCBadge } from "@/components/ui/bncc-badge";
import { api } from "@/lib/api-client";
import type { Activity, SessionState } from "@/types";

export default function LearnPage() {
  const { user } = useAuth();
  const { session, startSession, submitAnswer, isLoading } = useSession();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    if (user && !session) {
      startSession();
    }
  }, [user, session]);

  useEffect(() => {
    if (session?.currentActivity) {
      setCurrentActivity(session.currentActivity);
    }
  }, [session]);

  const handleAnswer = async (answer: any) => {
    if (!currentActivity) return;

    const result = await submitAnswer({
      activityId: currentActivity.id,
      answer,
      timeSpentMs: Date.now() - (session?.activityStartTime || Date.now()),
    });

    if (result.isCorrect) {
      setStars((s) => s + 1);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
    }
  };

  if (isLoading || !currentActivity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🌟</div>
          <p className="text-xl text-blue-700 font-bold">
            Preparando sua atividade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-learn-bg transition-all duration-300">
      {/* Top Bar */}
      <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">MathASD</span>
          <BNCCBadge skillCode={currentActivity.bnccSkillCode} />
        </div>

        <div className="flex items-center gap-3">
          {/* Stars counter */}
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-yellow-700">{stars}</span>
          </div>
          <SensoryControls />
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-3">
        <ProgressBar
          value={session?.progress || 0}
          max={100}
          label={`Progresso: ${session?.progress || 0}%`}
        />
      </div>

      {/* Activity Area */}
      <main className="max-w-2xl mx-auto p-4">
        <ActivityRenderer
          activity={currentActivity}
          onAnswer={handleAnswer}
          sensoryProfile={user?.childProfile?.sensoryProfile}
        />
      </main>

      {/* Reward animation */}
      {showReward && <StarReward />}
    </div>
  );
}