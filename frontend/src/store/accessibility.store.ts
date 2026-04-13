import { create } from "zustand";

interface AccessibilityState {
  highContrast: boolean;
  fontSize: number;
  reducedMotion: boolean;
  toggleHighContrast: () => void;
  setFontSize: (size: number) => void;
  toggleReducedMotion: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  highContrast: false,
  fontSize: 16,
  reducedMotion: false,
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  setFontSize: (fontSize) => set({ fontSize }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
}));
