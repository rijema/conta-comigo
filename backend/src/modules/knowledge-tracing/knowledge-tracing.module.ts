import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentSkillState } from './entities/student-skill-state.entity';
import { KnowledgeTracingService } from './knowledge-tracing.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentSkillState]), HttpModule],
  providers: [KnowledgeTracingService],
  exports: [KnowledgeTracingService],
})
export class KnowledgeTracingModule {}
