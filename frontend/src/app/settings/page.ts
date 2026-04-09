"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Sun, Moon, Volume2, VolumeX, Type, Globe } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { settings, updateSettings } = useAccessibility();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
  };

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleLowStimulation = () => {
    updateSettings({ lowStimulationMode: !settings.lowStimulationMode });
  };

  const changeFontSize = (size: "small" | "medium" | "large") => {
    updateSettings({ fontSize: size });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === "light" ? (
                  <Sun className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Moon className="w-6 h-6 text-blue-400" />
                )}
                <div>
                  <p className="font-semibold">{t("settings.theme")}</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.theme === "light"
                      ? t("settings.lightMode")
                      : t("settings.darkMode")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.theme === "dark" ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleTheme")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.theme === "dark" ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-green-500" />
                ) : (
                  <VolumeX className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold">{t("settings.sound")}</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.soundEnabled
                      ? t("settings.soundOn")
                      : t("settings.soundOff")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.soundEnabled ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleSound")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.soundEnabled ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Low Stimulation */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                  <span className="text-xs">🧘</span>
                </div>
                <div>
                  <p className="font-semibold">{t("settings.lowStimulation")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.lowStimulationDesc")}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleLowStimulation}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.lowStimulationMode ? "bg-primary" : "bg-muted"
                }`}
                aria-label={t("settings.toggleLowStimulation")}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.lowStimulationMode ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-6 h-6 text-blue-500" />
              <p className="font-semibold">{t("settings.fontSize")}</p>
            </div>
            <div className="flex gap-3">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => changeFontSize(size)}
                  className={`flex-1 py-2 rounded-xl border-2 transition-colors ${
                    settings.fontSize === size
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    fontSize:
                      size === "small"
                        ? "12px"
                        : size === "medium"
                        ? "16px"
                        : "20px",
                  }}
                >
                  {t(`settings.fontSize_${size}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-indigo-500" />
              <p className="font-semibold">{t("settings.language")}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => changeLanguage("pt")}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                  i18n.language === "pt"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                🇧🇷 Português
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                  i18n.language === "en"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}