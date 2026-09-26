import { ActivitiesService } from './activities.service';

describe('ActivitiesService answer evaluation', () => {
  const service = new ActivitiesService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any, // islandCycleValidator
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
      {} as any, {} as any, {} as any, {} as any, {} as any);
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
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
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

describe('Learning selection strategy', () => {
  const service = new ActivitiesService({} as any, {} as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, {} as any,
    { getMasteryBySkillCode: jest.fn().mockResolvedValue(0.1) } as any,
    undefined, { getSkillRelations: jest.fn().mockReturnValue([
      { skillCode: 'EF01MA08', relation: 'relatedSkill',
        concepts: ['AdditionConcept'], source: 'SHARED_CONCEPT_DERIVED' },
    ]) } as any);
  const decision = () => ({
    userId: 'student-1', recommendedBnccSkill: 'EF01MA06', recommendedDifficulty: 'hard',
    xaiLog: { mlPredictions: { masteryProbability: 0.85 } }, inputSnapshot: {},
  });
  const activities = [{ bnccSkills: ['EF01MA06'] }, { bnccSkills: ['EF01MA08'] }] as any;
  const attempt = (id: string, seconds: number) => ({
    activityId: id, activity: { bnccSkills: ['EF01MA06'] }, isCorrect: true,
    hintsUsed: 0, timeSpentSeconds: seconds,
  }) as any;

  it('treats a slow correct answer as reinforcement evidence without changing skills', async () => {
    const selected = decision();
    const strategy = await (service as any).planLearningStrategy(selected, activities,
      [attempt('a', 150), attempt('b', 20), attempt('c', 20)]);
    expect(strategy.mode).toBe('reinforce');
    expect(selected.recommendedBnccSkill).toBe('EF01MA06');
  });

  it('explores a concept-linked skill after repeated independent success', async () => {
    const selected = decision();
    const strategy = await (service as any).planLearningStrategy(selected, activities,
      [attempt('a', 20), attempt('b', 20), attempt('c', 20)]);
    expect(strategy).toEqual(expect.objectContaining({ mode: 'explore',
      selectedSkill: 'EF01MA08', relation: expect.objectContaining({ source: 'SHARED_CONCEPT_DERIVED' }) }));
    expect(selected.recommendedBnccSkill).toBe('EF01MA08');
    expect(selected.xaiLog.mlPredictions.masteryProbability).toBe(0.1);
  });

  it('does not switch an explicitly requested skill', async () => {
    const selected = { ...decision(), inputSnapshot: { targetSkillExplicit: true } };
    const strategy = await (service as any).planLearningStrategy(selected, activities,
      [attempt('a', 20), attempt('b', 20), attempt('c', 20)]);
    expect(strategy.mode).toBe('consolidate');
    expect(selected.recommendedBnccSkill).toBe('EF01MA06');
  });

  it('reinforces after repeated skips even when recent answers were correct', async () => {
    const selected = { ...decision(), inputSnapshot: { recentSkips: 2 } };
    const strategy = await (service as any).planLearningStrategy(selected, activities,
      [attempt('a', 20), attempt('b', 20), attempt('c', 20)]);
    expect(strategy.mode).toBe('reinforce');
    expect(selected.recommendedBnccSkill).toBe('EF01MA06');
  });
});

describe('Prerequisite fallback safety', () => {
  it('does not select an activity with a known unmet prerequisite', async () => {
    const blocked = { id: 'blocked', prerequisiteSkillCode: 'EF01MA06',
      content: {}, type: 'quiz', title: 'Blocked' };
    const available = { id: 'available', content: {}, type: 'counting', title: 'Available' };
    const service = new ActivitiesService(
      { find: jest.fn().mockResolvedValue([blocked, available]) } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      {} as any, {} as any, {} as any,
      { getRecentSkippedActivityIds: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      { getMasteryMapBySkillCode: jest.fn().mockResolvedValue({ EF01MA06: 0.2 }) } as any,
      {} as any, // islandCycleValidator
      undefined,
      { isActivityPrerequisiteSatisfied: (code: string | undefined, mastery: Record<string, number>) =>
        !code || (mastery[code] ?? 1) >= 0.5 } as any,
    );
    const selected = await (service as any).selectFallbackActivity('student-1');
    expect(selected.id).toBe('available');
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
      {} as any, // islandCycleValidator
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
      {} as any, // islandCycleValidator
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

describe('Professional experience restrictions', () => {
  const service = new ActivitiesService({} as any, {} as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, {} as any, {} as any);
  const activity = (type: string, count: number, skill: string, difficulty: string) => ({
    type, difficulty, bnccSkills: [skill], content: { options: Array.from({ length: count }, () => ({})) },
  });

  it('excludes disabled types and exercises with too many visible options', () => {
    const allowed = (candidate: any) => (service as any).matchesExperienceRestrictions(candidate, {
      disabledActivityTypes: ['quiz'], maxSimultaneousElements: 4,
    });
    expect(allowed(activity('quiz', 3, 'EF01MA01', 'easy'))).toBe(false);
    expect(allowed(activity('counting', 5, 'EF01MA01', 'easy'))).toBe(false);
    expect(allowed(activity('counting', 4, 'EF01MA01', 'easy'))).toBe(true);
  });

  it('prefers manual difficulty without creating new candidates', () => {
    const candidates = [
      activity('quiz', 3, 'EF01MA01', 'easy'),
      activity('counting', 3, 'EF01MA03', 'easy'),
      activity('counting', 3, 'EF01MA03', 'medium'),
    ];
    const chosen = (service as any).preferExperienceCandidates(candidates, {
      adaptiveDifficulty: false, manualDifficulty: 'medium',
    });
    expect(chosen).toEqual([candidates[2]]);
  });

  it('targets the least recently practiced professional BNCC priority before ADE decides', () => {
    const chosen = (service as any).pickPreferredSkill({ prioritizedBnccSkills: ['EF01MA01', 'EF01MA03'] }, [
      { activity: { bnccSkills: ['EF01MA01'] } },
      { activity: { bnccSkills: ['EF01MA01'] } },
    ]);
    expect(chosen).toBe('EF01MA03');
  });
});
