"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Sun, Moon, Volume2, VolumeX, Type, Globe } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTitiaSpeech } from "@/hooks/use-titia-speech";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { settings, updateSettings } = useAccessibility();
  const { setVoiceEnabled, speakFeedback, stopSpeech } = useTitiaSpeech();

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

          {/* TitiA voice */}
          <div className="bg-card rounded-2xl p-5 border border-border space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {settings.voiceEnabled ? (
                  <Volume2 className="w-6 h-6 text-purple-500" />
                ) : (
                  <VolumeX className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold">Voz da TitiA</p>
                  <p className="text-sm text-muted-foreground">Leitura opcional de instruções, dicas e pictogramas.</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={settings.voiceEnabled}
                onClick={() => setVoiceEnabled(!settings.voiceEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${settings.voiceEnabled ? "bg-primary" : "bg-muted"}`}
                aria-label={settings.voiceEnabled ? "Desativar voz da TitiA" : "Ativar voz da TitiA"}>
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.voiceEnabled ? "translate-x-8" : "translate-x-1"}`} />
              </button>
            </div>

            <label className="block">
              <span className="font-semibold">Velocidade da fala: {settings.speechRate.toFixed(2)}×</span>
              <input type="range" min="0.6" max="1.2" step="0.05"
                value={settings.speechRate}
                onChange={(event) => updateSettings({ speechRate: Number(event.target.value) })}
                className="w-full mt-2" aria-label="Velocidade da fala da TitiA" />
            </label>

            <label className="block font-semibold">
              Idioma da fala
              <select value={settings.speechLanguage}
                onChange={(event) => updateSettings({ speechLanguage: event.target.value })}
                className="block w-full mt-2 rounded-xl border-2 border-border bg-background px-3 py-2">
                <option value="pt-BR">Português do Brasil</option>
                <option value="en-US">English (US)</option>
              </select>
            </label>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Falar instruções automaticamente</p>
                <p className="text-sm text-muted-foreground">Uma vez ao abrir cada atividade.</p>
              </div>
              <button type="button" role="switch" aria-checked={settings.automaticInstructionSpeech}
                onClick={() => updateSettings({ automaticInstructionSpeech: !settings.automaticInstructionSpeech })}
                className={`relative w-14 h-7 rounded-full transition-colors ${settings.automaticInstructionSpeech ? "bg-primary" : "bg-muted"}`}
                aria-label="Alternar fala automática das instruções">
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.automaticInstructionSpeech ? "translate-x-8" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button type="button" disabled={!settings.voiceEnabled}
                onClick={() => speakFeedback("Oi! Eu sou a TitiA.")}
                className="flex-1 rounded-xl border-2 border-purple-200 px-3 py-2 font-bold text-purple-700 disabled:opacity-40">
                Testar voz
              </button>
              <button type="button" onClick={stopSpeech}
                className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 font-bold text-slate-700">
                Parar fala
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Voz neural Dii por TigreGotico Lda, disponibilizada por OpenVoiceOS sob
              {" "}<a href="https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii"
                target="_blank" rel="noopener noreferrer" className="underline">CC BY-NC-ND 4.0</a>.
            </p>
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
