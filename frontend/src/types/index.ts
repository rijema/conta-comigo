export interface SensoryProfile {
  fontSize?: string;
  lineHeight?: string;
  backgroundColor?: string;
  lowStimulationMode?: boolean;
  highContrast?: boolean;
  animationsEnabled?: boolean;
  soundEnabled?: boolean;
  [key: string]: any;
}

export interface ActivityOption {
  id: string;
  text: string;
  emoji?: string;
  isCorrect: boolean;
  value?: unknown;
  pictogramConceptId?: string;
}

export interface ActivityContent {
  instructionsPt?: string;
  instructions?: string;
  question?: string;
  items?: string[];
  options?: ActivityOption[];
  correctAnswer?: any;
  example?: string;
  imageUrl?: string;
  imageAlt?: string;
  correctOrder?: string[];
  [key: string]: any;
}

export type SemanticActivityType =
  | 'counting'
  | 'multiple_choice'
  | 'quiz'
  | 'drag_drop'
  | 'number_line'
  | 'composition_decomposition'
  | 'missing_number'
  | 'pattern_completion'
  | 'representation_matching'
  | 'error_detection'
  | 'contextual_problem_solving'
  | 'unmapped';

export type Representation =
  | 'pictorial'
  | 'symbolic'
  | 'textual'
  | 'number_line'
  | 'contextual'
  | 'object_based';

export type InteractionType =
  | 'repeated_selection'
  | 'option_selection'
  | 'drag_and_drop'
  | 'alternative_placement'
  | 'range_selection'
  | 'composition_building'
  | 'missing_value_entry'
  | 'pattern_completion'
  | 'representation_matching'
  | 'error_evaluation'
  | 'contextual_response'
  | 'unmapped';

export interface ActivityDifficultyProfile {
  conceptualComplexity: string | number | null;
  numericalMagnitude: number | null;
  abstractionLevel: string | number | null;
  stepCount: number | null;
  distractorSimilarity: string | number | null;
  languageLoad: string | number | null;
  motorDemand: string | number | null;
  sensoryLoad: string | number | null;
  scaffoldingLevel: string | number | null;
  annotationProvenance:
    | 'EXPLICIT_ACTIVITY_METADATA'
    | 'DEVELOPER_INSPECTION'
    | 'UNANNOTATED';
  unannotatedDimensions: string[];
}

export interface ActivityAffordance {
  requiresDragging: boolean;
  requiresReading: boolean;
  usesAudio: boolean;
  usesPictograms: boolean;
}

export interface ChildCommunicationSupport {
  textLabel: string;
  pictogram: string | null;
  spokenExplanationText: string;
  nonReaderAlternatives: Array<'audio' | 'pictogram' | 'symbolic'>;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: 'multiple_choice' | 'quiz' | 'drag_drop' | 'counting' | 'number_line' | string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  bnccSkills?: string[];
  bnccSkillCode?: string;
  targetModalities?: string[];
  pointsReward?: number;
  isActive?: boolean;
  content: ActivityContent;
  options?: ActivityOption[];
  instructions?: string;
  accessibility?: Record<string, any>;
  activityType?: SemanticActivityType;
  bnccSkillId?: string | null;
  mathematicalConcepts?: string[];
  representation?: Representation[];
  interactionType?: InteractionType[];
  difficultyProfile?: ActivityDifficultyProfile;
  affordances?: ActivityAffordance;
  communication?: ChildCommunicationSupport;
  scaffoldingOptions?: Record<string, unknown> | null;
  semanticAnnotation?: {
    source: 'CURRENT_ACTIVITY_CONTENT_AND_REPOSITORY_ONTOLOGY';
    conceptMappingStatus: 'MAPPED' | 'PARTIAL' | 'NEEDS_REVIEW' | 'UNMAPPED';
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CHILD" | "GUARDIAN" | "EDUCATOR" | "ADMIN";
  guardianChildren?: Child[];
}

export interface Child {
  id: string;
  name: string;
  asdLevel?: "mild" | "moderate" | "severe";
}

export interface LearnerReport {
  learnerId: string;
  learnerName: string;
  totalActivitiesCompleted: number;
  overallAccuracy: number;
  engagementIndex: number;
  masteredSkills: number;
  totalSkillsAttempted: number;
  skillMastery: Record<string, number>;
  recentSessions: SessionRecord[];
  bnccCoverage: Record<string, boolean>;
  todayActivities?: number;
  totalStars?: number;
  streakDays?: number;
  alerts?: Array<{ type: "info" | "warning" | "success"; message: string }>;
  weeklyProgress?: Array<{ date: string; score: number; activities: number }>;
  bnccSkills?: Array<{ code: string; name: string; mastery: number }>;
}

export interface SessionRecord {
  id: string;
  date: string;
  duration: number;
  skillCode: string;
  accuracy: number;
  status: "completed" | "abandoned";
}

export interface AnalyticsSnapshot {
  id: string;
  userId: string;
  sessionId?: string;
  overallAccuracy: number;
  engagementIndex: number;
  totalActivitiesCompleted: number;
  skillMasterySnapshot: Record<string, number>;
  bnccCoverage: Record<string, boolean>;
  createdAt: string;
}

export interface ActivityEvent {
  type: string;
  userId: string;
  activityId: string;
  sessionId?: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  timestamp: string;
}
