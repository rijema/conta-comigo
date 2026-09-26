# Longitudinal Review System — Design Revision Summary

**Date**: September 24, 2026  
**Status**: ✅ REVISION COMPLETE  
**Document Updated**: `LONGITUDINAL_REVIEW_SYSTEM_DESIGN.md` (1,088 → 1,313 lines)

---

## SECTIONS CHANGED

### 1. Section 3.1: Review Priority Score Design
**Changes**:
- Added disclaimer: weights are **initial configurable heuristics**, NOT scientifically validated
- Replaced 5 factors with **8 behavioral evidence factors** from existing platform:
  1. Error Frequency (0.20)
  2. Attempt Efficiency (0.15)
  3. Help Dependency (0.15)
  4. Engagement Signals (0.10)
  5. Response Time (0.10) — **with critical note: faster alone ≠ improvement**
  6. Completion Rate (0.10)
  7. BKT Mastery State (0.10)
  8. Recency/Retention (0.10)
- Made all weights **configurable** (sum to 1.0)
- Added `scoringConfiguration` versioning for reproducibility
- Emphasized response time normalization prevents metric dominance
- **Explicit**: "Faster response alone NEVER means improvement"

### 2. Section 3.2: Review Types and Baseline Selection
**Changes**:
- Added **explicit baseline selection strategy** for each review type:
  - **REMEDIATION**: Most recent interactions with errors/low accuracy
  - **RETENTION**: Most recent successful interactions from 7-30+ days ago
  - **GENERALIZATION**: Most recent successful interactions with high accuracy
- All `sourceInteractionIds` and `sourceRecommendationIds` must be stored
- Baseline must be **reconstructable** from stored source IDs
- Added note: "Baseline must be reconstructable from stored source IDs" (3 times)

### 3. Section 3.4.1: Generalization Instance Types (NEW)
**Changes**:
- Added 4 explicit instance comparison types:
  1. **EXACT_REPEAT**: Identical instance (NOT generalization)
  2. **EQUIVALENT_INSTANCE**: Same template, different parameters (IS generalization)
  3. **DIFFICULTY_PROGRESSION**: Same template, increased difficulty (IS generalization with progression)
  4. **DIFFICULTY_SUPPORT**: Same template, decreased difficulty (IS remediation/support)
- ReviewOutcome must record which type was used

### 4. Section 3.5: Review Session Composition
**Changes**:
- Clarified 60/20/20 composition is **initial heuristic, NOT empirically optimal**
- Added **graceful degradation**: redistribute slots if insufficient candidates
- Example: If only 4 remediation candidates, allocate 4+3+3 instead of 6+2+2
- Never force empty slots or repeat activities

### 5. Section 3.6: Review Triggers (Retention Review)
**Changes**:
- Added **real learning-session boundary** definition
- **CRITICAL**: Page refresh, route change, reconnect during same clinical encounter must NOT trigger new retention review
- Real boundary = clinical encounter boundary, not technical sessionId change
- Detection strategy:
  - Track `lastActivityTimestamp` per student
  - If `currentTime - lastActivityTimestamp < 1 hour` (configurable), same session
  - If `currentTime - lastActivityTimestamp >= 1 hour`, new session
  - Educator can explicitly mark session boundaries

### 6. Section 3.8: Progression/Regression Classification
**Changes**:
- **Removed simplistic rules**:
  - ❌ IMPROVED = accuracy up AND efficiency up
  - ❌ Faster response alone = improvement
  - ❌ Slower response alone = regression
- Changed signal range from [0,1] to **[-1, +1]** for clarity
- Added **4 explicit examples of conflicting signals** → INCONCLUSIVE:
  - Faster + more errors = INCONCLUSIVE
  - Slower + higher accuracy = INCONCLUSIVE
  - Similar accuracy + fewer attempts = INCONCLUSIVE
  - Maintained performance on harder task = INCONCLUSIVE
- Expanded evidence signals from 5 to 10 (added decline signals, variable attempts, etc.)
- **Explicit**: "Raw metrics are primary research data"

### 7. Section 2.1: ReviewAssignment Entity
**Changes**:
- Added `scoringConfiguration` field (version, weights, thresholds, timestamp)
- Updated `scoringBreakdown` to include all 8 behavioral factors
- Made all fields **configurable and versioned** for reproducibility

### 8. Section 2.1: ReviewOutcome Entity
**Changes**:
- **Expanded raw longitudinal evidence** fields:
  - `deltas`: accuracyDelta, responseTimeDelta, attemptsDelta, hintsDelta, masteryDelta
  - `normalizedDeltas`: all [-1, +1] with explicit meaning
- Expanded `metadata` to include:
  - `instanceComparison`: EXACT_REPEAT | EQUIVALENT_INSTANCE | DIFFICULTY_PROGRESSION | DIFFICULTY_SUPPORT
  - `difficultyComparison`: same | harder | easier
  - `daysSinceBaseline`: temporal context
  - `sameTemplate`, `sameInstance`: tracking
  - `reviewType`: for context
- **Explicit**: "Raw metrics are primary research data"

### 9. NEW Section 5.5: Scientific Claims and Limitations
**Changes**:
- Added explicit section on what system measures (behavioral/performance changes in ContaComigo)
- Added explicit section on what system does NOT measure (causality, learning gains, generalization outside platform)
- Added requirements for interpretation (experimental design, independent assessment, triangulation)
- Added **auditability and reproducibility** subsection with complete decision chain
- Added persistence requirements for all intermediate steps
- Added reproducibility guarantees (same ReviewAssignment can be re-analyzed, raw metrics preserved)

---

## FINAL REVIEW PRIORITY SCORE

**8 Configurable Behavioral Factors** (all normalized to [0,1]):

```
reviewPriorityScore = 
  w_error * errorScore +
  w_attempts * attemptScore +
  w_help * helpScore +
  w_engagement * engagementScore +
  w_responseTime * responseTimeScore +
  w_completion * completionScore +
  w_mastery * masteryScore +
  w_recency * recencyScore

Default weights: 0.20, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10
All weights configurable (sum to 1.0)
Scoring configuration versioned and persisted in ReviewAssignment
```

**Key Properties**:
- ✅ All weights configurable
- ✅ All weights versioned for reproducibility
- ✅ Response time normalized (prevents millisecond dominance)
- ✅ Faster response alone NEVER means improvement
- ✅ All factors normalized to [0,1] independently
- ✅ Baseline selection strategy explicit for each review type
- ✅ Baseline reconstructable from sourceInteractionIds

---

## FIELDS ADDED/CHANGED

### ReviewAssignment
**Added**:
- `scoringConfiguration` (JSONB): version, weights, thresholds, timestamp

**Changed**:
- `scoringBreakdown`: Now includes all 8 behavioral factors (errorScore, attemptScore, helpScore, engagementScore, responseTimeScore, completionScore, masteryScore, recencyScore)

### ReviewOutcome
**Added**:
- `metadata.instanceComparison`: EXACT_REPEAT | EQUIVALENT_INSTANCE | DIFFICULTY_PROGRESSION | DIFFICULTY_SUPPORT
- `metadata.daysSinceBaseline`: temporal context
- `metadata.sameTemplate`: boolean
- `metadata.sameInstance`: boolean
- `metadata.reviewType`: for context

**Changed**:
- `deltas`: Now explicit (accuracyDelta, responseTimeDelta, attemptsDelta, hintsDelta, masteryDelta)
- `normalizedDeltas`: Range [-1, +1] with explicit meaning (positive = improvement signal)
- `metadata.difficultyComparison`: Explicit values (same | harder | easier)

### Activity
**No changes** (already designed in original)

---

## UNRESOLVED ARCHITECTURAL DECISIONS

### 1. Parametric Activity Generation
**Status**: Deferred to future enhancement  
**Decision**: How to generate equivalent instances parametrically?
- Current design: Extend Activity entity with templateMetadata/instanceMetadata
- Not yet specified: Algorithm for parametric generation (numerical ranges, object variations, etc.)
- Recommendation: Implement in Batch 2 or 3 after core review system is operational

### 2. Scoring Configuration Versioning
**Status**: Specified but not implemented  
**Decision**: How to version and manage scoring configurations?
- Current design: Store version, weights, thresholds in ReviewAssignment
- Not yet specified: Version control system, rollback strategy, A/B testing setup
- Recommendation: Implement in Batch 1 with simple versioning (timestamp + hash)

### 3. Session Gap Threshold
**Status**: Specified as configurable  
**Decision**: What is the correct session gap threshold?
- Current design: Default 1 hour (configurable)
- Not yet specified: Validation against actual clinical session patterns
- Recommendation: Validate with clinical team before Batch 2

### 4. Baseline Selection Window
**Status**: Specified as configurable  
**Decision**: What is the correct lookback window for baseline selection?
- Current design: RETENTION uses 7-30+ days (configurable)
- Not yet specified: Validation against retention research
- Recommendation: Validate with research team before Batch 2

---

## SUMMARY OF CORRECTIONS

| Aspect | Before | After |
|--------|--------|-------|
| **Weights** | Fixed 25/25/20/15/15 | 8 configurable factors, versioned |
| **Behavioral Evidence** | 5 factors | 8 factors from platform |
| **Response Time** | Could dominate score | Normalized, explicit "faster ≠ better" |
| **Baseline Selection** | Implicit | Explicit strategy per review type |
| **Instance Types** | Not distinguished | 4 types (EXACT_REPEAT, EQUIVALENT, PROGRESSION, SUPPORT) |
| **Session Boundary** | Technical sessionId | Clinical encounter + 1-hour gap |
| **Progression Classification** | Simplistic rules | Conservative multi-signal interpretation |
| **Conflicting Signals** | Not addressed | Explicitly → INCONCLUSIVE |
| **Raw Evidence** | Deltas only | Raw metrics + deltas + normalized deltas |
| **Scientific Claims** | Implicit | Explicit limitations section |
| **Auditability** | Mentioned | Complete decision chain specified |
| **Reproducibility** | Not addressed | Scoring configuration versioned |

---

## DOCUMENT STATISTICS

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Lines | 1,088 | 1,313 | +225 lines |
| Sections | 11 | 12 | +1 section |
| Review Priority Factors | 5 | 8 | +3 factors |
| Instance Types | 0 | 4 | +4 types |
| Evidence Signals | 5 | 10 | +5 signals |
| ReviewOutcome Fields | 4 | 7 | +3 fields |
| Scientific Disclaimers | 0 | 3 | +3 disclaimers |

---

## NEXT STEPS

1. **Review** revised design document
2. **Validate** with research team:
   - Session gap threshold (1 hour)
   - Baseline selection windows (7-30 days for retention)
   - Behavioral evidence factors
3. **Proceed** with Batch 1 implementation using updated design
4. **Implement** scoring configuration versioning in Batch 1
5. **Defer** parametric generation to Batch 2 or 3

---

**Status**: ✅ REVISION COMPLETE — READY FOR BATCH 1 IMPLEMENTATION
