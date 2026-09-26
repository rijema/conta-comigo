/**
 * Research Pseudonymization Service Tests
 * [INTEGRATION 3C-FINAL]: Verify HMAC-based pseudonym generation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResearchPseudonymizationService } from '../research-pseudonymization.service';

describe('ResearchPseudonymizationService', () => {
  let service: ResearchPseudonymizationService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchPseudonymizationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'RESEARCH_PSEUDONYM_SECRET') {
                return 'test-secret-key';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ResearchPseudonymizationService>(ResearchPseudonymizationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Pseudonym Generation', () => {
    it('should generate stable pseudonym for same learner', () => {
      const learnerId = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const pseudonym1 = service.generatePseudonym(learnerId);
      const pseudonym2 = service.generatePseudonym(learnerId);

      expect(pseudonym1).toBe(pseudonym2);
    });

    it('should generate different pseudonym for different learner', () => {
      const learnerId1 = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const learnerId2 = 'learner-223e4567-e89b-12d3-a456-426614174000';

      const pseudonym1 = service.generatePseudonym(learnerId1);
      const pseudonym2 = service.generatePseudonym(learnerId2);

      expect(pseudonym1).not.toBe(pseudonym2);
    });

    it('should not expose UUID substring in pseudonym', () => {
      const learnerId = '123e4567-e89b-12d3-a456-426614174000';
      const pseudonym = service.generatePseudonym(learnerId);

      // Pseudonym should not contain any part of the UUID
      expect(pseudonym).not.toContain('123e4567');
      expect(pseudonym).not.toContain('e89b');
      expect(pseudonym).not.toContain('12d3');
      expect(pseudonym).not.toContain('a456');
      expect(pseudonym).not.toContain('426614174000');
    });

    it('should start with learner- prefix', () => {
      const learnerId = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const pseudonym = service.generatePseudonym(learnerId);

      expect(pseudonym).toMatch(/^learner-[a-f0-9]{16}$/);
    });

    it('should be deterministic across sessions', () => {
      const learnerId = 'learner-test-id';
      const pseudonyms = Array.from({ length: 5 }, () =>
        service.generatePseudonym(learnerId)
      );

      const allSame = pseudonyms.every((p) => p === pseudonyms[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('Pseudonym Verification', () => {
    it('should verify correct pseudonym', () => {
      const learnerId = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const pseudonym = service.generatePseudonym(learnerId);

      const isValid = service.verifyPseudonym(learnerId, pseudonym);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect pseudonym', () => {
      const learnerId = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const wrongPseudonym = 'learner-0000000000000000';

      const isValid = service.verifyPseudonym(learnerId, wrongPseudonym);
      expect(isValid).toBe(false);
    });

    it('should reject pseudonym for different learner', () => {
      const learnerId1 = 'learner-123e4567-e89b-12d3-a456-426614174000';
      const learnerId2 = 'learner-223e4567-e89b-12d3-a456-426614174000';

      const pseudonym1 = service.generatePseudonym(learnerId1);
      const isValid = service.verifyPseudonym(learnerId2, pseudonym1);

      expect(isValid).toBe(false);
    });
  });
});
