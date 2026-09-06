import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { DataSource, Repository } from 'typeorm';
import { StudentSkillState } from './entities/student-skill-state.entity';

interface BktUpdateResponse {
  updated_mastery: number;
}

export interface KnowledgeObservation {
  studentId: string;
  skillId: string;
  skillCode: string;
  correct: boolean;
}

@Injectable()
export class KnowledgeTracingService {
  private readonly mlServiceUrl: string;
  private readonly initialMastery: number;
  private readonly requestTimeoutMs: number;

  constructor(
    @InjectRepository(StudentSkillState)
    private readonly stateRepository: Repository<StudentSkillState>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8001');
    this.initialMastery = this.configuredNumber('BKT_PRIOR_KNOWLEDGE', 0.1);
    this.requestTimeoutMs = this.configuredNumber('KNOWLEDGE_TRACING_TIMEOUT_MS', 5000);
    if (this.initialMastery < 0 || this.initialMastery > 1) {
      throw new Error('BKT_PRIOR_KNOWLEDGE must be between 0 and 1');
    }
    if (this.requestTimeoutMs <= 0) {
      throw new Error('KNOWLEDGE_TRACING_TIMEOUT_MS must be greater than zero');
    }
  }

  async observe(observation: KnowledgeObservation): Promise<StudentSkillState> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(StudentSkillState);
      await repository
        .createQueryBuilder()
        .insert()
        .values({
          studentId: observation.studentId,
          skillId: observation.skillId,
          masteryProbability: this.initialMastery,
          observations: 0,
        })
        .orIgnore()
        .execute();

      const state = await repository.findOneOrFail({
        where: {
          studentId: observation.studentId,
          skillId: observation.skillId,
        },
        lock: { mode: 'pessimistic_write' },
      });
      const response = await firstValueFrom(
        this.httpService.post<BktUpdateResponse>(`${this.mlServiceUrl}/predict/bkt`, {
          learner_id: observation.studentId,
          skill_code: observation.skillCode,
          current_mastery: state.masteryProbability,
          is_correct: observation.correct,
        }).pipe(timeout(this.requestTimeoutMs)),
      );

      const updatedMastery = Number(response.data.updated_mastery);
      if (!Number.isFinite(updatedMastery) || updatedMastery < 0 || updatedMastery > 1) {
        throw new Error('BKT service returned an invalid mastery probability');
      }
      state.masteryProbability = updatedMastery;
      state.observations += 1;
      state.lastUpdatedAt = new Date();
      return repository.save(state);
    });
  }

  getStatesForStudent(studentId: string): Promise<StudentSkillState[]> {
    return this.stateRepository.find({ where: { studentId }, order: { skillId: 'ASC' } });
  }

  async getMasteryBySkillCode(studentId: string, skillCode: string): Promise<number> {
    const rows: Array<{ masteryProbability: number }> = await this.dataSource.query(
      `SELECT state."masteryProbability"
       FROM student_skill_states state
       INNER JOIN bncc_skills skill ON skill.id = state."skillId"
       WHERE state."studentId" = $1 AND skill.code = $2
       LIMIT 1`,
      [studentId, skillCode],
    );
    return Number(rows[0]?.masteryProbability ?? this.initialMastery);
  }

  async getMasteryMapBySkillCode(studentId: string): Promise<Record<string, number>> {
    const rows: Array<{ code: string; masteryProbability: number }> = await this.dataSource.query(
      `SELECT skill.code, state."masteryProbability"
       FROM student_skill_states state
       INNER JOIN bncc_skills skill ON skill.id = state."skillId"
       WHERE state."studentId" = $1
       ORDER BY skill.code ASC`,
      [studentId],
    );
    return Object.fromEntries(rows.map((row) => [row.code, Number(row.masteryProbability)]));
  }

  private configuredNumber(name: string, fallback: number): number {
    const value = Number(this.configService.get<string | number>(name, fallback));
    if (!Number.isFinite(value)) throw new Error(`${name} must be numeric`);
    return value;
  }
}
