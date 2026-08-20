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
import { HealthController } from './health.controller';

function validateEnvironment(config: Record<string, unknown>) {
  if (config.NODE_ENV === 'production') {
    const required = [
      'DATABASE_URL',
      'REDIS_URL',
      'ML_SERVICE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ALLOWED_ORIGINS',
    ];
    const missing = required.filter((name) => !config[name]);
    if (missing.length) {
      throw new Error(`Missing required production variables: ${missing.join(', ')}`);
    }
  }
  return config;
}

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
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
            family: 0,
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
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
