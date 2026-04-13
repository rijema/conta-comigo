import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaProducerService } from './kafka-producer.service';
import { AnalyticsConsumer } from './consumers/analytics.consumer';
import { AdeConsumer } from './consumers/ade.consumer';
import { AnalyticsSnapshot } from '../analytics/entities/analytics-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsSnapshot]),
    BullModule.registerQueue(
      { name: 'session-events' },
      { name: 'activity-events' },
      { name: 'analytics-updates' },
      { name: 'ade-decisions' },
      { name: 'alerts' },
    ),
  ],
  providers: [KafkaProducerService, AnalyticsConsumer, AdeConsumer],
  exports: [KafkaProducerService],
})
export class KafkaModule {}