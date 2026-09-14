import { readFileSync } from 'fs';
import { join } from 'path';
import { AddRecommendationTraceability1700000007000 } from './1700000007000-AddRecommendationTraceability';

describe('AddRecommendationTraceability migration', () => {
  it('creates and removes all traceability tables', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) } as any;
    const migration = new AddRecommendationTraceability1700000007000();
    await migration.up(queryRunner);
    const upSql = queryRunner.query.mock.calls.flat().join('\n');
    expect(upSql).toContain('recommendation_outcomes');
    expect(upSql).toContain('adaptation_transitions');
    expect(upSql).toContain('interaction_evidence');

    queryRunner.query.mockClear();
    await migration.down(queryRunner);
    expect(queryRunner.query).toHaveBeenCalledTimes(4);
  });

  it('is included in the idempotent production schema', () => {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS recommendation_outcomes');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS adaptation_transitions');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS interaction_evidence');
  });
});
