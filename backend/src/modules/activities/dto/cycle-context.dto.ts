/**
 * Cycle Context DTO
 * Represents the current state of a student's cycle progression.
 * Used to track where a student is within a skill-focused learning cycle.
 */
export interface CycleContextDto {
  cycleNumber: number;
  islandId: string;
  skillFocus: string;
  currentPosition: number; // 1-10, position within the cycle
  isActive: boolean; // Whether this cycle is currently active
}
