import { ActivitiesService } from './activities.service';
import { LearningEventType } from '../learning-events/entities/learning-event.entity';

describe('ActivitiesService change activity flow', () => {
  it('records skip, reruns recommendation, and completes the adaptation transition', async () => {
    const previous = {
      id: '10000000-0000-0000-0000-000000000001',
      bnccSkills: ['EF01MA08'], mathematicalConcepts: ['AdditionConcept'],
      interactionType: ['drag_and_drop'], representation: ['pictorial'], difficulty: 'medium',
      difficultyProfile: { motorDemand: 'HIGH', sensoryLoad: 'MEDIUM', languageLoad: 'LOW', scaffoldingLevel: 'LOW' },
    };
    const replacement = {
      id: '10000000-0000-0000-0000-000000000002',
      bnccSkills: ['EF01MA08'], mathematicalConcepts: ['AdditionConcept'],
      interactionType: ['option_selection'], representation: ['pictorial'], difficulty: 'medium',
      difficultyProfile: { motorDemand: 'LOW', sensoryLoad: 'LOW', languageLoad: 'LOW', scaffoldingLevel: 'MEDIUM' },
    };
    const outcomeService = { attachReplacement: jest.fn().mockResolvedValue({}) };
    const knowledgeTracing = { observe: jest.fn() };
    const service = new ActivitiesService(
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
      knowledgeTracing as any, undefined, undefined, undefined, undefined, outcomeService as any,
    );
    jest.spyOn(service, 'findById').mockResolvedValue(previous as any);
    const skipEvent = { id: '40000000-0000-0000-0000-000000000001' } as any;
    jest.spyOn(service, 'trackLifecycleEvent').mockResolvedValue(skipEvent);
    jest.spyOn(service, 'getNextActivity').mockResolvedValue({
      activity: replacement as any,
      adeDecision: { id: '20000000-0000-0000-0000-000000000002' },
    });

    const result = await service.changeActivity('student-1', {
      currentActivityId: previous.id,
      recommendationId: '20000000-0000-0000-0000-000000000001',
      sessionId: 'session-1', attemptsBeforeSkip: 1, hintsBeforeSkip: 1,
    });

    expect(service.trackLifecycleEvent).toHaveBeenCalledWith('student-1', previous.id, expect.objectContaining({
      eventType: LearningEventType.ACTIVITY_SKIPPED,
      recommendationId: '20000000-0000-0000-0000-000000000001',
      changeRequested: true,
    }));
    expect(service.getNextActivity).toHaveBeenCalledWith('student-1', {
      sessionId: 'session-1', targetSkillCode: 'EF01MA08', excludedActivityId: previous.id,
    });
    expect(outcomeService.attachReplacement).toHaveBeenCalledWith(
      '20000000-0000-0000-0000-000000000001',
      expect.objectContaining({
        replacementActivityId: replacement.id,
        sameBNCCSkill: true,
        sameMathematicalConcept: true,
        interactionTypeChanged: true,
        motorDemandDelta: -3,
      }),
    );
    expect(result.activity.id).toBe(replacement.id);
    expect(knowledgeTracing.observe).not.toHaveBeenCalled();
  });
});
