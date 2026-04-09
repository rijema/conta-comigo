import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityAttempt]),
    KafkaModule,
    AdeModule,
    UsersModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}