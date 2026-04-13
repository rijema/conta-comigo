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
