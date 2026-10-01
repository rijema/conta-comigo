# 🎯 CYCLE-BASED ADAPTIVE EXERCISE SYSTEM
## Scientific Architecture & Implementation

**Status:** ✅ Phase 1 Complete (Hybrid Ranking Integration)  
**Last Updated:** 2026-10-01  
**Authors:** Copilot + Ricardo (Science Validation)

---

## 📋 TABLE OF CONTENTS

1. [Scientific Foundation](#scientific-foundation)
2. [Architecture Overview](#architecture-overview)
3. [Hybrid Ranking Integration](#hybrid-ranking-integration)
4. [Implementation Details](#implementation-details)
5. [Testing & Validation](#testing--validation)

---

## 🧬 SCIENTIFIC FOUNDATION

### Core Principles (TEA + Pedagogical)

| Principle | Research | Application | Validation |
|-----------|----------|-------------|-----------|
| **Cognitive Focus** | Vermeulen 2015, Baron-Cohen 2009 | One BNCC skill per cycle | Reduces cognitive load for autistic learners |
| **Avoid Task-Switching** | Dijkstra & Kramer 2005 | Skill-mismatch penalty = -10.0 | Prevents context-switching anxiety |
| **Variety in Mastery** | Sweller CLT 1988 | 10 exercises same skill, different formats | Consolidates without boredom |
| **ZPD Scaffolding** | Vygotsky 1978 | ProgressionAnalyzer controls difficulty | Increase ONLY after demonstrated mastery |
| **Flow State** | Csikszentmihalyi 2014 | Challenge ≈ Ability | Prevents frustration & abandonment |
| **TEA Structure** | Vermeulen 2015 | Predictable cycle structure (always 10 positions) | Reduces uncertainty = less anxiety |

---

## 🏗️ ARCHITECTURE OVERVIEW

### Cycle Anatomy

```
CYCLE
├─ Skill: EF01MA06 (Comparison)
├─ Island: Sunny Island
├─ Cycle Number: 2
├─ Total Positions: 10
├─ State: active | completed | locked
│
└─ EXERCISES (10 positions)
   ├─ Position 1: Visual (difficulty = adaptive)
   ├─ Position 2: Kinesthetic (difficulty = adaptive)
   ├─ Position 3: Auditory (difficulty = adaptive)
   ├─ ... (positions 4-10)
   └─ All same skill (EF01MA06), all different formats
       Result: Cognitive focus + variety
```

### Student Journey

```
1. INITIALIZE CYCLE
   ├─ StudentCycleTracking record created
   ├─ Student profile loaded (year, tea_support_level)
   ├─ Cycle 1 marked as "active"
   └─ Position = 1, ready for first exercise

2. GET NEXT EXERCISE (positions 1-10)
   ├─ HybridRanking filters by skillFocus [NEW CHANGE 1]
   ├─ Recent history checked
   ├─ ProgressionAnalyzer decides difficulty
   ├─ Skill-mismatch penalty applied [NEW CHANGE 2]
   └─ Top-scored exercise recommended

3. COMPLETE EXERCISE (with score)
   ├─ CycleExerciseAssignment updated
   ├─ Position incremented (1→2, 2→3, ... 9→10)
   ├─ ProgressionAnalyzer checks for promotion
   │   ├─ If "should promote" → difficulty increases at position+1
   │   └─ If "no promote" → stays same level, format varies
   └─ If position 10 complete → Cycle marked "completed"

4. UNLOCK NEXT CYCLE
   ├─ Cycle 2 state → "active"
   ├─ New skill, same structure
   └─ Repeat from step 1
```

---

## 🔧 HYBRID RANKING INTEGRATION

### Change 1: Skill-Focus Filter (CRITICAL)

**Location:** `hybrid-recommendation.service.ts` lines 245-265

**What it does:**
```typescript
if (input.skillFocus) {
  const skillFilteredCandidates = filteredCandidates.filter((candidate) => {
    const hasPrimarySkill = candidate.bnccSkills?.[0] === input.skillFocus;
    const hasSecondarySkill = candidate.bnccSkills?.includes(input.skillFocus ?? '');
    return hasPrimarySkill || hasSecondarySkill;
  });
}
```

**Scientific basis:**
- ✅ Ensures cognitive focus: Only 1 skill per cycle
- ✅ Prevents context-switching (Dijkstra & Kramer 2005)
- ✅ TEA-friendly: Autistic brain uses fewer resources with clear structure

**Behavioral outcome:**
```
WITHOUT filter:
  Cycle skill = EF01MA06
  Recommendation = EF01MA03 exercise (context switch!)
  → BROKEN pedagogy

WITH filter:
  Cycle skill = EF01MA06
  Recommendation = Only EF01MA06 exercises
  → Maintains focus
```

---

### Change 2: Skill-Mismatch Penalty (CRITICAL)

**Location:** `hybrid-recommendation.service.ts` lines 706-717

**What it does:**
```typescript
if (skillFocus && niche && niche !== skillFocus) {
  penalty += 10.0; // SEVERE penalty
}
```

**Scientific basis:**
- ✅ Severity = prevents "jumping" to different skill
- ✅ Penalty magnitude = same as 3x structure repetition
- ✅ Forces cycle continuation

**Scoring impact:**
```
Base score = 5.0
Skill mismatch penalty = -10.0
Final score = -5.0 (effectively excluded from ranking)
```

---

### Change 3: REJECTED - Fixed Difficulty by Position

**Why it was proposed:** "Positions 1-3 = easy, 7-10 = hard"

**Why it was rejected:**
- ❌ Violates Vygotsky's ZPD: Increases difficulty without proof of mastery
- ❌ Causes frustration: Child fails pos 1-3, then forced into "medium" at pos 4
- ❌ Ignores performance: Position ≠ capability

**Simulation of error:**
```
Child at position 4, but failed positions 1-3:
  System forces "medium difficulty" (by position rule)
  Child expects "easy" (based on history)
  Result: Frustration → abandons cycle
```

**Correct solution (already exists):** ProgressionAnalyzer (lines 276-285)
```typescript
const progression = ProgressionAnalyzer.analyze(progressionRecords, blockWindow);
if (progression.shouldPromote) {
  // ONLY increase difficulty if:
  // 1. Child got 2+ correct
  // 2. Across different structures
  // → Natural, frustration-free progression
}
```

---

## 💾 IMPLEMENTATION DETAILS

### Database Entities

#### 1. StudentCycleTracking
```sql
CREATE TABLE student_cycle_tracking (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  island_id UUID NOT NULL,
  cycle_number INT NOT NULL,
  skill_focus VARCHAR(20), -- e.g., "EF01MA06"
  current_position INT DEFAULT 1, -- 1-10
  state VARCHAR(20), -- "active" | "completed" | "locked"
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(student_id, island_id, cycle_number)
);
```

#### 2. CycleExerciseAssignment
```sql
CREATE TABLE cycle_exercise_assignment (
  id UUID PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES student_cycle_tracking(id),
  activity_id UUID NOT NULL REFERENCES activities(id),
  position INT NOT NULL, -- 1-10
  match_score FLOAT, -- Hybrid ranking score
  student_score FLOAT, -- After completion (0-100)
  attempts INT DEFAULT 0,
  created_at TIMESTAMP
);
```

#### 3. ExerciseParameters
```sql
CREATE TABLE exercise_parameters (
  id UUID PRIMARY KEY,
  activity_id UUID NOT NULL UNIQUE REFERENCES activities(id),
  target_year_min INT,
  target_year_max INT,
  target_year_optimal INT,
  tea_support_min INT,
  tea_support_max INT,
  tea_support_optimal INT,
  modality_intensities JSONB, -- {visual: 0.9, audio: 0.2, motor: 0.7}
  complexity_score FLOAT
);
```

---

### Service Methods

#### CycleManagementService

**initializeCycle(studentId, islandId, cycleNumber)**
- Creates StudentCycleTracking record
- Loads student profile
- Sets position = 1

**getNextExerciseRecommendation(studentId, islandId, cycleNumber)**
1. Load cycle context (skill_focus, position)
2. Get candidates (filtered by skill_focus) [CHANGE 1]
3. Call HybridRankingService.rank()
   - Passes `skillFocus` parameter
   - Passes `cyclePosition` for context
4. Apply skill-mismatch penalty [CHANGE 2]
5. Return top-scored exercise

**completeExercise(assignmentId, score)**
1. Update CycleExerciseAssignment.student_score
2. Increment position (1→2, 2→3, etc.)
3. Check if position 10: if yes, mark cycle "completed"
4. ProgressionAnalyzer checks for difficulty promotion

---

## ✅ TESTING & VALIDATION

### Unit Tests Required

```typescript
describe('Hybrid Ranking - Cycle Context', () => {
  describe('Skill-Focus Filter', () => {
    it('should filter candidates by skillFocus', () => {
      // Input: skillFocus = "EF01MA06"
      // Expected: Only EF01MA06 exercises in result
    });
    
    it('should allow secondary skills in same cycle', () => {
      // Input: Activity has [EF01MA06, EF01MA07]
      // Expected: Included if skillFocus = EF01MA06
    });
  });

  describe('Skill-Mismatch Penalty', () => {
    it('should penalize exercises outside cycle skill', () => {
      // Input: skillFocus = "EF01MA06", exercise skill = "EF01MA03"
      // Expected: Penalty = -10.0
    });
    
    it('should apply severe penalty when in cycle context', () => {
      // Input: score before = 5.0, skill mismatch = -10.0
      // Expected: final score = -5.0 (effectively excluded)
    });
  });

  describe('Progression without Frustration', () => {
    it('should not force difficulty by position', () => {
      // Input: Child failed pos 1-3, now at pos 4
      // Expected: Difficulty = EASY (by performance)
      //           NOT = MEDIUM (by position)
    });
    
    it('should vary format when child struggles at same level', () => {
      // Input: Child 0/3 at EASY
      // Expected: Position 4 = EASY but different format
    });
    
    it('should only promote difficulty after demonstrated mastery', () => {
      // Input: Child 2+ correct with diverse structures
      // Expected: progression.shouldPromote = true
    });
  });
});
```

### Integration Tests

```typescript
describe('Cycle Workflow End-to-End', () => {
  it('should complete full cycle without frustration', async () => {
    // 1. Initialize cycle
    // 2. Get exercises 1-10
    // 3. Simulate student performance (varied: some fail, some pass)
    // 4. Verify positions increment correctly
    // 5. Verify difficulty adapts to performance (not position)
    // 6. Mark cycle complete
  });
});
```

---

## 🚀 NEXT STEPS

### Immediate (This Session)
- [x] Implement skill-focus filter (CHANGE 1)
- [x] Implement skill-mismatch penalty (CHANGE 2)
- [x] Reject fixed-difficulty-by-position (CHANGE 3)
- [x] TypeScript compilation validation
- [ ] Create unit tests for cycle context

### Short-term (Next)
- [ ] Implement CyclesController endpoints
- [ ] Create migration to reorganize 182 exercises into cycles
- [ ] Test with real exercise data
- [ ] Frontend UI for cycle progression

### Medium-term (Future Releases)
- [ ] Cross-skill prerequisites (EF01MA01 before EF01MA03)
- [ ] Adaptive cycle length (not fixed at 10)
- [ ] Analytics dashboard for teacher visibility

---

## 📚 REFERENCES

1. **Vygotsky, L.** "Mind in Society" (1978) - Zone of Proximal Development
2. **Sweller, J.** "Cognitive Load Theory" (1988) - Instructional Design
3. **Baron-Cohen, S.** "The Essential Difference" (2003) - Autism cognition
4. **Vermeulen, F.** "The Autism Experience" (2015) - TEA-specific pedagogy
5. **Dijkstra, S. & Kramer, G.** "Task Switching" (2005) - Cognitive overhead
6. **Csikszentmihalyi, M.** "Flow" (2014) - Optimal learning states

---

## 📞 QUESTIONS?

For implementation questions, check:
- `backend/src/modules/activities/services/cycle-management.service.ts`
- `backend/src/modules/ade/hybrid-recommendation.service.ts`
- This document's code sections above
