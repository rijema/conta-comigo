import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, DifficultyLevel, ActivityType } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { AdeService } from '../ade/ade.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly adeService: AdeService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create(dto);
    return this.activityRepo.save(activity);
  }

  async findAll(filters?: {
    difficulty?: DifficultyLevel;
    type?: ActivityType;
    bnccSkill?: string;
  }): Promise<Activity[]> {
    const query = this.activityRepo.createQueryBuilder('activity')
      .where('activity.isActive = true');

    if (filters?.difficulty) {
      query.andWhere('activity.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.type) {
      query.andWhere('activity.type = :type', { type: filters.type });
    }

    if (filters?.bnccSkill) {
      query.andWhere(':skill = ANY(activity.bnccSkills)', {
        skill: filters.bnccSkill,
      });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async getNextActivity(userId: string): Promise<{
    activity: Activity;
    adeDecision: any;
  }> {
    // 1. Load learner profile (with safe fallback for new children)
    let profile: any;
    try {
      profile = await this.usersService.getChildProfile(userId);
    } catch {
      profile = {
        userId,
        age: 7,
        schoolYear: 1,
        asdSupportLevel: 'mild',
        strengths: { visual: true },
        weaknesses: {},
        skillMastery: {},
        bnccProgress: {},
        currentStreak: 0,
      };
    }

    // 2. Call ADE to decide
    let adeDecision: any;
    try {
      adeDecision = await this.adeService.decide({
        userId,
        profile,
        recentAttempts: await this.getRecentAttempts(userId, 5),
      });
    } catch (adeErr: any) {
      this.logger.error(`ADE failed: ${adeErr?.message}`, adeErr?.stack);
      // Fallback: skip ADE, pick any easy activity
      const fallback = await this.activityRepo.findOne({
        where: { difficulty: DifficultyLevel.EASY, isActive: true },
      });
      if (!fallback) throw new Error('No activities available');
      return { activity: fallback, adeDecision: null };
    }

    // 3. Find matching activity
    let activity: Activity;
    try {
      activity = await this.findMatchingActivity(adeDecision);
    } catch (matchErr: any) {
      this.logger.error(`findMatchingActivity failed: ${matchErr?.message}`);
      const fallback = await this.activityRepo.findOne({
        where: { isActive: true },
      });
      if (!fallback) throw new Error('No activities available');
      activity = fallback;
    }

    this.logger.log(
      `Next activity for user ${userId}: ${activity.id} (ADE decision: ${adeDecision?.id ?? 'fallback'})`,
    );

    return { activity, adeDecision };
  }

  async submitAttempt(userId: string, dto: SubmitAttemptDto): Promise<{
    attempt: ActivityAttempt;
    feedback: any;
    nextActivity?: Activity;
    adeDecision?: any;
  }> {
    const activity = await this.findById(dto.activityId);

    // Calculate score
    const isCorrect = this.evaluateAnswer(activity, dto.answer);
    const score = isCorrect ? 1.0 : 0.0;

    // Save attempt
    const attempt = this.attemptRepo.create({
      userId,
      activityId: dto.activityId,
      sessionId: dto.sessionId,
      isCorrect,
      score,
      timeSpentSeconds: dto.timeSpentSeconds,
      hintsUsed: dto.hintsUsed || 0,
      interactionSignals: dto.interactionSignals,
      adeDecisionContext: dto.adeDecisionContext,
    });

    await this.attemptRepo.save(attempt);

    // Publish Kafka event (async, non-blocking)
    this.kafkaProducer.publishActivityEvent({
      eventId: `activity-${attempt.id}`,
      eventType: 'ACTIVITY_COMPLETED',
      learnerId: userId,
      sessionId: dto.sessionId || '',
      timestamp: new Date().toISOString(),
      payload: {
        activityId: dto.activityId,
        isCorrect,
        score,
        timeSpentSeconds: dto.timeSpentSeconds,
        interactionSignals: dto.interactionSignals,
        bnccSkills: activity.bnccSkills,
      },
    }).catch((err: any) => this.logger.error('Kafka publish failed', err));

    // Generate feedback
    const feedback = this.generateFeedback(isCorrect, activity, dto.hintsUsed ?? 0);

    // Fetch next activity via ADE (always, so UI can advance on correct answer)
    let nextActivity: Activity | undefined;
    let adeDecision: any;
    try {
      let profile: any;
      try {
        profile = await this.usersService.getChildProfile(userId);
      } catch {
        profile = {
          userId,
          age: 7,
          schoolYear: 1,
          asdSupportLevel: 'mild',
          strengths: { visual: true },
          weaknesses: {},
          skillMastery: {},
          bnccProgress: {},
          currentStreak: 0,
        };
      }
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ADE timeout')), 3000),
      );
      adeDecision = await Promise.race([
        this.adeService.decide({
          userId,
          profile,
          recentAttempts: await this.getRecentAttempts(userId, 5),
          sessionId: dto.sessionId,
        }),
        timeout,
      ]);
      nextActivity = await this.findMatchingActivity(adeDecision);
      // Avoid returning the same activity as current
      if (nextActivity.id === dto.activityId) {
        const candidates = await this.activityRepo
          .createQueryBuilder('activity')
          .where('activity.isActive = true')
          .andWhere('activity.id != :id', { id: dto.activityId })
          .getMany();
        if (candidates.length > 0) {
          nextActivity = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    } catch (err: any) {
      this.logger.error(`Next activity fetch failed: ${err?.message}. Using random fallback.`);
      try {
        const fallbacks = await this.activityRepo
          .createQueryBuilder('activity')
          .where('activity.isActive = true')
          .andWhere('activity.id != :id', { id: dto.activityId })
          .orderBy('RANDOM()')
          .limit(1)
          .getOne();
        if (fallbacks) nextActivity = fallbacks;
      } catch {
        // no-op — nextActivity stays undefined
      }
    }

    return { attempt, feedback, nextActivity, adeDecision };
  }

  async getActivityTree(userId: string): Promise<any> {
    let profile: any;
    try {
      profile = await this.usersService.getChildProfile(userId);
    } catch {
      profile = { strengths: {}, weaknesses: {}, skillMastery: {}, bnccProgress: {} };
    }

    const recentAttempts = await this.getRecentAttempts(userId, 20);
    const completedActivityIds = new Set(
      recentAttempts.filter((a) => a.isCorrect).map((a) => a.activityId)
    );

    const allActivities = await this.activityRepo.find({ where: { isActive: true } });

    // Group by BNCC skill
    const bySkill: Record<string, any[]> = {};
    allActivities.forEach((act) => {
      const skill = act.bnccSkills?.[0] ?? 'Geral';
      if (!bySkill[skill]) bySkill[skill] = [];
      bySkill[skill].push({
        id: act.id,
        title: act.title,
        type: act.type,
        difficulty: act.difficulty,
        completed: completedActivityIds.has(act.id),
        bnccSkills: act.bnccSkills,
        targetModalities: act.targetModalities,
      });
    });

    // Use ontology to determine recommended modalities
    const ontologyResult = this.adeService.inferOntologyModalities(
      profile.strengths ?? {},
      profile.weaknesses ?? {},
    );

    // Mark activities as recommended based on ontology modalities
    const tree = Object.entries(bySkill).map(([skill, activities]) => {
      const recommended = activities.filter((a) =>
        a.targetModalities?.some((m: string) => ontologyResult.modalities.includes(m))
      );
      return {
        skill,
        totalActivities: activities.length,
        completedCount: activities.filter((a) => a.completed).length,
        activities: activities.map((a) => ({
          ...a,
          recommended: a.targetModalities?.some((m: string) =>
            ontologyResult.modalities.includes(m)
          ) ?? false,
        })),
      };
    });

    return {
      tree,
      ontologyModalities: ontologyResult.modalities,
      ontologyInferences: ontologyResult.inferences,
      completedTotal: completedActivityIds.size,
      totalActivities: allActivities.length,
    };
  }

  async getRecentAttempts(userId: string, limit = 10): Promise<ActivityAttempt[]> {
    return this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserAttemptHistory(userId: string): Promise<ActivityAttempt[]> {
    return this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private evaluateAnswer(activity: Activity, answer: any): boolean {
    // Drag-drop: compare arrangement array against correctOrder
    if (activity.type === 'drag_drop') {
      const correctOrder: string[] = activity.content?.correctAnswer || [];
      const arrangement: string[] = Array.isArray(answer)
        ? answer
        : String(answer).split(',');
      return (
        arrangement.length === correctOrder.length &&
        arrangement.every((id, i) => id === correctOrder[i])
      );
    }

    const correct = activity.content?.correctAnswer;
    if (correct === null || correct === undefined) return false;

    if (typeof correct === 'string') {
      return String(answer).toLowerCase().trim() === correct.toLowerCase().trim();
    }

    if (typeof correct === 'number') {
      return Number(answer) === correct;
    }

    if (Array.isArray(correct)) {
      return JSON.stringify(answer) === JSON.stringify(correct);
    }

    return answer === correct;
  }

  private generateFeedback(
    isCorrect: boolean,
    activity: Activity,
    hintsUsed: number,
  ) {
    return {
      isCorrect,
      message: isCorrect
        ? 'Muito bem! Você acertou! 🌟'
        : 'Tente novamente! Você consegue! 💪',
      messageEn: isCorrect ? 'Well done! You got it! 🌟' : 'Try again! You can do it! 💪',
      pointsEarned: isCorrect ? Math.max(activity.pointsReward - hintsUsed * 5, 0) : 0,
      encouragement: true,
    };
  }

  private async findMatchingActivity(adeDecision: any): Promise<Activity> {
    const query = this.activityRepo.createQueryBuilder('activity')
      .where('activity.isActive = true');

    if (adeDecision.recommendedDifficulty) {
      query.andWhere('activity.difficulty = :diff', {
        diff: adeDecision.recommendedDifficulty,
      });
    }

    if (adeDecision.recommendedModality) {
      query.andWhere('activity.targetModalities::jsonb @> :modality::jsonb', {
        modality: JSON.stringify([adeDecision.recommendedModality]),
      });
    }

    const activities = await query.getMany();

    if (activities.length === 0) {
      // Fallback: return any easy activity
      const fallback = await this.activityRepo.findOne({
        where: { difficulty: DifficultyLevel.EASY, isActive: true },
      });
      if (!fallback) throw new Error('No activities available');
      return fallback;
    }

    // Random selection from candidates (simple exploration)
    return activities[Math.floor(Math.random() * activities.length)];
  }
}