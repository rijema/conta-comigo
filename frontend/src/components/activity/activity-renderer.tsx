"use client";

import { useEffect, useRef } from "react";
import { MultipleChoiceActivity } from "./multiple-choice-activity";
import { DragDropActivity } from "./drag-drop-activity";
import { CountingActivity } from "./counting-activity";
import { NumberLineActivity } from "./number-line-activity";
import { ParametricMathActivity } from "./parametric-math-activity";
import type { Activity, SensoryProfile } from "@/types";
import { GuidedInstructions } from "./guided-instructions";

interface ActivityRendererProps {
  activity: Activity;
  onAnswer: (answer: any) => void;
  sensoryProfile?: SensoryProfile;
  onRequestHint?: () => void;
}

export function ActivityRenderer({
  activity,
  onAnswer,
  sensoryProfile,
  onRequestHint,
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
    const hasOptions = (activity.content?.options?.length ?? 0) > 0;

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
      case "composition_decomposition":
      case "missing_number":
      case "pattern_completion":
      case "representation_matching":
      case "error_detection":
      case "contextual_problem_solving":
        return (
          <ParametricMathActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            onRequestHint={onRequestHint}
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
      {/* Activity Content */}
      <GuidedInstructions activity={activity} />
      <div className="rounded-2xl border-2 border-blue-50 bg-white p-3 shadow-md sm:p-4">
        {renderActivity()}
      </div>
    </div>
  );
}
