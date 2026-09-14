import { EducatorService } from './educator.service';
import { ProfessionalFeedbackRating } from './entities/professional-recommendation-feedback.entity';

describe('EducatorService professional recommendation feedback', () => {
  it('persists optional evaluation evidence without mutating decisions, BKT, or weights', async () => {
    const transition = {
      id: 'transition-1', studentId: 'student-1', sessionId: 'session-1',
      previousRecommendationId: 'decision-1', replacementRecommendationId: 'decision-2',
    };
    const transitionRepo = { findOne: jest.fn().mockResolvedValue(transition) };
    const feedbackRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'feedback-1', ...value })),
    };
    const adeRepo = { save: jest.fn() };
    const knowledgeTracing = { observe: jest.fn() };
    const service = new EducatorService(
      {} as any, {} as any, {} as any, adeRepo as any, {} as any, {} as any,
      knowledgeTracing as any, {} as any, transitionRepo as any, {} as any, feedbackRepo as any,
    );

    const result = await service.createAdaptationFeedback(
      transition.id,
      'professional-1',
      { rating: ProfessionalFeedbackRating.PARTIALLY_ADEQUATE, reasonCodes: ['insufficient_information'] },
    );

    expect(result).toEqual(expect.objectContaining({
      recommendationId: 'decision-2',
      rating: ProfessionalFeedbackRating.PARTIALLY_ADEQUATE,
    }));
    expect(adeRepo.save).not.toHaveBeenCalled();
    expect(knowledgeTracing.observe).not.toHaveBeenCalled();
  });
});
