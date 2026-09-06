import { of } from 'rxjs';
import { KnowledgeTracingService } from './knowledge-tracing.service';

describe('KnowledgeTracingService', () => {
  const createQueryBuilder = () => ({
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  });

  const createService = (updatedMastery: number) => {
    const state = {
      studentId: 'student-1',
      skillId: 'skill-1',
      masteryProbability: 0.5,
      observations: 0,
      lastUpdatedAt: new Date('2026-09-06T12:00:00.000Z'),
    };
    const transactionalRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder()),
      findOneOrFail: jest.fn().mockResolvedValue(state),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => callback({
        getRepository: () => transactionalRepository,
      })),
    };
    const httpService = {
      post: jest.fn().mockReturnValue(of({ data: { updated_mastery: updatedMastery } })),
    };
    const configService = {
      get: jest.fn().mockImplementation((_key, fallback) => fallback),
    };
    const service = new KnowledgeTracingService(
      {} as any,
      dataSource as any,
      httpService as any,
      configService as any,
    );
    return { service, state, httpService, transactionalRepository };
  };

  it('persists canonical mastery after a correct observation', async () => {
    const { service, state, httpService, transactionalRepository } = createService(0.8261);

    await expect(service.observe({
      studentId: 'student-1',
      skillId: 'skill-1',
      skillCode: 'EF01MA01',
      correct: true,
    })).resolves.toEqual(expect.objectContaining({
      masteryProbability: 0.8261,
      observations: 1,
    }));

    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:8001/predict/bkt',
      expect.objectContaining({ current_mastery: 0.5, is_correct: true }),
    );
    expect(transactionalRepository.save).toHaveBeenCalledWith(state);
  });

  it('persists canonical mastery after an incorrect observation', async () => {
    const { service, httpService } = createService(0.2941);

    await expect(service.observe({
      studentId: 'student-1',
      skillId: 'skill-1',
      skillCode: 'EF01MA01',
      correct: false,
    })).resolves.toEqual(expect.objectContaining({
      masteryProbability: 0.2941,
      observations: 1,
    }));

    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:8001/predict/bkt',
      expect.objectContaining({ current_mastery: 0.5, is_correct: false }),
    );
  });
});
