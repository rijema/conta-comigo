"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/${locale}/auth/login`);
      return;
    }
    const role = user.role?.toLowerCase();
    if (role === "guardian") {
      router.replace(`/${locale}/dashboard/guardian`);
    } else if (role === "educator" || role === "professional") {
      router.replace(`/${locale}/dashboard/educator`);
    } else {
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, isLoading, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );
}
