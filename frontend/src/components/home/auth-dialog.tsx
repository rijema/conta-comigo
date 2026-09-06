"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

export type AuthView = "login" | "register";

interface Props {
  open: boolean;
  initialView: AuthView;
  onClose: () => void;
}

const fieldClass = "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function AuthDialog({ open, initialView, onClose }: Props) {
  const { login } = useAuth();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<AuthView>(initialView);
  const [childLogin, setChildLogin] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", guardianEmail: "",
    role: "guardian" as "guardian" | "professional",
    childName: "", childAge: "", childPassword: "", consent: false,
  });

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setView(initialView);
    setError("");
    setSuccess("");
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, initialView, onClose]);

  if (!open) return null;
  const update = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      await login(childLogin
        ? { childName: form.name, guardianEmail: form.guardianEmail, password: form.password }
        : { email: form.email, password: form.password });
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível entrar. Confira os dados.");
      setLoading(false);
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (!form.consent) { setError("Aceite o termo de consentimento para continuar."); return; }
    setLoading(true); setError("");
    try {
      await apiClient.post("/auth/register", {
        name: form.name, email: form.email, password: form.password, role: form.role,
        childProfile: form.role === "guardian" && form.childName
          ? { name: form.childName, age: Number(form.childAge) } : undefined,
        childPassword: form.role === "guardian" ? form.childPassword : undefined,
        lgpdConsent: true, consentTimestamp: new Date().toISOString(),
      });
      setSuccess("Conta criada! Agora você já pode entrar.");
      setView("login"); setStep(1);
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível criar a conta.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-title"
        className="grid max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-[.85fr_1.15fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 md:block">
          <Image src="/assets/mainiconfirstpage.png" alt="TitiA, assistente de aprendizagem do Conta Comigo"
            fill sizes="360px" className="object-contain object-bottom pt-12" />
          <div className="absolute left-6 top-6 right-6 rounded-2xl bg-white/80 p-4 backdrop-blur">
            <p className="text-2xl font-black text-indigo-950">Conta Comigo</p>
            <p className="text-sm font-semibold text-violet-700">Matemática que aprende com cada criança.</p>
          </div>
        </div>

        <div className="relative overflow-y-auto p-5 sm:p-8">
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100 focus:ring-4 focus:ring-violet-200">×</button>
          <div className="mb-6 pr-10">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">Bem-vindo</p>
            <h2 id="auth-title" className="text-3xl font-black text-slate-900">
              {view === "login" ? "Entrar no Conta Comigo" : "Criar sua conta"}
            </h2>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Acesso">
            {(["login", "register"] as AuthView[]).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={view === item}
                onClick={() => { setView(item); setError(""); setSuccess(""); }}
                className={`rounded-xl px-4 py-2.5 font-bold ${view === item ? "bg-white text-violet-700 shadow-sm" : "text-slate-600"}`}>
                {item === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          {success && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {view === "login" ? (
            <form onSubmit={submitLogin} className="space-y-4">
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input type="checkbox" checked={childLogin} onChange={(e) => setChildLogin(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                Sou criança
              </label>
              {childLogin ? <>
                <Field label="Nome da criança"><input className={fieldClass} required value={form.name} onChange={(e) => update("name", e.target.value)} /></Field>
                <Field label="E-mail do responsável"><input type="email" className={fieldClass} required value={form.guardianEmail} onChange={(e) => update("guardianEmail", e.target.value)} /></Field>
              </> :
                <Field label="E-mail"><input type="email" autoComplete="email" className={fieldClass} required value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>}
              <Field label="Senha"><input type="password" autoComplete="current-password" className={fieldClass} required value={form.password} onChange={(e) => update("password", e.target.value)} /></Field>
              <SubmitButton loading={loading}>Entrar</SubmitButton>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="space-y-4">
              <p className="text-sm text-slate-500">Etapa {step} de 2</p>
              {step === 1 ? <>
                <Field label="Seu nome"><input className={fieldClass} required value={form.name} onChange={(e) => update("name", e.target.value)} /></Field>
                <Field label="E-mail"><input type="email" autoComplete="email" className={fieldClass} required value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
                <Field label="Senha (mínimo de 8 caracteres)"><input type="password" minLength={8} autoComplete="new-password" className={fieldClass} required value={form.password} onChange={(e) => update("password", e.target.value)} /></Field>
                <fieldset><legend className="mb-2 font-semibold text-slate-700">Eu sou</legend><div className="grid grid-cols-2 gap-2">
                  {[{ value: "guardian", label: "Responsável" }, { value: "professional", label: "Educador" }].map(({ value, label }) =>
                    <button key={value} type="button" onClick={() => update("role", value)}
                      className={`rounded-2xl border-2 p-3 font-bold ${form.role === value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600"}`}>{label}</button>)}
                </div></fieldset>
                <SubmitButton loading={false}>Continuar</SubmitButton>
              </> : <>
                {form.role === "guardian" && <>
                  <Field label="Nome da criança"><input className={fieldClass} required value={form.childName} onChange={(e) => update("childName", e.target.value)} /></Field>
                  <Field label="Idade da criança"><input type="number" min={4} max={12} className={fieldClass} required value={form.childAge} onChange={(e) => update("childAge", e.target.value)} /></Field>
                  <Field label="Senha da criança"><input type="password" minLength={4} className={fieldClass} required value={form.childPassword} onChange={(e) => update("childPassword", e.target.value)} /></Field>
                </>}
                <label className="flex items-start gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-slate-700">
                  <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-0.5 h-5 w-5 accent-violet-600" />
                  <span>Li e aceito o Termo de Consentimento e a Política de Privacidade para uso educacional e acadêmico.</span>
                </label>
                <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="rounded-2xl border-2 border-slate-200 px-5 font-bold">Voltar</button><SubmitButton loading={loading}>Criar conta</SubmitButton></div>
              </>}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-black text-white shadow-lg hover:-translate-y-0.5 disabled:opacity-50">{loading ? "Aguarde…" : children}</button>;
}
