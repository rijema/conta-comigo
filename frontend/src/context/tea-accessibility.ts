/**
 * TEA ACCESSIBILITY MANAGER
 *
 * Configures system for children with Autism Spectrum Disorder (ASD/TEA)
 *
 * FEATURES:
 * ✅ Sensory load control (low/medium/high)
 * ✅ Extended time (slow mode)
 * ✅ Reduced animations (prevent overstimulation)
 * ✅ Clear visual hierarchy (high contrast)
 * ✅ Audio feedback (predictable, consistent)
 * ✅ Minimal text (visual preference)
 * ✅ Consistent patterns (reduce anxiety)
 * ✅ Break reminders (prevent fatigue)
 */

export interface TEAAccessibilityProfile {
  // Sensory preferences
  sensoryLoad: 'low' | 'medium' | 'high';
  
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largerText: boolean;
  minimizeAnimations: boolean;
  
  // Audio preferences
  audioEnabled: boolean;
  audioVolume: 0.1 | 0.3 | 0.5 | 0.7 | 0.9 | 1.0;
  speakInstructions: boolean;
  
  // Timing preferences
  slowMode: boolean;
  timeMultiplier: 1 | 1.5 | 2 | 3; // Extra time multiplier
  breakReminderIntervalMs: number; // 0 = disabled
  
  // Interaction preferences
  largeButtons: boolean;
  confirmBeforeSubmit: boolean;
  hideUnnecessaryUI: boolean;
  
  // Rewards & motivation
  celebrationStyle: 'minimal' | 'moderate' | 'festive';
  showProgressBar: boolean;
  pointsVisible: boolean;
  
  // Cognitive support
  oneLearningObjectivePerScreen: boolean;
  stepByStepInstructions: boolean;
  repeatInstructions: boolean;
}

/**
 * Default TEA-optimized profile
 * Conservative settings to reduce overwhelm
 */
export const DEFAULT_TEA_PROFILE: TEAAccessibilityProfile = {
  // Low sensory load by default
  sensoryLoad: 'low',
  
  // Visuals: high contrast, minimal motion
  highContrast: true,
  reducedMotion: true,
  largerText: true,
  minimizeAnimations: true,
  
  // Audio: enabled but controllable
  audioEnabled: true,
  audioVolume: 0.7,
  speakInstructions: true,
  
  // Extra time by default
  slowMode: true,
  timeMultiplier: 2, // 2x time
  breakReminderIntervalMs: 15 * 60 * 1000, // 15 min breaks
  
  // Accessible interactions
  largeButtons: true,
  confirmBeforeSubmit: false,
  hideUnnecessaryUI: true,
  
  // Gentle rewards
  celebrationStyle: 'minimal',
  showProgressBar: true,
  pointsVisible: false, // Can be overwhelming
  
  // Cognitive support
  oneLearningObjectivePerScreen: true,
  stepByStepInstructions: true,
  repeatInstructions: false,
};

/**
 * Preset profiles based on child profile
 */
export const TEA_PRESETS = {
  veryMildSensory: {
    ...DEFAULT_TEA_PROFILE,
    sensoryLoad: 'low',
    timeMultiplier: 1.5,
    reducedMotion: false,
  } as TEAAccessibilityProfile,
  
  moderateSensory: {
    ...DEFAULT_TEA_PROFILE,
    sensoryLoad: 'low',
    timeMultiplier: 2,
    minimizeAnimations: true,
  } as TEAAccessibilityProfile,
  
  highSensory: {
    ...DEFAULT_TEA_PROFILE,
    sensoryLoad: 'low',
    timeMultiplier: 3,
    minimizeAnimations: true,
    audioVolume: 0.5,
    celebrationStyle: 'minimal',
    pointsVisible: false,
  } as TEAAccessibilityProfile,
  
  verbalCommunication: {
    ...DEFAULT_TEA_PROFILE,
    speakInstructions: true,
    audioEnabled: true,
    repeatInstructions: true,
  } as TEAAccessibilityProfile,
  
  nonverbalCommunication: {
    ...DEFAULT_TEA_PROFILE,
    speakInstructions: false,
    audioEnabled: false,
    minimizeAnimations: true,
    hideUnnecessaryUI: true,
  } as TEAAccessibilityProfile,
};

/**
 * Apply TEA profile to component
 */
export const applylTEAStyles = (
  profile: TEAAccessibilityProfile,
): React.CSSProperties => ({
  fontSize: profile.largerText ? '18px' : '16px',
  transition: profile.reducedMotion ? 'none' : 'all 0.3s ease',
  filter: profile.highContrast ? 'contrast(1.2)' : 'none',
  // Add more style utilities as needed
});

/**
 * Adjust time based on profile
 */
export const getAdjustedTime = (
  baseTime: number,
  profile: TEAAccessibilityProfile,
): number => {
  return profile.slowMode ? baseTime * profile.timeMultiplier : baseTime;
};

/**
 * Convert celebration style to animation config
 */
export const getCelebrationConfig = (
  style: 'minimal' | 'moderate' | 'festive',
) => {
  switch (style) {
    case 'minimal':
      return {
        duration: 1.0,
        confettiCount: 0,
        showEmoji: true,
        sound: false,
      };
    case 'moderate':
      return {
        duration: 1.5,
        confettiCount: 6,
        showEmoji: true,
        sound: true,
      };
    case 'festive':
      return {
        duration: 2.5,
        confettiCount: 12,
        showEmoji: true,
        sound: true,
      };
  }
};

/**
 * Check if should show break reminder
 */
export const shouldShowBreakReminder = (
  elapsedMs: number,
  profile: TEAAccessibilityProfile,
): boolean => {
  if (profile.breakReminderIntervalMs === 0) return false;
  return elapsedMs > 0 && elapsedMs % profile.breakReminderIntervalMs < 1000;
};

/**
 * Get button size based on profile
 */
export const getButtonSize = (profile: TEAAccessibilityProfile) => {
  if (profile.largeButtons) {
    return {
      padding: '20px 30px',
      fontSize: '18px',
      minHeight: '60px',
      minWidth: '120px',
    };
  }
  return {
    padding: '10px 15px',
    fontSize: '14px',
    minHeight: '40px',
    minWidth: '80px',
  };
};

/**
 * Store profile in localStorage
 */
export const saveTEAProfile = (
  childId: string,
  profile: TEAAccessibilityProfile,
) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      `tea-profile-${childId}`,
      JSON.stringify(profile),
    );
  }
};

/**
 * Load profile from localStorage
 */
export const loadTEAProfile = (
  childId: string,
): TEAAccessibilityProfile | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`tea-profile-${childId}`);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

/**
 * TEA Accessibility Context for React
 */
import React from 'react';

export interface TEAContextType {
  profile: TEAAccessibilityProfile;
  setProfile: (profile: TEAAccessibilityProfile) => void;
  applyToStyle: (base: React.CSSProperties) => React.CSSProperties;
}

export const TEAContext = React.createContext<TEAContextType>({
  profile: DEFAULT_TEA_PROFILE,
  setProfile: () => {},
  applyToStyle: (base) => base,
});

export const useTEAAccessibility = () => {
  return React.useContext(TEAContext);
};

/**
 * Provider component
 */
export const TEAAccessibilityProvider: React.FC<{
  children: React.ReactNode;
  childId?: string;
  preset?: keyof typeof TEA_PRESETS;
}> = ({ children, childId = 'default', preset = 'moderateSensory' }) => {
  const [profile, setProfile] = React.useState<TEAAccessibilityProfile>(() => {
    // Try to load from localStorage
    if (childId !== 'default') {
      const saved = loadTEAProfile(childId);
      if (saved) return saved;
    }
    
    // Otherwise use preset
    return TEA_PRESETS[preset] || DEFAULT_TEA_PROFILE;
  });

  const applyToStyle = (base: React.CSSProperties): React.CSSProperties => ({
    ...base,
    ...applylTEAStyles(profile),
  });

  const value: TEAContextType = {
    profile,
    setProfile: (newProfile) => {
      setProfile(newProfile);
      if (childId !== 'default') {
        saveTEAProfile(childId, newProfile);
      }
    },
    applyToStyle,
  };

  return (
    <TEAContext.Provider value={value}>
      {children}
    </TEAContext.Provider>
  );
};

export default TEAAccessibilityProvider;
