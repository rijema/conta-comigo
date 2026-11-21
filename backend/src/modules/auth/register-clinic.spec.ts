import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/enums/user-role.enum';

function build(clinics: Partial<Record<string, jest.Mock>> = {}) {
  const usersService = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(async (dto) => ({ id: 'user-1', ...dto })),
    createChildAccount: jest.fn(async () => ({ id: 'child-1', email: 'c@x' })),
    grantLgpdConsent: jest.fn(),
    deleteUnusedAccount: jest.fn(),
  };
  const clinicsService = {
    assertNameAvailable: jest.fn().mockResolvedValue(undefined),
    claimForProfessional: jest.fn(async () => ({ id: 'clinic-1', name: 'Solar' })),
    findSelectable: jest.fn(async (id: string) => ({ id })),
    ...clinics,
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const config = { get: jest.fn((_key: string, fallback?: string) => fallback) };
  const service = new AuthService(usersService as any, jwt as any, config as any, clinicsService as any);
  return { service, usersService, clinicsService };
}

const base = { name: 'Ana', email: 'ana@x.com', password: '12345678' };

describe('Sign-up with clinic', () => {
  it('refuses self-registration as admin or child', async () => {
    for (const role of [UserRole.ADMIN, UserRole.CHILD]) {
      const errors = await validate(plainToInstance(RegisterDto, { ...base, role }));
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    }
  });

  it('does not create a professional account for a clinic that is already registered', async () => {
    const { service, usersService } = build({
      assertNameAvailable: jest.fn().mockRejectedValue(new ConflictException('taken')),
    });
    await expect(service.register({ ...base, role: UserRole.PROFESSIONAL, clinicName: 'Ciclo' } as any))
      .rejects.toBeInstanceOf(ConflictException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rolls the account back when another sign-up claims the clinic first', async () => {
    const { service, usersService } = build({
      claimForProfessional: jest.fn().mockRejectedValue(new ConflictException('taken')),
    });
    await expect(service.register({ ...base, role: UserRole.PROFESSIONAL, clinicName: 'Solar' } as any))
      .rejects.toBeInstanceOf(ConflictException);
    expect(usersService.deleteUnusedAccount).toHaveBeenCalledWith('user-1');
  });

  it('links the guardian and the new child to the chosen clinic', async () => {
    const { service, usersService } = build();
    await service.register({
      ...base, role: UserRole.GUARDIAN, clinicId: 'clinic-ciclo',
      childProfile: { name: 'Bia', age: 7 }, childPassword: '1234',
    } as any);
    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ clinicId: 'clinic-ciclo' }));
    expect(usersService.createChildAccount).toHaveBeenCalledWith('user-1', 'Bia', expect.any(String), 7, 'clinic-ciclo');
  });

  it('leaves a guardian without clinic when none is chosen', async () => {
    const { service, usersService, clinicsService } = build();
    await service.register({
      ...base, role: UserRole.GUARDIAN, childProfile: { name: 'Bia', age: 7 }, childPassword: '1234',
    } as any);
    expect(clinicsService.findSelectable).not.toHaveBeenCalled();
    expect(usersService.createChildAccount).toHaveBeenCalledWith('user-1', 'Bia', expect.any(String), 7, null);
  });
});
