import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OntologyService } from './ontology.service';
import { RuntimeSemanticAdapter } from './runtime-semantic.adapter';
import { BnccSkill } from './entities/bncc-skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BnccSkill])],
  providers: [OntologyService, RuntimeSemanticAdapter],
  exports: [OntologyService, RuntimeSemanticAdapter, TypeOrmModule],
})
export class OntologyModule {}
