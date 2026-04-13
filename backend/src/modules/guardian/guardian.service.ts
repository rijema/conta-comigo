import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
  ) {}

  async getChildrenSummary(guardianId: string) {
    const childProfiles = await this.childProfileRepo.find({
      where: { guardianId },
      relations: ['user'],
    });

    const summaries = await Promise.all(
      childProfiles.map(async (profile) => {
        const child = profile.user;
        if (!child) return null;

        const snapshots = await this.snapshotRepo.find({
          where: { userId: child.id },
          order: { createdAt: 'DESC' },
          take: 30,
        });

        const latest = snapshots[0] ?? null;

        const progressData = snapshots
          .slice(0, 14)
          .reverse()
          .map((s) => ({
            date: s.createdAt.toISOString().split('T')[0],
            score: Math.round((s.overallAccuracy ?? 0) * 100),
            activities: s.totalActivitiesCompleted ?? 0,
          }));

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          age: profile.age ?? null,
          totalSessions: latest?.totalActivitiesCompleted ?? 0,
          averageScore: latest?.overallAccuracy ?? 0,
          engagementIndex: latest?.engagementIndex ?? 0,
          lastActivityAt: latest?.createdAt ?? null,
          progressData,
        };
      }),
    );

    return summaries.filter(Boolean);
  }

  async addChild(guardianId: string, childName: string, childPassword: string, age: number) {
    const slug = childName.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}.filho.${guardianId.substring(0, 6)}@mathasd.internal`;

    const hashedPassword = await bcrypt.hash(childPassword, 12);

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

    return {
      id: savedChild.id,
      name: savedChild.name,
      email: savedChild.email,
      age,
    };
  }
}
