# Longitudinal Review System — Executive Summary

**Status**: 🔍 DESIGN COMPLETE — READY FOR IMPLEMENTATION  
**Date**: September 24, 2026  
**Document**: `LONGITUDINAL_REVIEW_SYSTEM_DESIGN.md` (full technical design)

---

## WHAT WAS ANALYZED

### Existing Infrastructure (All Preserved)
✅ **StudentSkillState** — Single source of mastery (BKT-updated)  
✅ **KnowledgeTracingService** — BKT integration with ML service  
✅ **LearningEvent** — Append-only event log (16 event types)  
✅ **InteractionEvidence** — Multimodal interaction signals  
✅ **RecommendationOutcome** — Recommendation lifecycle tracking  
✅ **AdaptationTransition** — Adaptation decision recording  
✅ **ExercisePerformance** — Performance metrics per activity  
✅ **Activity** — Full semantic contract with difficulty profiles  
✅ **IslandExerciseMapping** — 8 islands, 12 exercises each  
✅ **OntologyService** — Semantic filtering with RDF/OWL  
✅ **HybridRecommendationService** — Composite scoring (32KB)  
✅ **ProgressionAnalyzer** — Auto-progression detection  
✅ **LearningAnalyticsMetricsService** — Deterministic metrics  

**Conclusion**: Robust foundation exists. Review system extends, not replaces.

---

## WHAT MUST BE CREATED

### 1. Two New Database Entities

#### ReviewAssignment
- Links baseline evidence → review selection → review activity
- Stores: sourceInteractionIds, sourceRecommendationIds, selectedActivityInstanceId
- Captures: priorityScore, scoringBreakdown, baselineState snapshot
- Indexes: (studentId, skillId, createdAt)

#### ReviewOutcome
- Compares baseline vs. review performance
- Stores: baselineMetrics, reviewMetrics, deltas, normalizedDeltas
- Classifies: IMPROVED | STABLE | NEEDS_SUPPORT | INCONCLUSIVE
- Indexes: (reviewAssignmentId)

### 2. Four New Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **ReviewCandidateGenerationService** | Identify skills needing review | `generateReviewCandidates()`, `calculateReviewPriorityScore()` |
| **ReviewSelectionService** | Select appropriate review activity | `selectReviewActivity()`, `generateEquivalentInstance()` |
| **ReviewTriggerService** | Determine when to trigger review | `isNewLearningSession()`, `detectCheckpointMilestone()`, `determineReviewType()` |
| **LongitudinalComparisonService** | Compare baseline vs. review | `createComparison()`, `classifyProgression()` |

### 3. Activity Entity Extensions

Add to existing Activity:
- `templateId` (UUID, nullable) — if instance, points to template
- `isTemplate` (boolean) — if true, is reusable template
- `templateMetadata` (JSONB) — difficulty dimensions, generation strategy
- `instanceMetadata` (JSONB) — specific parameters for this instance

---

## CORE DESIGN DECISIONS

### Review Priority Score (Normalized 0..1)

**Factors**:
1. **Difficulty-Driven** (25%) — Targets skills near mastery boundary
2. **Retention** (25%) — Exponential decay by days since exposure
3. **Generalization** (20%) — Requires sufficient prior exposure + high accuracy
4. **Semantic** (15%) — Prerequisite importance from ontology
5. **Novelty** (15%) — Prevents over-reviewing same skill

**Formula**:
```
score = 0.25×difficulty + 0.25×retention + 0.20×generalization + 0.15×semantic + 0.15×novelty
```

**Key**: All factors normalized to [0,1] independently; prevents high-magnitude metrics from dominating.

### Three Review Types

| Type | Trigger | Activity | Composition |
|------|---------|----------|-------------|
| **REMEDIATION** | Low mastery or recent errors | Same/easier difficulty, different format | 6 remediation + 2 retention + 2 generalization |
| **RETENTION** | Mastered but not seen recently | Same difficulty, different instance | 2 remediation + 6 retention + 2 generalization |
| **GENERALIZATION** | High accuracy, sufficient exposure | Same/harder difficulty, different representation | 2 remediation + 2 retention + 6 generalization |

### Activity Template vs Instance

**Design**: Extend Activity entity (don't create separate table)

**Template** (isTemplate=true):
- Defines pedagogical structure
- Contains difficulty dimensions (numerical magnitude, complexity, abstraction, etc.)

**Instance** (isTemplate=false):
- Concrete realization with specific parameters
- References templateId
- Can be parametrically generated (different numbers, objects, arrangements)

**Benefit**: Child completing one instance doesn't eliminate template; infinite instances possible.

### Progression Classification (Conservative)

**Signals** (each 0..1):
- Accuracy improvement
- Response time efficiency
- Independence (fewer hints)
- Consistency (stable attempts)

**Classification**:
- **IMPROVED**: accuracy ↑ AND efficiency ↑
- **NEEDS_SUPPORT**: accuracy ↓ OR efficiency ↓↓
- **STABLE**: minimal changes
- **INCONCLUSIVE**: mixed signals

**Key**: Raw metrics always available; classification is conservative interpretation.

### Semantic Filtering Pipeline

```
learnerProfile (accessibility, modality, language)
    ↓ (hard blocks)
ontology/semantic constraints
    ↓ (hard blocks)
eligible activities
    ↓ (soft ranking)
HybridRecommendationService
    ↓
selected activity
```

**Hard Blocks** (not soft penalties):
- Sensory load: exclude if learner has visual sensitivity
- Motor demand: exclude if learner has motor limitations
- Language load: exclude if learner has language delays
- Professional constraints: educator-specified restrictions

---

## CRITICAL ARCHITECTURAL CONSTRAINT

### StudentSkillState Remains Single Source of Mastery

**ReviewAssignment and ReviewOutcome are READ-ONLY observations.**

```
Activity Completed
    ↓
BKT Service
    ↓
StudentSkillState.masteryProbability UPDATED
    ↓
ReviewAssignment reads masteryProbability (snapshot)
    ↓
Review Activity Completed
    ↓
BKT Service
    ↓
StudentSkillState.masteryProbability UPDATED
    ↓
ReviewOutcome reads masteryProbability (snapshot)
    ↓
Comparison shows delta, but doesn't modify BKT
```

**Benefit**: Complete audit trail; BKT integrity preserved.

---

## INTEGRATION POINTS

| System | Integration | Constraint |
|--------|-------------|-----------|
| **BKT** | ReviewAssignment reads mastery; ReviewOutcome compares deltas | Read-only; no mastery updates |
| **Ontology** | Semantic filtering before ranking | Hard blocks for accessibility |
| **HybridRecommendation** | Ranks review activities after semantic filter | Modified weights for review context |
| **RecommendationDecision** | ReviewAssignment → RecommendationDecision | Tracks review context |
| **RecommendationOutcome** | Tracks review activity lifecycle | Existing entity, no changes |
| **InteractionEvidence** | Review interaction captured | Existing pipeline, no changes |
| **ExercisePerformance** | Baseline and review metrics | Existing entity, no changes |
| **AdaptationTransition** | Next recommendation informed by ReviewOutcome | Existing entity, no changes |

---

## RESEARCH TRACEABILITY

**Complete Audit Trail**:
```
LearningEvent (baseline)
    ↓
InteractionEvidence (baseline evidence)
    ↓
ReviewAssignment (selection decision + priority score)
    ↓
Activity (review activity)
    ↓
LearningEvent (review interaction)
    ↓
ReviewOutcome (longitudinal comparison + classification)
    ↓
AdaptationTransition (next recommendation)
```

**Answerable Research Questions**:
1. Did accuracy change when a skill was revisited?
2. Did hint dependency change?
3. Did number of attempts change?
4. Did normalized response time change?
5. Was performance retained across sessions?
6. Can the child solve an equivalent unseen instance?
7. How did BKT mastery change between exposures?
8. Which skills repeatedly require remediation?
9. How often did recommendation system correctly identify a skill needing review?
10. What happened after adaptive difficulty increased or decreased?

---

## MISSING DATABASE ENTITIES/FIELDS

### New Entities
1. ✅ `ReviewAssignment` (full schema in design doc)
2. ✅ `ReviewOutcome` (full schema in design doc)

### Fields to Add
- Activity: `templateId`, `isTemplate`, `templateMetadata`, `instanceMetadata`
- LearningEvent: `reviewAssignmentId` (optional, for context)

### No Changes Required
- StudentSkillState (preserved as-is)
- BKT parameters (preserved as-is)
- All existing entities (backward compatible)

---

## IMPLEMENTATION ROADMAP

### Batch 1: Foundation (1-2 weeks)
- ReviewAssignment + ReviewOutcome entities
- ReviewCandidateGenerationService
- ReviewSelectionService
- Unit tests (80%+ coverage)
- **Risk**: Low (additive, no existing code changes)

### Batch 2: Triggers & Integration (1-2 weeks)
- ReviewTriggerService
- Session lifecycle integration
- Recommendation pipeline integration
- Integration tests
- **Risk**: Medium (touches recommendation flow)

### Batch 3: Comparison & Classification (1 week)
- LongitudinalComparisonService
- ReviewOutcome creation
- Progression classification
- Unit tests
- **Risk**: Low (reads-only from existing entities)

### Batch 4: Frontend & Analytics (1-2 weeks)
- Review session UI
- Progression display
- Analytics queries
- Dashboard views
- **Risk**: Low (frontend only)

**Total Timeline**: 5-6 weeks

---

## CONFORMANCE CHECKLIST

### Architectural Constraints
- ✅ StudentSkillState remains single source of mastery
- ✅ Only BKT updates masteryProbability
- ✅ ReviewAssignment/ReviewOutcome are read-only observations
- ✅ Preserves NestJS/Next.js/Python architecture
- ✅ Backward compatible (no breaking changes)

### Feature Requirements
- ✅ Difficulty-driven review (Review Priority Score)
- ✅ Retention assessment (daysSinceLastExposure factor)
- ✅ Generalization through equivalent activities (Activity template/instance)
- ✅ Longitudinal comparison (ReviewOutcome entity)
- ✅ Adaptive progression/regression (classification + difficulty delta)
- ✅ Avoidance of unnecessary repetition (novelty factor + session constraints)

### Design Requirements
- ✅ Review candidate generation with normalized factors
- ✅ Review-selection algorithm with semantic filtering
- ✅ Equivalent activity instance generation
- ✅ Checkpoint vs. retention review detection
- ✅ BKT integration (read-only)
- ✅ Ontology integration (semantic filtering)
- ✅ RecommendationDecision/RecommendationOutcome integration
- ✅ InteractionEvidence integration
- ✅ AdaptationTransition integration
- ✅ Research traceability (complete audit trail)

### Research Integrity
- ✅ No invented scientific claims
- ✅ Experimental thresholds configurable
- ✅ No additional personal data collection
- ✅ Raw metrics always available
- ✅ Classification conservative (INCONCLUSIVE when uncertain)
- ✅ Evidence signals recorded for analysis

---

## KEY DESIGN PRINCIPLES

1. **Preserve Existing Architecture**: Extend, don't replace
2. **Single Source of Mastery**: BKT remains authoritative
3. **Observable, Not Prescriptive**: Review system observes; doesn't dictate learning
4. **Conservative Classification**: Only classify when sufficient evidence exists
5. **Complete Audit Trail**: Every decision traceable to original evidence
6. **Configurable Thresholds**: All parameters adjustable for research
7. **Semantic Constraints First**: Hard blocks before soft scoring
8. **Normalized Factors**: Prevent metric dominance through scaling

---

## NEXT STEPS

1. **Review this design** with team
2. **Validate assumptions** about existing infrastructure
3. **Approve architecture** before implementation
4. **Proceed with Batch 1** (database + core services)

---

**Full Technical Design**: See `LONGITUDINAL_REVIEW_SYSTEM_DESIGN.md`

**Status**: 🟢 READY FOR IMPLEMENTATION
