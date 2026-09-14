import { AddVoiceInteractionEventTypes1700000009000 } from './1700000009000-AddVoiceInteractionEventTypes';

describe('voice interaction event migration', () => {
  it('adds semantic voice events without removing historical enum values', async () => {
    const query = jest.fn();
    await new AddVoiceInteractionEventTypes1700000009000().up({ query } as any);
    const sql = query.mock.calls.map(([value]) => value).join('\n');
    expect(sql).toContain('VOICE_INTERACTION_STARTED');
    expect(sql).toContain('VOICE_ACTIVITY_CHANGE_REQUESTED');
    expect(query).toHaveBeenCalledTimes(6);
  });
});
