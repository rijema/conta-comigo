"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

type Mode = "adult" | "child";

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("adult");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === "adult") {
        await login({ email, password });
      } else {
        await login({ childName, guardianEmail, password });
      }
    } catch (err: any) {
      setError(err.message || "Dados incorretos. Tente novamente.");
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
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" role="img" aria-label="Planeta com estrelas">🌍✨</div>
          <h1 className="text-3xl font-bold text-blue-800">MathASD</h1>
          <p className="text-gray-500 mt-2">{t("loginSubtitle")}</p>
        </div>

        {/* Mode selector */}
        <div className="flex rounded-2xl overflow-hidden border-2 border-blue-100 mb-6">
          <button
            type="button"
            onClick={() => setMode("adult")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "adult" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-blue-50"
            }`}
          >
            👨‍👩‍👧 Responsável / Educador
          </button>
          <button
            type="button"
            onClick={() => setMode("child")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === "child" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-purple-50"
            }`}
          >
            🧒 Sou criança!
          </button>
        </div>

        <Card className={`p-6 shadow-lg border-2 ${mode === "child" ? "border-purple-100" : "border-blue-100"}`}>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "adult" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="text-lg p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="text-lg p-3"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bg-purple-50 rounded-xl p-3 text-center text-purple-700 text-sm font-medium">
                  🌟 Olá! Qual é o seu nome?
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meu nome é...</label>
                  <Input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Ex: Luiz"
                    required
                    className="text-xl p-4 text-center font-bold"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email do meu pai/mãe</label>
                  <Input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="email@dopai.com"
                    required
                    className="text-lg p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minha senha secreta 🔑</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    required
                    className="text-xl p-4 text-center"
                  />
                </div>
              </>
            )}

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full text-lg py-3 focus:ring-4 ${
                mode === "child"
                  ? "bg-purple-600 hover:bg-purple-700 focus:ring-purple-300"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-300"
              }`}
            >
              {isLoading ? "Entrando..." : mode === "child" ? "🚀 Vamos aprender!" : t("login")}
            </Button>
          </form>

          {mode === "adult" && (
            <div className="mt-4 text-center">
              <Link href="/auth/register" className="text-blue-600 hover:underline text-sm">
                Criar nova conta
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
