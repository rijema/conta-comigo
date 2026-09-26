/**
 * Research Pseudonymization Service
 * [INTEGRATION 3C-FINAL]: Deterministic HMAC-based pseudonym generation
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ResearchPseudonymizationService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    // Get secret from environment or use a default for development
    this.secret = this.configService.get<string>(
      'RESEARCH_PSEUDONYM_SECRET',
      'default-dev-secret-change-in-production'
    );
  }

  /**
   * Generate a deterministic pseudonym for a learner
   * [INTEGRATION 3C-FINAL]: HMAC-SHA256 based, stable across sessions
   * Does not expose any substring of the original UUID
   */
  generatePseudonym(learnerId: string): string {
    const hmac = crypto
      .createHmac('sha256', this.secret)
      .update(learnerId)
      .digest('hex');
    
    // Return first 16 characters of hex digest (128 bits)
    // This is stable, deterministic, and doesn't expose UUID substrings
    return `learner-${hmac.substring(0, 16)}`;
  }

  /**
   * Verify that a pseudonym is valid for a learner
   */
  verifyPseudonym(learnerId: string, pseudonym: string): boolean {
    const expected = this.generatePseudonym(learnerId);
    return pseudonym === expected;
  }
}
