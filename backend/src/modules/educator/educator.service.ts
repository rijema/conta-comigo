import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { AdeDecision } from '../ade/entities/ade-decision.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { Activity } from '../activities/entities/activity.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';
import { RecommendationExplanationService } from '../ade/recommendation-explanation.service';
import { AdaptationTransition } from '../learning-events/entities/adaptation-transition.entity';
import { RecommendationOutcome } from '../learning-events/entities/recommendation-outcome.entity';
import { ProfessionalRecommendationFeedback } from './entities/professional-recommendation-feedback.entity';
import { CreateProfessionalFeedbackDto } from './dto/create-professional-feedback.dto';
import { LongitudinalLearningAnalyticsService } from '../learning-events/longitudinal-learning-analytics.service';

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
    private readonly knowledgeTracingService: KnowledgeTracingService,
    private readonly recommendationExplanationService: RecommendationExplanationService,
    @InjectRepository(AdaptationTransition)
    private readonly transitionRepo: Repository<AdaptationTransition>,
    @InjectRepository(RecommendationOutcome)
    private readonly outcomeRepo: Repository<RecommendationOutcome>,
    @InjectRepository(ProfessionalRecommendationFeedback)
    private readonly professionalFeedbackRepo: Repository<ProfessionalRecommendationFeedback>,
    private readonly longitudinalAnalytics?: LongitudinalLearningAnalyticsService,
  ) {}

  async getLongitudinalAnalytics(learnerId: string) {
    if (!this.longitudinalAnalytics) throw new NotFoundException('Longitudinal analytics service is unavailable');
    return this.longitudinalAnalytics.getProfessionalReport(learnerId);
  }

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

    const [recentAttempts, recentAde, snapshot, skillMastery] = await Promise.all([
      this.attemptRepo.find({ where: { userId: learnerId }, order: { createdAt: 'DESC' }, take: 20 }),
      this.adeDecisionRepo.find({ where: { userId: learnerId }, order: { createdAt: 'DESC' }, take: 10 }),
      this.snapshotRepo.findOne({ where: { userId: learnerId }, order: { createdAt: 'DESC' } }),
      this.knowledgeTracingService.getMasteryMapBySkillCode(learnerId),
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
      skillMastery,
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
      recentAdeDecisions: recentAde.map((decision) =>
        this.recommendationExplanationService.toProfessionalDecision(decision, {
          recentActivityHistory: this.buildRecentActivityHistory(recentAttempts),
        }),
      ),
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
    const [decisions, recentAttempts] = await Promise.all([
      this.adeDecisionRepo.find({
        where: { userId: learnerId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.attemptRepo.find({
        where: { userId: learnerId },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);
    return decisions.map((decision) =>
      this.recommendationExplanationService.toProfessionalDecision(decision, {
        recentActivityHistory: this.buildRecentActivityHistory(recentAttempts),
      }),
    );
  }

  async getResearchExplanation(learnerId: string, decisionId: string) {
    const decision = await this.adeDecisionRepo.findOne({
      where: { id: decisionId, userId: learnerId },
    });
    if (!decision) throw new NotFoundException('Recommendation decision not found');
    const explanation = this.recommendationExplanationService.explain({ decision })
      .researchExplanation;
    const transition = await this.transitionRepo.findOne({
      where: [
        { studentId: learnerId, previousRecommendationId: decisionId },
        { studentId: learnerId, replacementRecommendationId: decisionId },
      ],
    });
    if (!transition) return explanation;
    const recommendationIds = [
      transition.previousRecommendationId,
      transition.replacementRecommendationId,
    ].filter((value): value is string => Boolean(value));
    const [decisions, outcomes, feedback] = await Promise.all([
      this.adeDecisionRepo.find({ where: { id: In(recommendationIds) } }),
      this.outcomeRepo.find({ where: { recommendationId: In(recommendationIds) } }),
      this.professionalFeedbackRepo.find({ where: { transitionId: transition.id } }),
    ]);
    return {
      ...explanation,
      adaptationTrace: {
        transition,
        decisions: decisions.map((item) => ({
          id: item.id,
          selectedActivityId: item.selectedActivityId,
          hybridRanking: item.hybridRanking,
          semanticTrace: item.xaiLog?.semanticFiltering,
          fallbackUsed: item.fallbackUsed,
        })),
        outcomes,
        professionalFeedback: feedback,
      },
    };
  }

  async getAdaptations(learnerId: string) {
    const transitions = await this.transitionRepo.find({
      where: { studentId: learnerId }, order: { createdAt: 'DESC' }, take: 50,
    });
    const activityIds = [...new Set(transitions.flatMap((item) =>
      [item.previousActivityId, item.replacementActivityId].filter((value): value is string => Boolean(value))))];
    const recommendationIds = [...new Set(transitions.flatMap((item) =>
      [item.previousRecommendationId, item.replacementRecommendationId].filter((value): value is string => Boolean(value))))];
    const [activities, outcomes, decisions, feedback] = await Promise.all([
      activityIds.length ? this.activityRepo.find({ where: { id: In(activityIds) } }) : [],
      recommendationIds.length ? this.outcomeRepo.find({ where: { recommendationId: In(recommendationIds) } }) : [],
      recommendationIds.length ? this.adeDecisionRepo.find({ where: { id: In(recommendationIds) } }) : [],
      transitions.length ? this.professionalFeedbackRepo.find({ where: { transitionId: In(transitions.map((item) => item.id)) } }) : [],
    ]);
    const activityMap = new Map(activities.map((item) => [item.id, item]));
    const outcomeMap = new Map(outcomes.map((item) => [item.recommendationId, item]));
    const decisionMap = new Map(decisions.map((item) => [item.id, item]));
    const feedbackMap = new Map(feedback.map((item) => [item.transitionId, item]));
    return transitions.map((transition) => {
      const previous = activityMap.get(transition.previousActivityId);
      const replacement = transition.replacementActivityId
        ? activityMap.get(transition.replacementActivityId) : undefined;
      const targetSkill = decisionMap.get(transition.previousRecommendationId)?.recommendedBnccSkill ?? null;
      const replacementDecision = transition.replacementRecommendationId
        ? decisionMap.get(transition.replacementRecommendationId) : undefined;
      const selectedRanking = replacementDecision?.hybridRanking?.candidates.find(
        (candidate) => candidate.activityId === replacementDecision.selectedActivityId,
      );
      const formatChange = transition.interactionTypeChanged
        ? `substituiu ${previous?.type ?? 'o formato anterior'} por ${replacement?.type ?? 'outro formato'}`
        : 'manteve o formato de interação';
      return {
        id: transition.id,
        sessionId: transition.sessionId,
        targetBnccSkill: targetSkill,
        mathematicalConcepts: this.activityConcepts(previous),
        trigger: transition.changeRequested ? 'Quero outro' : transition.triggerType,
        repeatedRejection: transitions.filter((item) => item.previousActivityId === transition.previousActivityId).length > 1,
        fallbackUsed: replacementDecision?.fallbackUsed ?? null,
        insufficientEvidence: selectedRanking?.insufficientEvidence ?? [],
        previousActivity: this.activitySummary(previous),
        replacementActivity: this.activitySummary(replacement),
        differences: {
          sameBNCCSkill: transition.sameBNCCSkill,
          sameMathematicalConcept: transition.sameMathematicalConcept,
          interactionTypeChanged: transition.interactionTypeChanged,
          representationChanged: transition.representationChanged,
          motorDemandDelta: transition.motorDemandDelta,
          sensoryLoadDelta: transition.sensoryLoadDelta,
          languageLoadDelta: transition.languageLoadDelta,
          scaffoldingDelta: transition.scaffoldingDelta,
          difficultyDelta: transition.difficultyDelta,
        },
        previousOutcome: outcomeMap.get(transition.previousRecommendationId) ?? null,
        replacementOutcome: transition.replacementRecommendationId
          ? outcomeMap.get(transition.replacementRecommendationId) ?? null : null,
        guardianExplanation: transition.sameBNCCSkill
          ? 'A criança pediu outro exercício. O sistema mudou a forma da atividade e manteve a mesma habilidade.'
          : 'A criança pediu outro exercício. O ContaComigo escolheu uma nova atividade.',
        professionalExplanation: `A criança solicitou outra atividade. O sistema ${formatChange}${targetSkill ? ` para ${targetSkill}` : ''}.`,
        feedback: feedbackMap.get(transition.id) ?? null,
      };
    });
  }

  async createAdaptationFeedback(
    transitionId: string,
    professionalId: string,
    dto: CreateProfessionalFeedbackDto,
  ) {
    const transition = await this.transitionRepo.findOne({ where: { id: transitionId } });
    if (!transition) throw new NotFoundException('Adaptation transition not found');
    const existing = await this.professionalFeedbackRepo.findOne({
      where: { transitionId, professionalId },
    });
    if (existing) return existing;
    return this.professionalFeedbackRepo.save(this.professionalFeedbackRepo.create({
      transitionId,
      recommendationId: transition.replacementRecommendationId ?? transition.previousRecommendationId,
      sessionId: transition.sessionId,
      studentId: transition.studentId,
      professionalId,
      rating: dto.rating,
      reasonCodes: dto.reasonCodes ?? [],
      optionalComment: dto.optionalComment?.trim() || null,
    }));
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

  private buildRecentActivityHistory(attempts: ActivityAttempt[]): string[] {
    return attempts.slice(0, 5).map((attempt) => {
      const result = attempt.isCorrect ? 'com acerto' : 'sem acerto';
      return `Atividade concluída ${result} em ${attempt.createdAt.toISOString()}.`;
    });
  }

  private activityConcepts(activity?: Activity): string[] {
    const concepts = activity?.content?.semantic?.mathematicalConcepts;
    return Array.isArray(concepts) ? concepts.filter((item): item is string => typeof item === 'string') : [];
  }

  private activitySummary(activity?: Activity) {
    return activity ? {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      bnccSkills: activity.bnccSkills,
      mathematicalConcepts: this.activityConcepts(activity),
    } : null;
  }
}
