import { AddVisualCommunicationEventTypes1700000004000 } from './1700000004000-AddVisualCommunicationEventTypes';

describe('AddVisualCommunicationEventTypes migration', () => {
  it('adds all visual communication values without replacing the enum', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddVisualCommunicationEventTypes1700000004000().up({ query } as any);
    const sql = query.mock.calls.flatMap((call) => call).join('\n');
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'pictogram_opened'");
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'visual_library_opened'");
    expect(sql).toContain("ADD VALUE IF NOT EXISTS 'visual_library_item_selected'");
    expect(sql).not.toContain('DROP TYPE');
  });

  it('keeps enum values on rollback to preserve historical events', async () => {
    const query = jest.fn();
    await new AddVisualCommunicationEventTypes1700000004000().down();
    expect(query).not.toHaveBeenCalled();
  });
});
