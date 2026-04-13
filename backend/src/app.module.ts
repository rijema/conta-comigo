import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
