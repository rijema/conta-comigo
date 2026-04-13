/**
 * OntologyReasonerService
 *
 * Implements a JSON-based reasoning engine inspired by the LASDONT OWL ontology.
 * The ontology defines:
 *   - Strengths: Visual, Auditive, Logical, Motor, Sensory
 *   - Weaknesses: same axes
 *   - Treatments: Visual_Puzzles, Textual_Quizzes, Videos, IA_Sandbox_DIY, etc.
 *   - Rules: if hasStrength(Visual) AND hasStrength(Sensory) → recommend IA_Sandbox_DIY
 *
 * Ontology source: LASDONT (LasdOnt.owl) - Richard Jeremias, 2024
 */
@Injectable()
export class OntologyReasonerService {
  private readonly logger = new Logger(OntologyReasonerService.name);

  /**
   * Infer recommended treatment modalities based on learner strengths/weaknesses.
   * Mirrors the OWL SubClassOf restrictions from LASDONT.
   */
  inferRecommendedModalities(
    strengths: Record<string, boolean>,
    weaknesses: Record<string, boolean>,
  ): { modalities: string[]; inferences: string[] } {
    const modalities: string[] = [];
    const inferences: string[] = [];

    // Rule 1: IA_Sandbox_DIY — requires Visual + Sensory strength
    // Source: OWL SubClassOf restriction on IA_Sandbox_DIY
    if (strengths?.visual && strengths?.sensory) {
      modalities.push('visual'); // IA_Sandbox maps to visual modality
      inferences.push(
        'LASDONT:IA_Sandbox_DIY — hasStrength(Visual) AND hasStrength(Sensory)',
      );
    }

    // Rule 2: Visual_Puzzles — requires Logical + Sensory + Visual strength
    if (strengths?.logical && strengths?.sensory && strengths?.visual) {
      modalities.push('visual');
      inferences.push(
        'LASDONT:Visual_Puzzles — hasStrength(Logical) AND hasStrength(Sensory) AND hasStrength(Visual)',
      );
    }

    // Rule 3: Textual_Quizzes — requires Logical strength
    if (strengths?.logical && !weaknesses?.logical) {
      modalities.push('text');
      inferences.push(
        'LASDONT:Textual_Quizzes — hasStrength(Logical)',
      );
    }

    // Rule 4: Question_Videos — Visual strength OR (Visual strength AND Motor weakness)
    if (strengths?.visual || (strengths?.visual && weaknesses?.motor)) {
      modalities.push('auditive');
      inferences.push(
        'LASDONT:Question_Videos — hasStrength(Visual) OR (hasStrength(Visual) AND hasWeakness(Motor))',
      );
    }

    // Rule 5: Yes_No_Videos — Logical weakness OR Motor weakness
    if (weaknesses?.logical || weaknesses?.motor) {
      modalities.push('auditive');
      inferences.push(
        'LASDONT:Yes_No_Videos — hasWeakness(Logical) OR hasWeakness(Motor)',
      );
    }

    // Default fallback
    if (modalities.length === 0) {
      modalities.push('visual');
      inferences.push('FALLBACK: Default visual modality (no specific constraints matched)');
    }

    // Deduplicate
    const uniqueModalities = [...new Set(modalities)];

    this.logger.debug(
      `Ontology inferences: ${inferences.join(' | ')} → modalities: ${uniqueModalities.join(', ')}`,
    );

    return { modalities: uniqueModalities, inferences };
  }

  /**
   * Infer support level from ASD profile.
   * Maps to LASDONT:Mild_Percentage, Moderated_Percentage, Strong_Percentage
   */
  inferSupportLevel(asdSupportLevel: string): {
    level: 'mild' | 'moderate' | 'strong';
    inference: string;
  } {
    const map: Record<string, 'mild' | 'moderate' | 'strong'> = {
      mild: 'mild',
      moderate: 'moderate',
      strong: 'strong',
    };

    const level = map[asdSupportLevel] || 'moderate';
    return {
      level,
      inference: `LASDONT:${level.charAt(0).toUpperCase() + level.slice(1)}_Percentage`,
    };
  }
}