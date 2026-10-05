/**
 * Initialize Cycles for All Students
 *
 * Called after first login or via admin seeding.
 * Creates StudentCycleTracking + CycleExerciseAssignment for all students × all islands × all skills.
 *
 * This enables:
 * - Automatic cycle detection in getNextActivity()
 * - Cycle progression tracking
 * - UI to show "Ciclo 1/3: EF01MA03 - Comparação"
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentCycleTracking } from '../entities/student-cycle-tracking.entity';
import { CycleExerciseAssignment } from '../entities/cycle-exercise-assignment.entity';
import { Activity } from '../entities/activity.entity';
import { Island } from '../entities/island.entity';

@Injectable()
export class CycleInitializationService {
  private readonly logger = new Logger(CycleInitializationService.name);

  constructor(
    @InjectRepository(StudentCycleTracking)
    private readonly cycleRepo: Repository<StudentCycleTracking>,
    @InjectRepository(CycleExerciseAssignment)
    private readonly assignmentRepo: Repository<CycleExerciseAssignment>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Island)
    private readonly islandRepo: Repository<Island>,
  ) {}

  /**
   * Initialize cycles for a student on a specific island
   * Called on first activity selection in that island
   */
  async initializeStudentCyclesForIsland(
    studentId: string,
    islandId: string,
  ): Promise<void> {
    // [PROPOSTA CONTA COMIGO] Only consider the BNCC skills that actually
    // belong to this island (per the live `islands` catalog), instead of
    // every skill in the whole activity bank. Without this, every island
    // ended up with an identical set of cycles.
    const island = await this.islandRepo.findOne({ where: { islandId } });
    const islandSkills = island?.bnccSkills?.length ? new Set(island.bnccSkills) : null;

    const exercises = await this.activityRepo.find({
      where: { isActive: true },
    });

    // Group by primary skill, restricted to this island's skills when known
    const skillsInIsland = new Set<string>();
    exercises.forEach((e) => {
      const primarySkill = e.bnccSkills?.[0];
      if (!primarySkill) return;
      if (islandSkills && !islandSkills.has(primarySkill)) return;
      skillsInIsland.add(primarySkill);
    });

    this.logger.log(
      `Initializing cycles for student ${studentId} on island ${islandId}: ${skillsInIsland.size} skills`,
    );

    let cycleNumber = 1;

    for (const skill of Array.from(skillsInIsland).sort()) {
      // Check if cycle already exists
      const existing = await this.cycleRepo.findOne({
        where: {
          student_id: studentId,
          island_id: islandId,
          skill_focus: skill,
        },
      });

      if (existing) {
        this.logger.debug(
          `Cycle already exists for ${skill}, skipping initialization`,
        );
        continue;
      }

      // Create cycle
      const cycle = this.cycleRepo.create({
        student_id: studentId,
        island_id: islandId,
        cycle_number: cycleNumber,
        skill_focus: skill,
        current_position: 1,
        status: 'active',
        total_exercises: 10,
        exercises_completed_count: 0,
      });

      await this.cycleRepo.save(cycle);
      this.logger.log(
        `Created cycle ${cycleNumber} for ${skill} (${cycle.id})`,
      );

      // Get exercises for this skill, sorted by difficulty
      const skillExercises = exercises
        .filter((e) => e.bnccSkills?.includes(skill))
        .sort((a, b) => {
          const diffOrder = {
            very_easy: 0,
            easy: 1,
            medium: 2,
            hard: 3,
            very_hard: 4,
          };
          return (
            (diffOrder[a.difficulty as keyof typeof diffOrder] ?? 99) -
            (diffOrder[b.difficulty as keyof typeof diffOrder] ?? 99)
          );
        });

      // Create assignment slots (10 per cycle)
      for (let position = 1; position <= 10; position++) {
        const activityIndex = (position - 1) % skillExercises.length;
        const activity = skillExercises[activityIndex];

        if (!activity) {
          this.logger.warn(
            `No activity found for ${skill} position ${position}`,
          );
          continue;
        }

        const assignment = this.assignmentRepo.create({
          cycle_tracking_id: cycle.id,
          activity_id: activity.id,
          position_in_cycle: position,
          is_completed: false,
          student_score: null,
          completed_at: null,
        } as any);

        await this.assignmentRepo.save(assignment);
      }

      cycleNumber++;
    }

    this.logger.log(
      `Initialized ${cycleNumber - 1} cycles for student ${studentId} on island ${islandId}`,
    );
  }

  /**
   * Bulk initialize cycles for all students (admin operation)
   */
  async initializeAllStudentCycles(studentIds: string[]): Promise<void> {
    // [PROPOSTA CONTA COMIGO] Use the real, live island catalog instead of a
    // hardcoded list of island ids that never matched production data.
    const activeIslands = await this.islandRepo.find({
      where: { isActive: true },
      order: { sequenceOrder: 'ASC' },
    });
    const islands = activeIslands.map((i) => i.islandId);

    for (const studentId of studentIds) {
      for (const island of islands) {
        try {
          await this.initializeStudentCyclesForIsland(studentId, island);
        } catch (err) {
          this.logger.error(
            `Failed to initialize cycles for ${studentId}/${island}: ${err}`,
          );
        }
      }
    }
  }
}
