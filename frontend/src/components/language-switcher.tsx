"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1">
      {["pt", "en"].map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            locale === l
              ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
          aria-pressed={locale === l}
          aria-label={`Mudar idioma para ${l === "pt" ? "Português" : "English"}`}
        >
          {l === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
        </button>
      ))}
    </div>
  );
}