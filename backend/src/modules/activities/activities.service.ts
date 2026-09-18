import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Activity, DifficultyLevel, ActivityType } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { AdeService } from '../ade/ade.service';
import { UsersService } from '../users/users.service';
import { LearningEventService } from '../learning-events/learning-event.service';
import { LearningEventType } from '../learning-events/entities/learning-event.entity';
import { TrackActivityLifecycleDto } from './dto/track-activity-lifecycle.dto';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';
import { buildActivitySemanticContract } from './activity-semantic-contract';
import { validateActivityAnswer } from './activity-answer-validator';
import { RecommendationExplanationService } from '../ade/recommendation-explanation.service';
import { OntologyService } from '../ontology/ontology.service';
import { RuntimeSemanticAdapter } from '../ontology/runtime-semantic.adapter';
import { SemanticFilteringTrace } from '../ontology/semantic-runtime.types';
import { RecommendationOutcomeService } from '../learning-events/recommendation-outcome.service';
import { ChangeActivityDto } from './dto/change-activity.dto';
import { LearningEvent } from '../learning-events/entities/learning-event.entity';
import {
  HybridRankingResult,
  HybridRecommendationService,
} from '../ade/hybrid-recommendation.service';

interface ActivitySelectionResult {
  activity: Activity;
  semanticTrace: SemanticFilteringTrace;
  ranking: HybridRankingResult;
}

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
    private readonly learningEventService: LearningEventService,
    private readonly dataSource: DataSource,
    private readonly knowledgeTracingService: KnowledgeTracingService,
    private readonly recommendationExplanationService: RecommendationExplanationService =
      new RecommendationExplanationService(),
    private readonly ontologyService?: OntologyService,
    private readonly runtimeSemanticAdapter?: RuntimeSemanticAdapter,
    private readonly hybridRecommendationService?: HybridRecommendationService,
    private readonly recommendationOutcomeService?: RecommendationOutcomeService,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    if (dto.skillWeights) {
      const codes = dto.skillWeights.map((entry) => entry.code);
      const sum = dto.skillWeights.reduce((total, entry) => total + entry.weight, 0);
      if (codes.length !== dto.bnccSkills.length ||
          new Set(codes).size !== codes.length ||
          !dto.bnccSkills.every((code) => codes.includes(code)) ||
          dto.skillWeights.filter((entry) => entry.role === 'primary').length !== 1 ||
          dto.skillWeights.find((entry) => entry.role === 'primary')?.code !== dto.bnccSkills[0] ||
          dto.skillWeights.some((entry) => !['primary', 'secondary'].includes(entry.role) ||
            !Number.isFinite(entry.weight) || entry.weight <= 0 || entry.weight > 1) ||
          Math.abs(sum - 1) > 0.0001) {
        throw new BadRequestException('Skill weights must cover each BNCC code once, with one primary skill and weights summing to 1');
      }
    }
    const activity = this.activityRepo.create(dto);
    return this.attachSemanticContract(await this.activityRepo.save(activity));
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
      query.andWhere('activity.bnccSkills ? :skill', {
        skill: filters.bnccSkill,
      });
    }

    const activities = await query.getMany();
    return Promise.all(
      activities.map((activity) => this.attachSemanticContract(activity)),
    );
  }

  async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return this.attachSemanticContract(activity);
  }

  async getNextActivity(userId: string, context?: {
    sessionId?: string;
    targetSkillCode?: string;
    excludedActivityId?: string;
  }): Promise<{
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
        recentAttempts: await this.getRecentAttempts(userId, 20),
        sessionId: context?.sessionId,
        targetSkillCode: context?.targetSkillCode,
        recentSkips: await this.recentSkipCount(userId),
      });
    } catch (adeErr: any) {
      this.logger.error(`ADE failed: ${adeErr?.message}`, adeErr?.stack);
      const fallback = await this.selectFallbackActivity(userId, context?.excludedActivityId);
      if (!fallback) throw new Error('No activities available');
      return {
        activity: await this.attachSemanticContract(fallback),
        adeDecision: null,
      };
    }

    // 3. Find matching activity
    let activity: Activity;
    try {
      const selection = await this.findMatchingActivity(
        adeDecision,
        profile,
        context?.excludedActivityId,
      );
      activity = selection.activity;
      await this.persistSelection(adeDecision, selection);
    } catch (matchErr: any) {
      this.logger.error(`findMatchingActivity failed: ${matchErr?.message}`);
      const fallback = await this.selectFallbackActivity(userId, context?.excludedActivityId);
      if (!fallback) throw new Error('No activities available');
      activity = fallback;
    }

    this.logger.log(
      `Next activity for user ${userId}: ${activity.id} (ADE decision: ${adeDecision?.id ?? 'fallback'})`,
    );

    return {
      activity: await this.attachSemanticContract(activity),
      adeDecision: this.recommendationExplanationService.toChildDecision(
        adeDecision,
        { selectedActivityId: activity.id, selectedActivityType: activity.type },
      ),
    };
  }

  async changeActivity(userId: string, dto: ChangeActivityDto) {
    const previous = await this.findById(dto.currentActivityId);
    const skipEvent = await this.trackLifecycleEvent(userId, dto.currentActivityId, {
      sessionId: dto.sessionId,
      recommendationId: dto.recommendationId,
      eventType: LearningEventType.ACTIVITY_SKIPPED,
      timeBeforeSkipMs: dto.timeBeforeSkipMs,
      attemptsBeforeSkip: dto.attemptsBeforeSkip,
      hintsBeforeSkip: dto.hintsBeforeSkip,
      changeRequested: true,
    });
    const replacement = await this.getNextActivity(userId, {
      sessionId: dto.sessionId,
      targetSkillCode: previous.bnccSkills?.[0],
      excludedActivityId: previous.id,
    });
    if (skipEvent && replacement.adeDecision?.id && this.recommendationOutcomeService) {
      const next = replacement.activity;
      await this.recommendationOutcomeService.attachReplacement(dto.recommendationId, {
        replacementRecommendationId: replacement.adeDecision.id,
        replacementActivityId: next.id,
        sameBNCCSkill: this.overlaps(previous.bnccSkills, next.bnccSkills),
        sameMathematicalConcept: this.overlaps(previous.mathematicalConcepts, next.mathematicalConcepts),
        interactionTypeChanged: !this.sameValues(previous.interactionType, next.interactionType),
        representationChanged: !this.sameValues(previous.representation, next.representation),
        motorDemandDelta: this.semanticLevelDelta(previous.difficultyProfile?.motorDemand, next.difficultyProfile?.motorDemand),
        sensoryLoadDelta: this.semanticLevelDelta(previous.difficultyProfile?.sensoryLoad, next.difficultyProfile?.sensoryLoad),
        languageLoadDelta: this.semanticLevelDelta(previous.difficultyProfile?.languageLoad, next.difficultyProfile?.languageLoad),
        scaffoldingDelta: this.semanticLevelDelta(previous.difficultyProfile?.scaffoldingLevel, next.difficultyProfile?.scaffoldingLevel),
        difficultyDelta: this.semanticLevelDelta(previous.difficulty, next.difficulty),
      });
    }
    return replacement;
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

    // Learning analytics is best-effort and must not delay attempt processing.
    void this.trackAnswerEvents(userId, dto, activity, isCorrect);
    void this.updateMasteryFromAttempt(userId, activity, isCorrect);

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
          recentAttempts: await this.getRecentAttempts(userId, 20),
          sessionId: dto.sessionId,
          recentSkips: await this.recentSkipCount(userId),
        }),
        timeout,
      ]);
      const selection = await this.findMatchingActivity(
        adeDecision,
        profile,
        dto.activityId,
      );
      nextActivity = selection.activity;
      await this.persistSelection(adeDecision, selection);
    } catch (err: any) {
      this.logger.error(`Next activity fetch failed: ${err?.message}. Using cooldown fallback.`);
      try {
        const fallbacks = await this.selectFallbackActivity(userId, dto.activityId);
        if (fallbacks) nextActivity = fallbacks;
      } catch {
        // no-op — nextActivity stays undefined
      }
    }

    if (nextActivity) {
      nextActivity = await this.attachSemanticContract(nextActivity);
    }

    return {
      attempt,
      feedback,
      nextActivity,
      adeDecision: adeDecision
        ? this.recommendationExplanationService.toChildDecision(adeDecision, {
            selectedActivityId: nextActivity?.id,
            selectedActivityType: nextActivity?.type,
          })
        : undefined,
    };
  }

  async trackLifecycleEvent(
    userId: string,
    activityId: string,
    dto: TrackActivityLifecycleDto,
  ): Promise<LearningEvent | null> {
    try {
      const activity = await this.findById(activityId);
      const bnccSkillId = await this.resolveBnccSkillId(activity);
      const isSkip = dto.eventType === LearningEventType.ACTIVITY_SKIPPED;
      const event = await this.learningEventService.track({
        studentId: userId,
        sessionId: dto.sessionId,
        eventType: dto.eventType,
        timestamp: new Date(),
        activityId,
        bnccSkillId,
        recommendationId: dto.recommendationId ?? null,
        hintsUsed: isSkip ? dto.hintsBeforeSkip ?? null : null,
        metadata: isSkip ? {
          timeBeforeSkipMs: dto.timeBeforeSkipMs ?? null,
          attemptsBeforeSkip: dto.attemptsBeforeSkip ?? null,
          hintsBeforeSkip: dto.hintsBeforeSkip ?? null,
          changeRequested: dto.changeRequested ?? false,
        } : null,
      });
      if (event && this.recommendationOutcomeService) {
        await this.recommendationOutcomeService.synchronize(event, activity);
      }
      return event;
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to track ${dto.eventType} for activity ${activityId}`,
        details,
      );
      return null;
    }
  }

  private overlaps(left?: string[], right?: string[]): boolean {
    return Boolean(left?.some((value) => right?.includes(value)));
  }

  private sameValues(left?: string[], right?: string[]): boolean {
    return JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...(right ?? [])].sort());
  }

  private semanticLevelDelta(previous: unknown, replacement: unknown): number | null {
    const levels: Record<string, number> = {
      very_easy: 0, easy: 1, low: 1, low_to_medium: 2, medium: 3, medium_with_low_motor_alternative: 3,
      medium_with_keyboard_alternative: 3, hard: 4, high: 4, extreme: 5,
    };
    const before = levels[String(previous ?? '').toLowerCase()];
    const after = levels[String(replacement ?? '').toLowerCase()];
    return before === undefined || after === undefined ? null : after - before;
  }

  private async trackAnswerEvents(
    userId: string,
    dto: SubmitAttemptDto,
    activity: Activity,
    isCorrect: boolean,
  ): Promise<void> {
    try {
      const [attemptNumber, bnccSkillId] = await Promise.all([
        this.attemptRepo.count({
          where: {
            userId,
            activityId: dto.activityId,
            sessionId: dto.sessionId,
          },
        }),
        this.resolveBnccSkillId(activity),
      ]);
      const event = {
        studentId: userId,
        sessionId: dto.sessionId ?? '',
        timestamp: new Date(),
        activityId: dto.activityId,
        bnccSkillId,
        attempt: attemptNumber,
        responseTimeMs: dto.responseTimeMs ?? Math.round((dto.timeSpentSeconds ?? 0) * 1000),
        correct: isCorrect,
        hintsUsed: dto.hintsUsed ?? 0,
        recommendationId: dto.recommendationId ?? dto.adeDecisionContext?.decisionId ?? null,
      };

      const submitted = await this.learningEventService.track({
        ...event,
        eventType: LearningEventType.ANSWER_SUBMITTED,
      });
      if (submitted && this.recommendationOutcomeService) {
        await this.recommendationOutcomeService.synchronize(submitted, activity);
      }
      const completed = await this.learningEventService.track({
        ...event,
        timestamp: new Date(),
        eventType: LearningEventType.ACTIVITY_COMPLETED,
      });
      if (completed && this.recommendationOutcomeService) {
        await this.recommendationOutcomeService.synchronize(completed, activity);
      }
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to track answer events for activity ${dto.activityId}`,
        details,
      );
    }
  }

  private async resolveBnccSkillId(activity: Activity): Promise<string | null> {
    const code = activity.bnccSkills?.[0];
    if (!code) return null;

    const rows: Array<{ id: string }> = await this.dataSource.query(
      'SELECT id FROM bncc_skills WHERE code = $1 LIMIT 1',
      [code],
    );
    return rows[0]?.id ?? null;
  }

  private async attachSemanticContract(activity: Activity): Promise<Activity> {
    let bnccSkillId: string | null = null;
    let formalConceptMappings: Record<string, string[]> | undefined;
    try {
      bnccSkillId = await this.resolveBnccSkillId(activity);
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to resolve BNCC skill for semantic activity ${activity.id}`,
        details,
      );
    }
    try {
      formalConceptMappings = this.ontologyService
        ?.getMathematicalConceptMappings(activity.bnccSkills ?? []);
    } catch (error) {
      this.logger.error(
        `Formal concept materialization failed for activity ${activity.id}; using documented legacy mappings`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return Object.assign(
      activity,
      buildActivitySemanticContract(activity, bnccSkillId, formalConceptMappings),
    );
  }

  private async updateMasteryFromAttempt(
    studentId: string,
    activity: Activity,
    correct: boolean,
  ): Promise<void> {
    const skillCode = activity.bnccSkills?.[0];
    if (!skillCode) return;

    try {
      const skillId = await this.resolveBnccSkillId(activity);
      if (!skillId) return;
      await this.knowledgeTracingService.observe({
        studentId,
        skillId,
        skillCode,
        correct,
      });
    } catch (error) {
      const details = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Knowledge tracing failed for skill ${skillCode}`, details);
    }
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

    const storedActivities = await this.activityRepo.find({ where: { isActive: true } });
    const allActivities = await Promise.all(
      storedActivities.map((activity) => this.attachSemanticContract(activity)),
    );

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
        activityType: act.activityType,
        bnccSkillId: act.bnccSkillId,
        mathematicalConcepts: act.mathematicalConcepts,
        representation: act.representation,
        interactionType: act.interactionType,
        difficultyProfile: act.difficultyProfile,
        affordances: act.affordances,
        communication: act.communication,
        semanticAnnotation: act.semanticAnnotation,
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
      ontologyInferences: [],
      legacyProceduralSignals: ontologyResult.inferences,
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

  private async recentSkipCount(userId: string): Promise<number> {
    const attempts = await this.getRecentAttempts(userId, 5);
    if (!attempts.length) return 0;
    const oldest = attempts[attempts.length - 1].createdAt;
    return typeof this.learningEventService.getRecentSkippedActivityIds === 'function'
      ? (await this.learningEventService.getRecentSkippedActivityIds(userId, 5, oldest)).length
      : 0;
  }

  async getUserAttemptHistory(userId: string): Promise<ActivityAttempt[]> {
    return this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private evaluateAnswer(activity: Activity, answer: any): boolean {
    const content = activity.type === ActivityType.DRAG_DROP && !activity.content.validation
      ? { ...activity.content, validation: { kind: 'sequence' as const } }
      : activity.content;
    return validateActivityAnswer(content, answer);
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

  private async findMatchingActivity(
    adeDecision: any,
    profile: any,
    excludedActivityId?: string,
  ): Promise<ActivitySelectionResult> {
    const storedActivities = (await this.activityRepo.find({ where: { isActive: true } }))
      .filter((activity) => activity.id !== excludedActivityId);
    if (storedActivities.length === 0) throw new Error('No activities available');

    const activities = await Promise.all(
      storedActivities.map((activity) => this.attachSemanticContract(activity)),
    );
    const sameSkill = activities.filter((activity) =>
      activity.bnccSkills?.includes(adeDecision.recommendedBnccSkill));
    const skillCandidates = sameSkill.length ? sameSkill : activities;
    const legacyCandidates = skillCandidates.filter((activity) =>
      this.matchesLegacyRecommendation(activity, adeDecision),
    );
    const [recentAttempts, rejectedActivityIds] = await Promise.all([
      this.getRecentAttempts(adeDecision.userId, 20),
      this.learningEventService.getRecentSkippedActivityIds(adeDecision.userId, 20),
    ]);
    const recentIds = [...rejectedActivityIds, ...recentAttempts.map((attempt) => attempt.activityId)];

    if (!this.ontologyService || !this.runtimeSemanticAdapter || !this.hybridRecommendationService) {
      const candidates = this.cooldown(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, activities, recentIds);
      const fallbackReason = 'Formal semantic or hybrid ranking services are unavailable; legacy selection was used';
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        activity,
        semanticTrace: this.unavailableSemanticTrace(
          adeDecision,
          activities,
          fallbackReason,
        ),
        ranking: this.fallbackRanking(activity.id, candidates, fallbackReason),
      };
    }

    const facts = this.runtimeSemanticAdapter.materialize({
      studentId: adeDecision.userId,
      targetSkill: adeDecision.recommendedBnccSkill,
      activities,
      masteryProbability: adeDecision.xaiLog?.mlPredictions?.masteryProbability,
      recentAccuracy: adeDecision.inputSnapshot?.recentAccuracy,
      observedLearnerEvidence: profile?.ontologyInstanceData,
    });
    const semanticResult = this.ontologyService.getValidActivityCandidates(facts);
    const validIds = new Set(semanticResult.validCandidateIds);
    const formallyValid = activities.filter((activity) => validIds.has(activity.id));

    if (semanticResult.trace.fallbackUsed) {
      const candidates = this.cooldown(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, activities, recentIds);
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        activity,
        semanticTrace: semanticResult.trace,
        ranking: this.fallbackRanking(
          activity.id,
          candidates,
          semanticResult.trace.fallbackReason ?? 'Semantic candidate generation required fallback',
          semanticResult.trace.ontologyVersion,
        ),
      };
    }

    const matchingLevel = formallyValid.filter((activity) =>
      activity.difficulty === adeDecision.recommendedDifficulty);
    const rankedCandidates = this.cooldown(
      matchingLevel.length ? matchingLevel : formallyValid, activities, recentIds);
    const ranking = this.hybridRecommendationService.rank({
      candidates: rankedCandidates,
      masteryProbability: facts.mastery.probability,
      semanticTrace: semanticResult.trace,
      recentActivityIds: recentAttempts.map((attempt) => attempt.activityId),
      recentlyRejectedActivityIds: rejectedActivityIds,
      observedEvidenceTypes: facts.observedEvidenceTypes,
    });
    const selected = rankedCandidates.find((activity) => activity.id === ranking.selectedActivityId);
    if (!selected) {
      const candidates = this.cooldown(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, activities, recentIds);
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      const fallbackReason = ranking.fallbackReason ?? 'Hybrid ranking did not select a valid candidate';
      return {
        activity,
        semanticTrace: semanticResult.trace,
        ranking: this.fallbackRanking(
          activity.id,
          candidates,
          fallbackReason,
          semanticResult.trace.ontologyVersion,
        ),
      };
    }

    return {
      activity: selected,
      semanticTrace: semanticResult.trace,
      ranking,
    };
  }

  private cooldown(candidates: Activity[], catalog: Activity[], recentIds: string[]): Activity[] {
    if (!candidates.length) return candidates;
    const byId = new Map(catalog.map((activity) => [activity.id, activity]));
    const recent = recentIds.slice(0, 4).map((id) => byId.get(id)).filter((item): item is Activity => Boolean(item));
    const recentStructures = new Set(recent.map((item) => item.content?.semantic?.structureId ?? item.title));
    const recentItems = new Set(recent.map((item) => JSON.stringify(item.content?.items ?? item.content?.pictogramConceptIds ?? [])));
    const recentTypes = new Set(recent.slice(0, 2).map((item) => item.type));
    const stages = [
      (item: Activity) => !recentIds.slice(0, 8).includes(item.id) &&
        !recentStructures.has(item.content?.semantic?.structureId ?? item.title) &&
        !recentItems.has(JSON.stringify(item.content?.items ?? item.content?.pictogramConceptIds ?? [])) &&
        !recentTypes.has(item.type),
      (item: Activity) => !recentIds.slice(0, 5).includes(item.id) &&
        !recentStructures.has(item.content?.semantic?.structureId ?? item.title),
      (item: Activity) => !recentIds.slice(0, 2).includes(item.id),
    ];
    for (const stage of stages) {
      const available = candidates.filter(stage);
      if (available.length) return available;
    }
    return candidates;
  }

  private async selectFallbackActivity(userId: string, excludedId?: string): Promise<Activity | null> {
    const catalog = await this.activityRepo.find({ where: { isActive: true } });
    const candidates = catalog.filter((item) => item.id !== excludedId);
    if (!candidates.length) return null;
    const [attempts, skipped] = await Promise.all([
      this.getRecentAttempts(userId, 20),
      this.learningEventService.getRecentSkippedActivityIds(userId, 20),
    ]);
    return this.cooldown(candidates, catalog,
      [...skipped, ...attempts.map((attempt) => attempt.activityId)])[0] ?? null;
  }

  private matchesLegacyRecommendation(activity: Activity, adeDecision: any): boolean {
    const difficultyMatches = !adeDecision.recommendedDifficulty ||
      activity.difficulty === adeDecision.recommendedDifficulty;
    const modalityMatches = !adeDecision.recommendedModality ||
      activity.targetModalities?.includes(adeDecision.recommendedModality);
    return difficultyMatches && modalityMatches;
  }

  private async persistSelection(
    decision: any,
    selection: ActivitySelectionResult,
  ): Promise<void> {
    try {
      await this.adeService.recordSemanticFilteringTrace(decision, selection.semanticTrace);
      await this.adeService.recordHybridRanking(decision, selection.ranking);
    } catch (error) {
      this.logger.error(
        `Failed to persist semantic trace for decision ${decision?.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private fallbackRanking(
    selectedActivityId: string,
    candidates: Activity[],
    fallbackReason: string,
    ontologyVersion = 'unavailable',
  ): HybridRankingResult {
    return {
      selectedActivityId,
      candidateIds: candidates.map((candidate) => candidate.id),
      candidates: [],
      weights: { learning: 0, challenge: 0, interaction: 0, semantic: 0, novelty: 0, rejection: 0 },
      configurationVersion: 'unavailable',
      rankingVersion: 'unavailable',
      ontologyVersion,
      decisionSource: 'LEGACY_FALLBACK',
      fallbackUsed: true,
      fallbackReason,
      selectionExplanation: {
        selectedActivityId,
        comparedWith: candidates.filter((candidate) => candidate.id !== selectedActivityId).map((candidate) => candidate.id),
        scoreMargin: null,
      },
    };
  }

  private unavailableSemanticTrace(
    decision: any,
    activities: Activity[],
    fallbackReason: string,
  ): SemanticFilteringTrace {
    return {
      targetSkill: decision.recommendedBnccSkill,
      runtimeFactsUsed: {
        studentId: decision.userId,
        masterySource: 'StudentSkillState',
        masteryProbability: decision.xaiLog?.mlPredictions?.masteryProbability ?? null,
        recentAccuracy: decision.inputSnapshot?.recentAccuracy ?? null,
        observedEvidenceTypes: [],
        hardConstraints: { disallowDragging: false, requireAudio: false },
      },
      candidateActivities: activities.map((activity) => activity.id),
      validCandidateIds: activities.map((activity) => activity.id),
      excludedCandidateIds: [],
      candidateDecisions: [],
      semanticRelations: [],
      ontologyVersion: 'unavailable',
      reasonerVersion: 'unavailable',
      fallbackUsed: true,
      fallbackReason,
    };
  }
}
