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
const ATTENDANCE_LEARNER_ID_KEY = "active_attendance_learner_id";
const ATTENDANCE_LEARNER_NAME_KEY = "active_attendance_learner_name";

const ATTENDANCE_KEYS = [
  PROFESSIONAL_TOKEN_KEY,
  PROFESSIONAL_REFRESH_KEY,
  PROFESSIONAL_USER_KEY,
  ATTENDANCE_ID_KEY,
  ATTENDANCE_LEARNER_ID_KEY,
  ATTENDANCE_LEARNER_NAME_KEY,
];

export interface AttendanceStartResult {
  attendanceId: string;
  learner: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Drops every "atendimento" key from localStorage. Must run on any normal
 * login/logout/register so leftovers from a previous professional
 * attendance never leak into an unrelated session that starts afterwards
 * on the same browser (e.g. another child logging in directly with their
 * own credentials would otherwise inherit the professional's banner and
 * "Encerrar atendimento" control, and that control would act on someone
 * else's attendance record).
 */
export function clearAttendanceState(): void {
  if (typeof window === "undefined") return;
  for (const key of ATTENDANCE_KEYS) localStorage.removeItem(key);
}

export function isAttendingAsChild(): boolean {
  if (typeof window === "undefined") return false;
  if (!localStorage.getItem(PROFESSIONAL_TOKEN_KEY)) return false;

  // The stash only describes a real, *current* attendance when the user
  // presently authenticated is the exact learner it was started for. If a
  // different user is now logged in (e.g. someone logged in directly as a
  // different child after a prior attendance was abandoned without going
  // through exitAttendance), the leftover keys are stale: surfacing the
  // attendance banner/controls here would leak another child's session
  // state and give a professional-only action to the wrong account.
  const attendanceLearnerId = localStorage.getItem(ATTENDANCE_LEARNER_ID_KEY);
  const currentUserId = useAuthStore.getState().user?.id ?? null;
  if (!attendanceLearnerId || !currentUserId || attendanceLearnerId !== currentUserId) {
    clearAttendanceState();
    return false;
  }

  return true;
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
  const alreadyAttending = !!localStorage.getItem(PROFESSIONAL_TOKEN_KEY);

  if (professionalUser && professionalToken && !alreadyAttending) {
    // Only stash once: resuming an attendance from the banner should not
    // overwrite the real professional session with a half-impersonated one.
    localStorage.setItem(PROFESSIONAL_TOKEN_KEY, professionalToken);
    if (professionalRefresh) localStorage.setItem(PROFESSIONAL_REFRESH_KEY, professionalRefresh);
    localStorage.setItem(PROFESSIONAL_USER_KEY, JSON.stringify(professionalUser));
  }
  localStorage.setItem(ATTENDANCE_ID_KEY, result.attendanceId);
  localStorage.setItem(ATTENDANCE_LEARNER_ID_KEY, result.learner.id);
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

  clearAttendanceState();

  const user = JSON.parse(professionalUserRaw) as AuthUser;
  return user.role === "professional" ? "dashboard/educator" : "dashboard";
}
