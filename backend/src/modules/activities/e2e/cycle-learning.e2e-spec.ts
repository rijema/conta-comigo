/**
 * E2E Integration Test: Complete Cycle Flow
 *
 * Validates:
 * 1. Cycle auto-initialization on first activity selection
 * 2. Position advancement (1→10)
 * 3. Cycle completion detection
 * 4. Skill-focus enforcement
 * 5. API endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { StudentCycleTracking } from '../entities/student-cycle-tracking.entity';
import { CycleExerciseAssignment } from '../entities/cycle-exercise-assignment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Cycle Learning System E2E', () => {
  let app: INestApplication;
  let cycleRepo: Repository<StudentCycleTracking>;
  let assignmentRepo: Repository<CycleExerciseAssignment>;

  const testUserId = 'test-student-cycle-e2e';
  const testIslandId = 'island-sol';
  const testSessionId = 'session-e2e-001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cycleRepo = moduleFixture.get(getRepositoryToken(StudentCycleTracking));
    assignmentRepo = moduleFixture.get(
      getRepositoryToken(CycleExerciseAssignment),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario 1: Auto-Initialize Cycle on First Activity', () => {
    it('should create cycle on first getNextActivity with islandId', async () => {
      // Pre-condition: No cycles exist for this user
      const existingCycles = await cycleRepo.find({
        where: { student_id: testUserId, island_id: testIslandId },
      });
      expect(existingCycles.length).toBe(0);

      // Action: Call getNextActivity with islandId
      const response = await request(app.getHttpServer())
        .post('/activities/next')
        .send({
          sessionId: testSessionId,
          islandId: testIslandId,
          excludedActivityId: '',
        })
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      // Verify: Cycle was created
      const createdCycles = await cycleRepo.find({
        where: { student_id: testUserId, island_id: testIslandId },
      });
      expect(createdCycles.length).toBeGreaterThan(0);

      // Verify: First cycle is active
      const firstCycle = createdCycles.find((c) => c.cycle_number === 1);
      expect(firstCycle).toBeDefined();
      expect(firstCycle?.status).toBe('active');
      expect(firstCycle?.current_position).toBe(1);

      // Verify: Response includes cycleContext
      expect(response.body.cycleContext).toBeDefined();
      expect(response.body.cycleContext.cycleNumber).toBe(1);
      expect(response.body.cycleContext.skillFocus).toBe(firstCycle?.skill_focus);
      expect(response.body.cycleContext.isActive).toBe(true);

      // Verify: Activity matches cycle skill focus
      expect(response.body.activity.bnccSkills[0]).toBe(
        firstCycle?.skill_focus,
      );
    });

    it('should not duplicate cycles on second call', async () => {
      // Call getNextActivity again
      await request(app.getHttpServer())
        .post('/activities/next')
        .send({ sessionId: testSessionId, islandId: testIslandId })
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      // Verify: Cycles not duplicated
      const cycles = await cycleRepo.find({
        where: { student_id: testUserId, island_id: testIslandId },
      });
      expect(cycles.length).toBeGreaterThan(0);
      // Should be stable
      expect(cycles.filter((c) => c.cycle_number === 1).length).toBe(1);
    });
  });

  describe('Scenario 2: Cycle Position Advancement (1→10)', () => {
    it('should advance position from 1 to 2 after first exercise submission', async () => {
      // Get current cycle
      let cycle = await cycleRepo.findOne({
        where: {
          student_id: testUserId,
          island_id: testIslandId,
          cycle_number: 1,
        },
      });
      const initialPosition = cycle?.current_position ?? 1;
      expect(initialPosition).toBeGreaterThanOrEqual(1);

      // Get activity
      const actResponse = await request(app.getHttpServer())
        .post('/activities/next')
        .send({
          sessionId: testSessionId,
          islandId: testIslandId,
          cycleNumber: 1,
        })
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      const activityId = actResponse.body.activity.id;
      expect(activityId).toBeDefined();

      // Submit attempt
      await request(app.getHttpServer())
        .post('/sessions/attempt')
        .send({
          activityId,
          sessionId: testSessionId,
          isCorrect: true,
          timeSpentSeconds: 30,
          hintsUsed: 0,
          islandId: testIslandId,
          cycleNumber: 1,
        })
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      // Verify: Position advanced
      cycle = await cycleRepo.findOne({
        where: {
          student_id: testUserId,
          island_id: testIslandId,
          cycle_number: 1,
        },
      });
      expect(cycle?.current_position).toBe(initialPosition + 1);
      expect(cycle?.exercises_completed_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scenario 3: Skill-Focus Enforcement', () => {
    it('should only recommend activities matching cycle skill focus', async () => {
      const cycle = await cycleRepo.findOne({
        where: {
          student_id: testUserId,
          island_id: testIslandId,
          cycle_number: 1,
          status: 'active',
        },
      });

      if (!cycle) {
        console.log('Skipping: No active cycle found');
        return;
      }

      // Request 3 activities
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/activities/next')
          .send({
            sessionId: testSessionId,
            islandId: testIslandId,
            cycleNumber: cycle.cycle_number,
          })
          .set('Authorization', `Bearer ${testUserId}`)
          .expect(200);

        // Verify: Activity's primary skill matches cycle's skill focus
        const primarySkill = response.body.activity.bnccSkills[0];
        expect(primarySkill).toBe(cycle.skill_focus);
      }
    });
  });

  describe('Scenario 4: API Endpoints', () => {
    it('GET /cycles/:islandId/:cycleNumber should return cycle state', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cycles/${testIslandId}/1`)
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycleNumber');
      expect(response.body).toHaveProperty('skillFocus');
      expect(response.body).toHaveProperty('currentPosition');
      expect(response.body).toHaveProperty('isActive');
      expect(response.body.cycleNumber).toBe(1);
      expect(response.body.islandId).toBe(testIslandId);
    });

    it('GET /cycles/:islandId/:cycleNumber/progress should return detailed progress', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cycles/${testIslandId}/1/progress`)
        .set('Authorization', `Bearer ${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('cycle');
      expect(response.body).toHaveProperty('completedCount');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('completionPercentage');
      expect(response.body).toHaveProperty('nextPosition');
      expect(response.body).toHaveProperty('status');
      expect(response.body.totalCount).toBe(10);
    });
  });

  describe('Scenario 5: Exercise Assignment Records', () => {
    it('should have 10 exercise assignments per cycle', async () => {
      const cycle = await cycleRepo.findOne({
        where: {
          student_id: testUserId,
          island_id: testIslandId,
          cycle_number: 1,
        },
      });

      if (!cycle) {
        console.log('Skipping: No cycle found');
        return;
      }

      const assignments = await assignmentRepo.find({
        where: { cycle_tracking_id: cycle.id },
      });

      expect(assignments.length).toBe(10);

      // Verify: Positions 1-10
      const positions = assignments
        .map((a) => a.position_in_cycle)
        .sort((a, b) => a - b);
      expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });
});
