"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressChart } from "@/components/charts/progress-chart";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";

interface ChildSummary {
  id: string;
  name: string;
  email: string;
  age?: number;
  totalSessions: number;
  averageScore: number;
  engagementIndex: number;
  lastActivityAt: string;
  progressData: { date: string; score: number; activities: number }[];
}

export default function GuardianDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [addChildForm, setAddChildForm] = useState({ childName: '', age: '', childPassword: '' });
  const [addChildLoading, setAddChildLoading] = useState(false);
  const [addChildError, setAddChildError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "guardian")) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router]);

  const fetchChildren = () => {
    const token = authService.getStoredToken();
    if (!token) return;
    apiClient
      .get<ChildSummary[]>("/guardian/children-summary", token)
      .then(setChildren)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchChildren();
  }, [user]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddChildLoading(true);
    setAddChildError(null);
    const token = authService.getStoredToken();
    if (!token) return;
    try {
      await apiClient.post("/guardian/children", {
        childName: addChildForm.childName,
        age: parseInt(addChildForm.age),
        childPassword: addChildForm.childPassword,
      }, token);
      setShowAddChild(false);
      setAddChildForm({ childName: '', age: '', childPassword: '' });
      fetchChildren();
    } catch (err: any) {
      setAddChildError(err?.message ?? 'Erro ao adicionar criança');
    } finally {
      setAddChildLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-indigo-700 px-4 pt-10 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white text-xl font-bold">
            Olá, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            Acompanhe o progresso dos seus filhos
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4">
        {/* Add child button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddChild(!showAddChild)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {showAddChild ? 'Cancelar' : '+ Adicionar filho'}
          </button>
        </div>

        {showAddChild && (
          <Card className="border-2 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-base">Cadastrar filho</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddChild} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome da criança</label>
                  <input
                    type="text"
                    value={addChildForm.childName}
                    onChange={(e) => setAddChildForm(f => ({ ...f, childName: e.target.value }))}
                    placeholder="Ex: Kevin"
                    required
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Idade</label>
                  <input
                    type="number"
                    min={4} max={12}
                    value={addChildForm.age}
                    onChange={(e) => setAddChildForm(f => ({ ...f, age: e.target.value }))}
                    required
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Senha para a criança entrar</label>
                  <input
                    type="password"
                    value={addChildForm.childPassword}
                    onChange={(e) => setAddChildForm(f => ({ ...f, childPassword: e.target.value }))}
                    placeholder="Mínimo 4 caracteres"
                    minLength={4}
                    required
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>
                {addChildError && <p className="text-red-500 text-sm">{addChildError}</p>}
                <button
                  type="submit"
                  disabled={addChildLoading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addChildLoading ? 'Salvando...' : 'Salvar filho'}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {children.length === 0 && !showAddChild && (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              <p className="mb-3">Nenhuma criança vinculada ainda.</p>
              <button
                onClick={() => setShowAddChild(true)}
                className="text-indigo-600 font-semibold text-sm hover:underline"
              >
                + Adicionar seu primeiro filho
              </button>
            </CardContent>
          </Card>
        )}

        {children.map((child) => (
          <Card key={child.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{child.name}</CardTitle>
                <Badge
                  variant={
                    child.engagementIndex >= 0.7
                      ? "success"
                      : child.engagementIndex >= 0.4
                      ? "warning"
                      : "error"
                  }
                >
                  {child.engagementIndex >= 0.7
                    ? "Engajado"
                    : child.engagementIndex >= 0.4
                    ? "Regular"
                    : "Precisa de atenção"}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Última atividade:{" "}
                {child.lastActivityAt
                  ? formatDate(child.lastActivityAt)
                  : "Nunca"}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Login da criança: <span className="font-mono">{child.email}</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-indigo-50 rounded-xl p-2">
                  <p className="font-bold text-indigo-700">
                    {child.totalSessions}
                  </p>
                  <p className="text-xs text-gray-500">sessões</p>
                </div>
                <div className="text-center bg-green-50 rounded-xl p-2">
                  <p className="font-bold text-green-700">
                    {Math.round(child.averageScore * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">média</p>
                </div>
                <div className="text-center bg-purple-50 rounded-xl p-2">
                  <p className="font-bold text-purple-700">
                    {Math.round(child.engagementIndex * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">engajamento</p>
                </div>
              </div>
              <ProgressChart data={child.progressData} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
