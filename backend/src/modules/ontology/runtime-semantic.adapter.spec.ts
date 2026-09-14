import { RuntimeSemanticAdapter } from './runtime-semantic.adapter';

describe('RuntimeSemanticAdapter', () => {
  it('materializes ephemeral learner and activity facts without changing BKT data', () => {
    const adapter = new RuntimeSemanticAdapter();
    const sourceActivity = {
      id: 'activity-1',
      activityType: 'drag_drop',
      bnccSkills: ['EF01MA08'],
      mathematicalConcepts: ['AdditionConcept'],
      representation: ['pictorial'],
      interactionType: ['drag_and_drop'],
      difficultyProfile: { motorDemand: 'MEDIUM' },
      affordances: {
        requiresDragging: true,
        requiresReading: false,
        usesAudio: false,
        usesPictograms: true,
      },
      semanticAnnotation: { conceptMappingStatus: 'MAPPED' },
    } as any;

    const result = adapter.materialize({
      studentId: 'student-1',
      targetSkill: 'EF01MA08',
      activities: [sourceActivity],
      masteryProbability: 0.37,
      recentAccuracy: 0.5,
      observedLearnerEvidence: {
        MotorInteractionEvidence: true,
        privatePayload: { raw: 'not materialized' },
      },
      hardConstraints: { disallowDragging: true },
    });

    expect(result.mastery).toEqual({
      source: 'StudentSkillState',
      probability: 0.37,
    });
    expect(result.observedEvidenceTypes).toEqual(['MotorInteractionEvidence']);
    expect(result.activities[0]).toEqual(expect.objectContaining({
      activityId: 'activity-1',
      mathematicalConcepts: ['AdditionConcept'],
      representations: ['pictorial'],
    }));
    expect(JSON.stringify(result)).not.toContain('not materialized');
    expect(sourceActivity).not.toHaveProperty('studentId');
  });
});
