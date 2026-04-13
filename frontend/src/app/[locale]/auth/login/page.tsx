"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="text-6xl mb-4"
            role="img"
            aria-label="Planeta com estrelas"
          >
            🌍✨
          </div>
          <h1 className="text-3xl font-bold text-blue-800">MathASD</h1>
          <p className="text-gray-500 mt-2">
            {t("loginSubtitle")}
          </p>
        </div>

        <Card className="p-6 shadow-lg border-2 border-blue-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className="text-lg p-3"
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
                className="text-lg p-3"
              />
              {errors.password && (
                <p id="password-error" className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
              aria-label="Entrar na plataforma"
            >
              {isLoading ? "Entrando..." : t("login")}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline focus:ring-2 focus:ring-blue-300 rounded"
            >
              Criar nova conta
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
