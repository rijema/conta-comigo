import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

/**
 * [PROPOSTA CONTA COMIGO]: Research Pseudonymization Service
 * 
 * Converts learner UUIDs to deterministic one-way pseudonyms for research export.
 * - Same learner → same pseudonym (deterministic)
 * - Different learner → different pseudonym
 * - Pseudonym does NOT contain substring of original UUID
 * - Uses HMAC-SHA256 with configured secret
 * - Secret never committed to source
 */
@Injectable()
export class ResearchPseudonymizationService {
  private readonly pseudonymizationSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.pseudonymizationSecret = this.configService.get<string>(
      'RESEARCH_PSEUDONYMIZATION_SECRET',
      'default-insecure-secret-change-in-production',
    );

    if (this.pseudonymizationSecret === 'default-insecure-secret-change-in-production') {
      console.warn(
        '[RESEARCH PSEUDONYMIZATION] Using default secret. Set RESEARCH_PSEUDONYMIZATION_SECRET environment variable for production.',
      );
    }
  }

  /**
   * Generate deterministic pseudonym for a learner UUID
   * [PROPOSTA CONTA COMIGO]: One-way HMAC-based pseudonymization
   * 
   * @param learnerUuid Original learner UUID
   * @returns Deterministic pseudonym (hex string, 64 chars for SHA256)
   */
  pseudonymizeLearnerId(learnerUuid: string): string {
    // Use HMAC-SHA256 to create deterministic one-way pseudonym
    const hmac = createHmac('sha256', this.pseudonymizationSecret);
    hmac.update(learnerUuid);
    const pseudonym = hmac.digest('hex');

    // Verify pseudonym does not contain substring of original UUID
    // (HMAC output is hex, UUID contains hyphens and alphanumeric - extremely unlikely to collide)
    const uuidWithoutHyphens = learnerUuid.replace(/-/g, '');
    if (pseudonym.includes(uuidWithoutHyphens)) {
      throw new Error(
        `[RESEARCH PSEUDONYMIZATION] Generated pseudonym contains original UUID substring (cryptographic failure)`,
      );
    }

    return pseudonym;
  }

  /**
   * Batch pseudonymize multiple learner UUIDs
   */
  pseudonymizeMultiple(learnerUuids: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const uuid of learnerUuids) {
      mapping.set(uuid, this.pseudonymizeLearnerId(uuid));
    }
    return mapping;
  }

  /**
   * Verify pseudonym consistency (for testing)
   */
  verifyConsistency(learnerUuid: string, expectedPseudonym: string): boolean {
    return this.pseudonymizeLearnerId(learnerUuid) === expectedPseudonym;
  }
}
