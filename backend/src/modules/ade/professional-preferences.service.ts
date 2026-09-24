import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../users/entities/child-profile.entity';

export interface ModalityPreferences {
  visual: {
    strength: boolean;
    difficulty: 'strength' | 'difficulty' | 'neutral';
  };
  auditive: {
    strength: boolean;
    difficulty: 'strength' | 'difficulty' | 'neutral';
  };
  logical: {
    strength: boolean;
    difficulty: 'strength' | 'difficulty' | 'neutral';
  };
  motor: {
    strength: boolean;
    difficulty: 'strength' | 'difficulty' | 'neutral';
  };
  sensory: {
    strength: boolean;
    difficulty: 'strength' | 'difficulty' | 'neutral';
  };
}

@Injectable()
export class ProfessionalPreferencesService {
  constructor(
    @InjectRepository(ChildProfile)
    private childProfileRepository: Repository<ChildProfile>,
  ) {}

  /**
   * Get professional's configured modality preferences for a child
   * These are set in the educator dashboard and should guide exercise selection
   */
  async getModalityPreferences(childId: string): Promise<ModalityPreferences> {
    const profile = await this.childProfileRepository.findOne({
      where: { userId: childId },
    });

    if (!profile) {
      return this.getDefaultPreferences();
    }

    // Map strengths and weaknesses to modality preferences
    const preferences: ModalityPreferences = {
      visual: {
        strength: profile.strengths?.visual ?? false,
        difficulty: this.getDifficultyLevel(
          profile.strengths?.visual,
          profile.weaknesses?.visual,
        ),
      },
      auditive: {
        strength: profile.strengths?.auditive ?? false,
        difficulty: this.getDifficultyLevel(
          profile.strengths?.auditive,
          profile.weaknesses?.auditive,
        ),
      },
      logical: {
        strength: profile.strengths?.logical ?? false,
        difficulty: this.getDifficultyLevel(
          profile.strengths?.logical,
          profile.weaknesses?.logical,
        ),
      },
      motor: {
        strength: profile.strengths?.motor ?? false,
        difficulty: this.getDifficultyLevel(
          profile.strengths?.motor,
          profile.weaknesses?.motor,
        ),
      },
      sensory: {
        strength: profile.strengths?.sensory ?? false,
        difficulty: this.getDifficultyLevel(
          profile.strengths?.sensory,
          profile.weaknesses?.sensory,
        ),
      },
    };

    return preferences;
  }

  /**
   * Get ASD support level configured by professional
   * Should be: 'mild', 'moderate', 'strong'
   */
  async getAsdSupportLevel(childId: string): Promise<string> {
    const profile = await this.childProfileRepository.findOne({
      where: { userId: childId },
    });

    return profile?.asdSupportLevel ?? 'mild';
  }

  /**
   * Check if a specific modality is marked as strength
   */
  async isModalityStrength(
    childId: string,
    modality: keyof ModalityPreferences,
  ): Promise<boolean> {
    const preferences = await this.getModalityPreferences(childId);
    return preferences[modality]?.strength ?? false;
  }

  /**
   * Check if a specific modality is marked as difficulty
   */
  async isModalityDifficulty(
    childId: string,
    modality: keyof ModalityPreferences,
  ): Promise<boolean> {
    const preferences = await this.getModalityPreferences(childId);
    return preferences[modality]?.difficulty === 'difficulty';
  }

  /**
   * Get exercises that match professional's configured strengths
   * These should be prioritized in recommendations
   */
  async getPreferredModalities(childId: string): Promise<string[]> {
    const preferences = await this.getModalityPreferences(childId);
    return Object.entries(preferences)
      .filter(([_, pref]) => pref.strength)
      .map(([modality]) => modality);
  }

  /**
   * Get exercises that should be avoided due to configured difficulties
   * These should be deprioritized or avoided in recommendations
   */
  async getAvoidedModalities(childId: string): Promise<string[]> {
    const preferences = await this.getModalityPreferences(childId);
    return Object.entries(preferences)
      .filter(([_, pref]) => pref.difficulty === 'difficulty')
      .map(([modality]) => modality);
  }

  /**
   * Calculate difficulty adjustment based on professional preferences
   * Returns a multiplier to adjust exercise difficulty
   */
  async getDifficultyMultiplier(childId: string): Promise<number> {
    const supportLevel = await this.getAsdSupportLevel(childId);

    // Support level affects overall difficulty tolerance
    const supportMultipliers: Record<string, number> = {
      mild: 1.0, // Normal difficulty progression
      moderate: 0.8, // Slightly easier
      strong: 0.6, // Significantly easier
    };

    return supportMultipliers[supportLevel] ?? 1.0;
  }

  /**
   * Filter activities based on professional preferences
   * Returns activities that match the configured strengths/difficulties
   */
  async filterActivitiesByPreferences(
    childId: string,
    activities: any[],
  ): Promise<any[]> {
    const preferences = await this.getModalityPreferences(childId);
    const preferredModalities = await this.getPreferredModalities(childId);
    const avoidedModalities = await this.getAvoidedModalities(childId);

    return activities.filter((activity) => {
      const targetModalities = activity.targetModalities ?? [];

      // Avoid activities with avoided modalities
      if (
        avoidedModalities.some((mod) =>
          targetModalities.includes(mod),
        )
      ) {
        return false;
      }

      // Prioritize activities with preferred modalities
      // But don't exclude activities without preferred modalities
      return true;
    });
  }

  /**
   * Score activities based on how well they match professional preferences
   */
  async scoreActivityByPreferences(
    childId: string,
    activity: any,
  ): Promise<number> {
    const preferences = await this.getModalityPreferences(childId);
    const targetModalities = activity.targetModalities ?? [];

    let score = 0;

    // Bonus for activities matching preferred modalities
    for (const modality of targetModalities) {
      if (preferences[modality as keyof ModalityPreferences]?.strength) {
        score += 0.3;
      }
    }

    // Penalty for activities with avoided modalities
    for (const modality of targetModalities) {
      if (
        preferences[modality as keyof ModalityPreferences]?.difficulty ===
        'difficulty'
      ) {
        score -= 0.5;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private getDifficultyLevel(
    strength: boolean | undefined,
    weakness: boolean | undefined,
  ): 'strength' | 'difficulty' | 'neutral' {
    if (strength) return 'strength';
    if (weakness) return 'difficulty';
    return 'neutral';
  }

  private getDefaultPreferences(): ModalityPreferences {
    return {
      visual: { strength: false, difficulty: 'neutral' },
      auditive: { strength: false, difficulty: 'neutral' },
      logical: { strength: false, difficulty: 'neutral' },
      motor: { strength: false, difficulty: 'neutral' },
      sensory: { strength: false, difficulty: 'neutral' },
    };
  }
}
