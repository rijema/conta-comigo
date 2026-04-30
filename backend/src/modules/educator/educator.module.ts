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

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile, AnalyticsSnapshot, AdeDecision, ActivityAttempt, Activity])],
  controllers: [EducatorController],
  providers: [EducatorService],
})
export class EducatorModule {}
