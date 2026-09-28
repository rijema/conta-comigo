"use client";

import { useEffect, useRef } from "react";
import { MultipleChoiceActivity } from "./multiple-choice-activity";
import { DragDropActivity } from "./drag-drop-activity";
import { CountingActivity } from "./counting-activity";
import { NumberLineActivity } from "./number-line-activity";
import { ParametricMathActivity } from "./parametric-math-activity";
import type { Activity, SensoryProfile } from "@/types";
import { GuidedInstructions } from "./guided-instructions";
import { CategorizationActivity } from "./categorization-activity";
import { QuantityBuilderActivity } from "./quantity-builder-activity";
import { BasketMinigame } from "../minigames/basket-minigame";
import { ComparisonMinigame } from "../minigames/comparison-minigame";
import { MemoryMinigame } from "../minigames/memory-minigame";
import { CategoryMinigame } from "../minigames/category-minigame";

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

  // [DECISÃO DE ENGENHARIA] Lógica probabilística de seleção de formato:
  // Nenhuma modalidade é totalmente fechada — o sistema sempre explora as duas,
  // com pesos diferentes conforme a preferência do perfil da criança.
  // Isso permite ao ADE aprender qual formato funciona melhor para cada criança
  // mesmo quando já há uma preferência definida.
  //
  // [PARÂMETRO EXPERIMENTAL] Probabilidades de minigame por modalidade:
  //   'visual' | 'sensory' → 70% minigame, 30% componente real
  //   'text'               → 30% minigame, 70% componente real
  //   sem preferência      → 50% minigame, 50% componente real (exploração pura)
  const modality = sensoryProfile?.preferredModality;
  const minigameProbability = modality === 'visual' || modality === 'sensory'
    ? 0.7
    : modality === 'text'
    ? 0.3
    : 0.5;
  // Seed determinístico por activity.id para que a mesma atividade sempre
  // renderize o mesmo formato (evita flip ao re-renderizar)
  const deterministicRoll = (() => {
    let hash = 0;
    for (let i = 0; i < activity.id.length; i++) {
      hash = (hash * 31 + activity.id.charCodeAt(i)) >>> 0;
    }
    return (hash % 100) / 100;
  })();
  const prefersMinigame = deterministicRoll < minigameProbability;

  const renderActivity = () => {
    if (activity.content?.interaction === "categorize") {
      if (prefersMinigame) {
        return (
          <CategoryMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA01'}
            difficulty={(activity.difficulty as any) || 'easy'}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );
      }
      return <CategorizationActivity key={activity.id} activity={activity} onAnswer={onAnswer} />;
    }
    if (activity.content?.interaction === "quantity_builder") {
      return <QuantityBuilderActivity key={activity.id} activity={activity} onAnswer={onAnswer} />;
    }
    const hasOptions = (activity.content?.options?.length ?? 0) > 0;

    // Check if this is a comparison activity (greater/less/equal)
    const isComparisonActivity = 
      activity.content?.semantic?.structureId?.includes('less') ||
      activity.content?.semantic?.structureId?.includes('greater') ||
      activity.content?.semantic?.structureId?.includes('compare') ||
      activity.content?.semantic?.structureId?.includes('equal');

    // Check if this should use memory game (pattern/matching activities)
    const isMemoryActivity =
      activity.content?.semantic?.structureId?.includes('pattern') ||
      activity.type === 'pattern_completion' ||
      activity.content?.interaction === 'memory';

    switch (activity.type) {
      case "quiz":
      case "multiple_choice":
        if (isComparisonActivity && prefersMinigame) {
          return (
            <ComparisonMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        return (
          <MultipleChoiceActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            sensoryProfile={sensoryProfile}
          />
        );

      case "drag_drop":
        if (prefersMinigame &&
            (activity.targetModalities?.includes('sensory') ||
             activity.targetModalities?.includes('visual') ||
             activity.content?.interaction === 'drag_drop')) {
          return (
            <BasketMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA01'}
              difficulty={(activity.difficulty as any) || 'easy'}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
              activity={activity}
            />
          );
        }
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
        if (isMemoryActivity && prefersMinigame) {
          return (
            <MemoryMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA02'}
              difficulty={(activity.difficulty as any) || 'easy'}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        return (
          <ParametricMathActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            onRequestHint={onRequestHint}
            sensoryProfile={sensoryProfile}
          />
        );

      case "error_detection":
      case "contextual_problem_solving":
      case "visual_puzzle":
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
