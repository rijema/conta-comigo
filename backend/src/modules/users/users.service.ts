import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChildProfile } from './entities/child-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async createChildAccount(guardianId: string, childName: string, hashedPassword: string, age: number): Promise<User> {
    const slug = childName.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}.filho.${guardianId.substring(0, 6)}@mathasd.internal`;

    const child = this.userRepo.create({
      name: childName,
      email,
      password: hashedPassword,
      role: UserRole.CHILD,
      isActive: true,
      lgpdConsentGiven: true,
      lgpdConsentDate: new Date(),
    });
    const savedChild = await this.userRepo.save(child);

    const profile = this.childProfileRepo.create({
      userId: savedChild.id,
      guardianId,
      age,
    });
    await this.childProfileRepo.save(profile);

    return savedChild;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['childProfile'],
    });
  }

  async findChildByNameAndGuardianEmail(childName: string, guardianEmail: string): Promise<User | null> {
    const guardian = await this.userRepo.findOne({ where: { email: guardianEmail } });
    if (!guardian) return null;

    const profile = await this.childProfileRepo.findOne({
      where: { guardianId: guardian.id },
      relations: ['user'],
    });
    if (!profile?.user) return null;

    const nameMatch = profile.user.name.toLowerCase().trim() === childName.toLowerCase().trim();
    return nameMatch ? profile.user : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['childProfile'] });
  }

  async getChildProfile(userId: string): Promise<ChildProfile> {
    const profile = await this.childProfileRepo.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(`Child profile not found for user ${userId}`);
    }
    return profile;
  }

  async updateChildProfile(
    userId: string,
    dto: UpdateChildProfileDto,
  ): Promise<ChildProfile> {
    let profile = await this.childProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      profile = this.childProfileRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }

    return this.childProfileRepo.save(profile);
  }

  async updateSkillMastery(
    userId: string,
    skillCode: string,
    masteryProbability: number,
  ): Promise<void> {
    const profile = await this.childProfileRepo.findOne({ where: { userId } });
    if (!profile) return;

    const current = profile.skillMastery || {};
    current[skillCode] = masteryProbability;
    profile.skillMastery = current;

    await this.childProfileRepo.save(profile);
  }

  async updateBnccProgress(
    userId: string,
    skillCode: string,
    mastered: boolean,
  ): Promise<void> {
    const profile = await this.childProfileRepo.findOne({ where: { userId } });
    if (!profile) return;

    const current = profile.bnccProgress || {};
    const existing = current[skillCode] || { attempted: 0, mastered: false };

    current[skillCode] = {
      attempted: existing.attempted + 1,
      mastered,
      lastAttempt: new Date().toISOString(),
    };

    profile.bnccProgress = current;
    await this.childProfileRepo.save(profile);
  }

  async grantLgpdConsent(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      lgpdConsentGiven: true,
      lgpdConsentDate: new Date(),
    });
    this.logger.log(`LGPD consent granted for user ${userId}`);
  }

  async anonymizeUser(userId: string): Promise<void> {
    const anonymized = `anon_${userId.substring(0, 8)}`;
    await this.userRepo.update(userId, {
      name: anonymized,
      email: `${anonymized}@deleted.invalid`,
      isActive: false,
    });
    this.logger.warn(`User ${userId} anonymized (LGPD request)`);
  }
}