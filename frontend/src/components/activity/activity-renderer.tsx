"use client";

import { useEffect, useRef } from "react";
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

  const renderActivity = () => {
    const hasOptions = activity.content?.options?.length > 0;

    switch (activity.type) {
      case "quiz":
      case "multiple_choice":
        return (
          <MultipleChoiceActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "drag_drop":
        return (
          <DragDropActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "counting":
        if (hasOptions) {
          return (
            <MultipleChoiceActivity
              key={activity.id}
              activity={activity}
              onAnswer={onAnswer}
              sensoryProfile={sensoryProfile}
            />
          );
        }
        return (
          <CountingActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      case "number_line":
        return (
          <NumberLineActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            sensoryProfile={sensoryProfile}
          />
        );
      default:
        return (
          <MultipleChoiceActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
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
            {activity.bnccSkills?.[0] ?? activity.bnccSkillCode ?? "BNCC"}
          </span>
          <DifficultyIndicator level={activity.difficulty} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {activity.title || activity.content?.instructionsPt}
        </h2>
        {(activity.instructions || activity.content?.instructionsPt) && activity.title && (
          <p className="text-gray-600 mt-1">
            {activity.instructions || activity.content?.instructionsPt}
          </p>
        )}
      </div>

      {/* Activity Content */}
      <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-50">
        {renderActivity()}
      </div>
    </div>
  );
}

function DifficultyIndicator({ level }: { level: string | number }) {
  const numLevel = typeof level === 'number' ? level
    : level === 'easy' ? 1 : level === 'medium' ? 3 : level === 'hard' ? 5 : 1;
  const stars = Array.from({ length: 5 }, (_, i) => i < numLevel);
  return (
    <div
      className="flex gap-0.5"
      aria-label={`Dificuldade: ${numLevel} de 5 estrelas`}
    >
      {stars.map((filled, i) => (
        <span key={i} className={filled ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}