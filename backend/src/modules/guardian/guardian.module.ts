import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile, AnalyticsSnapshot])],
  controllers: [GuardianController],
  providers: [GuardianService],
})
export class GuardianModule {}
