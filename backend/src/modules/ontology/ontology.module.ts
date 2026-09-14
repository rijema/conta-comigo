import { Module } from '@nestjs/common';
import { OntologyService } from './ontology.service';
import { RuntimeSemanticAdapter } from './runtime-semantic.adapter';

@Module({
  providers: [OntologyService, RuntimeSemanticAdapter],
  exports: [OntologyService, RuntimeSemanticAdapter],
})
export class OntologyModule {}
