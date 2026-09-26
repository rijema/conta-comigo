import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { IslandExerciseMapping } from './entities/island-exercise-mapping.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { IslandCycleValidatorService } from './services/island-cycle-validator.service';
import { CycleProgressionService } from './services/cycle-progression.service';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';
import { UsersModule } from '../users/users.module';
import { LearningEventsModule } from '../learning-events/learning-events.module';
import { KnowledgeTracingModule } from '../knowledge-tracing/knowledge-tracing.module';
import { OntologyModule } from '../ontology/ontology.module';
import { LearningEvent } from '../learning-events/entities/learning-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityAttempt, IslandExerciseMapping, LearningEvent]),
    KafkaModule,
    AdeModule,
    UsersModule,
    LearningEventsModule,
    KnowledgeTracingModule,
    OntologyModule,
  ],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    IslandCycleValidatorService,
    CycleProgressionService,
    {
      provide: 'CycleProgressionService',
      useClass: CycleProgressionService,
    },
  ],
  exports: [ActivitiesService, IslandCycleValidatorService, CycleProgressionService],
})
export class ActivitiesModule {}
