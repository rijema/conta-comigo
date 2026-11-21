import { ConflictException, ForbiddenException } from '@nestjs/common';
import { LearnerAccessService } from './services/learner-access.service';
import { ClinicsService, CLINIC_TAKEN_MESSAGE } from './services/clinics.service';
import { normalizeClinicName } from './entities/clinic.entity';
import { EducatorService } from '../educator/educator.service';

const CICLO = 'clinic-ciclo';
const SOLAR = 'clinic-solar';

function accessService() {
  const users: Record<string, any> = {
    angela: { id: 'angela', role: 'professional', clinicId: CICLO },
    solar: { id: 'solar', role: 'professional', clinicId: SOLAR },
    noclinic: { id: 'noclinic', role: 'professional', clinicId: null },
  };
  const profiles = [
    { userId: 'child-ciclo', guardianId: 'mom', clinicId: CICLO },
    { userId: 'child-none', guardianId: 'mom', clinicId: null },
  ];
  const userRepo = {
    findOne: jest.fn(async ({ where }) => {
      const user = users[where.id];
      return user && (!where.role || user.role === where.role) ? user : null;
    }),
  };
  const childProfileRepo = {
    exists: jest.fn(async ({ where }) => profiles.some((p) =>
      Object.entries(where).every(([key, value]) => (p as any)[key] === value))),
  };
  return new LearnerAccessService(userRepo as any, childProfileRepo as any);
}

describe('Clinic scoping — LearnerAccessService', () => {
  const service = accessService();

  it('lets a professional see only children of her own clinic', async () => {
    await expect(service.canAccess({ userId: 'angela', role: 'professional' }, 'child-ciclo')).resolves.toBe(true);
    await expect(service.canAccess({ userId: 'solar', role: 'professional' }, 'child-ciclo')).resolves.toBe(false);
  });

  it('gives a professional without a clinic no child at all', async () => {
    await expect(service.canAccess({ userId: 'noclinic', role: 'professional' }, 'child-ciclo')).resolves.toBe(false);
    await expect(service.canAccess({ userId: 'noclinic', role: 'professional' }, 'child-none')).resolves.toBe(false);
  });

  it('keeps children without a clinic away from every professional', async () => {
    await expect(service.canAccess({ userId: 'angela', role: 'professional' }, 'child-none')).resolves.toBe(false);
  });

  it('lets guardians see only their own children, and the child herself', async () => {
    await expect(service.canAccess({ userId: 'mom', role: 'guardian' }, 'child-none')).resolves.toBe(true);
    await expect(service.canAccess({ userId: 'other-mom', role: 'guardian' }, 'child-none')).resolves.toBe(false);
    await expect(service.canAccess({ userId: 'child-ciclo', role: 'child' }, 'child-ciclo')).resolves.toBe(true);
    await expect(service.canAccess({ userId: 'child-none', role: 'child' }, 'child-ciclo')).resolves.toBe(false);
  });

  it('throws 403 with a plain-language message', async () => {
    await expect(service.assertCanAccess({ userId: 'solar', role: 'professional' }, 'child-ciclo'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('Clinic scoping — ClinicsService', () => {
  it('normalizes accents, case, punctuation and spacing', () => {
    expect(normalizeClinicName('  Ciclo -  Centro de FONOAUDIOLOGIA ')).toBe('ciclo centro de fonoaudiologia');
    expect(normalizeClinicName('Clínica Sólar')).toBe(normalizeClinicName('clinica solar'));
  });

  it('refuses a sign-up with a clinic that is already registered', async () => {
    const clinicRepo = { findOne: jest.fn().mockResolvedValue({ id: CICLO }) };
    const service = new ClinicsService(clinicRepo as any, {} as any);
    await expect(service.assertNameAvailable('CICLO – Centro de Fonoaudiologia'))
      .rejects.toThrow(new ConflictException(CLINIC_TAKEN_MESSAGE));
    expect(clinicRepo.findOne).toHaveBeenCalledWith({ where: { normalizedName: 'ciclo centro de fonoaudiologia' } });
  });

  it('requires a clinic name', async () => {
    const service = new ClinicsService({ findOne: jest.fn() } as any, {} as any);
    await expect(service.assertNameAvailable('  ')).rejects.toThrow('Informe o nome da clínica');
  });
});

describe('Clinic scoping — EducatorService', () => {
  function educator(profilesByClinic: Record<string, any[]>, clinicId: string | null) {
    const childProfileRepo = {
      find: jest.fn(async (options?: any) => (options?.where
        ? profilesByClinic[options.where.clinicId] ?? []
        : Object.values(profilesByClinic).flat())),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const attendanceRepo = { update: jest.fn() };
    const learnerAccess = { professionalClinicId: jest.fn().mockResolvedValue(clinicId) };
    const service = new EducatorService(
      {} as any, childProfileRepo as any, {} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any, {} as any, {} as any, {} as any,
      attendanceRepo as any, {} as any, learnerAccess as any,
    );
    return { service, childProfileRepo, attendanceRepo };
  }
  const child = (id: string) => ({ userId: id, user: { id, name: id, isActive: true } });
  const data = { [CICLO]: [child('a'), child('b')], [SOLAR]: [child('c')] };

  it('lists only the learners of the professional\'s clinic', async () => {
    const { service } = educator(data, CICLO);
    const learners = await service.getAllLearners({ userId: 'angela', role: 'professional' });
    expect(learners.map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('lists nobody for a professional without a clinic', async () => {
    const { service, childProfileRepo } = educator(data, null);
    await expect(service.getAllLearners({ userId: 'new', role: 'professional' })).resolves.toEqual([]);
    expect(childProfileRepo.find).not.toHaveBeenCalled();
  });

  it('removing a child from the clinic only clears the link and closes open attendances', async () => {
    const { service, childProfileRepo, attendanceRepo } = educator(data, CICLO);
    childProfileRepo.findOne.mockResolvedValue({ id: 'profile-a', userId: 'a', clinicId: CICLO });
    await service.removeLearnerFromClinic({ userId: 'angela', role: 'professional' }, 'a');
    expect(childProfileRepo.update).toHaveBeenCalledWith({ id: 'profile-a' }, { clinicId: null });
    expect(attendanceRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: 'a', professionalId: 'angela' }),
      expect.objectContaining({ status: expect.anything() }),
    );
  });
});
