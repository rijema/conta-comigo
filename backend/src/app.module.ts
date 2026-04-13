import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdeModule } from './modules/ade/ade.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { OntologyModule } from './modules/ontology/ontology.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    // Application Modules
    AuthModule,
    UsersModule,
    ActivitiesModule,
    AnalyticsModule,
    AdeModule,
    KafkaModule,
    OntologyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
