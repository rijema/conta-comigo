"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * [PROPOSTA CONTA COMIGO] This page drove a second, parallel "cycle" model
 * (BNCC-skill-focused, backed by StudentCycleTracking/CycleExerciseAssignment)
 * that duplicated and conflicted with the island/sequence model now live at
 * /learn/menu (island_activity_mappings + locked/completed flags). Running
 * both models at once would show the child two different, contradictory
 * progress/lock states for the same content.
 *
 * The underlying uuid-vs-string island id bug in StudentCycleTracking was
 * fixed (migration FixCycleTrackingIslandIdType) so it no longer crashes,
 * but this page is kept as a redirect to the one real, wired-up learning
 * path until/unless the two models are formally merged.
 */
export default function CycleLearningPageRedirect() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/learn/menu`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      <p className="text-gray-500">Levando você para o mapa de ilhas...</p>
    </div>
  );
}
