import { AddParametricActivityFamilies1700000003000 } from './1700000003000-AddParametricActivityFamilies';

describe('AddParametricActivityFamilies migration', () => {
  it('expands the varchar activity check constraint', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([{ data_type: 'character varying', udt_name: 'varchar' }])
      .mockResolvedValue([]);

    await new AddParametricActivityFamilies1700000003000().up({ query } as any);

    const sql = query.mock.calls.flatMap((call) => call).join('\n');
    for (const activityType of [
      'composition_decomposition',
      'missing_number',
      'pattern_completion',
      'representation_matching',
      'error_detection',
      'contextual_problem_solving',
    ]) {
      expect(sql).toContain(activityType);
    }
    expect(sql).toContain('activities_type_check');
  });

  it('adds values to an existing PostgreSQL enum', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([{ data_type: 'USER-DEFINED', udt_name: 'activity_type_enum' }])
      .mockResolvedValue([]);

    await new AddParametricActivityFamilies1700000003000().up({ query } as any);

    expect(query).toHaveBeenCalledTimes(7);
    expect(query.mock.calls[1][0]).toContain(
      'ALTER TYPE "activity_type_enum" ADD VALUE IF NOT EXISTS',
    );
  });

  it('refuses a destructive rollback while new activities exist', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ count: 1 }]);

    await expect(
      new AddParametricActivityFamilies1700000003000().down({ query } as any),
    ).rejects.toThrow('activities still use them');
  });
});
