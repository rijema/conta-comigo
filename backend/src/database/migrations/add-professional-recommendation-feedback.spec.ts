import { readFileSync } from 'fs';
import { join } from 'path';
import { AddProfessionalRecommendationFeedback1700000008000 } from './1700000008000-AddProfessionalRecommendationFeedback';

describe('AddProfessionalRecommendationFeedback migration', () => {
  it('adds optional feedback and the transition difficulty delta', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) } as any;
    await new AddProfessionalRecommendationFeedback1700000008000().up(queryRunner);
    const sql = queryRunner.query.mock.calls.flat().join('\n');
    expect(sql).toContain('difficultyDelta');
    expect(sql).toContain('professional_recommendation_feedback');
    expect(sql).toContain('PARTIALLY_ADEQUATE');
  });

  it('is present in the production schema runner', () => {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS professional_recommendation_feedback');
  });
});
