/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import { ResearchPseudonymizationService } from '../research-pseudonymization.service';

/**
 * [PROPOSTA CONTA COMIGO]: Research Pseudonymization Tests
 * Verify deterministic one-way pseudonymization for research export
 */
describe('ResearchPseudonymizationService', () => {
  let service: ResearchPseudonymizationService;
  let mockConfigService: any;

  const testSecret = 'test-secret-key-12345';
  const learnerUuid1 = '550e8400-e29b-41d4-a716-446655440000';
  const learnerUuid2 = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key, defaultValue) => {
        if (key === 'RESEARCH_PSEUDONYMIZATION_SECRET') {
          return testSecret;
        }
        return defaultValue;
      }),
    };

    service = new ResearchPseudonymizationService(mockConfigService);
  });

  describe('Deterministic Pseudonymization', () => {
    it('should generate same pseudonym for same learner UUID', () => {
      // [PROPOSTA CONTA COMIGO]: Same input → same output (deterministic)
      const pseudonym1 = service.pseudonymizeLearnerId(learnerUuid1);
      const pseudonym2 = service.pseudonymizeLearnerId(learnerUuid1);

      expect(pseudonym1).toBe(pseudonym2);
    });

    it('should generate different pseudonym for different learner UUIDs', () => {
      // [PROPOSTA CONTA COMIGO]: Different input → different output
      const pseudonym1 = service.pseudonymizeLearnerId(learnerUuid1);
      const pseudonym2 = service.pseudonymizeLearnerId(learnerUuid2);

      expect(pseudonym1).not.toBe(pseudonym2);
    });

    it('should generate 64-character hex string (SHA256)', () => {
      // [PROPOSTA CONTA COMIGO]: HMAC-SHA256 produces 64 hex chars
      const pseudonym = service.pseudonymizeLearnerId(learnerUuid1);

      expect(pseudonym).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should NOT contain substring of original UUID', () => {
      // [PROPOSTA CONTA COMIGO]: Pseudonym must not expose original UUID
      const pseudonym = service.pseudonymizeLearnerId(learnerUuid1);
      const uuidWithoutHyphens = learnerUuid1.replace(/-/g, '');

      expect(pseudonym).not.toContain(uuidWithoutHyphens);
      expect(pseudonym).not.toContain(learnerUuid1);
    });

    it('should use configured secret for HMAC', () => {
      // [PROPOSTA CONTA COMIGO]: Different secret → different pseudonym
      const pseudonym1 = service.pseudonymizeLearnerId(learnerUuid1);

      // Create service with different secret
      const altConfigService = {
        get: jest.fn((key, defaultValue) => {
          if (key === 'RESEARCH_PSEUDONYMIZATION_SECRET') {
            return 'different-secret-key-67890';
          }
          return defaultValue;
        }),
      } as any;
      const altService = new ResearchPseudonymizationService(altConfigService);
      const pseudonym2 = altService.pseudonymizeLearnerId(learnerUuid1);

      expect(pseudonym1).not.toBe(pseudonym2);
    });
  });

  describe('Batch Pseudonymization', () => {
    it('should pseudonymize multiple UUIDs consistently', () => {
      // [PROPOSTA CONTA COMIGO]: Batch operation preserves determinism
      const uuids = [learnerUuid1, learnerUuid2];
      const mapping = service.pseudonymizeMultiple(uuids);

      expect(mapping.size).toBe(2);
      expect(mapping.get(learnerUuid1)).toBe(service.pseudonymizeLearnerId(learnerUuid1));
      expect(mapping.get(learnerUuid2)).toBe(service.pseudonymizeLearnerId(learnerUuid2));
    });
  });

  describe('Consistency Verification', () => {
    it('should verify pseudonym consistency', () => {
      // [PROPOSTA CONTA COMIGO]: Verify generated pseudonym matches expected
      const pseudonym = service.pseudonymizeLearnerId(learnerUuid1);
      const isConsistent = service.verifyConsistency(learnerUuid1, pseudonym);

      expect(isConsistent).toBe(true);
    });

    it('should reject inconsistent pseudonym', () => {
      // [PROPOSTA CONTA COMIGO]: Detect tampering or wrong secret
      const wrongPseudonym = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const isConsistent = service.verifyConsistency(learnerUuid1, wrongPseudonym);

      expect(isConsistent).toBe(false);
    });
  });
});
