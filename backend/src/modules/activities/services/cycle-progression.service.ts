import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityAttempt } from '../entities/activity-attempt.entity';
import { LearningEvent, LearningEventType } from '../../learning-events/entities/learning-event.entity';

/**
 * Cycle Progression Service
 * [INTEGRATION 3C-FINAL]: Derives authoritative cycle from completed normal activities
 *
 * [PROPOSTA CONTA COMIGO]: Cycles organize learning progression within an island:
 * - Cycle 1: activities 1-10 (completed normal activities)
 * - Cycle 2: activities 11-20
 * - Cycle 3: activities 21-30
 * etc.
 *
 * [DECISÃO DE ENGENHARIA]: Cycle is derived from persisted completion evidence, not frontend input.
 * - Only COMPLETED NORMAL activities count (not review, not incorrect, not skipped, not abandoned)
 * - Cycle is independent per student + island
 * - Session changes do not reset island cycle progression
 * - Review attempts do not increment cycle progression
 */
@Injectable()
export class CycleProgressionService {
  // [PARÂMETRO EXPERIMENTAL]: Configurable cycle size (activities per cycle)
  private readonly CYCLE_SIZE = 10;

  constructor(
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepository: Repository<ActivityAttempt>,
    @InjectRepository(LearningEvent)
    private readonly eventRepository: Repository<LearningEvent>,
  ) {}

  /**
   * Derive authoritative cycle number for a student in an island
   *
   * [INTEGRATION 3C-FINAL]: Returns the current cycle based on completed normal activities
   * - Cycle 1: 1-10 completed normal activities
   * - Cycle 2: 11-20 completed normal activities
   * - etc.
   *
   * @param studentId - Student identifier
   * @param islandId - Island identifier (verified)
   * @returns Current cycle number (1-based)
   */
  async deriveCurrentCycle(
    studentId: string,
    islandId: string,
  ): Promise<number> {
    // [INTEGRATION 3C-FINAL]: Count completed normal activities in this island
    // Only count ACTIVITY_COMPLETED events (not review, not failed, not skipped, not abandoned)
    const completedNormalActivities = await this.countCompletedNormalActivitiesInIsland(
      studentId,
      islandId,
    );

    // [INTEGRATION 3C-FINAL]: Derive cycle from completion count
    // Cycle 1: 0-9 completed → next position 1-10
    // Cycle 2: 10-19 completed → next position 1-10
    // Cycle 3: 20-29 completed → next position 1-10
    const currentCycle = Math.floor(completedNormalActivities / this.CYCLE_SIZE) + 1;

    return currentCycle;
  }

  /**
   * Derive position within current cycle
   *
   * @param studentId - Student identifier
   * @param islandId - Island identifier (verified)
   * @returns Position within current cycle (1-10)
   */
  async deriveCurrentCyclePosition(
    studentId: string,
    islandId: string,
  ): Promise<number> {
    const completedNormalActivities = await this.countCompletedNormalActivitiesInIsland(
      studentId,
      islandId,
    );

    // [INTEGRATION 3C-FINAL]: Position is remainder within cycle size
    // 0-9 completed → position 1-10
    // 10-19 completed → position 1-10
    // 20-29 completed → position 1-10
    const positionInCycle = (completedNormalActivities % this.CYCLE_SIZE) + 1;

    return positionInCycle;
  }

  /**
   * Check if next activity will trigger cycle checkpoint
   *
   * @param studentId - Student identifier
   * @param islandId - Island identifier (verified)
   * @returns true if next completion will reach cycle boundary (position 10)
   */
  async willNextActivityTriggerCheckpoint(
    studentId: string,
    islandId: string,
  ): Promise<boolean> {
    const position = await this.deriveCurrentCyclePosition(studentId, islandId);
    // Checkpoint triggers when position reaches 10 (end of cycle)
    return position === this.CYCLE_SIZE;
  }

  /**
   * Count completed normal activities in an island
   *
   * [INTEGRATION 3C-FINAL]: Only counts ACTIVITY_COMPLETED events
   * - Excludes review attempts (identified by reviewAssignmentId)
   * - Excludes failed attempts (only ACTIVITY_COMPLETED counts)
   * - Excludes skipped activities (ACTIVITY_SKIPPED)
   * - Excludes abandoned activities (ACTIVITY_ABANDONED)
   *
   * @param studentId - Student identifier
   * @param islandId - Island identifier (verified)
   * @returns Count of completed normal activities
   */
  private async countCompletedNormalActivitiesInIsland(
    studentId: string,
    islandId: string,
  ): Promise<number> {
    // [INTEGRATION 3C-FINAL]: Query completed activities in this island
    // Only count ACTIVITY_COMPLETED events (successful completions)
    const completedEvents = await this.eventRepository.find({
      where: {
        studentId,
        eventType: LearningEventType.ACTIVITY_COMPLETED,
      },
    });

    // [INTEGRATION 3C-FINAL]: Filter by island and exclude review attempts
    let completedNormalCount = 0;

    for (const event of completedEvents) {
      // Check if activity belongs to this island
      const eventMetadata = event.metadata as Record<string, unknown> | null;
      if (eventMetadata?.islandId !== islandId) {
        continue;
      }

      // [INTEGRATION 3C-FINAL]: Exclude review attempts
      // Review attempts have reviewAssignmentId in metadata
      if (eventMetadata?.reviewAssignmentId) {
        continue;
      }

      completedNormalCount++;
    }

    return completedNormalCount;
  }

  /**
   * Get cycle size (for testing and configuration)
   */
  getCycleSize(): number {
    return this.CYCLE_SIZE;
  }
}
