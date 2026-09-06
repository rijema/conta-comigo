import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningEvent } from './entities/learning-event.entity';
import { LearningEventService } from './learning-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([LearningEvent])],
  providers: [LearningEventService],
  exports: [LearningEventService],
})
export class LearningEventsModule {}
