import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentCycleTracking } from '../entities/student-cycle-tracking.entity';
import { CycleExerciseAssignment } from '../entities/cycle-exercise-assignment.entity';
import { Activity } from '../entities/activity.entity';
import { HybridRecommendationService, HybridRankingResult } from '../../ade/hybrid-recommendation.service';
import { ExerciseParameters } from '../entities/exercise-parameters.entity';

export interface CycleState {
  cycle: StudentCycleTracking;
  currentPosition: number;
  totalExercises: number;
  status: string;
  nextExercise: Activity | null;
  allAssignments: CycleExerciseAssignment[];
}

@Injectable()
export class CycleManagementService {
  constructor(
    @InjectRepository(StudentCycleTracking)
    private cycleRepo: Repository<StudentCycleTracking>,

    @InjectRepository(CycleExerciseAssignment)
    private assignmentRepo: Repository<CycleExerciseAssignment>,

    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,

    @InjectRepository(ExerciseParameters)
    private parametersRepo: Repository<ExerciseParameters>,

    private hybridRecommendationService: HybridRecommendationService,
  ) {}

  /**
   * Initialize a new cycle for a student
   */
  async initializeCycle(
    studentId: string,
    islandId: string,
    cycleNumber: number,
    skillFocus: string,
    totalExercises: number = 10,
  ): Promise<StudentCycleTracking> {
    // Check if cycle already exists
    const existing = await this.cycleRepo.findOne({
      where: {
        student_id: studentId,
        island_id: islandId,
        cycle_number: cycleNumber,
      },
    });

    if (existing && existing.status === 'active') {
      throw new BadRequestException(
        `Cycle ${cycleNumber} for this student/island is already active`,
      );
    }

    // Create new cycle
    const cycle = this.cycleRepo.create({
      student_id: studentId,
      island_id: islandId,
      cycle_number: cycleNumber,
      skill_focus: skillFocus,
      current_position: 1,
      status: 'active',
      total_exercises: totalExercises,
      exercises_completed_count: 0,
    });

    return this.cycleRepo.save(cycle);
  }

  /**
   * Get current state of a cycle
   */
  async getCycleState(studentId: string, islandId: string, cycleNumber: number): Promise<CycleState> {
    const cycle = await this.cycleRepo.findOne({
      where: {
        student_id: studentId,
        island_id: islandId,
        cycle_number: cycleNumber,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Cycle not found for student ${studentId}`);
    }

    // Get all assignments for this cycle
    const allAssignments = await this.assignmentRepo.find({
      where: { cycle_tracking_id: cycle.id },
      order: { position_in_cycle: 'ASC' },
    });

    // Get next exercise (current position that's not completed)
    const nextAssignment = allAssignments.find(
      (a) => a.position_in_cycle === cycle.current_position && !a.is_completed,
    );

    let nextExercise: Activity | null = null;
    if (nextAssignment) {
      nextExercise = await this.activityRepo.findOne({
        where: { id: nextAssignment.activity_id },
      });
    }

    return {
      cycle,
      currentPosition: cycle.current_position,
      totalExercises: cycle.total_exercises,
      status: cycle.status,
      nextExercise,
      allAssignments,
    };
  }

  /**
   * Get next exercise recommendation using hybrid ranking
   * Filters by skill_focus and avoids recent structures
   */
  async getNextExerciseRecommendation(
    studentId: string,
    islandId: string,
    cycleNumber: number,
    hybridRankingInput: any, // Input for hybrid recommendation service
  ): Promise<{
    exercise: Activity;
    position: number;
    matchScore: number;
    rankingResult: HybridRankingResult;
  }> {
    // Get cycle
    const cycle = await this.cycleRepo.findOne({
      where: {
        student_id: studentId,
        island_id: islandId,
        cycle_number: cycleNumber,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Cycle not found`);
    }

    if (cycle.status !== 'active') {
      throw new BadRequestException(`Cycle is not active`);
    }

    if (cycle.current_position > cycle.total_exercises) {
      throw new BadRequestException(`Cycle is already completed`);
    }

    // Get all exercises already assigned in this cycle
    const alreadyAssigned = await this.assignmentRepo.find({
      where: { cycle_tracking_id: cycle.id },
    });

    const assignedActivityIds = alreadyAssigned.map((a) => a.activity_id);

    // Filter candidates: must have skill_focus
    const candidates = await this.activityRepo.find({
      where: {
        id: 'NOT_IN(:...excludeIds)',
      },
    });

    // TODO: Add skill_focus filtering when Activity entity is updated
    // For now, filter by BNCC skills in post-processing
    const filteredCandidates = candidates.filter((activity) => {
      // Avoid already assigned
      if (assignedActivityIds.includes(activity.id)) {
        return false;
      }

      // Must match skill focus
      if (!activity.bnccSkills?.includes(cycle.skill_focus)) {
        return false;
      }

      return true;
    });

    if (filteredCandidates.length === 0) {
      throw new BadRequestException(
        `No more exercises available for skill ${cycle.skill_focus}`,
      );
    }

    // Update input to include cycle context
    const enhancedInput = {
      ...hybridRankingInput,
      candidates: filteredCandidates,
      cycleId: cycle.id,
      cyclePosition: cycle.current_position,
      skillFocus: cycle.skill_focus,
    };

    // Call hybrid ranking
    const rankingResult = await this.hybridRecommendationService.rank(enhancedInput);

    if (!rankingResult.selectedActivityId) {
      throw new BadRequestException('No suitable exercise found by recommendation algorithm');
    }

    // Get the recommended activity
    const selectedActivity = await this.activityRepo.findOne({
      where: { id: rankingResult.selectedActivityId },
    });

    if (!selectedActivity) {
      throw new NotFoundException(`Selected activity not found`);
    }

    // Create assignment (but don't mark as completed yet)
    const assignment = this.assignmentRepo.create({
      cycle_tracking_id: cycle.id,
      activity_id: selectedActivity.id,
      position_in_cycle: cycle.current_position,
      match_score: rankingResult.candidates[0]?.finalScore ?? 0.75,
    });

    await this.assignmentRepo.save(assignment);

    return {
      exercise: selectedActivity,
      position: cycle.current_position,
      matchScore: assignment.match_score,
      rankingResult,
    };
  }

  /**
   * Mark exercise as completed and move to next position
   */
  async completeExercise(
    studentId: string,
    islandId: string,
    cycleNumber: number,
    studentScore: number, // 0.0-1.0
  ): Promise<CycleState> {
    const cycle = await this.cycleRepo.findOne({
      where: {
        student_id: studentId,
        island_id: islandId,
        cycle_number: cycleNumber,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Cycle not found`);
    }

    // Get current assignment
    const assignment = await this.assignmentRepo.findOne({
      where: {
        cycle_tracking_id: cycle.id,
        position_in_cycle: cycle.current_position,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment not found`);
    }

    // Mark as completed
    assignment.is_completed = true;
    assignment.student_score = studentScore;
    assignment.completed_at = new Date();
    await this.assignmentRepo.save(assignment);

    // Update cycle
    cycle.exercises_completed_count += 1;

    // Check if cycle is complete
    if (cycle.exercises_completed_count >= cycle.total_exercises) {
      cycle.status = 'completed';
      cycle.completed_at = new Date();
    } else {
      // Move to next position
      cycle.current_position += 1;
    }

    await this.cycleRepo.save(cycle);

    // Return updated state
    return this.getCycleState(studentId, islandId, cycleNumber);
  }

  /**
   * Get cycle progress summary
   */
  async getCycleProgress(studentId: string, islandId: string, cycleNumber: number) {
    const state = await this.getCycleState(studentId, islandId, cycleNumber);

    const completed = state.allAssignments.filter((a) => a.is_completed);
    const avgScore = completed.length > 0
      ? completed.reduce((sum, a) => sum + (a.student_score ?? 0), 0) / completed.length
      : 0;

    return {
      cycle: state.cycle,
      progress: {
        completed: completed.length,
        total: state.totalExercises,
        percentage: (completed.length / state.totalExercises) * 100,
        averageScore: avgScore,
      },
      nextPosition: state.cycle.current_position,
      status: state.cycle.status,
    };
  }
}
