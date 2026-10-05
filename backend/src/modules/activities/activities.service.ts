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
import type { ChildProfile } from '../users/entities/child-profile.entity';
import { LearningEventService } from '../learning-events/learning-event.service';
import { LearningEventType } from '../learning-events/entities/learning-event.entity';
import { TrackActivityLifecycleDto } from './dto/track-activity-lifecycle.dto';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';
import { buildActivitySemanticContract } from './activity-semantic-contract';
import { validateActivityAnswer } from './activity-answer-validator';
import { RecommendationExplanationService } from '../ade/recommendation-explanation.service';
import { OntologyService } from '../ontology/ontology.service';
import type { SkillRelationEvidence } from '../ontology/ontology.service';
import { RuntimeSemanticAdapter } from '../ontology/runtime-semantic.adapter';
import { SemanticFilteringTrace } from '../ontology/semantic-runtime.types';
import { RecommendationOutcomeService } from '../learning-events/recommendation-outcome.service';
import { ReviewOrchestrationService } from '../learning-events/services/review-orchestration.service';
import { ChangeActivityDto } from './dto/change-activity.dto';
import { LearningEvent } from '../learning-events/entities/learning-event.entity';
import {
  HybridRankingResult,
  HybridRecommendationService,
} from '../ade/hybrid-recommendation.service';
import { IslandCycleValidatorService } from './services/island-cycle-validator.service';
import { Island } from './entities/island.entity';
import { IslandActivityMapping } from './entities/island-activity-mapping.entity';
import { CycleManagementService } from './services/cycle-management.service';
import { StudentCycleTracking } from './entities/student-cycle-tracking.entity';
import { CycleContextDto } from './dto/cycle-context.dto';
import { CycleInitializationService } from './services/cycle-initialization.service';

interface ActivitySelectionResult {
  activity: Activity;
  semanticTrace: SemanticFilteringTrace;
  ranking: HybridRankingResult;
}

interface LearningSelectionStrategy {
  mode: 'consolidate' | 'reinforce' | 'review' | 'challenge' | 'explore';
  originalSkill: string;
  selectedSkill: string;
  evidence: string[];
  relation?: SkillRelationEvidence;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    @InjectRepository(Island)
    private readonly islandRepo: Repository<Island>,
    @InjectRepository(IslandActivityMapping)
    private readonly islandActivityMappingRepo: Repository<IslandActivityMapping>,
    @InjectRepository(StudentCycleTracking)
    private readonly cycleTrackingRepo: Repository<StudentCycleTracking>,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly adeService: AdeService,
    private readonly usersService: UsersService,
    private readonly learningEventService: LearningEventService,
    private readonly dataSource: DataSource,
    private readonly knowledgeTracingService: KnowledgeTracingService,
    private readonly islandCycleValidator: IslandCycleValidatorService,
    private readonly cycleManagementService: CycleManagementService,
    private readonly cycleInitializationService: CycleInitializationService,
    private readonly recommendationExplanationService: RecommendationExplanationService =
      new RecommendationExplanationService(),
    private readonly ontologyService?: OntologyService,
    private readonly runtimeSemanticAdapter?: RuntimeSemanticAdapter,
    private readonly hybridRecommendationService?: HybridRecommendationService,
    private readonly recommendationOutcomeService?: RecommendationOutcomeService,
    private readonly reviewOrchestrationService?: ReviewOrchestrationService,
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
    cycleNumber?: number;
    islandId?: string;
  }): Promise<{
    activity: Activity;
    adeDecision: any;
    reviewAssignmentId?: string;
    cycleContext?: CycleContextDto;
    preferredModality: string | null;
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

    // [NEW] 1.5 Auto-detect cycle context if not explicitly provided
    let cycleContext: CycleContextDto | null = null;
    if (context?.cycleNumber && context?.islandId) {
      // Explicit cycle context provided
      try {
        const cycle = await this.cycleTrackingRepo.findOne({
          where: {
            student_id: userId,
            island_id: context.islandId,
            cycle_number: context.cycleNumber,
          },
        });
        if (cycle) {
          cycleContext = {
            cycleNumber: cycle.cycle_number,
            islandId: cycle.island_id,
            skillFocus: cycle.skill_focus,
            currentPosition: cycle.current_position,
            isActive: cycle.status === 'active',
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to load explicit cycle context: ${err?.message}`);
      }
    } else {
      // Auto-detect active cycle for this student/island
      try {
        const activeCycle = await this.cycleTrackingRepo.findOne({
          where: {
            student_id: userId,
            status: 'active',
          },
          order: { updated_at: 'DESC' },
        });
        if (activeCycle) {
          cycleContext = {
            cycleNumber: activeCycle.cycle_number,
            islandId: activeCycle.island_id,
            skillFocus: activeCycle.skill_focus,
            currentPosition: activeCycle.current_position,
            isActive: true,
          };
        } else if (context?.islandId) {
          // No active cycle found; auto-initialize if in an island
          this.logger.log(
            `Auto-initializing cycles for student ${userId} on island ${context.islandId}`,
          );
          try {
            await this.cycleInitializationService.initializeStudentCyclesForIsland(
              userId,
              context.islandId,
            );
            // Re-fetch first active cycle
            const firstCycle = await this.cycleTrackingRepo.findOne({
              where: {
                student_id: userId,
                island_id: context.islandId,
                status: 'active',
              },
              order: { cycle_number: 'ASC' },
            });
            if (firstCycle) {
              cycleContext = {
                cycleNumber: firstCycle.cycle_number,
                islandId: firstCycle.island_id,
                skillFocus: firstCycle.skill_focus,
                currentPosition: firstCycle.current_position,
                isActive: true,
              };
              this.logger.log(
                `Auto-initialized ${firstCycle.cycle_number} cycles; starting cycle ${firstCycle.cycle_number}`,
              );
            }
          } catch (initErr: any) {
            this.logger.warn(`Failed to auto-initialize cycles: ${initErr?.message}`);
          }
        }
      } catch (err: any) {
        this.logger.debug(`Failed to auto-detect cycle context: ${err?.message}`);
      }
    }

    // [NEW] 2. Check for active review assignment (has priority over cycle)
    // Review can interrupt cycle, but we preserve cycle context for resuming later
    let reviewAssignmentId: string | undefined;
    let reviewActivity: Activity | null = null;
    if (this.reviewOrchestrationService) {
      try {
        const activeReview = await this.reviewOrchestrationService.getNextReviewActivity(userId);
        if (activeReview) {
          reviewAssignmentId = activeReview.reviewAssignmentId;
          reviewActivity = activeReview.activity;
          this.logger.log(
            `Review assigned for user ${userId}: ${reviewActivity?.id} (type: ${activeReview.reviewType})`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`Failed to check active review: ${err?.message}`);
        // Continue with normal activity selection if review check fails
      }
    }

    // [DECISION] If review exists, return it immediately (review has priority)
    // Cycle context is preserved but not used for selection
    if (reviewActivity && reviewAssignmentId) {
      return {
        activity: await this.attachSemanticContract(reviewActivity),
        adeDecision: this.recommendationExplanationService.toChildDecision(
          { id: 'review' } as any,
          { selectedActivityId: reviewActivity.id, selectedActivityType: reviewActivity.type },
        ),
        reviewAssignmentId,
        cycleContext: cycleContext || undefined,
        preferredModality: (profile?.uiPreferences?.preferredModality as string | undefined) ?? null,
      };
    }

    // 3. Determine target skill based on cycle context
    // If in active cycle, skill_focus is FORCED (not overridable)
    // If not in cycle, use provided skill or pick preferred skill
    const targetSkill = cycleContext?.isActive
      ? cycleContext.skillFocus
      : (context?.targetSkillCode ?? this.pickPreferredSkill(profile?.uiPreferences, await this.getRecentAttempts(userId, 20)));

    // 4. Call ADE to decide (with cycle context)
    let adeDecision: any;
    try {
      const recentAttempts = await this.getRecentAttempts(userId, 20);
      adeDecision = await this.adeService.decide({
        userId,
        profile,
        recentAttempts,
        sessionId: context?.sessionId,
        targetSkillCode: targetSkill,
        cycleContext: cycleContext ? {
          cycleNumber: cycleContext.cycleNumber,
          islandId: cycleContext.islandId,
          skillFocus: cycleContext.skillFocus,
          current_position: cycleContext.currentPosition,
        } : undefined,
        recentSkips: await this.recentSkipCount(userId),
      });
    } catch (adeErr: any) {
      this.logger.error(`ADE failed: ${adeErr?.message}`, adeErr?.stack);
      const fallback = await this.selectFallbackActivity(userId, context?.excludedActivityId);
      if (!fallback) throw new Error('No activities available');
      return {
        activity: await this.attachSemanticContract(fallback),
        adeDecision: null,
        cycleContext: cycleContext || undefined,
        preferredModality: null,
      };
    }

    // 5. Find matching activity
    let activity: Activity;
    try {
      const selection = await this.findMatchingActivity(
        adeDecision,
        profile,
        context?.excludedActivityId,
        cycleContext || undefined,
      );
      activity = selection.activity;
      await this.persistSelection(adeDecision, selection);
      this.logSelectionSequence(userId, selection);
    } catch (matchErr: any) {
      this.logger.error(`findMatchingActivity failed: ${matchErr?.message}`);
      const fallback = await this.selectFallbackActivity(userId, context?.excludedActivityId);
      if (!fallback) throw new Error('No activities available');
      activity = fallback;
    }

    this.logger.log(
      `Next activity for user ${userId}: ${activity.id} (skill: ${targetSkill}, cycle: ${cycleContext?.isActive ? `${cycleContext.cycleNumber}/${cycleContext.currentPosition}` : 'none'})`,
    );

    return {
      activity: await this.attachSemanticContract(activity),
      adeDecision: this.recommendationExplanationService.toChildDecision(
        adeDecision,
        { selectedActivityId: activity.id, selectedActivityType: activity.type },
      ),
      reviewAssignmentId,
      cycleContext: cycleContext || undefined,
      preferredModality: (profile?.uiPreferences?.preferredModality as string | undefined) ?? null,
    };
  }

  private logSelectionSequence(userId: string, selection: ActivitySelectionResult): void {
    const ranked = selection.ranking.candidates.slice(0, 5);
    const selected = ranked.find((candidate) => candidate.activityId === selection.activity.id) ??
      selection.ranking.candidates[0];
    const topStructures = ranked.map((candidate) => candidate.structureId ?? 'n/a');
    const topTypes = ranked.map((candidate) => candidate.activityType);
    const topNiches = ranked.map((candidate) => candidate.bnccSkills?.[0] ?? 'n/a');
    const history = selection.ranking.evidenceUsed?.recentActivityIds?.slice(-10) ?? [];
    const historySummary = history.length ? history.join(' > ') : 'none';
    const repeatedStructure = ranked.filter((candidate) => candidate.structureId === selected?.structureId).length > 1;
    const repeatedType = ranked.filter((candidate) => candidate.activityType === selected?.activityType).length > 1;
    const selectedCandidate = selection.ranking.candidates.find((candidate) => candidate.activityId === selection.activity.id);
    this.logger.log(
      `[sequence] user=${userId} selected=${selection.activity.id} ` +
      `structure=${selected?.structureId ?? 'n/a'} type=${selected?.activityType ?? 'n/a'} ` +
      `repeatedStructure=${repeatedStructure} repeatedType=${repeatedType} ` +
      `topStructures=${topStructures.join(',')} topTypes=${topTypes.join(',')} topNiches=${topNiches.join(',')} ` +
      `topScores=${ranked.map((candidate) => candidate.finalScore.toFixed(3)).join(',')} ` +
      `learningNeed=${selectedCandidate?.learningNeed?.toFixed(3) ?? 'n/a'} ` +
      `challengeFit=${selectedCandidate?.challengeFit?.toFixed(3) ?? 'n/a'} ` +
      `interactionFit=${selectedCandidate?.interactionFit?.toFixed(3) ?? 'n/a'} ` +
      `semanticFit=${selectedCandidate?.semanticFit?.toFixed(3) ?? 'n/a'} ` +
      `novelty=${selectedCandidate?.novelty?.toFixed(3) ?? 'n/a'} ` +
      `rejectionRisk=${selectedCandidate?.rejectionRisk?.toFixed(3) ?? 'n/a'} ` +
      `progressDerivative=${selectedCandidate?.progressDerivative?.toFixed(3) ?? 'n/a'} ` +
      `performanceIntegral=${selectedCandidate?.performanceIntegral?.toFixed(3) ?? 'n/a'} ` +
      `dominanceNormalization=${selectedCandidate?.dominanceNormalization?.toFixed(3) ?? 'n/a'} ` +
      `recencyPenalty=${selectedCandidate?.recencyPenalty?.toFixed(3) ?? 'n/a'} ` +
      `blockWindow=10 recent=${historySummary}`,
    );
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

    // [INTEGRATION 3C-FINAL]: Validate island and derive authoritative cycle before persisting
    const validatedIslandCycle = await this.islandCycleValidator.validateAndResolveIslandCycle(
      activity,
      userId,
      dto.islandId,
      dto.cycleNumber,
    );

    // Save attempt
    // [INTEGRATION 3B.2]: Propagate reviewAssignmentId for longitudinal tracking
    const attempt = this.attemptRepo.create({
      userId,
      activityId: dto.activityId,
      sessionId: dto.sessionId,
      ...(dto.reviewAssignmentId && { reviewAssignmentId: dto.reviewAssignmentId }),
      isCorrect,
      score,
      timeSpentSeconds: dto.timeSpentSeconds,
      hintsUsed: dto.hintsUsed || 0,
      interactionSignals: dto.interactionSignals,
      adeDecisionContext: dto.adeDecisionContext,
      researchTrace: {
        answer: this.researchAnswer(dto.answer),
        primaryBnccSkill: activity.skillWeights?.find((skill) => skill.role === 'primary')?.code ?? activity.bnccSkills?.[0] ?? null,
        secondaryBnccSkills: activity.bnccSkills?.filter((code) => code !== (activity.skillWeights?.find((skill) => skill.role === 'primary')?.code ?? activity.bnccSkills?.[0])) ?? [],
        difficulty: activity.difficulty,
        previousDifficulty: dto.previousDifficulty ?? null,
        format: activity.type,
        presentedExercise: {
          title: activity.title,
          structureId: activity.content?.semantic?.structureId ?? null,
          skillWeights: activity.skillWeights ?? null,
        },
        recommendationId: dto.recommendationId ?? dto.adeDecisionContext?.decisionId ?? null,
        firstInteractionMs: dto.firstInteractionMs ?? null,
        responseTimeMs: dto.responseTimeMs ?? null,
        totalTimeMs: dto.totalTimeMs ?? null,
        // [INTEGRATION 3C-FINAL]: Persist validated island/cycle context for checkpoint scope
        islandId: validatedIslandCycle.islandId,
        cycleNumber: validatedIslandCycle.cycleNumber,
      },
    });

    await this.attemptRepo.save(attempt);

    // Learning analytics is best-effort and must not delay attempt processing.
    void this.trackAnswerEvents(userId, dto, activity, isCorrect);
    const masteryUpdate = this.updateMasteryFromAttempt(userId, activity, isCorrect, attempt);

    // Publish Kafka event (async, non-blocking)
    this.kafkaProducer.publishActivityEvent({
      eventId: `activity-${attempt.id}`,
      eventType: isCorrect ? 'ACTIVITY_COMPLETED' : 'ANSWER_SUBMITTED',
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
      const recentAttempts = await this.getRecentAttempts(userId, 20);
      adeDecision = await Promise.race([
        this.adeService.decide({
          userId,
          profile,
          recentAttempts,
          sessionId: dto.sessionId,
          targetSkillCode: this.pickPreferredSkill(profile?.uiPreferences, recentAttempts),
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
      this.logger.error(`Next activity fetch failed: ${err?.message}. Using cooldown fallback.`, err?.stack);
      try {
        const fallbacks = await this.selectFallbackActivity(userId, dto.activityId);
        if (fallbacks) {
          nextActivity = fallbacks;
          this.logger.log(`Fallback activity selected: ${fallbacks.id}`);
        } else {
          this.logger.warn(`No fallback activity available for user ${userId}`);
        }
      } catch (fallbackErr: any) {
        this.logger.error(`Fallback activity selection also failed: ${fallbackErr?.message}`);
      }
    }

    if (nextActivity) {
      nextActivity = await this.attachSemanticContract(nextActivity);
    }

    await masteryUpdate;
    attempt.researchTrace = {
      ...attempt.researchTrace,
      nextDifficulty: nextActivity?.difficulty ?? null,
      nextRecommendationId: adeDecision?.id ?? null,
    };
    await this.attemptRepo.save(attempt);

    // [INTEGRATION 3C]: Automatic review completion after BKT
    // If this attempt is part of a review assignment, complete the review
    if (dto.reviewAssignmentId && this.reviewOrchestrationService) {
      try {
        // [INTEGRATION 3C]: Validate assignment/activity/student match before completion
        // This prevents mismatched reviewAssignmentId from creating false research data
        void this.reviewOrchestrationService.validateAndCompleteReviewActivity(
          dto.reviewAssignmentId,
          attempt.id,
          userId,
          dto.activityId,
        ).catch((err: any) => {
          this.logger.error(
            `Review completion failed for assignment ${dto.reviewAssignmentId}: ${err?.message}`,
          );
          // Do not fail the attempt submission if review completion fails
        });
      } catch (err: any) {
        this.logger.error(
          `Review completion error for assignment ${dto.reviewAssignmentId}: ${err?.message}`,
        );
        // Non-blocking — attempt already persisted successfully
      }
    }

    // [NEW] Record cycle progression if this activity is part of an active cycle
    if (dto.cycleNumber && dto.islandId && this.cycleManagementService) {
      try {
        void this.cycleManagementService.completeExercise(
          userId,
          dto.islandId,
          dto.cycleNumber,
          isCorrect ? 1.0 : 0.0, // Score: 1.0 for correct, 0.0 for incorrect
        ).catch((err: any) => {
          this.logger.error(
            `Cycle progression failed for cycle ${dto.cycleNumber}/${dto.islandId}: ${err?.message}`,
          );
          // Do not fail the attempt submission if cycle progression fails
        });
      } catch (err: any) {
        this.logger.error(`Cycle progression error: ${err?.message}`);
        // Non-blocking — attempt already persisted successfully
      }
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

  private researchAnswer(answer: unknown): number | boolean | string | number[] | null {
    if (typeof answer === 'number' && Number.isFinite(answer)) return answer;
    if (typeof answer === 'boolean') return answer;
    if (typeof answer === 'string') return answer.length <= 40 && /^[0-9 +\-.,=<>]*$/.test(answer) ? answer : null;
    if (Array.isArray(answer) && answer.length <= 20 && answer.every((item) => typeof item === 'number' && Number.isFinite(item))) return answer;
    return null;
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
      const isExit = dto.eventType === LearningEventType.ACTIVITY_ABANDONED;
      const event = await this.learningEventService.track({
        studentId: userId,
        sessionId: dto.sessionId,
        eventType: dto.eventType,
        timestamp: new Date(),
        activityId,
        bnccSkillId,
        recommendationId: dto.recommendationId ?? null,
        hintsUsed: isSkip ? dto.hintsBeforeSkip ?? null : isExit ? dto.hintsBeforeExit ?? null : null,
        metadata: isSkip ? {
          timeBeforeSkipMs: dto.timeBeforeSkipMs ?? null,
          attemptsBeforeSkip: dto.attemptsBeforeSkip ?? null,
          hintsBeforeSkip: dto.hintsBeforeSkip ?? null,
          changeRequested: dto.changeRequested ?? false,
        } : isExit ? {
          timeBeforeExitMs: dto.timeBeforeExitMs ?? null,
          attemptsBeforeExit: dto.attemptsBeforeExit ?? null,
          hintsBeforeExit: dto.hintsBeforeExit ?? null,
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

  /** Maps the child profile's free-text asdSupportLevel ('mild'/'moderate'/
   * 'strong') to the 1-5 numeric scale expected by the ADE engine's
   * teaSupportLevel preference (1=minimal support needed, 5=maximum). */
  private mapAsdSupportLevelToNumeric(asdSupportLevel: string | undefined): number | undefined {
    switch (asdSupportLevel) {
      case 'mild':
        return 2;
      case 'moderate':
        return 3;
      case 'strong':
        return 4;
      default:
        return undefined;
    }
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
      if (!isCorrect) return;
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
    attempt: ActivityAttempt,
  ): Promise<void> {
    const skillCode = activity.bnccSkills?.[0];
    if (!skillCode) return;

    try {
      const skillId = await this.resolveBnccSkillId(activity);
      if (!skillId) return;
      const masteryBefore = await this.knowledgeTracingService.getMasteryBySkillCode(studentId, skillCode);
      const state = await this.knowledgeTracingService.observe({
        studentId,
        skillId,
        skillCode,
        correct,
      });
      attempt.researchTrace = {
        ...attempt.researchTrace,
        masteryBefore,
        masteryAfter: state.masteryProbability,
      };
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

    // Show each activity ONLY on its primary BNCC skill to prevent repetition within islands.
    // Use skillWeights role='primary' to determine primary skill, fallback to first bnccSkill.
    const bySkill: Record<string, any[]> = {};
    allActivities.forEach((act) => {
      // Determine primary skill from skillWeights or bnccSkills
      let primarySkill: string | null = null;
      if (act.skillWeights && act.skillWeights.length > 0) {
        const primary = (act.skillWeights as any[]).find((sw: any) => sw.role === 'primary');
        primarySkill = primary?.code ?? null;
      }
      if (!primarySkill && act.bnccSkills && act.bnccSkills.length > 0) {
        primarySkill = act.bnccSkills[0];
      }
      const skill = primarySkill ?? 'Exploracao';

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

  /**
   * Get islands with their activities for the learning map
   * [PROPOSTA CONTA COMIGO] Islands provide structured learning paths
   */
  async getIslandsWithActivities(userId: string): Promise<any> {
    const recentAttempts = await this.getRecentAttempts(userId, 50);
    const completedActivityIds = new Set(
      recentAttempts.filter((a) => a.isCorrect).map((a) => a.activityId)
    );

    // [PROPOSTA CONTA COMIGO] Get the next recommended activity
    // Only ONE activity should be marked as recommended, not all
    let recommendedActivityId: string | null = null;
    try {
      const lastAttempt = recentAttempts[0];
      if (lastAttempt) {
        if (!lastAttempt.isCorrect) {
          // If last attempt was incorrect, recommend trying again
          recommendedActivityId = lastAttempt.activityId;
        } else if (lastAttempt.islandId) {
          // If last attempt was correct, get the next activity in the island
          // Find the current sequence position from the mapping
          const currentMapping = await this.islandActivityMappingRepo.findOne({
            where: {
              activityId: lastAttempt.activityId,
              islandId: lastAttempt.islandId,
              isActive: true,
            },
          });
          if (currentMapping) {
            const nextMapping = await this.islandActivityMappingRepo.findOne({
              where: {
                islandId: lastAttempt.islandId,
                sequenceInIsland: currentMapping.sequenceInIsland + 1,
                isActive: true,
              },
            });
            if (nextMapping) {
              recommendedActivityId = nextMapping.activityId;
            }
          }
        }
      } else {
        // [PROPOSTA CONTA COMIGO] If no attempts yet, recommend first activity of first island
        // This ensures new users always see at least one "TitIA recomenda" badge
        const firstIsland = await this.islandRepo.findOne({
          where: { isActive: true },
          order: { sequenceOrder: 'ASC' },
        });
        if (firstIsland) {
          const firstMapping = await this.islandActivityMappingRepo.findOne({
            where: {
              islandId: firstIsland.islandId,
              sequenceInIsland: 1,
              isActive: true,
            },
          });
          if (firstMapping) {
            recommendedActivityId = firstMapping.activityId;
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to get next recommended activity: ${err?.message ?? 'unknown error'}`);
    }

    // Fetch all active islands ordered by sequence
    const islands = await this.islandRepo.find({
      where: { isActive: true },
      order: { sequenceOrder: 'ASC' },
    });

    // For each island, fetch its activities
    const islandsWithActivities = await Promise.all(
      islands.map(async (island) => {
        const mappings = await this.islandActivityMappingRepo.find({
          where: { islandId: island.islandId, isActive: true },
          order: { sequenceInIsland: 'ASC' },
        });

        const activities = await Promise.all(
          mappings.map(async (mapping) => {
            const activity = await this.activityRepo.findOne({
              where: { id: mapping.activityId },
            });
            if (!activity) return null;

            return {
              id: activity.id,
              title: mapping.customTitle || activity.title,
              type: activity.type,
              difficulty: mapping.difficulty || activity.difficulty,
              modality: mapping.modality,
              completed: completedActivityIds.has(activity.id),
              // [PROPOSTA CONTA COMIGO] Only mark ONE activity as recommended
              recommended: activity.id === recommendedActivityId,
              bnccSkills: activity.bnccSkills,
              scaffolding: mapping.scaffolding,
              sequenceInIsland: mapping.sequenceInIsland,
              // [PROPOSTA CONTA COMIGO] Include full activity content for frontend rendering
              content: activity.content,
              accessibility: activity.accessibility,
              targetModalities: activity.targetModalities,
              pointsReward: activity.pointsReward,
            };
          })
        );

        const validActivities = activities.filter((a) => a !== null);
        const completedCount = validActivities.filter((a) => a.completed).length;

        // [PROPOSTA CONTA COMIGO] Sequential unlock within an island:
        // activity N is locked until activity N-1 (by sequenceInIsland) is completed.
        // The first activity of an island is always unlocked so the child always has
        // somewhere to start.
        const sequencedActivities = validActivities.map((activity, index) => ({
          ...activity,
          locked: index > 0 && !validActivities[index - 1].completed,
        }));

        return {
          islandId: island.islandId,
          name: island.name,
          description: island.description,
          theme: island.theme,
          arasaacPictogramIds: island.arasaacPictogramIds,
          bnccSkills: island.bnccSkills,
          sequenceOrder: island.sequenceOrder,
          totalActivities: sequencedActivities.length,
          completedCount,
          activities: sequencedActivities,
        };
      })
    );

    // [PROPOSTA CONTA COMIGO] Sequential unlock across islands:
    // island N+1 is locked until island N is 100% completed. This gives the child
    // (and the parent/professional watching the "ciclos" view) a clear, single path:
    // finish every exercise in an island before the next one opens up.
    const islandsWithLocks = islandsWithActivities.map((island, index) => {
      const previousIsland = index > 0 ? islandsWithActivities[index - 1] : null;
      const previousIslandCompleted =
        !previousIsland ||
        (previousIsland.totalActivities > 0 &&
          previousIsland.completedCount >= previousIsland.totalActivities);

      return {
        ...island,
        locked: index > 0 && !previousIslandCompleted,
      };
    });

    const totalCompleted = islandsWithLocks.reduce(
      (sum, island) => sum + island.completedCount,
      0
    );
    const totalActivities = islandsWithLocks.reduce(
      (sum, island) => sum + island.totalActivities,
      0
    );

    return {
      islands: islandsWithLocks,
      completedTotal: totalCompleted,
      totalActivities,
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
    cycleContext?: CycleContextDto,
  ): Promise<ActivitySelectionResult> {
    const storedActivities = (await this.activityRepo.find({ where: { isActive: true } }))
      .filter((activity) => activity.id !== excludedActivityId);
    if (storedActivities.length === 0) throw new Error('No activities available');

    const activities = await Promise.all(
      storedActivities.map((activity) => this.attachSemanticContract(activity)),
    );
    const [recentAttempts, rejectedActivityIds] = await Promise.all([
      this.getRecentAttempts(adeDecision.userId, 20),
      this.learningEventService.getRecentSkippedActivityIds(adeDecision.userId, 20),
    ]);
    const masteryBySkillCode = typeof this.knowledgeTracingService.getMasteryMapBySkillCode === 'function'
      ? await this.knowledgeTracingService.getMasteryMapBySkillCode(adeDecision.userId).catch(() => ({}))
      : {};
    const preferences = profile?.uiPreferences ?? {};
    const eligibleActivities = activities.filter((activity) =>
      (typeof this.ontologyService?.isActivityPrerequisiteSatisfied !== 'function' ||
        this.ontologyService.isActivityPrerequisiteSatisfied(
          activity.prerequisiteSkillCode, masteryBySkillCode)) &&
      this.matchesExperienceRestrictions(activity, preferences));
    if (!eligibleActivities.length) throw new Error('No activity satisfies known prerequisites');
    const strategy = await this.planLearningStrategy(adeDecision, eligibleActivities, recentAttempts);
    
    // [PROPOSTA CONTA COMIGO] Filter by recommended island first if available
    let islandCandidates = eligibleActivities;
    if (adeDecision.recommendedIslandId) {
      // Get activities mapped to the recommended island
      const islandMappings = await this.islandActivityMappingRepo.find({
        where: { islandId: adeDecision.recommendedIslandId, isActive: true },
      });
      const islandActivityIds = new Set(islandMappings.map((m) => m.activityId));
      const islandActivities = eligibleActivities.filter((activity) =>
        islandActivityIds.has(activity.id),
      );
      if (islandActivities.length > 0) {
        islandCandidates = islandActivities;
      }
    }
    
    const sameSkill = islandCandidates.filter((activity) =>
      activity.bnccSkills?.includes(adeDecision.recommendedBnccSkill));
    const skillCandidates = sameSkill.length ? sameSkill : islandCandidates;
    const legacyCandidates = skillCandidates.filter((activity) =>
      this.matchesLegacyRecommendation(activity, adeDecision),
    );
    const recentIds = [...rejectedActivityIds, ...recentAttempts.map((attempt) => attempt.activityId)];

    if (!this.ontologyService || !this.runtimeSemanticAdapter || !this.hybridRecommendationService) {
      const candidates = this.cooldown(this.preferExperienceCandidates(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, preferences), activities, recentIds);
      const fallbackReason = 'Formal semantic or hybrid ranking services are unavailable; legacy selection was used';
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        activity,
        semanticTrace: this.unavailableSemanticTrace(
          adeDecision,
          activities,
          fallbackReason,
        ),
        ranking: { ...this.fallbackRanking(activity.id, candidates, fallbackReason), selectionStrategy: strategy },
      };
    }

    const observedLearnerEvidence = {
      ...(profile?.ontologyInstanceData || {}),
      // Map profile strengths/weaknesses to evidence for hybrid recommendation
      ...(profile?.strengths?.visual && { visualstrength: true }),
      ...(profile?.strengths?.auditive && { auditivestrength: true }),
      ...(profile?.strengths?.motor && { motorstrength: true }),
      ...(profile?.strengths?.logical && { logicalstrength: true }),
      ...(profile?.strengths?.sensory && { sensorystrength: true }),
      ...(profile?.weaknesses?.visual && { visualweakness: true }),
      ...(profile?.weaknesses?.auditive && { auditiveweakness: true }),
      ...(profile?.weaknesses?.motor && { motorweakness: true }),
      ...(profile?.weaknesses?.logical && { logicalweakness: true }),
      ...(profile?.weaknesses?.sensory && { sensoryweakness: true }),
    };

    const facts = this.runtimeSemanticAdapter.materialize({
      studentId: adeDecision.userId,
      targetSkill: adeDecision.recommendedBnccSkill,
      activities,
      masteryProbability: adeDecision.xaiLog?.mlPredictions?.masteryProbability,
      recentAccuracy: adeDecision.inputSnapshot?.recentAccuracy,
      observedLearnerEvidence,
      masteryBySkillCode,
    });
    const semanticResult = this.ontologyService.getValidActivityCandidates(facts);
    const validIds = new Set(semanticResult.validCandidateIds);
    const formallyValid = eligibleActivities.filter((activity) => validIds.has(activity.id));

    if (semanticResult.trace.fallbackUsed) {
      const candidates = this.cooldown(this.preferExperienceCandidates(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, preferences), activities, recentIds);
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        activity,
        semanticTrace: semanticResult.trace,
        ranking: { ...this.fallbackRanking(
          activity.id,
          candidates,
          semanticResult.trace.fallbackReason ?? 'Semantic candidate generation required fallback',
          semanticResult.trace.ontologyVersion,
        ), selectionStrategy: strategy },
      };
    }

    const curriculumCandidates = this.preferExperienceCandidates(formallyValid, preferences);
    const manualDifficulty = preferences.adaptiveDifficulty === false ? preferences.manualDifficulty : null;
    const matchingLevel = curriculumCandidates.filter((activity) =>
      activity.difficulty === (manualDifficulty ?? adeDecision.recommendedDifficulty));
    const rankedCandidates = this.cooldown(
      matchingLevel.length ? matchingLevel : curriculumCandidates, activities, recentIds);
    const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
    
    // [CYCLE INTEGRATION] Pass cycle context to ranking service
    const ranking = this.hybridRecommendationService.rank({
      candidates: rankedCandidates,
      masteryProbability: facts.mastery.probability,
      semanticTrace: semanticResult.trace,
      recentActivityIds: recentAttempts.map((attempt) => attempt.activityId),
      recentlyRejectedActivityIds: rejectedActivityIds,
      observedEvidenceTypes: facts.observedEvidenceTypes,
      recentActivities: recentAttempts.map((attempt) => ({
        activityId: attempt.activityId,
        type: attempt.activity?.type,
        structureId: attempt.activity?.content?.semantic?.structureId,
        bnccSkills: attempt.activity?.bnccSkills,
        representation: activitiesById.get(attempt.activityId)?.representation,
        isCorrect: attempt.isCorrect,
        timeSpentSeconds: attempt.timeSpentSeconds,
      })),
      preferences: {
        ...profile?.uiPreferences,
        // [ADE year-fit bridge] yearLevelFit/teaSupportFit were already
        // implemented and weighted in the ranking engine, but nothing ever
        // passed the student's real schoolYear/asdSupportLevel through, so
        // both factors were always neutral. Wire the real profile values in.
        yearLevel: profile?.schoolYear || undefined,
        teaSupportLevel: this.mapAsdSupportLevelToNumeric(profile?.asdSupportLevel),
      },
      // Pass cycle context for skill-focus filtering
      skillFocus: cycleContext?.isActive ? cycleContext.skillFocus : undefined,
    });
    ranking.selectionStrategy = strategy;
    const selected = rankedCandidates.find((activity) => activity.id === ranking.selectedActivityId);
    if (!selected) {
      const candidates = this.cooldown(this.preferExperienceCandidates(legacyCandidates.length > 0 ? legacyCandidates : skillCandidates, preferences), activities, recentIds);
      const activity = candidates[Math.floor(Math.random() * candidates.length)];
      const fallbackReason = ranking.fallbackReason ?? 'Hybrid ranking did not select a valid candidate';
      return {
        activity,
        semanticTrace: semanticResult.trace,
        ranking: { ...this.fallbackRanking(
          activity.id,
          candidates,
          fallbackReason,
          semanticResult.trace.ontologyVersion,
        ), selectionStrategy: strategy },
      };
    }

    return {
      activity: selected,
      semanticTrace: semanticResult.trace,
      ranking,
    };
  }

  private async planLearningStrategy(
    decision: any,
    activities: Activity[],
    recentAttempts: ActivityAttempt[],
  ): Promise<LearningSelectionStrategy> {
    const originalSkill = decision.recommendedBnccSkill;
    const strategy: LearningSelectionStrategy = {
      mode: 'consolidate', originalSkill, selectedSkill: originalSkill, evidence: [],
    };
    const skillAttempts = recentAttempts.filter((attempt) =>
      attempt.activity?.bnccSkills?.includes(originalSkill));
    const strategyWindow = this.experimentalCount('ADE_STRATEGY_RECENT_WINDOW', 5);
    const recent = skillAttempts.slice(0, strategyWindow);
    const slowThreshold = this.experimentalNumber('ADE_SLOW_RESPONSE_SECONDS', 120);
    const reinforceErrors = this.experimentalCount('ADE_REINFORCE_MIN_ERRORS', 2);
    const reinforceSkips = this.experimentalCount('ADE_REINFORCE_MIN_SKIPS', 2);
    const exploreSuccesses = this.experimentalCount('ADE_EXPLORE_MIN_INDEPENDENT_SUCCESSES', 3);
    const slowCorrect = recent[0]?.isCorrect &&
      Number(recent[0].timeSpentSeconds) > slowThreshold;
    const repeatedErrors = recent.slice(0, strategyWindow)
      .filter((attempt) => !attempt.isCorrect).length >= reinforceErrors;
    const repeatedSkips = (decision.inputSnapshot?.recentSkips ?? 0) >= reinforceSkips;
    const mastery = decision.xaiLog?.mlPredictions?.masteryProbability;
    const relations = typeof this.ontologyService?.getSkillRelations === 'function'
      ? this.ontologyService.getSkillRelations(originalSkill) : [];
    if (slowCorrect) {
      strategy.mode = 'reinforce';
      strategy.evidence.push(`correct_response_exceeded_${slowThreshold}_seconds`);
    } else if (repeatedErrors || repeatedSkips) {
      strategy.mode = 'reinforce';
      strategy.evidence.push(repeatedErrors
        ? `${reinforceErrors}_errors_in_recent_${strategyWindow}_attempts`
        : `${reinforceSkips}_recent_skips`);
      const prerequisite = relations.find((relation) => relation.relation === 'prerequisiteSkill' &&
        activities.some((activity) => activity.bnccSkills?.includes(relation.skillCode)));
      if (prerequisite && !decision.inputSnapshot?.targetSkillExplicit) {
        strategy.mode = 'review';
        strategy.relation = prerequisite;
      }
    } else if (!decision.inputSnapshot?.targetSkillExplicit &&
      !decision.inputSnapshot?.recentSkips &&
      typeof mastery === 'number' && mastery >= this.experimentalNumber('ADE_EXPLORE_MASTERY_THRESHOLD', 0.8) &&
      recent.length >= exploreSuccesses && recent.slice(0, exploreSuccesses).every((attempt) =>
        attempt.isCorrect && !attempt.hintsUsed &&
        Number(attempt.timeSpentSeconds) > 0 && Number(attempt.timeSpentSeconds) <= slowThreshold) &&
      new Set(recent.slice(0, exploreSuccesses).map((attempt) => attempt.activityId)).size === exploreSuccesses) {
      const related = relations.find((relation) => relation.relation === 'relatedSkill' &&
        activities.some((activity) => activity.bnccSkills?.includes(relation.skillCode)) &&
        !recentAttempts.slice(0, 5).some((attempt) =>
          attempt.activity?.bnccSkills?.includes(relation.skillCode)));
      if (related) {
        strategy.mode = 'explore';
        strategy.relation = related;
        strategy.evidence.push(`${exploreSuccesses}_recent_independent_successes_and_mastery`);
      } else {
        strategy.mode = 'challenge';
        strategy.evidence.push('stable_success_without_available_related_skill');
      }
    }
    if (strategy.relation) {
      strategy.selectedSkill = strategy.relation.skillCode;
      decision.recommendedBnccSkill = strategy.selectedSkill;
      decision.recommendedDifficulty = DifficultyLevel.EASY;
      decision.inputSnapshot ??= {};
      decision.xaiLog ??= { mlPredictions: {} };
      decision.xaiLog.mlPredictions ??= {};
      const selectedAttempts = recentAttempts.filter((attempt) =>
        attempt.activity?.bnccSkills?.includes(strategy.selectedSkill));
      decision.inputSnapshot.recentAccuracy = selectedAttempts.length
        ? selectedAttempts.filter((attempt) => attempt.isCorrect).length / selectedAttempts.length
        : null;
      try {
        const selectedMastery = await this.knowledgeTracingService.getMasteryBySkillCode(
          decision.userId, strategy.selectedSkill);
        decision.xaiLog.mlPredictions.masteryProbability = selectedMastery;
        decision.inputSnapshot.currentMastery = selectedMastery;
      } catch (error) {
        strategy.evidence.push('selected_skill_mastery_unavailable');
        decision.xaiLog.mlPredictions.masteryProbability = null;
        decision.inputSnapshot.currentMastery = null;
      }
    }
    decision.inputSnapshot = { ...decision.inputSnapshot, selectionStrategy: strategy };
    return strategy;
  }

  private experimentalNumber(key: string, fallback: number): number {
    const configured = Number(process.env[key]);
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }

  private experimentalCount(key: string, fallback: number): number {
    return Math.floor(this.experimentalNumber(key, fallback));
  }

  private cooldown(candidates: Activity[], catalog: Activity[], recentIds: string[]): Activity[] {
    if (!candidates.length) return candidates;
    const byId = new Map(catalog.map((activity) => [activity.id, activity]));
    const recent = recentIds.slice(0, 4).map((id) => byId.get(id)).filter((item): item is Activity => Boolean(item));
    const recentStructures = new Set(recent.map((item) => item.content?.semantic?.structureId ?? item.title));
    const recentItems = new Set(recent.map((item) => JSON.stringify(item.content?.items ?? item.content?.pictogramConceptIds ?? [])));
    const recentTypes = new Set(recent.slice(0, 2).map((item) => item.type));
    
    // [PROPOSTA CONTA COMIGO] Add island diversity to cooldown
    // Prefer activities from different islands to increase variety
    const recentIslandIds = new Set(recent.map((item) => item.islandId).filter(Boolean));
    
    const stages = [
      // Stage 1: Maximum diversity - different island, structure, items, AND type
      (item: Activity) => !recentIds.slice(0, 8).includes(item.id) &&
        !recentStructures.has(item.content?.semantic?.structureId ?? item.title) &&
        !recentItems.has(JSON.stringify(item.content?.items ?? item.content?.pictogramConceptIds ?? [])) &&
        !recentTypes.has(item.type) &&
        !recentIslandIds.has(item.islandId),
      // Stage 2: Different island and structure
      (item: Activity) => !recentIds.slice(0, 5).includes(item.id) &&
        !recentStructures.has(item.content?.semantic?.structureId ?? item.title) &&
        !recentIslandIds.has(item.islandId),
      // Stage 3: Different island
      (item: Activity) => !recentIds.slice(0, 2).includes(item.id) &&
        !recentIslandIds.has(item.islandId),
      // Stage 4: Just avoid recent (fallback)
      (item: Activity) => !recentIds.slice(0, 2).includes(item.id),
    ];
    for (const stage of stages) {
      const available = candidates.filter(stage);
      if (available.length) return available;
    }
    return candidates;
  }

  private async selectFallbackActivity(userId: string, excludedId?: string): Promise<Activity | null> {
    const profile = typeof this.usersService.getChildProfile === 'function'
      ? await this.usersService.getChildProfile(userId).catch(() => null)
      : null;
    const preferences = profile?.uiPreferences ?? {};
    const catalog = await this.activityRepo.find({ where: { isActive: true } });
    const masteryBySkillCode = typeof this.knowledgeTracingService.getMasteryMapBySkillCode === 'function'
      ? await this.knowledgeTracingService.getMasteryMapBySkillCode(userId).catch(() => ({}))
      : {};
    const candidates = catalog.filter((item) => item.id !== excludedId &&
      this.matchesExperienceRestrictions(item, preferences) &&
      (typeof this.ontologyService?.isActivityPrerequisiteSatisfied !== 'function' ||
        this.ontologyService.isActivityPrerequisiteSatisfied(
          item.prerequisiteSkillCode, masteryBySkillCode)));
    if (!candidates.length) return null;
    const [attempts, skipped] = await Promise.all([
      this.getRecentAttempts(userId, 20),
      this.learningEventService.getRecentSkippedActivityIds(userId, 20),
    ]);
    return this.cooldown(this.preferExperienceCandidates(candidates, preferences), catalog,
      [...skipped, ...attempts.map((attempt) => attempt.activityId)])[0] ?? null;
  }

  private matchesLegacyRecommendation(activity: Activity, adeDecision: any): boolean {
    const difficultyMatches = !adeDecision.recommendedDifficulty ||
      activity.difficulty === adeDecision.recommendedDifficulty;
    const modalityMatches = !adeDecision.recommendedModality ||
      activity.targetModalities?.includes(adeDecision.recommendedModality);
    return difficultyMatches && modalityMatches;
  }

  private matchesExperienceRestrictions(activity: Activity, preferences: NonNullable<ChildProfile['uiPreferences']>): boolean {
    if (preferences.disabledActivityTypes?.includes(activity.type)) return false;
    const maximum = preferences.maxSimultaneousElements;
    if (!Number.isInteger(maximum) || maximum! < 1) return true;
    return Math.max(activity.content?.items?.length ?? 0, activity.content?.options?.length ?? 0) <= maximum!;
  }

  private preferExperienceCandidates(activities: Activity[], preferences: NonNullable<ChildProfile['uiPreferences']>): Activity[] {
    let candidates = activities;
    if (preferences.adaptiveDifficulty === false && preferences.manualDifficulty) {
      const manual = candidates.filter((activity) => activity.difficulty === preferences.manualDifficulty);
      if (manual.length > 0) candidates = manual;
    }
    return candidates;
  }

  private pickPreferredSkill(preferences: ChildProfile['uiPreferences'] | null | undefined, recentAttempts: ActivityAttempt[]): string | undefined {
    const skills = preferences?.prioritizedBnccSkills;
    if (!Array.isArray(skills) || skills.length === 0) return undefined;
    const counts = new Map(skills.map((skill) => [skill, 0]));
    for (const attempt of recentAttempts) {
      for (const skill of attempt.activity?.bnccSkills ?? []) {
        if (counts.has(skill)) counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }
    return [...counts].sort((a, b) => a[1] - b[1])[0]?.[0];
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
      weights: { learning: 0, challenge: 0, interaction: 0, semantic: 0, novelty: 0, rejection: 0,
        sensory: 0, format: 0, repetition: 0, frustration: 0 },
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
