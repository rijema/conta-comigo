# Longitudinal Review System — Quick Reference

**Status**: 🔍 DESIGN COMPLETE  
**Documents**: 
- `LONGITUDINAL_REVIEW_SYSTEM_DESIGN.md` (full technical design, 1088 lines)
- `LONGITUDINAL_REVIEW_EXECUTIVE_SUMMARY.md` (executive overview, 336 lines)
- `LONGITUDINAL_REVIEW_BATCH_1_GUIDE.md` (implementation guide, 1457 lines)

---

## WHAT IS THIS SYSTEM?

A **longitudinal review mechanism** that allows ContaComigo to observe whether children demonstrate changes when previously practiced mathematical skills are encountered again over time.

**Key Constraint**: StudentSkillState remains the single source of mastery. Review system is **read-only observation**, not an independent mastery model.

---

## CORE COMPONENTS

### 1. Review Priority Score (Normalized 0..1)

Identifies WHAT should be reviewed:
- **25%** Difficulty-driven (targets skills near mastery boundary)
- **25%** Retention (exponential decay by days since exposure)
- **20%** Generalization (sufficient prior exposure + high accuracy)
- **15%** Semantic importance (prerequisite weight from ontology)
- **15%** Novelty (prevents over-reviewing)

### 2. Three Review Types

| Type | Trigger | Activity | Composition |
|------|---------|----------|-------------|
| **REMEDIATION** | Low mastery or recent errors | Same/easier difficulty, different format | 60% remediation + 20% retention + 20% generalization |
| **RETENTION** | Mastered but not seen recently | Same difficulty, different instance | 20% remediation + 60% retention + 20% generalization |
| **GENERALIZATION** | High accuracy, sufficient exposure | Same/harder difficulty, different representation | 20% remediation + 20% retention + 60% generalization |

### 3. Activity Template vs Instance

**Template** (isTemplate=true):
- Pedagogical structure
- Difficulty dimensions (numerical magnitude, complexity, abstraction, etc.)

**Instance** (isTemplate=false):
- Concrete realization with specific parameters
- References templateId
- Can be parametrically generated

### 4. Progression Classification

**Conservative Model** (only classify when sufficient evidence):
- **IMPROVED**: accuracy ↑ AND efficiency ↑
- **STABLE**: minimal changes
- **NEEDS_SUPPORT**: accuracy ↓ OR efficiency ↓↓
- **INCONCLUSIVE**: mixed signals

---

## DATABASE ENTITIES

### ReviewAssignment
Links baseline evidence → review selection → review activity

**Key Fields**:
- `studentId`, `skillId`, `reviewType`
- `sourceInteractionIds[]`, `sourceRecommendationIds[]`
- `selectedActivityTemplateId`, `selectedActivityInstanceId`
- `priorityScore`, `scoringBreakdown`
- `baselineState` (mastery, difficulty, attempts, accuracy, hints, responseTime)

**Indexes**: (studentId, skillId, createdAt), (studentId, createdAt)

### ReviewOutcome
Compares baseline vs. review performance

**Key Fields**:
- `reviewAssignmentId` (links back to baseline)
- `baselineMetrics`, `reviewMetrics`
- `deltas`, `normalizedDeltas`
- `progressionClassification` (IMPROVED|STABLE|NEEDS_SUPPORT|INCONCLUSIVE)
- `evidenceSignals[]`, `classificationReason`

**Indexes**: (reviewAssignmentId), (studentId, skillId, createdAt)

### Activity Extensions
- `templateId` (UUID, nullable)
- `isTemplate` (boolean)
- `templateMetadata` (JSONB)
- `instanceMetadata` (JSONB)

---

## CORE SERVICES

### ReviewCandidateGenerationService
Identifies skills needing review

**Methods**:
- `generateReviewCandidates(studentId, options?)`: Returns ranked list
- `calculateReviewPriorityScore(studentId, skillId, evidence)`: Calculates score

**Factors Calculated**:
- difficultyScore
- retentionScore
- generalizationScore
- semanticScore
- noveltyScore

### ReviewSelectionService
Selects appropriate review activity

**Methods**:
- `selectReviewActivity(studentId, skillId, reviewType, learnerProfile)`: Returns selected activity
- `generateEquivalentInstance(templateId, reviewType)`: Generates new instance

**Pipeline**:
1. Get eligible activities for skill
2. Apply semantic filtering (hard blocks for accessibility)
3. Rank by review type
4. Select top candidate
5. Generate equivalent instance

---

## SEMANTIC FILTERING PIPELINE

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

## IMPLEMENTATION ROADMAP

### Batch 1: Foundation (1-2 weeks)
- ReviewAssignment + ReviewOutcome entities
- ReviewCandidateGenerationService
- ReviewSelectionService
- Unit tests (80%+ coverage)
- **Risk**: Low

### Batch 2: Triggers & Integration (1-2 weeks)
- ReviewTriggerService
- Session lifecycle integration
- Recommendation pipeline integration
- Integration tests
- **Risk**: Medium

### Batch 3: Comparison & Classification (1 week)
- LongitudinalComparisonService
- ReviewOutcome creation
- Progression classification
- Unit tests
- **Risk**: Low

### Batch 4: Frontend & Analytics (1-2 weeks)
- Review session UI
- Progression display
- Analytics queries
- Dashboard views
- **Risk**: Low

**Total Timeline**: 5-6 weeks

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

## CONFIGURATION PARAMETERS

All configurable via environment variables:

```
# Review Priority Score
REVIEW_RETENTION_HALF_LIFE_DAYS=14
REVIEW_MIN_ATTEMPTS_GENERALIZATION=5
REVIEW_MAX_REVIEWS_PER_SKILL=3

# Existing (reused)
HYBRID_TARGET_SUCCESS_PROBABILITY=0.7
BKT_PRIOR_KNOWLEDGE=0.1
```

---

## CONFORMANCE CHECKLIST

### Architectural Constraints
- ✅ StudentSkillState remains single source of mastery
- ✅ Only BKT updates masteryProbability
- ✅ ReviewAssignment/ReviewOutcome are read-only observations
- ✅ Preserves NestJS/Next.js/Python architecture
- ✅ Backward compatible (no breaking changes)

### Feature Requirements
- ✅ Difficulty-driven review
- ✅ Retention assessment
- ✅ Generalization through equivalent activities
- ✅ Longitudinal comparison
- ✅ Adaptive progression/regression
- ✅ Avoidance of unnecessary repetition

### Design Requirements
- ✅ Review candidate generation with normalized factors
- ✅ Review-selection algorithm with semantic filtering
- ✅ Equivalent activity instance generation
- ✅ Checkpoint vs. retention review detection
- ✅ BKT integration (read-only)
- ✅ Ontology integration (semantic filtering)
- ✅ Complete research traceability

---

## WHAT'S NOT INCLUDED

- ❌ Frontend implementation (Batch 4)
- ❌ ReviewTriggerService (Batch 2)
- ❌ LongitudinalComparisonService (Batch 3)
- ❌ Analytics dashboard (Batch 4)
- ❌ Parametric activity generation (future enhancement)

---

## NEXT STEPS

1. **Review** this design with team
2. **Validate** assumptions about existing infrastructure
3. **Approve** architecture before implementation
4. **Proceed** with Batch 1 (use `LONGITUDINAL_REVIEW_BATCH_1_GUIDE.md`)

---

## DOCUMENT REFERENCE

| Document | Purpose | Length |
|----------|---------|--------|
| `LONGITUDINAL_REVIEW_SYSTEM_DESIGN.md` | Full technical design | 1088 lines |
| `LONGITUDINAL_REVIEW_EXECUTIVE_SUMMARY.md` | Executive overview | 336 lines |
| `LONGITUDINAL_REVIEW_BATCH_1_GUIDE.md` | Implementation guide | 1457 lines |
| `LONGITUDINAL_REVIEW_QUICK_REFERENCE.md` | This document | ~300 lines |

---

**Status**: 🟢 READY FOR IMPLEMENTATION
