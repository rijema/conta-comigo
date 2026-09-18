import { readFileSync } from 'fs';
import { join } from 'path';
import { AddAttemptResearchTrace1700000010000 } from './1700000010000-AddAttemptResearchTrace';

describe('AddAttemptResearchTrace migration', () => {
  it('adds research evidence and abandonment to both migration paths', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) } as any;
    await new AddAttemptResearchTrace1700000010000().up(queryRunner);
    const sql = queryRunner.query.mock.calls.flat().join('\n');
    const runtimeSchema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    for (const fragment of ['"researchTrace"', 'ACTIVITY_ABANDONED', '"abandonedAt"']) {
      expect(sql).toContain(fragment);
      expect(runtimeSchema).toContain(fragment);
    }
  });
});
