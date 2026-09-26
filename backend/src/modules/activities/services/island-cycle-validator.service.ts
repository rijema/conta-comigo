import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IslandExerciseMapping } from '../entities/island-exercise-mapping.entity';
import { Activity } from '../entities/activity.entity';
import { CycleProgressionService } from './cycle-progression.service';

/**
 * Island/Cycle Validation Service
 * [INTEGRATION 3C-FINAL]: Validates island context and derives authoritative cycle
 * 
 * [PROPOSTA CONTA COMIGO]: The application organizes learning by:
 * - Island: thematic grouping of BNCC skills (AUTHORITATIVE via IslandExerciseMapping)
 * - Cycle: ordinal progression window of completed normal activities (AUTHORITATIVE via CycleProgressionService)
 * 
 * [DECISÃO DE ENGENHARIA]: Cycle is derived from persisted completion evidence, not frontend input.
 * - Only COMPLETED NORMAL activities count
 * - Cycle is independent per student + island
 * - Session changes do not reset island cycle progression
 * - Review attempts do not increment cycle progression
 * - Server-derived cycle cannot be overridden by client
 */
@Injectable()
export class IslandCycleValidatorService {
  constructor(
    @InjectRepository(IslandExerciseMapping)
    private islandMappingRepository: Repository<IslandExerciseMapping>,
    @Inject('CycleProgressionService')
    private cycleProgressionService: CycleProgressionService,
  ) {}

  /**
   * Validate island and derive authoritative cycle for an activity submission
   * 
   * [INTEGRATION 3C-FINAL]:
   * - islandId is VERIFIED against IslandExerciseMapping
   * - cycleNumber is DERIVED from completed normal activities (authoritative)
   * - Client-submitted cycleNumber is ignored (server-derived cycle is authoritative)
   * - Returns context that should be persisted in ActivityAttempt.researchTrace
   */
  async validateAndResolveIslandCycle(
    activity: Activity,
    studentId: string,
    submittedIslandId?: string,
    submittedCycleNumber?: number,
  ): Promise<{ islandId: string | null; cycleNumber: number | null }> {
    // [INTEGRATION 3C-FINAL]: If no island submitted, return null
    if (!submittedIslandId) {
      return { islandId: null, cycleNumber: null };
    }

    // [INTEGRATION 3C-FINAL]: Validate island exists and activity belongs to it
    const islandMapping = await this.islandMappingRepository.findOne({
      where: { islandId: submittedIslandId },
    });

    if (!islandMapping) {
      // Island doesn't exist — reject the context
      return { islandId: null, cycleNumber: null };
    }

    // [INTEGRATION 3C-FINAL]: Verify activity belongs to this island
    // Activity belongs to island if it has a primary BNCC skill in the island's skill list
    const activityPrimarySkill =
      activity.skillWeights?.find((s) => s.role === 'primary')?.code ||
      activity.bnccSkills?.[0];

    if (!activityPrimarySkill || !islandMapping.bnccSkills.includes(activityPrimarySkill)) {
      // Activity does not belong to submitted island — reject context
      return { islandId: null, cycleNumber: null };
    }

    // [INTEGRATION 3C-FINAL]: Island is VERIFIED
    // Derive authoritative cycle from completed normal activities
    // Client-submitted cycleNumber is ignored
    const authoritiveCycleNumber = await this.cycleProgressionService.deriveCurrentCycle(
      studentId,
      submittedIslandId,
    );

    return {
      islandId: submittedIslandId,
      cycleNumber: authoritiveCycleNumber,
    };
  }
}
