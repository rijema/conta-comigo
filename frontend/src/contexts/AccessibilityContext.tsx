"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

export interface AccessibilitySettings {
  theme: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  soundEnabled: boolean;
  voiceEnabled: boolean;
  speechRate: number;
  automaticInstructionSpeech: boolean;
  speechLanguage: string;
  lowStimulationMode: boolean;
  highContrast: boolean;
  language: string;
  animationsReduced: boolean;
}

const defaultSettings: AccessibilitySettings = {
  theme: "light",
  fontSize: "medium",
  soundEnabled: true,
  voiceEnabled: true,
  speechRate: 0.9,
  automaticInstructionSpeech: true,
  speechLanguage: "pt-BR",
  lowStimulationMode: false,
  highContrast: false,
  language: "pt",
  animationsReduced: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
  settingsLoaded: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("a11y_settings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        /* ignore */
      }
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    // Apply theme to document
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.classList.toggle("low-stimulation", settings.lowStimulationMode);
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle(
      "reduce-motion",
      settings.animationsReduced
    );

    // Font size
    const fontSizeMap = { small: "14px", medium: "16px", large: "20px" };
    root.style.setProperty(
      "--base-font-size",
      fontSizeMap[settings.fontSize]
    );

    localStorage.setItem("a11y_settings", JSON.stringify(settings));
  }, [settings, settingsLoaded]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, settingsLoaded }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
