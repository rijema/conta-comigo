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
import { ReviewSelectionService } from './services/review-selection.service';
import { ReviewTriggerService } from './services/review-trigger.service';
import { LongitudinalComparisonService } from './services/longitudinal-comparison.service';
import { ReviewOrchestrationService } from './services/review-orchestration.service';
import { LongitudinalReviewAnalyticsService } from './services/longitudinal-review-analytics.service';
import { LongitudinalReviewExportService } from './services/longitudinal-review-export.service';
import { ResearchPseudonymizationService } from './services/research-pseudonymization.service';
import { ExercisePerformance } from './entities/exercise-performance.entity';
import { StudentSkillState } from '../knowledge-tracing/entities/student-skill-state.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { Activity } from '../activities/entities/activity.entity';
import { OntologyModule } from '../ontology/ontology.module';
import { AdeModule } from '../ade/ade.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningEvent,
      RecommendationOutcome,
      AdaptationTransition,
      InteractionEvidence,
      ReviewAssignment,
      ReviewOutcome,
      ExercisePerformance,
      StudentSkillState,
      ActivityAttempt,
      Activity,
    ]),
    OntologyModule,
    AdeModule,
  ],
  controllers: [LearningAnalyticsMetricsController, LearningEventsController],
  providers: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    LongitudinalLearningAnalyticsService,
    ReviewCandidateGenerationService,
    ReviewSelectionService,
    ReviewTriggerService,
    LongitudinalComparisonService,
    ReviewOrchestrationService,
    LongitudinalReviewAnalyticsService,
    LongitudinalReviewExportService,
    ResearchPseudonymizationService,
  ],
  exports: [
    LearningEventService,
    LearningAnalyticsMetricsService,
    RecommendationOutcomeService,
    LongitudinalLearningAnalyticsService,
    ReviewCandidateGenerationService,
    ReviewSelectionService,
    ReviewTriggerService,
    LongitudinalComparisonService,
    ReviewOrchestrationService,
  ],
})
export class LearningEventsModule {}
