"use client";

import { useState, useEffect, useRef } from "react";
import { MultipleChoiceActivity } from "./multiple-choice-activity";
import { DragDropActivity } from "./drag-drop-activity";
import { CountingActivity } from "./counting-activity";
import { NumberLineActivity } from "./number-line-activity";
import type { Activity, SensoryProfile } from "@/types";

interface ActivityRendererProps {
  activity: Activity;
  onAnswer: (answer: any) => void;
  sensoryProfile?: SensoryProfile;
}

export function ActivityRenderer({
  activity,
  onAnswer,
  sensoryProfile,
}: ActivityRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());

  // Apply sensory adjustments
  const containerStyle: React.CSSProperties = {
    fontSize: sensoryProfile?.fontSize || "1.125rem",
    lineHeight: sensoryProfile?.lineHeight || "1.75",
    backgroundColor: sensoryProfile?.backgroundColor || "#fafafa",
  };

  // Auto-focus for accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, [activity.id]);

  const handleAnswer = (answer: any) => {
    onAnswer({
      ...answer,
      timeSpentMs: Date.now() - startTime,
    });
  };

  const renderActivity = () => {
    switch (activity.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "drag_drop":
        return (
          <DragDropActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "counting":
        return (
          <CountingActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "number_line":
        return (
          <NumberLineActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      default:
        return (
          <MultipleChoiceActivity
            activity={activity}
            onAnswer={handleAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      style={containerStyle}
      className="outline-none"
      aria-label={`Atividade: ${activity.title}`}
      role="main"
    >
      {/* Activity Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {activity.bnccSkillCode}
          </span>
          <DifficultyIndicator level={activity.difficulty} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{activity.title}</h2>
        {activity.instructions && (
          <p className="text-gray-600 mt-1">{activity.instructions}</p>
        )}
      </div>

      {/* Activity Content */}
      <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-50">
        {renderActivity()}
      </div>
    </div>
  );
}

function DifficultyIndicator({ level }: { level: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < level);
  return (
    <div
      className="flex gap-0.5"
      aria-label={`Dificuldade: ${level} de 5 estrelas`}
    >
      {stars.map((filled, i) => (
        <span key={i} className={filled ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}