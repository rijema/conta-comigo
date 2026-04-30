import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdeModule } from './modules/ade/ade.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { OntologyModule } from './modules/ontology/ontology.module';
import { GuardianModule } from './modules/guardian/guardian.module';
import { EducatorModule } from './modules/educator/educator.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('LOG_LEVEL') === 'debug' ? ['query', 'error'] : ['error'],
      }),
      inject: [ConfigService],
    }),

    // Bull / Redis Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        settings: {
          maxStalledCount: 0,
        },
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: true,
        },
        // Prevent ioredis from crashing the process when Redis is unavailable
        createClient: () => {
          const IORedis = require('ioredis');
          const url = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
          return new IORedis(url, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
          });
        },
      }),
      inject: [ConfigService],
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
    GuardianModule,
    EducatorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
