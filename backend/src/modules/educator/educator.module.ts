import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { AdeDecision } from '../ade/entities/ade-decision.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';
import { Activity } from '../activities/entities/activity.entity';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';
import { KnowledgeTracingModule } from '../knowledge-tracing/knowledge-tracing.module';
import { AdeModule } from '../ade/ade.module';
import { AdaptationTransition } from '../learning-events/entities/adaptation-transition.entity';
import { RecommendationOutcome } from '../learning-events/entities/recommendation-outcome.entity';
import { ProfessionalRecommendationFeedback } from './entities/professional-recommendation-feedback.entity';
import { LearningEventsModule } from '../learning-events/learning-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, ChildProfile, AnalyticsSnapshot, AdeDecision, ActivityAttempt, Activity,
      AdaptationTransition, RecommendationOutcome, ProfessionalRecommendationFeedback,
    ]),
    KnowledgeTracingModule,
    AdeModule,
    LearningEventsModule,
  ],
  controllers: [EducatorController],
  providers: [EducatorService],
})
export class EducatorModule {}
