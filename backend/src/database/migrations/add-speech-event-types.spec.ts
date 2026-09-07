import { AddSpeechEventTypes1700000005000 } from './1700000005000-AddSpeechEventTypes';

describe('AddSpeechEventTypes migration', () => {
  it('adds all speech events without replacing the append-only enum', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddSpeechEventTypes1700000005000().up({ query } as any);
    const sql = query.mock.calls.flatMap((call) => call).join('\n');
    for (const eventType of [
      'instruction_spoken', 'instruction_replayed', 'hint_spoken',
      'pictogram_spoken', 'speech_disabled',
    ]) {
      expect(sql).toContain(`ADD VALUE IF NOT EXISTS '${eventType}'`);
    }
    expect(sql).not.toContain('DROP TYPE');
  });

  it('retains event values on rollback so historical rows stay readable', async () => {
    await expect(new AddSpeechEventTypes1700000005000().down()).resolves.toBeUndefined();
  });
});
