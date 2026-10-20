"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { isAttendingAsChild, getAttendanceLearnerName, exitAttendance } from "@/lib/attendance";

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
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    setVisible(isAttendingAsChild());
    setLearnerName(getAttendanceLearnerName());
  }, []);

  if (!visible) return null;

  const handleEnd = async () => {
    setEnding(true);
    const destination = await exitAttendance();
    router.push(`/${locale}/${destination ?? "dashboard/educator"}`);
  };

  return (
    <div className="sticky inset-x-0 top-0 z-[95] flex items-center justify-between gap-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 px-4 py-2 text-white shadow-lg">
      <p className="text-sm font-bold">
        🩺 Atendimento em andamento{learnerName ? ` · ${learnerName}` : ""}
      </p>
      <button
        type="button"
        onClick={handleEnd}
        disabled={ending}
        className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold hover:bg-white/30 disabled:opacity-60"
      >
        {ending ? "Encerrando…" : "Encerrar atendimento"}
      </button>
    </div>
  );
}
