import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class EducatorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
  ) {}

  async getStats() {
    const learners = await this.userRepo.find({
      where: { role: UserRole.GUARDIAN, isActive: true },
      relations: ['childProfile'],
    });

    const learnersWithProfiles = learners.filter((u) => u.childProfile);

    const profiles = await Promise.all(
      learnersWithProfiles.map(async (user) => {
        const latest = await this.snapshotRepo.findOne({
          where: { userId: user.id },
          order: { createdAt: 'DESC' },
        });

        const bnccCoverage = latest?.bnccCoverage ?? {};
        const totalSkills = Object.keys(bnccCoverage).length;
        const masteredSkills = Object.values(bnccCoverage).filter(Boolean).length;
        const bnccCoverageRate = totalSkills > 0 ? masteredSkills / totalSkills : 0;

        const profile = user.childProfile;
        const supportLevel = profile?.asdSupportLevel?.toUpperCase() ?? 'MILD';

        return {
          id: user.id,
          name: user.name,
          supportLevel: ['MILD', 'MODERATE', 'STRONG'].includes(supportLevel)
            ? supportLevel
            : 'MILD',
          bnccCoverage: bnccCoverageRate,
          recentAdeDecisions: [],
        };
      }),
    );

    const averageBnccCoverage =
      profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.bnccCoverage, 0) / profiles.length
        : 0;

    return {
      totalLearners: profiles.length,
      averageBnccCoverage,
      learners: profiles,
    };
  }
}
