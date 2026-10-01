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
import { BlockStackingMinigame } from "../minigames/block-stacking-minigame";
import { NumberLineMinigame } from "../minigames/number-line-minigame";
import { CategorizationMinigame } from "../minigames/categorization-minigame";
import { TenFrameMinigame } from "../minigames/ten-frame-minigame";
import { MultiSelectMinigame } from "../minigames/multi-select-minigame";
import { PatternCompletionMinigame } from "../minigames/pattern-completion-minigame";
import { ContextualProblemMinigame } from "../minigames/contextual-problem-minigame";
import { TrueFalseMinigame } from "../minigames/true-false-minigame";
import { ErrorDetectionMinigame } from "../minigames/error-detection-minigame";
import { EquationBuilderMinigame } from "../minigames/equation-builder-minigame";
import { MatchingMinigame } from "../minigames/matching-minigame";

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
      // Only use the generic CategoryMinigame when the activity has no real
      // bins/correctOrder data — i.e. it is truly a free-form minigame slot.
      // If the activity carries its own bins and correctOrder, always use
      // CategorizationActivity so the child works with the actual content.
      const hasRealData = Array.isArray(activity.content?.bins) &&
        activity.content.bins.length > 0 &&
        Array.isArray(activity.content?.correctOrder);
      if (prefersMinigame && !hasRealData) {
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

    // Check if this is a quantity comparison activity (more/less/equal).
    // Must match BOTH the niche AND have visual groups — avoids activating
    // ComparisonMinigame for unrelated quiz types like spatial or shape activities.
    const isComparisonActivity =
      activity.content?.semantic?.niche === 'comparison' &&
      Array.isArray(activity.content?.visualGroups) &&
      activity.content.visualGroups.length >= 2;

    // Check if this should use memory game (pattern/matching activities)
    const isMemoryActivity =
      activity.content?.semantic?.structureId?.includes('pattern') ||
      activity.type === 'pattern_completion' ||
      activity.content?.interaction === 'memory';

    // Check if this is a number line activity (ordering/comparison on a line)
    const isNumberLineActivity =
      activity.content?.semantic?.type === 'number_line' ||
      activity.content?.semantic?.structureId?.includes('numberline');

    switch (activity.type) {
      case "quiz":
      case "multiple_choice":
        if (isNumberLineActivity) {
          // MINIGAME: Number Line Quest (BNCC: EF01MA03, EF01MA08)
          return (
            <NumberLineMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              activity={activity}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
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

      case "drag_drop": {
        // BasketMinigame only makes sense for "collect items into one basket" exercises.
        // Exercises with correctOrder (sequencing/ordering) must use DragDropActivity
        // because BasketMinigame has no concept of order or bins.
        const hasOrdering = Array.isArray(activity.content?.correctOrder) ||
          activity.content?.interaction === 'categorize';
        if (prefersMinigame && !hasOrdering &&
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
      }

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
        // MINIGAME: Block Stacking Quest (BNCC: EF01MA03, EF01MA06)
        return (
          <BlockStackingMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );

      case "missing_number":
        // Check semantic type to decide which minigame
        if (activity.content?.semantic?.concept === 'decomposition') {
          // "Complete o quadro de 10!" - TenFrame
          return (
            <TenFrameMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              activity={activity}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        if (activity.content?.semantic?.concept === 'addition_as_comparison') {
          // "Complete: 3 + ? = 8" - EquationBuilder
          return (
            <EquationBuilderMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              activity={activity}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        // Fallback to ParametricMathActivity
        return (
          <ParametricMathActivity
            key={activity.id}
            activity={activity}
            onAnswer={onAnswer}
            onRequestHint={onRequestHint}
            sensoryProfile={sensoryProfile}
          />
        );

      case "pattern_completion":
        // MINIGAME: Pattern Completion Quest (BNCC: EF01MA03, EF01MA02)
        return (
          <PatternCompletionMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );

      case "representation_matching":
        // MINIGAME: Matching Quest (BNCC: EF01MA03)
        return (
          <MatchingMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );

      case "visual_puzzle":
        // Check semantic type to decide which minigame
        if (activity.content?.semantic?.type === 'sorting' || 
            activity.content?.semantic?.concept === 'categorization_by_comparison') {
          // "Separe: MAIOR e MENOR" - Categorization
          return (
            <CategorizationMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              activity={activity}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        if (activity.content?.semantic?.type === 'multi_selection' ||
            activity.content?.semantic?.concept === 'comparison_multiple') {
          // "Marque os números > 5" - MultiSelect
          return (
            <MultiSelectMinigame
              key={activity.id}
              skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
              difficulty={(activity.difficulty as any) || 'easy'}
              activity={activity}
              onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
              isTEAMode={true}
            />
          );
        }
        // Fallback to ParametricMathActivity
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
        // MINIGAME: Error Detection Quest (BNCC: EF01MA03)
        return (
          <ErrorDetectionMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );

      case "contextual_problem_solving":
        // MINIGAME: Contextual Problem Quest (BNCC: EF01MA03)
        return (
          <ContextualProblemMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
          />
        );

      case "yes_no":
        // MINIGAME: True/False Quest (BNCC: EF01MA03)
        return (
          <TrueFalseMinigame
            key={activity.id}
            skill={activity.bnccSkills?.[0] ?? 'EF01MA03'}
            difficulty={(activity.difficulty as any) || 'easy'}
            activity={activity}
            onComplete={(score, isCorrect) => onAnswer({ correct: isCorrect, score })}
            isTEAMode={true}
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
