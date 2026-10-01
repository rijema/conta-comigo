import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { IslandExerciseMapping } from './entities/island-exercise-mapping.entity';
import { Island } from './entities/island.entity';
import { IslandActivityMapping } from './entities/island-activity-mapping.entity';
import { ExerciseParameters } from './entities/exercise-parameters.entity';
import { StudentCycleTracking } from './entities/student-cycle-tracking.entity';
import { CycleExerciseAssignment } from './entities/cycle-exercise-assignment.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { CyclesController } from './cycles.controller';
import { SandboxController } from './sandbox.controller';
import { IslandCycleValidatorService } from './services/island-cycle-validator.service';
import { CycleProgressionService } from './services/cycle-progression.service';
import { CycleManagementService } from './services/cycle-management.service';
import { CycleInitializationService } from './services/cycle-initialization.service';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';
import { UsersModule } from '../users/users.module';
import { LearningEventsModule } from '../learning-events/learning-events.module';
import { KnowledgeTracingModule } from '../knowledge-tracing/knowledge-tracing.module';
import { OntologyModule } from '../ontology/ontology.module';
import { LearningEvent } from '../learning-events/entities/learning-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityAttempt,
      IslandExerciseMapping,
      Island,
      IslandActivityMapping,
      LearningEvent,
      ExerciseParameters,
      StudentCycleTracking,
      CycleExerciseAssignment,
    ]),
    KafkaModule,
    AdeModule,
    UsersModule,
    LearningEventsModule,
    KnowledgeTracingModule,
    OntologyModule,
  ],
  controllers: [ActivitiesController, CyclesController, SandboxController],
  providers: [
    ActivitiesService,
    IslandCycleValidatorService,
    CycleProgressionService,
    CycleManagementService,
    CycleInitializationService,
    {
      provide: 'CycleProgressionService',
      useClass: CycleProgressionService,
    },
  ],
  exports: [ActivitiesService, IslandCycleValidatorService, CycleProgressionService, CycleManagementService, CycleInitializationService],
})
export class ActivitiesModule {}
