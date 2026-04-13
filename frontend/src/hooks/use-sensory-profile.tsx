"use client";

import { useState } from "react";

export interface SensoryProfile {
  lowStimulationMode: boolean;
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  backgroundColor: string;
}

const defaultProfile: SensoryProfile = {
  lowStimulationMode: false,
  fontSize: "medium",
  highContrast: false,
  backgroundColor: "#ffffff",
};

export function useSensoryProfile() {
  const [profile, setProfile] = useState<SensoryProfile>(defaultProfile);

  const updateProfile = (newFields: Partial<SensoryProfile>) => {
    setProfile((prev) => ({ ...prev, ...newFields }));
  };

  return {
    profile,
    updateProfile,
  };
}
