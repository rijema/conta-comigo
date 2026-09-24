import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LearningEvent, LearningEventType } from '../entities/learning-event.entity';
import { ReviewType } from '../entities/review-assignment.entity';

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
   */
  async detectCheckpointMilestone(studentId: string, islandId: string): Promise<CheckpointMilestone | null> {
    // Get activities completed in this island in current session
    const recentActivities = await this.eventRepository.find({
      where: {
        studentId,
        // Filter by island if available in metadata
      },
      order: { timestamp: 'DESC' },
      take: 20,
    });

    // Count completed activities
    const completedCount = recentActivities.filter((e) => e.eventType === LearningEventType.ACTIVITY_COMPLETED).length;

    // For now, trigger checkpoint after 10 activities (configurable)
    const checkpointThreshold = this.configService.get<number>('REVIEW_CHECKPOINT_ACTIVITY_THRESHOLD', 10);

    if (completedCount >= checkpointThreshold) {
      return {
        islandId,
        cycleNumber: 1, // TODO: extract from session metadata
        completedActivitiesCount: completedCount,
        totalActivitiesInCycle: checkpointThreshold,
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
