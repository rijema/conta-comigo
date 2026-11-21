import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ChildProfile } from './entities/child-profile.entity';
import { Clinic } from './entities/clinic.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './services/clinics.service';
import { LearnerAccessService } from './services/learner-access.service';
import { LearnerAccessGuard } from './guards/learner-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile, Clinic])],
  controllers: [UsersController, ClinicsController],
  providers: [UsersService, ClinicsService, LearnerAccessService, LearnerAccessGuard],
  exports: [UsersService, ClinicsService, LearnerAccessService, LearnerAccessGuard, TypeOrmModule],
})
export class UsersModule {}
