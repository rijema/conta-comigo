import { apiClient } from "./api-client";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user?: any;
}

export interface LoginPayload {
  email?: string;
  password: string;
  childName?: string;
  guardianEmail?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "guardian" | "professional";
  lgpdConsent: boolean;
  consentTimestamp?: string;
  language?: string;
  childProfile?: {
    name: string;
    age: number;
  };
  childPassword?: string;
}

const REGISTRATION_NONCE_KEY = "pending_registration_nonce";

const buildRegistrationNonce = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `register_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens>("/auth/login", payload),

  getRegistrationNonce: () => {
    if (typeof window === "undefined") return null;
    const existing = sessionStorage.getItem(REGISTRATION_NONCE_KEY);
    if (existing) return existing;

    const nonce = buildRegistrationNonce();
    sessionStorage.setItem(REGISTRATION_NONCE_KEY, nonce);
    return nonce;
  },

  clearRegistrationNonce: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(REGISTRATION_NONCE_KEY);
  },

  register: (payload: RegisterPayload) => {
    const registrationNonce = authService.getRegistrationNonce();
    return apiClient.post<AuthTokens>(
      "/auth/register",
      {
        ...payload,
        registrationNonce: registrationNonce ?? undefined,
      },
      undefined,
      undefined,
      registrationNonce ? { "X-Registration-Nonce": registrationNonce } : undefined,
    );
  },

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refreshToken }),

  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },

  storeTokens: (tokens: AuthTokens) => {
    localStorage.setItem("access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem("refresh_token", tokens.refreshToken);
    }
  },

  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  storeOauthResultFromUrl: () => {
    if (typeof window === "undefined") return null;

    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get("accessToken");
    const refreshToken = url.searchParams.get("refreshToken");

    if (!accessToken) return null;

    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    url.searchParams.delete("accessToken");
    url.searchParams.delete("refreshToken");
    window.history.replaceState({}, document.title, url.toString());

    return { accessToken, refreshToken: refreshToken ?? undefined };
  },
};
