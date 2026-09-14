import { AddHybridRecommendationDecision1700000006000 } from './1700000006000-AddHybridRecommendationDecision';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('AddHybridRecommendationDecision migration', () => {
  it('adds and removes the hybrid decision fields', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) } as any;
    const migration = new AddHybridRecommendationDecision1700000006000();

    await migration.up(queryRunner);
    expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining('"hybridRanking" JSONB'));
    expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining('"selectedActivityId" UUID'));

    queryRunner.query.mockClear();
    await migration.down(queryRunner);
    expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining('DROP COLUMN "hybridRanking"'));
  });

  it('keeps the production schema runner additive and idempotent', () => {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    expect(schema).toContain('ADD COLUMN IF NOT EXISTS "selectedActivityId" UUID');
    expect(schema).toContain('ADD COLUMN IF NOT EXISTS "hybridRanking" JSONB');
  });
});
