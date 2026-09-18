import { ActivitiesService } from './activities.service';

describe('ActivitiesService answer evaluation', () => {
  const service = new ActivitiesService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const evaluateAnswer = (activity: any, answer: any) =>
    (service as any).evaluateAnswer(activity, answer);

  it('accepts a drag-drop arrangement using correctOrder', () => {
    const activity = {
      type: 'drag_drop',
      content: {
        correctOrder: ['n9', 'n7', 'n6', 'n5'],
        correctAnswer: 'n9,n7,n6,n5',
      },
    };

    expect(evaluateAnswer(activity, ['n9', 'n7', 'n6', 'n5'])).toBe(true);
  });

  it('supports legacy drag-drop activities with a comma-separated correctAnswer', () => {
    const activity = {
      type: 'drag_drop',
      content: { correctAnswer: 'n1,n2,n3,n4' },
    };

    expect(evaluateAnswer(activity, ['n1', 'n2', 'n3', 'n4'])).toBe(true);
    expect(evaluateAnswer(activity, ['n4', 'n3', 'n2', 'n1'])).toBe(false);
  });

  it.each([
    ['composition_decomposition', { validation: { kind: 'exact' }, correctAnswer: '3' }, '3'],
    ['missing_number', { validation: { kind: 'numeric' }, correctAnswer: 3 }, 3],
    ['pattern_completion', { validation: { kind: 'exact' }, correctAnswer: 'blue' }, 'blue'],
    ['representation_matching', { validation: { kind: 'exact' }, correctAnswer: 'square' }, 'square'],
    ['error_detection', {
      validation: { kind: 'compound' },
      correctAnswer: { value: false, reason: 'sum_is_five' },
    }, { value: false, reason: 'sum_is_five' }],
    ['contextual_problem_solving', { validation: { kind: 'numeric' }, correctAnswer: 5 }, 5],
  ])('validates answers for %s', (type, content, answer) => {
    expect(evaluateAnswer({ type, content }, answer)).toBe(true);
  });
});

describe('Activity cooldown', () => {
  it('avoids the last activity, structure, items and format when alternatives exist', () => {
    const service = new ActivitiesService({} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any, {} as any, {} as any);
    const activity = (id: string, structureId: string, type: string, items: string[]) => ({
      id, title: id, type, content: { items, semantic: { structureId } },
    });
    const recent = activity('recent', 'count', 'counting', ['⭐']);
    const sameStructure = activity('structure', 'count', 'quiz', ['●']);
    const sameItems = activity('items', 'different', 'quiz', ['⭐']);
    const sameFormat = activity('format', 'different-again', 'counting', ['▲']);
    const fresh = activity('fresh', 'new', 'missing_number', ['■']);
    const result = (service as any).cooldown(
      [recent, sameStructure, sameItems, sameFormat, fresh],
      [recent, sameStructure, sameItems, sameFormat, fresh], ['recent'],
    );
    expect(result.map((item: any) => item.id)).toEqual(['fresh']);
  });
});

describe('Weighted BNCC activity creation', () => {
  it('rejects inconsistent primary and secondary weights before persistence', async () => {
    const save = jest.fn();
    const service = new ActivitiesService({ create: jest.fn(), save } as any,
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await expect(service.create({
      title: 'Shopping', type: 'quiz' as any, difficulty: 'easy' as any,
      bnccSkills: ['EF01MA08', 'EF01MA03'], targetModalities: ['visual'], content: {},
      skillWeights: [
        { code: 'EF01MA08', role: 'primary', weight: 0.8 },
        { code: 'EF01MA03', role: 'secondary', weight: 0.8 },
      ],
    })).rejects.toThrow('Skill weights');
    expect(save).not.toHaveBeenCalled();
  });
});

describe('ActivitiesService semantic activity responses', () => {
  it('adds the semantic contract while preserving legacy difficulty', async () => {
    const activity = {
      id: 'activity-1',
      title: 'Conte as estrelas',
      type: 'counting',
      difficulty: 'easy',
      bnccSkills: ['EF01MA01'],
      content: { instructionsPt: 'Conte 3 estrelas', items: ['⭐', '⭐', '⭐'] },
      accessibility: { sensoryLoad: 'low' },
    };
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([activity]),
    };
    const service = new ActivitiesService(
      { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { query: jest.fn().mockResolvedValue([{ id: 'skill-1' }]) } as any,
      {} as any,
    );

    const [result] = await service.findAll();

    expect(result.difficulty).toBe('easy');
    expect(result).toEqual(expect.objectContaining({
      activityType: 'counting',
      bnccSkillId: 'skill-1',
      mathematicalConcepts: ['NumberConcept'],
      representation: ['pictorial', 'symbolic'],
      affordances: expect.objectContaining({ usesPictograms: true }),
    }));
  });

  it('still returns the contract if BNCC id resolution fails', async () => {
    const activity = {
      id: 'activity-2',
      title: 'Number line',
      type: 'number_line',
      difficulty: 'medium',
      bnccSkills: ['EF01MA01'],
      content: { instructionsPt: 'Marque o ponto', min: 0, max: 10 },
    };
    const service = new ActivitiesService(
      { findOne: jest.fn().mockResolvedValue(activity) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { query: jest.fn().mockRejectedValue(new Error('database unavailable')) } as any,
      {} as any,
    );
    const errorLog = jest.spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(service.findById(activity.id)).resolves.toEqual(
      expect.objectContaining({ activityType: 'number_line', bnccSkillId: null }),
    );
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve BNCC skill'),
      expect.any(String),
    );
  });
});
