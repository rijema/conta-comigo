import { createActivitiesService } from '../testing/create-activities-service';

/**
 * End-to-end behaviour of the curricular progression inside ActivitiesService
 * (see services/learning-progression.ts). Repositories are in-memory fakes.
 */
const activity = (id: string, skill: string | null, extra: Record<string, any> = {}) => ({
  id, title: id, type: 'quiz', difficulty: 'easy', isActive: true,
  bnccSkills: skill ? [skill] : [], content: { ...extra },
});

const islandPool = [
  activity('y1-a', 'EF01MA06'), activity('y1-b', 'EF01MA06'),
  activity('y2', 'EF02MA07'), activity('y3', 'EF03MA07'), activity('y4', 'EF04MA06'),
];

const attemptOn = (skill: string, isCorrect = true) => ({
  activityId: `done-${skill}`, isCorrect, hintsUsed: 0, timeSpentSeconds: 20,
  activity: { bnccSkills: [skill] },
});

const build = (mastery: Record<string, number> = {}) => {
  const service = createActivitiesService({
    activityRepo: { find: jest.fn().mockResolvedValue(islandPool) },
    islandActivityMappingRepo: {
      find: jest.fn().mockResolvedValue(islandPool.map((a) => ({ activityId: a.id, islandId: 'island-body' }))),
    },
    knowledgeTracingService: { getMasteryMapBySkillCode: jest.fn().mockResolvedValue(mastery) },
    ontologyService: { getSkillRelations: jest.fn().mockReturnValue([]) },
  });
  return service as any;
};

describe('curricular progression in ActivitiesService', () => {
  const previous = process.env.ADE_YEAR_PROGRESSION_ENABLED;
  afterEach(() => {
    if (previous === undefined) delete process.env.ADE_YEAR_PROGRESSION_ENABLED;
    else process.env.ADE_YEAR_PROGRESSION_ENABLED = previous;
  });

  it('moves a 4º ano child who is doing well out of 1º ano exercises', async () => {
    const service = build();
    const attempts = Array(5).fill(attemptOn('EF01MA06'));
    const skill = await service.progressionTargetSkill('child', { schoolYear: 4 }, attempts, 'island-body');
    expect(skill).toBe('EF03MA07');
  });

  it('keeps the 1º ano skill available when the child is struggling', async () => {
    const service = build();
    const attempts = [attemptOn('EF01MA06', false), attemptOn('EF01MA06', false), attemptOn('EF01MA06')];
    const skill = await service.progressionTargetSkill('child', { schoolYear: 4 }, attempts, 'island-body');
    expect(skill).toBe('EF01MA06');
  });

  it('stays on the current skill until mastery, then advances within the island', async () => {
    const practising = build({ EF03MA07: 0.5 });
    const streak = [attemptOn('EF03MA07'), attemptOn('EF03MA07'), attemptOn('EF03MA07')];
    expect(await practising.progressionTargetSkill('child', { schoolYear: 3 }, streak, 'island-body')).toBe('EF03MA07');

    const mastered = build({ EF03MA07: 0.92 });
    expect(await mastered.progressionTargetSkill('child', { schoolYear: 3 }, streak, 'island-body')).toBe('EF04MA06');
  });

  it('filters candidates by the school-year window and never empties the pool', () => {
    const service = build();
    const window = service.progressionYearWindow({ schoolYear: 4 }, Array(5).fill(attemptOn('EF04MA06')), 'consolidate');
    expect(window).toEqual({ minYear: 4, maxYear: 5 });
    const reviewWindow = service.progressionYearWindow({ schoolYear: 4 }, [], 'review');
    expect(reviewWindow.minYear).toBe(1);
  });

  it('does nothing when ADE_YEAR_PROGRESSION_ENABLED=false (previous behaviour)', async () => {
    process.env.ADE_YEAR_PROGRESSION_ENABLED = 'false';
    const service = build();
    expect(await service.progressionTargetSkill('child', { schoolYear: 4 }, Array(5).fill(attemptOn('EF01MA06')), 'island-body'))
      .toBeUndefined();
    expect(service.progressionYearWindow({ schoolYear: 4 }, [], 'consolidate')).toBeNull();
  });

  it('never breaks recommendation when progression data is unavailable', async () => {
    const service = createActivitiesService({
      activityRepo: { find: jest.fn().mockRejectedValue(new Error('db down')) },
    }) as any;
    await expect(service.progressionTargetSkill('child', { schoolYear: 4 }, [], 'island-body')).resolves.toBeUndefined();
  });
});

describe('learning strategy keeps progression direction', () => {
  const decision = (skill: string) => ({
    userId: 'student-1', recommendedBnccSkill: skill, recommendedDifficulty: 'hard',
    xaiLog: { mlPredictions: { masteryProbability: 0.9 } }, inputSnapshot: {},
  });
  const success = (skill: string, id: string) => ({
    activityId: id, activity: { bnccSkills: [skill] }, isCorrect: true, hintsUsed: 0, timeSpentSeconds: 20,
  });

  it('explores a same-or-later year related skill, never an earlier one', async () => {
    const service = createActivitiesService({
      knowledgeTracingService: { getMasteryBySkillCode: jest.fn().mockResolvedValue(0.2) },
      ontologyService: { getSkillRelations: jest.fn().mockReturnValue([
        { skillCode: 'EF02MA07', relation: 'relatedSkill', concepts: ['MultiplicationConcept'], source: 'SHARED_CONCEPT_DERIVED', grade: 2 },
        { skillCode: 'EF04MA11', relation: 'relatedSkill', concepts: ['MultiplicationConcept'], source: 'SHARED_CONCEPT_DERIVED', grade: 4 },
      ]) },
    }) as any;
    const selected = decision('EF04MA06');
    const strategy = await service.planLearningStrategy(selected,
      [{ bnccSkills: ['EF04MA06'] }, { bnccSkills: ['EF02MA07'] }, { bnccSkills: ['EF04MA11'] }],
      [success('EF04MA06', 'a'), success('EF04MA06', 'b'), success('EF04MA06', 'c')]);
    expect(strategy.mode).toBe('explore');
    expect(strategy.selectedSkill).toBe('EF04MA11');
  });

  it('reviews the closest prerequisite after repeated errors', async () => {
    const service = createActivitiesService({
      knowledgeTracingService: { getMasteryBySkillCode: jest.fn().mockResolvedValue(0.4) },
      ontologyService: { getSkillRelations: jest.fn().mockReturnValue([
        { skillCode: 'EF01MA06', relation: 'prerequisiteSkill', concepts: ['AdditionConcept'], source: 'ASSERTED_CONCEPT_PREREQUISITE', grade: 1 },
        { skillCode: 'EF02MA07', relation: 'prerequisiteSkill', concepts: ['AdditionConcept'], source: 'ASSERTED_CONCEPT_PREREQUISITE', grade: 2 },
      ]) },
    }) as any;
    const selected = decision('EF03MA07');
    const error = (id: string) => ({ ...success('EF03MA07', id), isCorrect: false });
    const strategy = await service.planLearningStrategy(selected,
      [{ bnccSkills: ['EF03MA07'] }, { bnccSkills: ['EF01MA06'] }, { bnccSkills: ['EF02MA07'] }],
      [error('a'), error('b')]);
    expect(strategy.mode).toBe('review');
    expect(strategy.selectedSkill).toBe('EF02MA07');
  });
});

describe('cycles respect the island the child opened', () => {
  const cycle = (n: number, skill: string) => ({ cycle_number: n, skill_focus: skill, island_id: 'island-body', status: 'active' });
  const service = (cycles: any[], attempts: any[] = []) => createActivitiesService({
    cycleTrackingRepo: { find: jest.fn().mockResolvedValue(cycles) },
    attemptRepo: { find: jest.fn().mockResolvedValue(attempts) },
  }) as any;

  it('prefers the first active cycle inside the school-year window', async () => {
    const chosen = await service([cycle(1, 'EF01MA06'), cycle(2, 'EF02MA07'), cycle(3, 'EF04MA06')])
      .activeCycleForIsland('child', 'island-body', { schoolYear: 4 });
    expect(chosen.skill_focus).toBe('EF04MA06');
  });

  it('keeps the first cycle when none is in the window, and none when the island has no cycle', async () => {
    expect((await service([cycle(1, 'EF01MA06')]).activeCycleForIsland('child', 'island-body', { schoolYear: 4 })).skill_focus)
      .toBe('EF01MA06');
    expect(await service([]).activeCycleForIsland('child', 'island-body', { schoolYear: 4 })).toBeNull();
  });
});
