"use client";

import { useRef, useState } from "react";
import { useModalFocus } from "@/hooks/use-modal-focus";

/**
 * Confirmation before a professional removes a child from her clinic.
 * Nothing is deleted: the child stops appearing in this clinic's panel and
 * keeps her history with the guardian. `alertdialog` + initial focus on
 * "Cancelar" so a stray Enter never removes anyone (WCAG 3.3.4 / GAIA:
 * confirm consequential actions).
 */
export function RemoveFromClinicDialog({
  learnerName,
  clinicName,
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  learnerName: string;
  clinicName?: string | null;
  open: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalFocus<HTMLDivElement>(open, onCancel, cancelRef);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-clinic-title"
        aria-describedby="remove-clinic-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="remove-clinic-title" className="text-lg font-bold text-slate-900">
          Remover {learnerName} da {clinicName ? clinicName : "sua clínica"}?
        </h2>
        <div id="remove-clinic-description" className="mt-3 space-y-2 text-sm text-slate-700">
          <p>Use esta opção se a criança não é atendida na sua clínica.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>A criança deixa de aparecer no seu painel.</li>
            <li>Nenhum dado é apagado. O responsável continua com acesso.</li>
            <li>Para voltar, o responsável precisa vincular a criança à sua clínica de novo.</li>
          </ul>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-11 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 focus-visible:ring-4 focus-visible:ring-red-400 disabled:opacity-60"
          >
            {busy ? "Removendo…" : "Remover da clínica"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown to a professional whose account has no clinic yet (e.g. signed up
 * with Google). Until she registers one, no child is visible.
 */
export function ClaimClinicCard({ onClaim }: { onClaim: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 3) {
      setError("Informe o nome da clínica (pelo menos 3 letras).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onClaim(name.trim());
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível cadastrar a clínica.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="claim-clinic-title" className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <h2 id="claim-clinic-title" className="text-lg font-bold text-amber-950">Cadastre a sua clínica</h2>
      <p className="mt-1 text-sm text-amber-950">
        Sua conta ainda não está ligada a uma clínica, por isso nenhuma criança aparece aqui.
        Depois do cadastro, você verá as crianças cujos responsáveis escolherem a sua clínica.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3" noValidate>
        <label className="flex-1 min-w-[14rem]">
          <span className="mb-1 block text-sm font-semibold text-slate-800">Nome da clínica</span>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoComplete="organization"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "claim-clinic-error" : undefined}
            className="w-full rounded-xl border-2 border-slate-500 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:ring-4 focus-visible:ring-indigo-400 disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Cadastrar clínica"}
        </button>
      </form>
      {error && <p id="claim-clinic-error" role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
    </section>
  );
}
