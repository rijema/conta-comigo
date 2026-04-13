import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile, AnalyticsSnapshot])],
  controllers: [EducatorController],
  providers: [EducatorService],
})
export class EducatorModule {}
