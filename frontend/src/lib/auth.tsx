import { apiClient } from "./api-client";

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "CHILD" | "GUARDIAN" | "EDUCATOR";
  lgpdConsent: boolean;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthTokens>("/auth/register", payload),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken }),

  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  storeTokens: (tokens: AuthTokens) => {
    localStorage.setItem("access_token", tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }
  },

  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};