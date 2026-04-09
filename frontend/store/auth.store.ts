import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

export type UserRole = "child" | "guardian" | "professional" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  learnerId?: string; // for child role
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        Cookies.set("access_token", token, {
          expires: 1, // 1 day
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      clearAuth: () => {
        Cookies.remove("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "asd-platform-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);