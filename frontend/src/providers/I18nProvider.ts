"use client";

import { useEffect } from "react";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import ptTranslations from "@/locales/pt.json";
import enTranslations from "@/locales/en.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: ptTranslations },
      en: { translation: enTranslations },
    },
    lng: typeof window !== "undefined"
      ? localStorage.getItem("lang") || "pt"
      : "pt",
    fallbackLng: "pt",
    interpolation: { escapeValue: false },
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}