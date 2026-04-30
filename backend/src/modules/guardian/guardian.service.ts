import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { AdeDecision } from '../ade/entities/ade-decision.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
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
    @InjectRepository(AdeDecision)
    private readonly adeDecisionRepo: Repository<AdeDecision>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
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

        const [recentAde, recentAttempts] = await Promise.all([
          this.adeDecisionRepo.find({
            where: { userId: child.id },
            order: { createdAt: 'DESC' },
            take: 5,
          }),
          this.attemptRepo.find({
            where: { userId: child.id },
            order: { createdAt: 'DESC' },
            take: 20,
          }),
        ]);

        const totalAttempts = recentAttempts.length;
        const correctAttempts = recentAttempts.filter((a) => a.isCorrect).length;

        const skillAccuracy: Record<string, { correct: number; total: number }> = {};
        recentAttempts.forEach((a) => {
          // bncc skills stored per attempt via adeDecisionContext or activity
        });

        return {
          id: child.id,
          name: child.name,
          email: child.email,
          age: profile.age ?? null,
          asdSupportLevel: profile.asdSupportLevel ?? 'mild',
          strengths: profile.strengths ?? {},
          weaknesses: profile.weaknesses ?? {},
          bnccProgress: profile.bnccProgress ?? {},
          totalSessions: latest?.totalActivitiesCompleted ?? 0,
          averageScore: latest?.overallAccuracy ?? 0,
          engagementIndex: latest?.engagementIndex ?? 0,
          lastActivityAt: latest?.createdAt ?? null,
          accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
          totalAttempts,
          currentStreak: profile.currentStreak ?? 0,
          totalPoints: profile.totalPoints ?? 0,
          progressData,
          recentAdeDecisions: recentAde,
        };
      }),
    );

    return summaries.filter(Boolean);
  }

  async getChildDetail(guardianId: string, childId: string) {
    const profile = await this.childProfileRepo.findOne({
      where: { userId: childId, guardianId },
      relations: ['user'],
    });
    if (!profile) throw new ForbiddenException('Child not found or not linked to this guardian');

    const [adeHistory, attempts, snapshots] = await Promise.all([
      this.adeDecisionRepo.find({ where: { userId: childId }, order: { createdAt: 'DESC' }, take: 30 }),
      this.attemptRepo.find({ where: { userId: childId }, order: { createdAt: 'DESC' }, take: 50 }),
      this.snapshotRepo.find({ where: { userId: childId }, order: { createdAt: 'ASC' }, take: 30 }),
    ]);

    const progressOverTime = snapshots.map((s) => ({
      date: s.createdAt.toISOString().split('T')[0],
      accuracy: Math.round((s.overallAccuracy ?? 0) * 100),
      activities: s.totalActivitiesCompleted ?? 0,
      engagement: Math.round((s.engagementIndex ?? 0) * 100),
    }));

    const totalAttempts = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;

    return {
      id: childId,
      name: profile.user?.name,
      age: profile.age,
      asdSupportLevel: profile.asdSupportLevel ?? 'mild',
      strengths: profile.strengths ?? {},
      weaknesses: profile.weaknesses ?? {},
      bnccProgress: profile.bnccProgress ?? {},
      totalPoints: profile.totalPoints ?? 0,
      currentStreak: profile.currentStreak ?? 0,
      stats: {
        totalAttempts,
        correct,
        accuracy: totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0,
      },
      progressOverTime,
      recentAdeDecisions: adeHistory,
    };
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
