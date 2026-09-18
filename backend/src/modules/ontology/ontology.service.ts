import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DOMParser, Document, Element } from '@xmldom/xmldom';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CandidateDecisionTrace,
  RuntimeSemanticFacts,
  SemanticCandidateResult,
} from './semantic-runtime.types';

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const OWL_NS = 'http://www.w3.org/2002/07/owl#';
const CC_NS = 'https://contacomigo.org/ontology#';
const EXPECTED_ONTOLOGY_IRI = 'https://contacomigo.org/ontology';
const REASONER_VERSION = 'contacomigo-semantic-filter/1.0.0';

interface SkillDefinition {
  iri: string;
  code: string;
  mathematicalConcepts: string[];
}

interface PrerequisiteDefinition {
  iri: string;
  prerequisiteConcept: string;
  dependentConcept: string;
}

interface CachedOntology {
  filePath: string;
  ontologyIri: string;
  version: string;
  skillsByCode: Map<string, SkillDefinition>;
  prerequisites: PrerequisiteDefinition[];
}

export interface SkillRelationEvidence {
  skillCode: string;
  relation: 'prerequisiteSkill' | 'relatedSkill' | 'complementarySkill' | 'contrastSkill';
  concepts: string[];
  source: 'ASSERTED_CONCEPT_PREREQUISITE' | 'SHARED_CONCEPT_DERIVED';
}

@Injectable()
export class OntologyService implements OnModuleInit {
  private readonly logger = new Logger(OntologyService.name);
  private ontology: CachedOntology | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.loadOnce();
  }

  loadOnce(): void {
    if (this.ontology) return;
    const filePath = this.resolveOntologyPath();
    const source = this.readOntology(filePath);
    const document = this.parseOntology(source, filePath);
    this.ontology = this.buildCache(document, filePath);
    this.logger.log(
      `ContaComigo ontology ${this.ontology.version} loaded from ${filePath}; ` +
      `${this.ontology.skillsByCode.size} BNCC skills cached`,
    );
  }

  getValidActivityCandidates(facts: RuntimeSemanticFacts): SemanticCandidateResult {
    const ontology = this.requireOntology();
    const targetSkill = ontology.skillsByCode.get(facts.targetSkill);
    if (!targetSkill) {
      return this.fallbackResult(
        facts,
        `Target skill ${facts.targetSkill} is not represented in the loaded ontology`,
      );
    }

    const decisions: CandidateDecisionTrace[] = facts.activities.map((activity) => {
      const reasons: string[] = [];
      const matchedConcepts = activity.mathematicalConcepts.filter((concept) =>
        targetSkill.mathematicalConcepts.includes(concept),
      );

      if (!activity.bnccSkills.includes(facts.targetSkill)) {
        reasons.push('TARGET_SKILL_NOT_DECLARED_BY_ACTIVITY');
      }
      if (!this.isActivityPrerequisiteSatisfied(
        activity.prerequisiteSkillCode, facts.masteryBySkillCode ?? {})) {
        reasons.push('ACTIVITY_PREREQUISITE_NOT_MASTERED');
      }
      if (
        targetSkill.mathematicalConcepts.length > 0 &&
        matchedConcepts.length === 0
      ) {
        reasons.push('NO_SHARED_MATHEMATICAL_CONCEPT');
      }
      if (facts.hardConstraints.disallowDragging && activity.affordances.requiresDragging) {
        reasons.push('HARD_CONSTRAINT_DISALLOWS_DRAGGING');
      }
      if (facts.hardConstraints.requireAudio && !activity.affordances.usesAudio) {
        reasons.push('HARD_CONSTRAINT_REQUIRES_AUDIO');
      }
      if (activity.mappingStatus === 'UNMAPPED') {
        reasons.push('ACTIVITY_SEMANTIC_MAPPING_MISSING');
      }
      if (activity.mappingStatus === 'NEEDS_REVIEW') {
        reasons.push('ACTIVITY_SEMANTIC_MAPPING_REQUIRES_REVIEW');
      }

      return {
        activityId: activity.activityId,
        included: reasons.length === 0,
        reasons: reasons.length === 0
          ? ['TARGET_SKILL_AND_MATHEMATICAL_CONCEPT_ALIGNED']
          : reasons,
        matchedConcepts,
      };
    });
    const validCandidateIds = decisions
      .filter((decision) => decision.included)
      .map((decision) => decision.activityId);

    if (validCandidateIds.length === 0) {
      return this.fallbackResult(
        facts,
        'Formal semantic filtering produced no valid candidates',
        decisions,
      );
    }

    return {
      validCandidateIds,
      excludedCandidateIds: decisions
        .filter((decision) => !decision.included)
        .map((decision) => decision.activityId),
      trace: this.buildTrace(facts, targetSkill, decisions, false, null),
    };
  }

  getStatus() {
    const ontology = this.requireOntology();
    return {
      loaded: true,
      filePath: ontology.filePath,
      ontologyIri: ontology.ontologyIri,
      ontologyVersion: ontology.version,
      reasonerVersion: REASONER_VERSION,
      cachedBnccSkills: ontology.skillsByCode.size,
      cachedPrerequisiteRelations: ontology.prerequisites.length,
    };
  }

  getMathematicalConceptMappings(
    skillCodes: string[],
  ): Record<string, string[]> {
    const ontology = this.requireOntology();
    return Object.fromEntries(
      skillCodes.flatMap((code) => {
        const skill = ontology.skillsByCode.get(code);
        return skill ? [[code, [...skill.mathematicalConcepts]]] : [];
      }),
    );
  }

  getSkillRelations(skillCode: string): SkillRelationEvidence[] {
    const ontology = this.requireOntology();
    const target = ontology.skillsByCode.get(skillCode);
    if (!target) return [];
    const relations: SkillRelationEvidence[] = [];
    for (const candidate of ontology.skillsByCode.values()) {
      if (candidate.code === skillCode) continue;
      const prerequisiteConcepts = ontology.prerequisites
        .filter((relation) => target.mathematicalConcepts.includes(relation.dependentConcept) &&
          candidate.mathematicalConcepts.includes(relation.prerequisiteConcept))
        .map((relation) => relation.prerequisiteConcept);
      if (prerequisiteConcepts.length) {
        relations.push({ skillCode: candidate.code, relation: 'prerequisiteSkill',
          concepts: [...new Set(prerequisiteConcepts)], source: 'ASSERTED_CONCEPT_PREREQUISITE' });
        continue;
      }
      const shared = candidate.mathematicalConcepts.filter((concept) =>
        target.mathematicalConcepts.includes(concept));
      if (shared.length) relations.push({ skillCode: candidate.code, relation: 'relatedSkill',
        concepts: [...new Set(shared)], source: 'SHARED_CONCEPT_DERIVED' });
    }
    return relations.sort((left, right) => left.skillCode.localeCompare(right.skillCode));
  }

  isActivityPrerequisiteSatisfied(
    prerequisiteSkillCode: string | null | undefined,
    masteryBySkillCode: Record<string, number>,
  ): boolean {
    if (!prerequisiteSkillCode) return true;
    const mastery = masteryBySkillCode[prerequisiteSkillCode];
    if (typeof mastery !== 'number' || !Number.isFinite(mastery)) return true;
    return mastery >= this.prerequisiteThreshold();
  }

  private prerequisiteThreshold(): number {
    const threshold = Number(this.configService.get<string | number>(
      'ONTOLOGY_PREREQUISITE_MASTERY_THRESHOLD') ?? 0.5);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
      throw new Error('ONTOLOGY_PREREQUISITE_MASTERY_THRESHOLD must be between 0 and 1');
    }
    return threshold;
  }

  private buildTrace(
    facts: RuntimeSemanticFacts,
    targetSkill: SkillDefinition,
    decisions: CandidateDecisionTrace[],
    fallbackUsed: boolean,
    fallbackReason: string | null,
  ) {
    const ontology = this.requireOntology();
    const semanticRelations = targetSkill.mathematicalConcepts.map((concept) => ({
      subject: targetSkill.iri,
      predicate: `${CC_NS}addressesMathematicalConcept`,
      object: `${CC_NS}${concept}`,
    }));
    const relevantPrerequisites = ontology.prerequisites.filter((relation) =>
      targetSkill.mathematicalConcepts.includes(relation.dependentConcept),
    );
    semanticRelations.push(...relevantPrerequisites.flatMap((relation) => [
      {
        subject: relation.iri,
        predicate: `${CC_NS}prerequisiteConcept`,
        object: `${CC_NS}${relation.prerequisiteConcept}`,
      },
      {
        subject: relation.iri,
        predicate: `${CC_NS}dependentConcept`,
        object: `${CC_NS}${relation.dependentConcept}`,
      },
    ]));

    return {
      targetSkill: facts.targetSkill,
      runtimeFactsUsed: {
        studentId: facts.studentId,
        masterySource: facts.mastery.source,
        masteryProbability: facts.mastery.probability,
        recentAccuracy: facts.learningAnalytics.recentAccuracy,
        observedEvidenceTypes: facts.observedEvidenceTypes,
        hardConstraints: facts.hardConstraints,
        prerequisiteMasteryBySkillCode: Object.fromEntries(
          [...new Set(facts.activities.flatMap((activity) =>
            activity.prerequisiteSkillCode ? [activity.prerequisiteSkillCode] : []))]
            .map((code) => [code, facts.masteryBySkillCode?.[code] ?? null])),
      },
      candidateActivities: facts.activities.map((activity) => activity.activityId),
      validCandidateIds: decisions
        .filter((decision) => decision.included)
        .map((decision) => decision.activityId),
      excludedCandidateIds: decisions
        .filter((decision) => !decision.included)
        .map((decision) => decision.activityId),
      candidateDecisions: decisions,
      semanticRelations,
      ontologyVersion: ontology.version,
      reasonerVersion: REASONER_VERSION,
      fallbackUsed,
      fallbackReason,
    };
  }

  private fallbackResult(
    facts: RuntimeSemanticFacts,
    reason: string,
    decisions: CandidateDecisionTrace[] = [],
  ): SemanticCandidateResult {
    const ontology = this.requireOntology();
    const targetSkill = ontology.skillsByCode.get(facts.targetSkill) ?? {
      iri: `${CC_NS}unmapped_${facts.targetSkill}`,
      code: facts.targetSkill,
      mathematicalConcepts: [],
    };
    return {
      validCandidateIds: decisions
        .filter((decision) => decision.included)
        .map((decision) => decision.activityId),
      excludedCandidateIds: decisions
        .filter((decision) => !decision.included)
        .map((decision) => decision.activityId),
      trace: this.buildTrace(facts, targetSkill, decisions, true, reason),
    };
  }

  private resolveOntologyPath(): string {
    const configured = this.configService.get<string>('CONTACOMIGO_ONTOLOGY_PATH');
    if (configured) {
      const explicitPath = resolve(configured);
      if (!existsSync(explicitPath)) {
        throw new Error(
          `ContaComigo ontology file configured at ${explicitPath} does not exist`,
        );
      }
      return explicitPath;
    }

    const candidates = [
      resolve(process.cwd(), 'ontology/contacomigo/contacomigo.owl'),
      resolve(process.cwd(), '../ontology/contacomigo/contacomigo.owl'),
    ];
    const discovered = candidates.find(existsSync);
    if (!discovered) {
      throw new Error(
        `ContaComigo ontology file was not found. Checked: ${candidates.join(', ')}`,
      );
    }
    return discovered;
  }

  private readOntology(filePath: string): string {
    try {
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to read ContaComigo ontology at ${filePath}: ${this.errorMessage(error)}`,
      );
    }
  }

  private parseOntology(source: string, filePath: string): Document {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
      throw new Error(
        `Invalid RDF/XML in ContaComigo ontology at ${filePath}: external entity declarations are not allowed`,
      );
    }
    const errors: string[] = [];
    const parser = new DOMParser({
      onError: (level, message) => errors.push(`${level}: ${message}`),
    });
    const document = parser.parseFromString(source, 'application/xml');
    if (errors.length > 0 || document.documentElement?.localName !== 'RDF') {
      throw new Error(
        `Invalid RDF/XML in ContaComigo ontology at ${filePath}: ` +
        (errors.join(' | ') || 'root element must be rdf:RDF'),
      );
    }
    return document;
  }

  private buildCache(document: Document, filePath: string): CachedOntology {
    const ontologyElements = this.elements(document.getElementsByTagNameNS(OWL_NS, 'Ontology'));
    if (ontologyElements.length !== 1) {
      throw new Error('ContaComigo ontology must declare exactly one owl:Ontology');
    }
    const ontologyElement = ontologyElements[0];
    const ontologyIri = ontologyElement.getAttributeNS(RDF_NS, 'about');
    if (ontologyIri !== EXPECTED_ONTOLOGY_IRI) {
      throw new Error(`Unexpected ContaComigo ontology IRI: ${ontologyIri || '(missing)'}`);
    }
    const version = this.firstText(ontologyElement, OWL_NS, 'versionInfo');
    if (!version) throw new Error('ContaComigo ontology owl:versionInfo is missing');

    const skillsByCode = new Map<string, SkillDefinition>();
    const prerequisites: PrerequisiteDefinition[] = [];
    for (const individual of this.elements(
      document.getElementsByTagNameNS(OWL_NS, 'NamedIndividual'),
    )) {
      const iri = individual.getAttributeNS(RDF_NS, 'about') ?? '';
      const types = this.resourceValues(individual, RDF_NS, 'type');
      if (types.includes(`${CC_NS}BNCCSkill`)) {
        const code = this.firstText(individual, CC_NS, 'hasCurriculumCode');
        if (!code) throw new Error(`BNCC skill ${iri} has no curriculum code`);
        if (skillsByCode.has(code)) throw new Error(`Duplicate BNCC skill code ${code}`);
        skillsByCode.set(code, {
          iri,
          code,
          mathematicalConcepts: this.resourceValues(
            individual,
            CC_NS,
            'addressesMathematicalConcept',
          ).map((value) => this.localName(value)),
        });
      }
      if (types.includes(`${CC_NS}PrerequisiteRelation`)) {
        const prerequisite = this.resourceValues(individual, CC_NS, 'prerequisiteConcept')[0];
        const dependent = this.resourceValues(individual, CC_NS, 'dependentConcept')[0];
        if (prerequisite && dependent) {
          prerequisites.push({
            iri,
            prerequisiteConcept: this.localName(prerequisite),
            dependentConcept: this.localName(dependent),
          });
        }
      }
    }
    if (skillsByCode.size === 0) {
      throw new Error('ContaComigo ontology contains no BNCCSkill individuals');
    }
    return { filePath, ontologyIri, version, skillsByCode, prerequisites };
  }

  private firstText(parent: Element, namespace: string, localName: string): string {
    return parent.getElementsByTagNameNS(namespace, localName).item(0)
      ?.textContent?.trim() ?? '';
  }

  private resourceValues(
    parent: Element,
    namespace: string,
    localName: string,
  ): string[] {
    return this.elements(parent.getElementsByTagNameNS(namespace, localName))
      .map((element) => element.getAttributeNS(RDF_NS, 'resource'))
      .filter((value): value is string => Boolean(value));
  }

  private elements<T extends Element>(nodes: ArrayLike<T>): T[] {
    return Array.from({ length: nodes.length }, (_, index) => nodes[index]);
  }

  private localName(iri: string): string {
    return iri.includes('#') ? iri.slice(iri.lastIndexOf('#') + 1) : iri;
  }

  private requireOntology(): CachedOntology {
    if (!this.ontology) {
      throw new Error('ContaComigo ontology has not been initialized');
    }
    return this.ontology;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
