import { AddPauseEventTypes1729000001000, PAUSE_EVENT_TYPES } from './1729000001000-AddPauseEventTypes';

describe('AddPauseEventTypes migration', () => {
  it('adds pause events without replacing the append-only enum', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddPauseEventTypes1729000001000().up({ query } as any);
    const sql = query.mock.calls.flatMap((call) => call).join('\n');
    for (const eventType of PAUSE_EVENT_TYPES) {
      expect(sql).toContain(`ADD VALUE IF NOT EXISTS '${eventType}'`);
    }
    expect(sql).not.toContain('DROP TYPE');
  });

  it('only alters the enum when it exists so startup never crashes', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddPauseEventTypes1729000001000().up({ query } as any);
    for (const [sql] of query.mock.calls) {
      expect(sql).toContain("IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_event_type_enum')");
    }
  });

  it('is registered in the production migration runner list', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getPendingMigrationClasses } = require('../data-source');
    expect(getPendingMigrationClasses()).toContain(AddPauseEventTypes1729000001000);
  });

  it('retains event values on rollback so historical rows stay readable', async () => {
    await expect(new AddPauseEventTypes1729000001000().down()).resolves.toBeUndefined();
  });
});
