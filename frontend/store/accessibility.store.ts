import { persist } from "zustand/middleware";

interface AccessibilityState {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
  darkMode: boolean;
  lowStimulation: boolean;
  fontSize: "normal" | "large" | "xlarge";

  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setSoundEffects: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setLowStimulation: (v: boolean) => void;
  setFontSize: (v: "normal" | "large" | "xlarge") => void;
  resetToDefault: () => void;
}

const defaultState = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  soundEffects: true,
  darkMode: false,
  lowStimulation: false,
  fontSize: "normal" as const,
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      ...defaultState,

      setHighContrast: (v) => set({ highContrast: v }),
      setLargeText: (v) =>
        set({ largeText: v, fontSize: v ? "large" : "normal" }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setSoundEffects: (v) => set({ soundEffects: v }),
      setDarkMode: (v) => set({ darkMode: v }),
      setLowStimulation: (v) => set({ lowStimulation: v }),
      setFontSize: (v) => set({ fontSize: v }),
      resetToDefault: () => set(defaultState),
    }),
    {
      name: "asd-platform-accessibility",
    }
  )
);