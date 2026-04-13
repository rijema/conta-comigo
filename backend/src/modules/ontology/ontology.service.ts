/**
 * OntologyService — JSON-based implementation of LASDONT ontology
 * Based on: http://www.semanticweb.org/ricma/ontologies/2024/11/LASDONT.owl
 *
 * Maps the OWL ontology concepts to runtime reasoning:
 * - Strengths (Visual, Auditive, Logical, Motor, Sensory)
 * - Weaknesses (Visual, Auditive, Logical, Motor, Sensory)
 * - Treatments (DIY, IA_Sandbox_DIY, Puzzles, Visual_Puzzles, Quizzes, Videos)
 * - Support Levels (Mild, Moderated, Strong)
 */
@Injectable()
export class OntologyService {
  private readonly logger = new Logger(OntologyService.name);

  // Ontology graph derived from LASDONT.owl
  private readonly ontologyGraph = {
    classes: {
      Strengths: ['Visual_Strength', 'Auditive_Strength', 'Logical_Strength', 'Motor_Strength', 'Sensory_Strength'],
      Weaknesses: ['Visual_Weakness', 'Auditive_Weakness', 'Logical_Weakness', 'Motor_Weakness', 'Sensory_Weakness'],
      Treatments: {
        DIY: ['IA_Sandbox_DIY'],
        Puzzles: ['Visual_Puzzles'],
        Quizzes: ['Textual_Quizzes', 'Visual_Quizzes'],
        Videos: ['Question_Videos', 'Yes_No_Videos'],
      },
      SupportLevels: {
        Mild: 'Mild_Learning_Percentage',
        Moderated: 'Moderated_Percentage',
        Strong: 'Strong_Percentage',
      },
    },
    // Treatment → Required Strengths (from OWL SubClassOf restrictions)
    treatmentRequirements: {
      IA_Sandbox_DIY: {
        requiredStrengths: ['Sensory_Strength', 'Visual_Strength'],
        suitableFor: ['Mild', 'Moderated'],
      },
      Visual_Puzzles: {
        requiredStrengths: ['Logical_Strength', 'Sensory_Strength', 'Visual_Strength'],
        suitableFor: ['Mild', 'Moderated', 'Strong'],
      },
      Question_Videos: {
        requiredStrengths: ['Visual_Strength'],
        requiredWeaknesses: ['Motor_Weakness', 'Logical_Weakness'],
        suitableFor: ['Moderated', 'Strong'],
      },
      Yes_No_Videos: {
        requiredWeaknesses: ['Logical_Weakness', 'Motor_Weakness'],
        suitableFor: ['Strong'],
      },
      Textual_Quizzes: {
        requiredStrengths: ['Logical_Strength'],
        suitableFor: ['Mild'],
      },
      Visual_Quizzes: {
        requiredStrengths: ['Visual_Strength'],
        suitableFor: ['Mild', 'Moderated'],
      },
    },
    // Content difficulty mapping
    contentDifficultyMap: {
      Strong_Support_Level_User: 'Easy_Content',
      Moderated_Support_Level_User: 'Mid_Content',
      Mild_Support_Level_User: 'Hard_Content',
    },
  };

  /**
   * Load learner ontology instance
   * Maps DB learner profile to ontology concepts
   */
  loadLearnerInstance(learnerProfile: Record<string, unknown>): Record<string, unknown> {
    const strengths = (learnerProfile.strengths as string[]) ?? [];
    const weaknesses = (learnerProfile.weaknesses as string[]) ?? [];
    const supportLevel = (learnerProfile.supportLevel as string) ?? 'Moderated';

    const instance = {
      type: 'LearnerOntologyInstance',
      supportLevel,
      strengths: strengths.map(s => `${s}_Strength`),
      weaknesses: weaknesses.map(w => `${w}_Weakness`),
      contentDifficulty: this.ontologyGraph.contentDifficultyMap[`${supportLevel}_Support_Level_User`] ?? 'Mid_Content',
      inferredTreatments: this.inferTreatments(strengths, weaknesses, supportLevel),
    };

    this.logger.log(`[ONTOLOGY] Learner instance loaded: ${JSON.stringify(instance)}`);
    return instance;
  }

  /**
   * Infer applicable treatments based on learner strengths/weaknesses
   * Implements OWL SubClassOf reasoning in TypeScript
   */
  inferTreatments(
    strengths: string[],
    weaknesses: string[],
    supportLevel: string,
  ): string[] {
    const mappedStrengths = strengths.map(s => `${s}_Strength`);
    const mappedWeaknesses = weaknesses.map(w => `${w}_Weakness`);
    const applicable: string[] = [];

    for (const [treatment, requirements] of Object.entries(this.ontologyGraph.treatmentRequirements)) {
      const req = requirements as {
        requiredStrengths?: string[];
        requiredWeaknesses?: string[];
        suitableFor: string[];
      };

      // Check support level compatibility
      if (!req.suitableFor.includes(supportLevel)) continue;

      // Check required strengths (all must be present)
      if (req.requiredStrengths) {
        const hasAllStrengths = req.requiredStrengths.every(s => mappedStrengths.includes(s));
        if (!hasAllStrengths) continue;
      }

      // Check required weaknesses (at least one must be present for weakness-based treatments)
      if (req.requiredWeaknesses) {
        const hasAnyWeakness = req.requiredWeaknesses.some(w => mappedWeaknesses.includes(w));
        if (!hasAnyWeakness) continue;
      }

      applicable.push(treatment);
    }

    this.logger.log(`[ONTOLOGY] Inferred treatments for ${supportLevel}: ${applicable.join(', ')}`);
    return applicable.length > 0 ? applicable : ['Visual_Quizzes']; // Default fallback
  }

  /**
   * Map ontology treatment type to activity modality
   */
  mapTreatmentToModality(treatment: string): string {
    const modalityMap: Record<string, string> = {
      IA_Sandbox_DIY: 'interactive',
      Visual_Puzzles: 'visual',
      Question_Videos: 'video',
      Yes_No_Videos: 'video',
      Textual_Quizzes: 'text',
      Visual_Quizzes: 'visual',
    };
    return modalityMap[treatment] ?? 'visual';
  }

  /**
   * Validate BNCC skill against learner ontology state
   */
  validateBnccAlignment(
    bnccSkillCode: string,
    learnerGrade: number,
  ): { isAligned: boolean; reason: string } {
    // Extract year from BNCC code (e.g., EF01MA01 -> year 1)
    const yearMatch = bnccSkillCode.match(/EF(\d{2})MA/);
    if (!yearMatch) {
      return { isAligned: false, reason: 'Invalid BNCC code format' };
    }

    const skillYear = parseInt(yearMatch[1], 10);
    const isAligned = Math.abs(skillYear - learnerGrade) <= 1; // Allow ±1 year flexibility

    return {
      isAligned,
      reason: isAligned
        ? `Skill year ${skillYear} aligns with learner grade ${learnerGrade}`
        : `Skill year ${skillYear} too far from learner grade ${learnerGrade}`,
    };
  }
}