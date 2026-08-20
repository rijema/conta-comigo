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
