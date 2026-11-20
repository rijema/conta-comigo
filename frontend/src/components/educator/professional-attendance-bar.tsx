"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { isAttendingAsChild, getAttendanceLearnerName, exitAttendance } from "@/lib/attendance";
import { useAuthStore } from "@/store/auth.store";

/**
 * Fixed banner shown only while a professional is "inside" a child's
 * experience (started via "Iniciar atendimento"). Lets her end the
 * attendance and return to her own dashboard without ever needing the
 * child's login again.
 */
export function ProfessionalAttendanceBar() {
  const [visible, setVisible] = useState(false);
  const [learnerName, setLearnerName] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  // Two-step end (GAIA G20/G28): one stray tap must not close the session.
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  // Re-evaluate whenever the authenticated user changes (not just on mount):
  // isAttendingAsChild() checks the attendance stash against *this* user's
  // id, so if a different account becomes active on an already-mounted page
  // (e.g. client-side navigation without unmounting this component), the
  // banner must not keep showing another child's stale attendance state.
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    setVisible(isAttendingAsChild());
    setLearnerName(getAttendanceLearnerName());
  }, [currentUserId]);

  if (!visible) return null;

  const handleEnd = async () => {
    setEnding(true);
    const destination = await exitAttendance();
    router.push(`/${locale}/${destination ?? "dashboard/educator"}`);
  };

  return (
    <div className="sticky inset-x-0 top-0 z-[95] flex items-center justify-between gap-3 bg-violet-700 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-700 px-4 py-2 text-white shadow-lg">
      <p className="text-sm font-bold">
        🩺 Atendimento em andamento{learnerName ? ` · ${learnerName}` : ""}
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirmar encerramento do atendimento">
          <span className="text-sm font-bold">Encerrar mesmo?</span>
          <button type="button" onClick={handleEnd} disabled={ending} autoFocus
            className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-violet-900 hover:bg-violet-50 focus-visible:outline-white">
            {ending ? "Encerrando…" : "Sim, encerrar"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={ending}
            className="rounded-full bg-black/20 px-4 py-1.5 text-sm font-bold hover:bg-black/30 focus-visible:outline-white">
            Continuar atendimento
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full bg-black/20 px-4 py-1.5 text-sm font-bold hover:bg-black/30 focus-visible:outline-white"
        >
          Encerrar atendimento
        </button>
      )}
    </div>
  );
}
