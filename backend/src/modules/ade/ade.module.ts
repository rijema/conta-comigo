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

@Module({
  imports: [
    TypeOrmModule.forFeature([AdeDecision]),
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
  ],
  exports: [AdeService, RecommendationExplanationService, HybridRecommendationService],
})
export class AdeModule {}
