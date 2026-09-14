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

@Module({
  imports: [TypeOrmModule.forFeature([
    LearningEvent,
    RecommendationOutcome,
    AdaptationTransition,
    InteractionEvidence,
  ])],
  controllers: [LearningAnalyticsMetricsController, LearningEventsController],
  providers: [LearningEventService, LearningAnalyticsMetricsService, RecommendationOutcomeService],
  exports: [LearningEventService, LearningAnalyticsMetricsService, RecommendationOutcomeService],
})
export class LearningEventsModule {}
