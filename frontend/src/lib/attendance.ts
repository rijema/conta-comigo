"use client";

import { useAuthStore, AuthUser } from "@/store/auth.store";
import { authService } from "@/lib/auth";
import { api } from "@/lib/api-client";

/**
 * Lets a professional jump straight into a child's experience ("Iniciar
 * atendimento") without the child's credentials, while keeping their own
 * professional session safely stashed so they can come back to it — even
 * if the attendance screen is closed abruptly and the site is reopened
 * later (see getActiveAttendances / resume flow on the educator dashboard).
 */

const PROFESSIONAL_TOKEN_KEY = "professional_access_token";
const PROFESSIONAL_REFRESH_KEY = "professional_refresh_token";
const PROFESSIONAL_USER_KEY = "professional_user";
const ATTENDANCE_ID_KEY = "active_attendance_id";
const ATTENDANCE_LEARNER_NAME_KEY = "active_attendance_learner_name";

export interface AttendanceStartResult {
  attendanceId: string;
  learner: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export function isAttendingAsChild(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PROFESSIONAL_TOKEN_KEY);
}

export function getAttendanceLearnerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ATTENDANCE_LEARNER_NAME_KEY);
}

/** Starts (or resumes) an attendance and switches the active session to the child. */
export function enterAttendance(result: AttendanceStartResult) {
  const professionalUser = useAuthStore.getState().user;
  const professionalToken = authService.getStoredToken();
  const professionalRefresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

  if (professionalUser && professionalToken && !isAttendingAsChild()) {
    // Only stash once: resuming an attendance from the banner should not
    // overwrite the real professional session with a half-impersonated one.
    localStorage.setItem(PROFESSIONAL_TOKEN_KEY, professionalToken);
    if (professionalRefresh) localStorage.setItem(PROFESSIONAL_REFRESH_KEY, professionalRefresh);
    localStorage.setItem(PROFESSIONAL_USER_KEY, JSON.stringify(professionalUser));
  }
  localStorage.setItem(ATTENDANCE_ID_KEY, result.attendanceId);
  localStorage.setItem(ATTENDANCE_LEARNER_NAME_KEY, result.learner.name);

  authService.storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  useAuthStore.getState().setAuth(result.learner, result.accessToken);
}

/** Ends the attendance on the backend and restores the professional's own session. */
export async function exitAttendance(): Promise<string | null> {
  const professionalToken = localStorage.getItem(PROFESSIONAL_TOKEN_KEY);
  const professionalRefresh = localStorage.getItem(PROFESSIONAL_REFRESH_KEY);
  const professionalUserRaw = localStorage.getItem(PROFESSIONAL_USER_KEY);
  const attendanceId = localStorage.getItem(ATTENDANCE_ID_KEY);

  if (!professionalToken || !professionalUserRaw) return null;

  if (attendanceId) {
    try {
      await api.post(`/educator/attendance/${attendanceId}/end`, {}, professionalToken);
    } catch (error) {
      console.error("Failed to end attendance:", error);
    }
  }

  authService.storeTokens({ accessToken: professionalToken, refreshToken: professionalRefresh ?? undefined });
  useAuthStore.getState().setAuth(JSON.parse(professionalUserRaw), professionalToken);

  localStorage.removeItem(PROFESSIONAL_TOKEN_KEY);
  localStorage.removeItem(PROFESSIONAL_REFRESH_KEY);
  localStorage.removeItem(PROFESSIONAL_USER_KEY);
  localStorage.removeItem(ATTENDANCE_ID_KEY);
  localStorage.removeItem(ATTENDANCE_LEARNER_NAME_KEY);

  const user = JSON.parse(professionalUserRaw) as AuthUser;
  return user.role === "professional" ? "dashboard/educator" : "dashboard";
}
