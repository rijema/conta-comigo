"use client";

import { useAccessibilityStore } from "@/store/accessibility.store";
import { useEffect } from "react";

export function useSensoryProfile() {
  const store = useAccessibilityStore();

  // Mapear propriedades para compatibilidade com componentes existentes
  const profile = {
    lowStimulationMode: store.lowStimulation,
    highContrast: store.highContrast,
    fontSize: store.fontSize === "normal" ? "medium" : store.fontSize, // Ajuste para o que SensoryControls espera
    backgroundColor: store.backgroundColor || "#ffffff",
    reducedMotion: store.reducedMotion,
    largeText: store.largeText,
  };

  const updateProfile = (updates: Partial<typeof profile>) => {
    if (updates.lowStimulationMode !== undefined) store.setLowStimulation(updates.lowStimulationMode);
    if (updates.highContrast !== undefined) store.setHighContrast(updates.highContrast);
    if (updates.fontSize !== undefined) {
      const size = updates.fontSize === "medium" ? "normal" : updates.fontSize;
      store.setFontSize(size as any);
    }
    if (updates.backgroundColor !== undefined) store.setBackgroundColor(updates.backgroundColor);
    if (updates.reducedMotion !== undefined) store.setReducedMotion(updates.reducedMotion);
    if (updates.largeText !== undefined) store.setLargeText(updates.largeText);
  };

  // Efeito para aplicar classes ou estilos globais
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      
      if (profile.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      if (profile.lowStimulationMode) {
        root.classList.add("low-stimulation");
      } else {
        root.classList.remove("low-stimulation");
      }
      
      root.style.backgroundColor = profile.backgroundColor;
    }
  }, [profile.highContrast, profile.lowStimulationMode, profile.backgroundColor]);

  return {
    profile,
    updateProfile,
    resetToDefault: store.resetToDefault,
  };
}
