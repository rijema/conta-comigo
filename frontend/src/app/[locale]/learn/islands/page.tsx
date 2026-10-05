"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

/**
 * [PROPOSTA CONTA COMIGO] This page used to show a mocked island/cycle
 * overview (hardcoded data, never connected to the backend). The real
 * islands + sequential unlock experience now lives at /learn/menu, which
 * is wired to the live `island_activity_mappings` data and the
 * `locked`/`completed` flags from `GET /activities/islands/map`.
 *
 * Keeping this route alive as a redirect so any existing links/bookmarks
 * still land somewhere useful, instead of a half-built mock screen.
 */
export default function IslandsPageRedirect() {
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
