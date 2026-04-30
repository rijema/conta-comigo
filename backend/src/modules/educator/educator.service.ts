import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { AdeDecision } from '../ade/entities/ade-decision.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { Activity } from '../activities/entities/activity.entity';
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
    @InjectRepository(AdeDecision)
    private readonly adeDecisionRepo: Repository<AdeDecision>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
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

  async getAllLearners() {
    const profiles = await this.childProfileRepo.find({ relations: ['user'] });
    return profiles
      .filter((p) => p.user)
      .map((p) => ({
        id: p.userId,
        name: p.user.name,
        age: p.age,
        schoolYear: p.schoolYear,
        asdSupportLevel: p.asdSupportLevel ?? 'mild',
        strengths: p.strengths ?? {},
        weaknesses: p.weaknesses ?? {},
        uiPreferences: p.uiPreferences ?? {},
        totalPoints: p.totalPoints,
        currentLevel: p.currentLevel,
        currentStreak: p.currentStreak,
      }));
  }

  async getLearnerProfile(learnerId: string) {
    const profile = await this.childProfileRepo.findOne({
      where: { userId: learnerId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Learner not found');

    const [recentAttempts, recentAde, snapshot] = await Promise.all([
      this.attemptRepo.find({ where: { userId: learnerId }, order: { createdAt: 'DESC' }, take: 20 }),
      this.adeDecisionRepo.find({ where: { userId: learnerId }, order: { createdAt: 'DESC' }, take: 10 }),
      this.snapshotRepo.findOne({ where: { userId: learnerId }, order: { createdAt: 'DESC' } }),
    ]);

    const totalAttempts = recentAttempts.length;
    const correctAttempts = recentAttempts.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    return {
      id: profile.userId,
      name: profile.user?.name,
      age: profile.age,
      schoolYear: profile.schoolYear,
      asdSupportLevel: profile.asdSupportLevel ?? 'mild',
      strengths: profile.strengths ?? {},
      weaknesses: profile.weaknesses ?? {},
      uiPreferences: profile.uiPreferences ?? {},
      skillMastery: profile.skillMastery ?? {},
      bnccProgress: profile.bnccProgress ?? {},
      totalPoints: profile.totalPoints,
      currentLevel: profile.currentLevel,
      currentStreak: profile.currentStreak,
      stats: {
        totalAttempts,
        correctAttempts,
        accuracy: Math.round(accuracy * 100),
        engagementIndex: snapshot?.engagementIndex ?? 0,
        overallAccuracy: snapshot?.overallAccuracy ?? 0,
      },
      recentAdeDecisions: recentAde,
      recentAttempts: recentAttempts.slice(0, 10),
    };
  }

  async updateSkillLevels(learnerId: string, dto: {
    strengths?: Record<string, boolean>;
    weaknesses?: Record<string, boolean>;
    asdSupportLevel?: string;
    uiPreferences?: Record<string, any>;
  }) {
    const profile = await this.childProfileRepo.findOne({ where: { userId: learnerId } });
    if (!profile) throw new NotFoundException('Learner profile not found');

    if (dto.strengths !== undefined) profile.strengths = dto.strengths as any;
    if (dto.weaknesses !== undefined) profile.weaknesses = dto.weaknesses as any;
    if (dto.asdSupportLevel !== undefined) profile.asdSupportLevel = dto.asdSupportLevel;
    if (dto.uiPreferences !== undefined) profile.uiPreferences = dto.uiPreferences as any;

    await this.childProfileRepo.save(profile);
    return { success: true, profile };
  }

  async getAdeHistory(learnerId: string) {
    return this.adeDecisionRepo.find({
      where: { userId: learnerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getAttemptHistory(learnerId: string) {
    const attempts = await this.attemptRepo.find({
      where: { userId: learnerId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const activityIds = [...new Set(attempts.map((a) => a.activityId))];
    const activities = await this.activityRepo.findByIds(activityIds);
    const actMap = new Map(activities.map((a) => [a.id, a]));
    return attempts.map((a) => ({
      ...a,
      activityTitle: actMap.get(a.activityId)?.title ?? a.activityId,
      activityType: actMap.get(a.activityId)?.type,
      bnccSkills: actMap.get(a.activityId)?.bnccSkills ?? [],
    }));
  }

  async getFullReport(learnerId: string) {
    const [profile, attempts, adeHistory, snapshots] = await Promise.all([
      this.getLearnerProfile(learnerId),
      this.getAttemptHistory(learnerId),
      this.getAdeHistory(learnerId),
      this.snapshotRepo.find({ where: { userId: learnerId }, order: { createdAt: 'ASC' }, take: 30 }),
    ]);

    const progressOverTime = snapshots.map((s) => ({
      date: s.createdAt.toISOString().split('T')[0],
      accuracy: Math.round((s.overallAccuracy ?? 0) * 100),
      activities: s.totalActivitiesCompleted ?? 0,
      engagement: Math.round((s.engagementIndex ?? 0) * 100),
    }));

    const skillAccuracy: Record<string, { correct: number; total: number }> = {};
    attempts.forEach((a: any) => {
      (a.bnccSkills ?? []).forEach((skill: string) => {
        if (!skillAccuracy[skill]) skillAccuracy[skill] = { correct: 0, total: 0 };
        skillAccuracy[skill].total++;
        if (a.isCorrect) skillAccuracy[skill].correct++;
      });
    });

    const bnccChart = Object.entries(skillAccuracy).map(([skill, data]) => ({
      skill,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempts: data.total,
    }));

    return {
      generatedAt: new Date().toISOString(),
      learner: profile,
      progressOverTime,
      bnccChart,
      totalAttempts: attempts.length,
      adeDecisions: adeHistory.slice(0, 20),
    };
  }
}
