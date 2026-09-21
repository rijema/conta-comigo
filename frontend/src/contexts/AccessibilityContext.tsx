"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/lib/auth";
import { api } from "@/lib/api-client";

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
  soundEffectsEnabled: boolean;
  volume: number;
  animationSpeed: "slow" | "normal" | "fast";
  visualStimulus: "low" | "medium" | "high";
  audioStimulus: "low" | "medium" | "high";
  feedbackVisual: "minimal" | "normal" | "reinforced";
  celebrationFrequency: "round_only" | "normal" | "frequent";
  autoHints: boolean;
  helpDelaySeconds: number;
  allowChangeActivity: boolean;
  predictability: "standard" | "high";
  reinforcementPreference: "minimal" | "normal" | "frequent";
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
  soundEffectsEnabled: true,
  volume: 0.7,
  animationSpeed: "normal",
  visualStimulus: "medium",
  audioStimulus: "medium",
  feedbackVisual: "normal",
  celebrationFrequency: "frequent",
  autoHints: false,
  helpDelaySeconds: 30,
  allowChangeActivity: true,
  predictability: "standard",
  reinforcementPreference: "normal",
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
  settingsLoaded: boolean;
  childPreferencesReady: boolean;
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
  const user = useAuthStore((state) => state.user);
  const [professionalPreferences, setProfessionalPreferences] = useState<Partial<AccessibilitySettings> | null>(null);
  const [professionalUserId, setProfessionalUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'child') { setProfessionalPreferences(null); setProfessionalUserId(null); return; }
    let active = true;
    setProfessionalPreferences(null);
    setProfessionalUserId(null);
    const load = () => {
      const token = authService.getStoredToken();
      if (!token) return;
      api.get<{ uiPreferences?: Record<string, unknown> }>(`/users/${user.id}/child-profile`, token)
        .then((profile) => {
          if (!active) return;
          const preferences = profile.uiPreferences ?? {};
          setProfessionalPreferences({
            lowStimulationMode: preferences.lowStimulation === true,
            highContrast: preferences.highContrast === true,
            soundEnabled: preferences.soundEnabled !== false,
            voiceEnabled: preferences.voiceEnabled !== false,
            animationsReduced: preferences.animationsEnabled === false,
            automaticInstructionSpeech: preferences.automaticInstructionSpeech !== false,
            soundEffectsEnabled: preferences.soundEffectsEnabled !== false,
            volume: typeof preferences.volume === 'number' ? Math.min(1, Math.max(0, preferences.volume)) : defaultSettings.volume,
            animationSpeed: ['slow', 'normal', 'fast'].includes(String(preferences.animationSpeed)) ? preferences.animationSpeed as AccessibilitySettings['animationSpeed'] : defaultSettings.animationSpeed,
            visualStimulus: ['low', 'medium', 'high'].includes(String(preferences.visualStimulus)) ? preferences.visualStimulus as AccessibilitySettings['visualStimulus'] : defaultSettings.visualStimulus,
            audioStimulus: ['low', 'medium', 'high'].includes(String(preferences.audioStimulus)) ? preferences.audioStimulus as AccessibilitySettings['audioStimulus'] : defaultSettings.audioStimulus,
            feedbackVisual: ['minimal', 'normal', 'reinforced'].includes(String(preferences.feedbackVisual)) ? preferences.feedbackVisual as AccessibilitySettings['feedbackVisual'] : defaultSettings.feedbackVisual,
            celebrationFrequency: ['round_only', 'normal', 'frequent'].includes(String(preferences.celebrationFrequency)) ? preferences.celebrationFrequency as AccessibilitySettings['celebrationFrequency'] : defaultSettings.celebrationFrequency,
            autoHints: preferences.autoHints === true,
            helpDelaySeconds: typeof preferences.helpDelaySeconds === 'number' ? preferences.helpDelaySeconds : defaultSettings.helpDelaySeconds,
            allowChangeActivity: preferences.allowChangeActivity !== false,
            predictability: preferences.predictability === 'high' ? 'high' : 'standard',
            reinforcementPreference: ['minimal', 'normal', 'frequent'].includes(String(preferences.reinforcementPreference)) ? preferences.reinforcementPreference as AccessibilitySettings['reinforcementPreference'] : defaultSettings.reinforcementPreference,
            ...(typeof preferences.speechRate === 'number' ? { speechRate: preferences.speechRate } : {}),
          });
          setProfessionalUserId(user.id);
        }).catch((error) => { console.error('Failed to load child accessibility preferences', error); });
    };
    load();
    window.addEventListener('focus', load);
    const refresh = window.setInterval(load, 30000);
    return () => { active = false; window.removeEventListener('focus', load); window.clearInterval(refresh); };
  }, [user?.id, user?.role]);

  const appliedPreferences = user?.role === 'child' && professionalUserId === user.id ? professionalPreferences : null;
  const effectiveSettings: AccessibilitySettings = useMemo(() => ({
    ...settings,
    soundEnabled: settings.soundEnabled && appliedPreferences?.soundEnabled !== false,
    voiceEnabled: settings.voiceEnabled && settings.soundEnabled && appliedPreferences?.voiceEnabled !== false && appliedPreferences?.soundEnabled !== false,
    automaticInstructionSpeech: settings.automaticInstructionSpeech && appliedPreferences?.automaticInstructionSpeech !== false,
    lowStimulationMode: settings.lowStimulationMode || appliedPreferences?.lowStimulationMode === true,
    highContrast: settings.highContrast || appliedPreferences?.highContrast === true,
    animationsReduced: settings.animationsReduced || appliedPreferences?.animationsReduced === true,
    speechRate: appliedPreferences?.speechRate ?? settings.speechRate,
    soundEffectsEnabled: settings.soundEffectsEnabled && appliedPreferences?.soundEffectsEnabled !== false && !(settings.lowStimulationMode || appliedPreferences?.lowStimulationMode === true),
    volume: appliedPreferences?.volume ?? settings.volume,
    animationSpeed: appliedPreferences?.animationSpeed ?? settings.animationSpeed,
    visualStimulus: appliedPreferences?.visualStimulus ?? settings.visualStimulus,
    audioStimulus: appliedPreferences?.audioStimulus ?? settings.audioStimulus,
    feedbackVisual: appliedPreferences?.feedbackVisual ?? settings.feedbackVisual,
    celebrationFrequency: appliedPreferences?.celebrationFrequency ?? settings.celebrationFrequency,
    autoHints: appliedPreferences?.autoHints ?? settings.autoHints,
    helpDelaySeconds: appliedPreferences?.helpDelaySeconds ?? settings.helpDelaySeconds,
    allowChangeActivity: settings.allowChangeActivity && appliedPreferences?.allowChangeActivity !== false,
    predictability: appliedPreferences?.predictability ?? settings.predictability,
    reinforcementPreference: appliedPreferences?.reinforcementPreference ?? settings.reinforcementPreference,
  }), [settings, appliedPreferences]);
  const childPreferencesReady = user?.role !== 'child' || professionalUserId === user.id;

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
    root.classList.toggle("dark", effectiveSettings.theme === "dark");
    root.classList.toggle("low-stimulation", effectiveSettings.lowStimulationMode);
    root.classList.toggle("high-contrast", effectiveSettings.highContrast);
    root.classList.toggle(
      "reduce-motion",
      effectiveSettings.animationsReduced
    );

    // Font size
    const fontSizeMap = { small: "14px", medium: "16px", large: "20px" };
    root.style.setProperty(
      "--base-font-size",
      fontSizeMap[effectiveSettings.fontSize]
    );

    localStorage.setItem("a11y_settings", JSON.stringify(settings));
  }, [effectiveSettings, settingsLoaded, professionalPreferences, professionalUserId, user?.id, user?.role, settings]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings: effectiveSettings, updateSettings, settingsLoaded, childPreferencesReady }}>
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
