"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginPayload } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const profile = await apiClient.get<User>("/auth/me", token);
      setUser(profile);
    } catch {
      authService.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (payload: LoginPayload) => {
    const tokens = await authService.login(payload);
    authService.storeTokens(tokens);
    await fetchProfile();
  };

  const logout = () => {
    authService.clearTokens();
    setUser(null);
    router.push("/auth/login");
  };

  return { user, loading, login, logout };
}