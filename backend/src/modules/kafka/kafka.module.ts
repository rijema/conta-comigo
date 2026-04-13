import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { KafkaProducerService } from './kafka-producer.service';
import { AnalyticsConsumer } from './consumers/analytics.consumer';
import { AdeConsumer } from './consumers/ade.consumer';

@Module({
  imports: [
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