import * as bcrypt from 'bcryptjs';
import { GuardianService } from './guardian.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

function service(profile: any, child: any) {
  const save = jest.fn(async (value) => value);
  const users = { findOne: jest.fn(async () => child), save };
  const profiles = { findOne: jest.fn(async () => profile) };
  return { guardian: new GuardianService(users as any, profiles as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, {} as any), users, profiles };
}

describe('Guardian child access', () => {
  it('rejects a child not linked to the guardian before changing any account', async () => {
    const { guardian, users } = service(null, { id: 'child-1' });
    await expect(guardian.updateChildAccess('guardian-1', 'child-1', {
      childName: 'Ana', childPassword: '1234',
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('updates the linked child name and stores a hash of the new short password', async () => {
    const child = { id: 'child-1', name: 'Old', password: 'old-hash' };
    const { guardian, users, profiles } = service({ userId: 'child-1', guardianId: 'guardian-1' }, child);
    await expect(guardian.updateChildAccess('guardian-1', 'child-1', {
      childName: ' Ana ', childPassword: '5678',
    })).resolves.toEqual({ id: 'child-1', name: 'Ana' });
    expect(profiles.findOne).toHaveBeenCalledWith({ where: { userId: 'child-1', guardianId: 'guardian-1' } });
    expect(users.save).toHaveBeenCalledTimes(1);
    expect(child.password).not.toBe('5678');
    expect(await bcrypt.compare('5678', child.password)).toBe(true);
  });
});

describe('Guardian plain-language evidence', () => {
  it('counts distinct recent sessions and reports practiced versus successful skills separately', async () => {
    const attempts = [
      { id: 'a1', sessionId: 's1', isCorrect: true, createdAt: new Date(), activity: { title: 'Compare grupos', type: 'quiz', bnccSkills: ['EF01MA03'] } },
      { id: 'a2', sessionId: 's1', isCorrect: false, createdAt: new Date(), activity: { title: 'Compare grupos', type: 'quiz', bnccSkills: ['EF01MA03'] } },
      { id: 'a3', sessionId: 's2', isCorrect: false, createdAt: new Date(), activity: { title: 'Conte objetos', type: 'counting', bnccSkills: ['EF01MA01'] } },
    ];
    const guardian = new GuardianService({} as any,
      { findOne: jest.fn().mockResolvedValue({ user: { name: 'Ana' }, age: 7 }) } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn().mockResolvedValue(attempts) } as any,
      { getMasteryMapBySkillCode: jest.fn().mockResolvedValue({}) } as any,
      {} as any, {} as any);
    const detail = await guardian.getChildDetail('guardian-1', 'child-1');
    expect(detail.stats.sessionCount).toBe(2);
    expect(detail.practicedSkills).toEqual([{ code: 'EF01MA03', count: 2 }, { code: 'EF01MA01', count: 1 }]);
    expect(detail.recentlySuccessfulSkills).toEqual([{ code: 'EF01MA03', count: 1 }]);
    expect(detail.favoriteFormats).toEqual([{ type: 'quiz', count: 1 }]);
  });
});

describe('Guardian password change', () => {
  it('requires the current password before storing a new hash', async () => {
    const user = { id: 'guardian-1', password: await bcrypt.hash('original-pass', 12) };
    const save = jest.fn(async (value) => value);
    const query = { addSelect: jest.fn(), where: jest.fn(), getOne: jest.fn().mockResolvedValue(user) };
    query.addSelect.mockReturnValue(query);
    query.where.mockReturnValue(query);
    const guardian = new GuardianService({ createQueryBuilder: jest.fn().mockReturnValue(query), save } as any,
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await expect(guardian.updateOwnPassword('guardian-1', {
      currentPassword: 'wrong', newPassword: 'replacement-pass',
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(save).not.toHaveBeenCalled();
    await guardian.updateOwnPassword('guardian-1', {
      currentPassword: 'original-pass', newPassword: 'replacement-pass',
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(await bcrypt.compare('replacement-pass', user.password)).toBe(true);
  });
});
