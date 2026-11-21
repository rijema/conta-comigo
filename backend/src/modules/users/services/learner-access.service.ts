import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProfile } from '../entities/child-profile.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export interface Requester {
  userId: string;
  role: string;
}

export const LEARNER_FORBIDDEN_MESSAGE =
  'Você não tem acesso aos dados desta criança.';

/**
 * Single rule for "who may see/change a learner's data":
 *   - admin: everyone;
 *   - the learner herself;
 *   - guardian: only her own children (child_profiles.guardianId);
 *   - professional: only children of her clinic (same non-null clinic_id).
 */
@Injectable()
export class LearnerAccessService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
  ) {}

  async canAccess(requester: Requester | undefined, learnerId: string | undefined): Promise<boolean> {
    if (!requester?.userId || !learnerId) return false;
    if (requester.role === UserRole.ADMIN) return true;
    if (requester.userId === learnerId) return true;

    if (requester.role === UserRole.GUARDIAN) {
      return this.childProfileRepo.exists({ where: { userId: learnerId, guardianId: requester.userId } });
    }

    if (requester.role === UserRole.PROFESSIONAL) {
      const clinicId = await this.professionalClinicId(requester.userId);
      if (!clinicId) return false;
      return this.childProfileRepo.exists({ where: { userId: learnerId, clinicId } });
    }

    return false;
  }

  async assertCanAccess(requester: Requester | undefined, learnerId: string | undefined): Promise<void> {
    if (!(await this.canAccess(requester, learnerId))) {
      throw new ForbiddenException(LEARNER_FORBIDDEN_MESSAGE);
    }
  }

  async professionalClinicId(professionalId: string): Promise<string | null> {
    const professional = await this.userRepo.findOne({
      where: { id: professionalId, role: UserRole.PROFESSIONAL },
    });
    return professional?.clinicId ?? null;
  }
}
