# Batch 1 Implementation — Longitudinal Review System Foundation

**Status**: ✅ COMPLETE  
**Date**: September 24, 2026  
**Timeline**: Foundation + Scoring (1-2 weeks estimated)

---

## IMPLEMENTATION SUMMARY

Batch 1 implements the foundation of the Longitudinal Review System with focus on review candidate generation and scoring.

### What Was Implemented

1. **ReviewAssignment Entity** — Persistence for review selection decisions
2. **ReviewOutcome Entity** — Foundation for longitudinal comparison (classification deferred to Batch 3)
3. **Database Migrations** — Two migrations for new entities with proper indexes
4. **ReviewCandidateGenerationService** — 8-factor behavioral scoring with normalization
5. **Unit Tests** — 19 comprehensive tests covering all scoring factors
6. **Module Registration** — Integration with LearningEventsModule

### What Was NOT Implemented (Out of Scope)

- ❌ ReviewSelectionService (deferred to Batch 2)
- ❌ ReviewTriggerService (deferred to Batch 2)
- ❌ LongitudinalComparisonService (deferred to Batch 3)
- ❌ Progression classification (deferred to Batch 3)
- ❌ Frontend/UI changes (deferred to Batch 4)
- ❌ Parametric activity generation (deferred to future)

---

## FILES CREATED

### Entities (2 files)
- `backend/src/modules/learning-events/entities/review-assignment.entity.ts` (103 lines)
- `backend/src/modules/learning-events/entities/review-outcome.entity.ts` (112 lines)

### Migrations (2 files)
- `backend/src/database/migrations/1726950000000-AddReviewAssignments.ts` (121 lines)
- `backend/src/database/migrations/1726950001000-AddReviewOutcomes.ts` (120 lines)

### Services (1 file)
- `backend/src/modules/learning-events/services/review-candidate-generation.service.ts` (375 lines)

### Tests (1 file)
- `backend/src/modules/learning-events/services/__tests__/review-candidate-generation.service.spec.ts` (435 lines)

### Documentation (1 file)
- `BATCH_1_IMPLEMENTATION.md` (this file)

---

## TECHNICAL DETAILS

### ReviewAssignment Entity

**Purpose**: Persist review selection decisions with complete traceability

**Key Fields**:
- `studentId`, `skillId`, `reviewType` (REMEDIATION|RETENTION|GENERALIZATION)
- `sourceInteractionIds[]`, `sourceRecommendationIds[]` — Reconstructable baseline
- `selectedActivityTemplateId`, `selectedActivityInstanceId` — Selected activity
- `priorityScore` — Final score [0,1]
- `scoringConfiguration` — Versioned weights, thresholds, timestamp
- `scoringBreakdown` — All 8 behavioral factors
- `baselineState` — Snapshot of baseline evidence

**Indexes**:
- (studentId, skillId, createdAt)
- (studentId, createdAt)

### ReviewOutcome Entity

**Purpose**: Foundation for longitudinal comparison (classification in Batch 3)

**Key Fields**:
- `reviewAssignmentId` — Link to baseline decision
- `baselineMetrics`, `reviewMetrics` — Raw performance data
- `deltas` — Raw differences (accuracyDelta, responseTimeDelta, etc.)
- `normalizedDeltas` — Scaled [-1, +1] for comparison
- `metadata` — Longitudinal context (instanceComparison, difficultyComparison, etc.)
- `progressionClassification` — IMPROVED|STABLE|NEEDS_SUPPORT|INCONCLUSIVE (populated in Batch 3)
- `evidenceSignals[]` — Recorded signals for research

**Indexes**:
- (reviewAssignmentId)
- (studentId, skillId, createdAt)

### ReviewCandidateGenerationService

**8 Behavioral Factors** (all normalized to [0,1]):

1. **Error Frequency** (w=0.20)
   - `errorScore = incorrectAttempts / totalAttempts`
   - Source: LearningEvent.correct

2. **Attempt Efficiency** (w=0.15)
   - `attemptScore = 1 - min(totalAttempts / maxExpectedAttempts, 1)`
   - Source: ExercisePerformance.attemptNumber

3. **Help Dependency** (w=0.15)
   - `helpScore = 1 - min(totalHints / maxExpectedHints, 1)`
   - Source: LearningEvent.hintsUsed

4. **Engagement Signals** (w=0.10)
   - `engagementScore = 1 - (skipCount + changeRequestCount) / totalExposures`
   - Source: LearningEvent.ACTIVITY_SKIPPED, AdaptationTransition.changeRequested

5. **Response Time** (w=0.10) — **CRITICAL**
   - Uses sigmoid to prevent millisecond dominance
   - `responseTimeScore = 1 / (1 + e^((medianResponseTime - slowThreshold) / slowThreshold))`
   - **Explicit**: Faster response alone NEVER means improvement
   - Source: LearningEvent.responseTimeMs

6. **Completion Rate** (w=0.10)
   - `completionScore = completedActivities / presentedActivities`
   - Source: LearningEvent.ACTIVITY_COMPLETED

7. **BKT Mastery State** (w=0.10)
   - `masteryScore = 1 - abs(masteryProbability - targetSuccessProbability) / targetSuccessProbability`
   - Targets skills near decision boundary
   - Source: StudentSkillState.masteryProbability (READ-ONLY)

8. **Recency/Retention** (w=0.10)
   - `recencyScore = exp(-daysSinceLastExposure / retentionHalfLife)`
   - Exponential decay
   - Source: LearningEvent.timestamp

**Final Score**:
```
reviewPriorityScore = 
  0.20 * errorScore +
  0.15 * attemptScore +
  0.15 * helpScore +
  0.10 * engagementScore +
  0.10 * responseTimeScore +
  0.10 * completionScore +
  0.10 * masteryScore +
  0.10 * recencyScore
```

**Configurable Parameters**:
- `REVIEW_RETENTION_HALF_LIFE_DAYS` (default: 14)
- `REVIEW_MIN_ATTEMPTS_GENERALIZATION` (default: 5)
- `REVIEW_MAX_REVIEWS_PER_SKILL` (default: 3)
- `HYBRID_TARGET_SUCCESS_PROBABILITY` (default: 0.7)
- `REVIEW_SLOW_RESPONSE_THRESHOLD_MS` (default: 10000)
- `REVIEW_MAX_EXPECTED_ATTEMPTS` (default: 3)
- `REVIEW_MAX_EXPECTED_HINTS` (default: 5)

---

## TEST COVERAGE

**19 Tests** covering:

### Score Normalization (8 tests)
- ✅ Score remains in [0,1]
- ✅ All 8 factors normalize correctly
- ✅ Missing evidence handled safely

### Response Time Handling (2 tests)
- ✅ Faster response alone does NOT indicate improvement
- ✅ Response time cannot dominate score

### Scoring Configuration (2 tests)
- ✅ Configuration persisted with version
- ✅ Configured weights respected

### Baseline Selection (2 tests)
- ✅ Source interaction IDs preserved
- ✅ Missing evidence handled gracefully

### Review Type Determination (3 tests)
- ✅ REMEDIATION for low mastery
- ✅ GENERALIZATION for high accuracy + sufficient attempts
- ✅ RETENTION for mastered but not recent

### Mastery Constraint (1 test)
- ✅ Mastery READ but never MUTATED

### Determinism (1 test)
- ✅ Deterministic scores for same inputs

---

## ARCHITECTURAL COMPLIANCE

### Preserved Constraints
- ✅ StudentSkillState remains single source of mastery
- ✅ Only BKT/KnowledgeTracingService updates masteryProbability
- ✅ ReviewCandidateGenerationService reads mastery but never modifies it
- ✅ No parallel mastery implementations

### Reused Infrastructure
- ✅ LearningEvent (append-only event log)
- ✅ InteractionEvidence (multimodal signals)
- ✅ ExercisePerformance (performance metrics)
- ✅ StudentSkillState (mastery source)
- ✅ LearningEventsModule (existing module structure)

### Scientific Integrity
- ✅ Weights are configurable heuristics, NOT empirically validated
- ✅ All parameters configurable and versioned
- ✅ Raw evidence preserved
- ✅ No fabricated evidence
- ✅ Response time normalization prevents metric dominance
- ✅ Faster response alone NEVER means improvement

---

## MIGRATION INSTRUCTIONS

### 1. Run Migrations
```bash
npm run typeorm migration:run
```

### 2. Verify Database Schema
```sql
-- Check ReviewAssignment table
\d review_assignments

-- Check ReviewOutcome table
\d review_outcomes

-- Check enum types
\dT review_type_enum
\dT progression_classification_enum
```

### 3. Run Tests
```bash
npm test -- --testPathPattern="review-candidate-generation"
```

### 4. Build
```bash
npm run build
```

---

## NEXT STEPS (Batch 2)

### ReviewSelectionService
- Semantic filtering (hard blocks for accessibility)
- Activity ranking using HybridRecommendationService
- Instance selection/generation

### ReviewTriggerService
- Session boundary detection (clinical encounter + 1-hour gap)
- Checkpoint review trigger (end of island/cycle)
- Retention review trigger (new session + time interval)

### Integration
- Session lifecycle integration
- Recommendation pipeline integration
- Activity completion flow integration

---

## KNOWN LIMITATIONS

### Out of Scope for Batch 1
- Parametric activity generation (deferred to future)
- Progression classification (deferred to Batch 3)
- Frontend/UI (deferred to Batch 4)
- Analytics dashboard (deferred to Batch 4)

### Deferred Decisions
- Exact parametric generation algorithm
- Scoring configuration versioning strategy (recommend: timestamp + hash)
- Session gap threshold validation (recommend: clinical team input)
- Baseline selection window validation (recommend: research team input)

---

## VERIFICATION CHECKLIST

- ✅ Entities created and typed correctly
- ✅ Migrations created with proper indexes
- ✅ Service implements 8 behavioral factors
- ✅ All factors normalized to [0,1]
- ✅ Response time uses sigmoid (prevents dominance)
- ✅ Faster response alone NEVER means improvement
- ✅ Scoring configuration versioned
- ✅ Baseline source IDs preserved
- ✅ Mastery READ but never MUTATED
- ✅ 19 unit tests passing
- ✅ Build compiles without errors
- ✅ Module registered correctly
- ✅ No breaking changes to existing code

---

## IMPLEMENTATION NOTES

### Design Decisions Made

1. **8 Behavioral Factors** — Replaces original 5-factor model
   - Rationale: More granular evidence from existing platform
   - All normalized independently to prevent dominance

2. **Sigmoid for Response Time** — Prevents millisecond-scale metrics from dominating
   - Rationale: Response time is important but not primary
   - Explicit: Faster response alone NEVER means improvement

3. **Configurable Weights** — All weights versioned for reproducibility
   - Rationale: Heuristics, not empirically validated
   - Persisted in ReviewAssignment for auditability

4. **Source Interaction IDs** — Preserved for baseline reconstruction
   - Rationale: Complete traceability for research
   - Enables re-analysis with different scoring configurations

5. **Review Type Determination** — Simple heuristic in Batch 1
   - REMEDIATION: masteryProbability < 0.5 OR accuracy < 0.7
   - GENERALIZATION: accuracy > 0.8 AND attempts >= 5
   - RETENTION: else (mastered but not recent)
   - Rationale: Baseline selection strategy deferred to Batch 2

---

## TECHNICAL DEBT / FUTURE WORK

- [ ] Parametric activity generation algorithm
- [ ] Scoring configuration versioning strategy
- [ ] Session gap threshold validation
- [ ] Baseline selection window validation
- [ ] ReviewSelectionService (Batch 2)
- [ ] ReviewTriggerService (Batch 2)
- [ ] LongitudinalComparisonService (Batch 3)
- [ ] Progression classification (Batch 3)
- [ ] Frontend integration (Batch 4)

---

**Status**: ✅ BATCH 1 COMPLETE  
**Test Results**: 19/19 passing  
**Build Status**: ✅ Compiles without errors  
**Ready for Batch 2**: YES
