import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningEvent } from './entities/learning-event.entity';
import { LearningEventService } from './learning-event.service';
import { LearningAnalyticsMetricsService } from './learning-analytics-metrics.service';
import { LearningAnalyticsMetricsController } from './learning-analytics-metrics.controller';
import { LearningEventsController } from './learning-events.controller';
import { RecommendationOutcome } from './entities/recommendation-outcome.entity';
import { AdaptationTransition } from './entities/adaptation-transition.entity';
import { InteractionEvidence } from './entities/interaction-evidence.entity';
import { RecommendationOutcomeService } from './recommendation-outcome.service';
import { LongitudinalLearningAnalyticsService } from './longitudinal-learning-analytics.service';
import { ReviewAssignment } from './entities/review-assignment.entity';
import { ReviewOutcome } from './entities/review-outcome.entity';
import { ReviewCandidateGenerationService } from './services/review-candidate-generation.service';
import { ExercisePerformance } from './entities/exercise-performance.entity';
import { StudentSkillState } from '../knowledge-tracing/entities/student-skill-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    LearningEvent,
    RecommendationOutcome,
    AdaptationTransition,
    InteractionEvidence,
    ReviewAssignment,
    ReviewOutcome,
    ExercisePerformance,
    StudentSkillState,
  ])],
  controllers: [LearningAnalyticsMetricsController, LearningEventsController],
  providers: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    LongitudinalLearningAnalyticsService,
    ReviewCandidateGenerationService,
  ],
  exports: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    LongitudinalLearningAnalyticsService,
    ReviewCandidateGenerationService,
  ],
})
export class LearningEventsModule {}
