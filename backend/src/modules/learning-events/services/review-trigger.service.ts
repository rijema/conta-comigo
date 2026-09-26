import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LearningEvent, LearningEventType } from '../entities/learning-event.entity';
import { ReviewAssignment, ReviewType } from '../entities/review-assignment.entity';

export interface CheckpointMilestone {
  islandId: string;
  cycleNumber: number;
  completedActivitiesCount: number;
  totalActivitiesInCycle: number;
}

export interface SessionBoundary {
  isNewSession: boolean;
  sessionGapMinutes: number;
  lastActivityTimestamp: Date | null;
  currentSessionId: string;
}

@Injectable()
export class ReviewTriggerService {
  private readonly logger = new Logger(ReviewTriggerService.name);

  private readonly sessionGapThresholdMinutes: number;
  private readonly retentionHalfLifeDays: number;

  constructor(
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
    @InjectRepository(ReviewAssignment)
    private readonly assignmentRepository: Repository<ReviewAssignment>,
    private readonly configService: ConfigService,
  ) {
    this.sessionGapThresholdMinutes = this.configService.get<number>('REVIEW_SESSION_GAP_THRESHOLD_MINUTES', 60);
    this.retentionHalfLifeDays = this.configService.get<number>('REVIEW_RETENTION_HALF_LIFE_DAYS', 14);
  }

  /**
   * Detect if this is a new learning session (clinical encounter boundary)
   * NOT just a technical session ID change
   */
  async isNewLearningSession(studentId: string, currentSessionId: string): Promise<SessionBoundary> {
    // Get the last activity timestamp for this student
    const lastActivity = await this.eventRepository.findOne({
      where: { studentId },
      order: { timestamp: 'DESC' },
    });

    if (!lastActivity) {
      // First session ever
      return {
        isNewSession: true,
        sessionGapMinutes: Infinity,
        lastActivityTimestamp: null,
        currentSessionId,
      };
    }

    const now = new Date();
    const gapMinutes = (now.getTime() - lastActivity.timestamp.getTime()) / (1000 * 60);

    // New session if gap exceeds threshold
    const isNewSession = gapMinutes >= this.sessionGapThresholdMinutes;

    return {
      isNewSession,
      sessionGapMinutes: gapMinutes,
      lastActivityTimestamp: lastActivity.timestamp,
      currentSessionId,
    };
  }

  /**
   * Detect checkpoint milestone (end of island/cycle)
   * [INTEGRATION 3C-FINAL]: Uses authoritative cycle derived from completed normal activities
   */
  async detectCheckpointMilestone(
    studentId: string,
    islandId: string,
    currentSessionId: string,
  ): Promise<CheckpointMilestone | null> {
    // [INTEGRATION 3C-FINAL]: Count completed normal activities in this island
    // Only count ACTIVITY_COMPLETED events (not review, not failed, not skipped, not abandoned)
    const completedEvents = await this.eventRepository.find({
      where: {
        studentId,
        eventType: LearningEventType.ACTIVITY_COMPLETED,
      },
    });

    // [INTEGRATION 3C-FINAL]: Filter by island and exclude review attempts
    const CYCLE_SIZE = 10;
    let completedNormalCount = 0;

    for (const event of completedEvents) {
      const eventMetadata = event.metadata as Record<string, unknown> | null;
      // Only count activities from this island
      if (eventMetadata?.islandId !== islandId) {
        continue;
      }
      // Exclude review attempts
      if (eventMetadata?.reviewAssignmentId) {
        continue;
      }
      completedNormalCount++;
    }

    // [INTEGRATION 3C-FINAL]: Derive cycle and position from completion count
    // Cycle 1: 0-9 completed → next position 1-10
    // Cycle 2: 10-19 completed → next position 1-10
    // Checkpoint triggers when position = 10 (end of cycle)
    const currentCycle = Math.floor(completedNormalCount / CYCLE_SIZE) + 1;
    const positionInCycle = (completedNormalCount % CYCLE_SIZE) + 1;

    // [INTEGRATION 3C-FINAL]: Only trigger checkpoint if next activity will reach cycle boundary
    if (positionInCycle !== CYCLE_SIZE) {
      return null;
    }

    // [INTEGRATION 3C-FINAL]: Check if checkpoint already triggered for this cycle
    // to prevent duplicate triggers on refresh/reconnect
    const existingCheckpoint = await this.assignmentRepository.findOne({
      where: {
        studentId,
        // TODO: Add cycleNumber to ReviewAssignment to track per-cycle checkpoints
      },
    });

    if (!existingCheckpoint) {
      return {
        islandId,
        cycleNumber: currentCycle,
        completedActivitiesCount: completedNormalCount,
        totalActivitiesInCycle: CYCLE_SIZE,
      };
    }

    return null;
  }

  /**
   * Determine if retention review should be triggered
   */
  async shouldTriggerRetentionReview(studentId: string, sessionBoundary: SessionBoundary): Promise<boolean> {
    // Only trigger retention review if this is a genuinely new learning session
    if (!sessionBoundary.isNewSession) {
      return false;
    }

    // Check if there are skills that haven't been seen recently
    const skillsNeedingRetention = await this.getSkillsNeedingRetention(studentId);

    return skillsNeedingRetention.length > 0;
  }

  /**
   * Get skills that need retention review
   */
  async getSkillsNeedingRetention(studentId: string): Promise<string[]> {
    // Get all skills the student has interacted with
    const allEvents = await this.eventRepository.find({
      where: { studentId },
      order: { timestamp: 'DESC' },
    });

    const skillMap = new Map<string, Date>();

    // Track last exposure for each skill
    for (const event of allEvents) {
      if (event.bnccSkillId && !skillMap.has(event.bnccSkillId)) {
        skillMap.set(event.bnccSkillId, event.timestamp);
      }
    }

    const now = new Date();
    const skillsNeedingRetention: string[] = [];

    for (const [skillId, lastExposure] of skillMap.entries()) {
      const daysSinceExposure = (now.getTime() - lastExposure.getTime()) / (1000 * 60 * 60 * 24);

      // Trigger retention review if skill hasn't been seen in retention half-life
      if (daysSinceExposure >= this.retentionHalfLifeDays) {
        skillsNeedingRetention.push(skillId);
      }
    }

    return skillsNeedingRetention;
  }

  /**
   * Determine review type based on evidence
   */
  determineReviewType(masteryProbability: number, accuracy: number, daysSinceLastExposure: number): ReviewType {
    // REMEDIATION: low mastery or recent errors
    if (masteryProbability < 0.5 || accuracy < 0.7) {
      return ReviewType.REMEDIATION;
    }

    // GENERALIZATION: high accuracy, sufficient exposure
    if (accuracy > 0.8 && daysSinceLastExposure < 7) {
      return ReviewType.GENERALIZATION;
    }

    // RETENTION: mastered but not seen recently
    return ReviewType.RETENTION;
  }
}
