"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { authService, LoginPayload, RegisterPayload } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, AuthUser } from "@/store/auth.store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const profile = await apiClient.get<AuthUser>("/auth/me", token);
      setAuth(profile, token);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      clearAuth();
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  }, [setAuth, clearAuth, setLoading]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, isLoading, fetchProfile]);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await authService.login(payload);
      authService.storeTokens(response);
      
      // If the backend already returns the user, use it. Otherwise, fetch it.
      const profile = response.user || await apiClient.get<AuthUser>("/auth/me", response.accessToken);
      setAuth(profile, response.accessToken);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const response = await authService.register(payload);
      authService.storeTokens(response);
      
      const profile = response.user || await apiClient.get<AuthUser>("/auth/me", response.accessToken);
      setAuth(profile, response.accessToken);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authService.clearTokens();
    clearAuth();
    router.push(`/${locale}/auth/login`);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile: fetchProfile,
  };
}
