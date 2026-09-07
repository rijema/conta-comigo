import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningEvent } from './entities/learning-event.entity';
import { LearningEventService } from './learning-event.service';
import { LearningAnalyticsMetricsService } from './learning-analytics-metrics.service';
import { LearningAnalyticsMetricsController } from './learning-analytics-metrics.controller';
import { LearningEventsController } from './learning-events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LearningEvent])],
  controllers: [LearningAnalyticsMetricsController, LearningEventsController],
  providers: [LearningEventService, LearningAnalyticsMetricsService],
  exports: [LearningEventService, LearningAnalyticsMetricsService],
})
export class LearningEventsModule {}
