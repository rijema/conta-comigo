import { Injectable, Logger } from '@nestjs/common';

/**
 * OntologyReasonerService
 *
 * @deprecated Legacy procedural modality fallback retained for compatibility.
 * It does not execute or infer from the formal ContaComigo ontology.
 * The retained legacy rule table contains:
 *   - Strengths: Visual, Auditive, Logical, Motor, Sensory
 *   - Weaknesses: same axes
 *   - Treatments: Visual_Puzzles, Textual_Quizzes, Videos, IA_Sandbox_DIY, etc.
 *   - Rules: if hasStrength(Visual) AND hasStrength(Sensory) → recommend IA_Sandbox_DIY
 *
 * Historical source label: LASDONT.
 */
@Injectable()
export class OntologyReasonerService {
  private readonly logger = new Logger(OntologyReasonerService.name);

  /**
   * Infer recommended treatment modalities based on learner strengths/weaknesses.
   * Runs the legacy hard-coded modality rules.
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
        'LEGACY_PROCEDURAL: IA_Sandbox_DIY modality rule matched',
      );
    }

    // Rule 2: Visual_Puzzles — requires Logical + Sensory + Visual strength
    if (strengths?.logical && strengths?.sensory && strengths?.visual) {
      modalities.push('visual');
      inferences.push(
        'LEGACY_PROCEDURAL: Visual_Puzzles modality rule matched',
      );
    }

    // Rule 3: Textual_Quizzes — requires Logical strength
    if (strengths?.logical && !weaknesses?.logical) {
      modalities.push('text');
      inferences.push(
        'LEGACY_PROCEDURAL: Textual_Quizzes modality rule matched',
      );
    }

    // Rule 4: Question_Videos — Visual strength OR (Visual strength AND Motor weakness)
    if (strengths?.visual || (strengths?.visual && weaknesses?.motor)) {
      modalities.push('auditive');
      inferences.push(
        'LEGACY_PROCEDURAL: Question_Videos modality rule matched',
      );
    }

    // Rule 5: Yes_No_Videos — Logical weakness OR Motor weakness
    if (weaknesses?.logical || weaknesses?.motor) {
      modalities.push('auditive');
      inferences.push(
        'LEGACY_PROCEDURAL: Yes_No_Videos modality rule matched',
      );
    }

    // Default fallback
    if (modalities.length === 0) {
      modalities.push('visual');
      inferences.push('LEGACY_FALLBACK: Default visual modality');
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
   * Preserves the legacy support-level mapping for compatibility only.
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
      inference: `LEGACY_PROCEDURAL: support level mapped to ${level}`,
    };
  }
}
