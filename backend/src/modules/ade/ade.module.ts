import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdeService } from './ade.service';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { MlEngineService } from './ml/ml-engine.service';
import { KafkaModule } from '../kafka/kafka.module';
import { KnowledgeTracingModule } from '../knowledge-tracing/knowledge-tracing.module';
import { RecommendationExplanationService } from './recommendation-explanation.service';
import { HybridRecommendationService } from './hybrid-recommendation.service';
import { IslandContextService } from './island-context.service';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdeDecision, ActivityAttempt]),
    HttpModule,
    KafkaModule,
    KnowledgeTracingModule,
  ],
  providers: [
    AdeService,
    OntologyReasonerService,
    RuleEngineService,
    MlEngineService,
    RecommendationExplanationService,
    HybridRecommendationService,
    IslandContextService,
  ],
  exports: [AdeService, RecommendationExplanationService, HybridRecommendationService, IslandContextService],
})
export class AdeModule {}
