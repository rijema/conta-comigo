# Longitudinal Review and Learning Progression System — Technical Implementation Plan

**Date:** September 24, 2026  
**Status:** 🔍 DESIGN PHASE (No Implementation Yet)  
**Scope:** Architecture analysis and technical design for review mechanism

---

## EXECUTIVE SUMMARY

This document presents a comprehensive technical design for a **longitudinal review mechanism** that allows ContaComigo to observe whether children demonstrate changes when previously practiced mathematical skills are encountered again over time.

The design preserves the existing NestJS/Next.js/Python architecture and respects the critical constraint: **StudentSkillState remains the single source of mastery, updated only by BKT/Knowledge Tracing**.

The review system is **NOT** an independent mastery model. It is an **observation and selection mechanism** that:
1. Identifies which skills/activities are candidates for future review
2. Selects appropriate review activities through semantic filtering and ranking
3. Tracks longitudinal evidence linking baseline → review → comparison
4. Informs adaptive progression/regression decisions without modifying BKT

---

## PART 1: WHAT ALREADY EXISTS

### 1.1 Core Mastery Model

**StudentSkillState** (single source of truth)
- `studentId` + `skillId` (composite key)
- `masteryProbability` (0..1, updated only by BKT)
- `observations` (count of evidence observations)
- `lastUpdatedAt` (timestamp)

**KnowledgeTracingService**
- Calls ML service `/predict/bkt` endpoint
- Updates `masteryProbability` based on `correct` outcome
- Transactional with pessimistic write lock
- Initial mastery: configurable (default 0.1)

**BKT Parameters** (configurable):
- `BKT_PRIOR_KNOWLEDGE`: 0.1 (default)
- `KNOWLEDGE_TRACING_TIMEOUT_MS`: 5000 (default)

### 1.2 Evidence Collection Infrastructure

**LearningEvent** (append-only event log)
- `id`, `studentId`, `sessionId`, `timestamp`
- `eventType` (enum: SESSION_STARTED, ACTIVITY_PRESENTED, ANSWER_SUBMITTED, ACTIVITY_COMPLETED, ACTIVITY_SKIPPED, HINT_REQUESTED, TUTORIAL_OPENED, INSTRUCTION_REPLAYED, etc.)
- `activityId`, `bnccSkillId`, `attempt`, `responseTimeMs`, `correct`, `hintsUsed`, `recommendationId`
- `metadata` (JSONB, extensible)
- **Status**: Fully implemented, immutable, indexed

**InteractionEvidence**
- `sourceEventId` (unique), `studentId`, `sessionId`, `activityId`, `recommendationId`
- `eventType`, `interactionType[]`, `representation[]`
- `motorDemand`, `sensoryLoad`, `languageLoad`, `outcome`
- `timestamp`, `metadata`
- **Status**: Implemented, tracks multimodal interaction signals

**RecommendationOutcome**
- `recommendationId` (unique), `studentId`, `sessionId`, `activityId`
- `status` (PRESENTED, STARTED, COMPLETED, SKIPPED, ABANDONED)
- `presentedAt`, `startedAt`, `completedAt`, `skippedAt`, `abandonedAt`
- `attempts`, `hintsUsed`, `instructionReplays`, `responseTimeMs`, `correct`
- **Status**: Implemented, tracks recommendation lifecycle

**AdaptationTransition**
- `studentId`, `sessionId`, `previousRecommendationId`, `previousActivityId`
- `triggerEventId`, `triggerType`, `changeRequested`
- `replacementRecommendationId`, `replacementActivityId`
- `sameBNCCSkill`, `sameMathematicalConcept`, `interactionTypeChanged`, `representationChanged`
- `motorDemandDelta`, `sensoryLoadDelta`, `languageLoadDelta`, `scaffoldingDelta`, `difficultyDelta`
- **Status**: Implemented, tracks adaptation decisions

**ExercisePerformance** (recent addition)
- `userId`, `activityId`, `islandId`, `sessionId`
- `attemptNumber`, `isCorrect`, `score`, `responseTimeMs`, `hintsUsed`
- `tutorialOpenedCount`, `instructionReplayCount`, `skipped`, `timeBeforeSkipMs`
- `metadata` (difficultyAttempt, modality, conceptsTargeted, bnccSkills, interactionSignals)
- **Status**: Implemented, indexed on (userId, activityId), (userId, islandId), (userId, createdAt)

**LearningAnalyticsMetricsService**
- Calculates: accuracy, completionRate, skipRate, averageAttempts, averageResponseTimeMs, hintRate, instructionReplayRate
- Scoped by: studentId, sessionId, bnccSkillId, activityType
- **Status**: Implemented, deterministic formulas from LearningEvent

### 1.3 Activity Model

**Activity Entity**
- `id`, `title`, `description`, `type` (enum: VISUAL_PUZZLE, QUIZ, COUNTING, DRAG_DROP, etc.)
- `difficulty` (enum: VERY_EASY, EASY, MEDIUM, HARD, EXTREME)
- `bnccSkills[]`, `skillWeights[]` (primary/secondary with weight)
- `targetModalities[]` (visual, logical, sensory, etc.)
- `content` (JSONB):
  - `instructions`, `instructionsPt`, `howToPlay`, `howToPlayPt`
  - `items[]`, `imageUrl`, `audioUrl`, `videoUrl`
  - `correctAnswer`, `correctOrder`, `acceptedOrders`, `options`
  - `timeLimit`, `validation` (kind: exact|numeric|boolean|sequence|set|compound)
  - `semantic`, `scaffolding`, `pictogramConceptIds`
- `accessibility` (hasAudio, hasVisual, hasAnimation, sensoryLoad)
- `isActive`, `pointsReward`, `prerequisiteSkillCode`
- **Status**: Fully implemented with semantic contract

**IslandExerciseMapping** (recent addition)
- `islandId`, `islandName`, `topic`
- `bnccSkills[]`, `exerciseCount`, `exerciseTitles[]`
- **Status**: Implemented, 8 islands with 12 exercises each

**ActivityAttempt** (legacy, still used)
- Tracks individual attempt results
- **Status**: Preserved for backward compatibility

### 1.4 Semantic Filtering & Ontology

**OntologyService**
- Loads ContaComigo ontology (RDF/OWL)
- Caches: `skillsByCode` (Map), `prerequisites` (array)
- Methods:
  - `getValidActivityCandidates(facts: RuntimeSemanticFacts)`: Filters activities by semantic constraints
  - Returns: `SemanticCandidateResult` with decision traces
- **Status**: Implemented, used in recommendation pipeline

**RuntimeSemanticFacts**
- `targetSkill` (BNCC code)
- `activities[]` (with mathematicalConcepts, representations, etc.)
- `learnerProfile` (accessibility needs, modality preferences)
- `professionalConstraints` (sensory, motor, language restrictions)
- **Status**: Implemented, passed to semantic filter

**SemanticFilteringTrace**
- Records which activities passed/failed semantic constraints
- Reasons for rejection (concept mismatch, accessibility violation, etc.)
- **Status**: Implemented, used in hybrid ranking

### 1.5 Hybrid Recommendation Engine

**HybridRecommendationService**
- Ranks candidates by composite score:
  - `learningNeed` (BKT mastery gap)
  - `challengeFit` (difficulty vs. success probability)
  - `interactionFit` (modality match)
  - `semanticFit` (concept alignment)
  - `novelty` (recency penalty)
  - `rejectionRisk` (history of skips/abandons)
  - `sensoryFit`, `formatFit`, `repetitionRisk`, `frustrationRisk`
- Weights configurable via environment
- Returns: `HybridRankingResult` with top candidate + explanation
- **Status**: Fully implemented, 32KB service with comprehensive scoring

**HybridCandidateScore**
- `activityId`, `bnccSkills`, `difficulty`, `activityType`, `structureId`
- All scoring components (learning, challenge, interaction, semantic, novelty, rejection, sensory, format, repetition, frustration)
- `finalScore`, `predictedSuccess`, `progressDerivative`, `performanceIntegral`
- `explanation` (semanticValidityReasons, positiveContributions, penalties)
- **Status**: Implemented

**ProgressionAnalyzer**
- Detects automatic progression: 2+ correct answers + 2+ different structure types → escalate difficulty
- Hard block filtering: structures appearing ≥2x in last 10 activities → exclude
- Exponential recency penalty: count^1.5
- **Status**: Implemented (109 lines, 9 unit tests)

### 1.6 Session Model

**Session** (frontend state, not persisted as entity)
- `sessionId` (string, generated per learning session)
- `currentActivity` (Activity)
- `progress` (completion state)
- Maintained by `useSession` hook
- **Status**: Implemented in frontend, tracked via LearningEvent.sessionId

**Session Detection**
- New session = new `sessionId` generated
- Persists until explicitly closed
- Tracked via SESSION_STARTED and SESSION_COMPLETED events
- **Status**: Implemented

### 1.7 Professional Feedback & Learner Profile

**ProfessionalRecommendationFeedback** (entity exists)
- Stores educator feedback on recommendations
- **Status**: Implemented

**LearnerProfile** (embedded in user context)
- Accessibility needs (sensory, motor, language)
- Preferred modalities
- TEA-specific preferences
- **Status**: Partially implemented, used in semantic filtering

---

## PART 2: WHAT MUST BE CREATED

### 2.1 New Database Entities

#### ReviewAssignment
Purpose: Link baseline evidence → review selection → review activity

```typescript
@Entity('review_assignments')
export class ReviewAssignment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column({ type: 'uuid' }) skillId: string;
  @Column({ type: 'varchar' }) reviewType: 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION';
  
  // Baseline evidence that triggered review
  @Column({ type: 'uuid', array: true }) sourceInteractionIds: string[];
  @Column({ type: 'uuid', array: true }) sourceRecommendationIds: string[];
  
  // Activity selected for review
  @Column({ type: 'uuid' }) selectedActivityTemplateId: string;
  @Column({ type: 'uuid' }) selectedActivityInstanceId: string;
  
  // Selection metadata
  @Column({ type: 'varchar' }) reason: string;
  @Column({ type: 'float' }) priorityScore: number;
  
  // Scoring configuration (versioned for reproducibility)
  @Column({ type: 'jsonb' }) scoringConfiguration: {
    version: string; // e.g., "review-priority-score/1.0.0"
    weights: Record<string, number>; // w_error, w_attempts, w_help, etc.
    thresholds: Record<string, number>; // slowThreshold, maxExpectedAttempts, etc.
    timestamp: Date; // when this configuration was active
  };
  
  @Column({ type: 'jsonb' }) scoringBreakdown: {
    errorScore?: number;
    attemptScore?: number;
    helpScore?: number;
    engagementScore?: number;
    responseTimeScore?: number;
    completionScore?: number;
    masteryScore?: number;
    recencyScore?: number;
    normalizedFactors: Record<string, number>;
  };
  
  // Baseline state snapshot (reconstructable from sourceInteractionIds)
  @Column({ type: 'jsonb' }) baselineState: {
    masteryBefore: number;
    difficultyBefore: string;
    lastExposureAt: Date;
    daysSinceLastExposure: number;
    previousAttempts: number;
    previousAccuracy: number;
    previousHintUsage: number;
    previousResponseTimeMs: number;
  };
  
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
}
```

#### ReviewOutcome / LongitudinalComparison
Purpose: Compare baseline vs. review performance

```typescript
@Entity('review_outcomes')
export class ReviewOutcome {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) reviewAssignmentId: string;
  @Column({ type: 'uuid' }) studentId: string;
  @Column({ type: 'uuid' }) skillId: string;
  
  // Review interaction evidence
  @Column({ type: 'uuid' }) reviewInteractionId: string;
  @Column({ type: 'uuid' }) reviewRecommendationId: string;
  
  // RAW LONGITUDINAL EVIDENCE (primary research data)
  @Column({ type: 'jsonb' }) baselineMetrics: {
    accuracy: number;
    averageResponseTimeMs: number;
    averageAttempts: number;
    hintsUsed: number;
    masteryProbability: number;
    difficultyLevel: string;
  };
  
  @Column({ type: 'jsonb' }) reviewMetrics: {
    accuracy: number;
    averageResponseTimeMs: number;
    averageAttempts: number;
    hintsUsed: number;
    masteryProbability: number;
    difficultyLevel: string;
  };
  
  // Raw deltas (review - baseline)
  @Column({ type: 'jsonb' }) deltas: {
    accuracyDelta: number; // reviewAccuracy - baselineAccuracy
    responseTimeDelta: number; // reviewResponseTime - baselineResponseTime (ms)
    attemptsDelta: number; // reviewAttempts - baselineAttempts
    hintsDelta: number; // reviewHints - baselineHints
    masteryDelta: number; // masteryAfter - masteryBefore
  };
  
  // Normalized deltas (for comparison across scales, [-1, +1])
  @Column({ type: 'jsonb' }) normalizedDeltas: {
    accuracyDeltaNormalized: number; // [-1, +1]
    responseTimeDeltaNormalized: number; // [-1, +1], positive = faster
    attemptsDeltaNormalized: number; // [-1, +1]
    hintsDeltaNormalized: number; // [-1, +1], positive = fewer hints
    masteryDeltaNormalized: number; // [-1, +1]
  };
  
  // Conservative classification (based on multiple signals)
  @Column({ type: 'varchar' }) progressionClassification: 
    'IMPROVED' | 'STABLE' | 'NEEDS_SUPPORT' | 'INCONCLUSIVE';
  
  // Evidence signals (recorded for research)
  @Column({ type: 'varchar', array: true }) evidenceSignals: string[];
  
  // Classification reasoning (for auditability)
  @Column({ type: 'text' }) classificationReason: string;
  
  // Longitudinal context metadata
  @Column({ type: 'jsonb' }) metadata: {
    // Instance comparison type
    instanceComparison: 'EXACT_REPEAT' | 'EQUIVALENT_INSTANCE' | 'DIFFICULTY_PROGRESSION' | 'DIFFICULTY_SUPPORT';
    
    // Difficulty comparison
    difficultyComparison: 'same' | 'harder' | 'easier';
    
    // Concepts
    conceptCoverage: string[]; // concepts tested in both baseline and review
    conceptsNewInReview: string[]; // concepts only in review
    
    // Temporal context
    daysSinceBaseline: number; // days between baseline and review
    
    // Template/instance tracking
    sameTemplate: boolean; // same Activity.templateId
    sameInstance: boolean; // same Activity.id (EXACT_REPEAT)
    
    // Review type (for context)
    reviewType: 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION';
  };
  
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

#### ActivityTemplate vs ActivityInstance
Purpose: Distinguish pedagogical template from concrete instance

**Approach**: Extend existing Activity entity with template metadata

```typescript
// Add to Activity entity:
@Column({ type: 'uuid', nullable: true })
templateId: string; // If this is an instance, points to template

@Column({ type: 'boolean', default: false })
isTemplate: boolean; // If true, this is a reusable template

@Column({ type: 'jsonb', nullable: true })
templateMetadata: {
  conceptDimensions: string[]; // 'numericalMagnitude', 'complexity', 'abstraction', etc.
  difficultyDimensions: Record<string, number>; // 'numericalMagnitude': 0..20, etc.
  interactionFormat: string; // 'selection', 'dragdrop', 'matching', etc.
  pedagogicalObjective: string;
  generationStrategy: 'parametric' | 'combinatorial' | 'semantic';
};

@Column({ type: 'jsonb', nullable: true })
instanceMetadata: {
  generatedFrom: string; // templateId
  generationSeed: number; // for reproducibility
  parameters: Record<string, any>; // specific values for this instance
  generatedAt: Date;
};
```

### 2.2 New Services

#### ReviewCandidateGenerationService
Purpose: Identify which skills/activities are candidates for future review

```typescript
@Injectable()
export class ReviewCandidateGenerationService {
  // Analyze interaction evidence to identify review candidates
  async generateReviewCandidates(
    studentId: string,
    skillId: string,
    options?: { lookbackDays?: number; minEvidence?: number }
  ): Promise<ReviewCandidate[]>;
  
  // Calculate Review Priority Score
  async calculateReviewPriorityScore(
    studentId: string,
    skillId: string,
    evidence: InteractionEvidence[]
  ): Promise<ReviewPriorityScore>;
}
```

#### ReviewSelectionService
Purpose: Select appropriate review activities using semantic filtering and ranking

```typescript
@Injectable()
export class ReviewSelectionService {
  // Select review activity for a skill
  async selectReviewActivity(
    studentId: string,
    skillId: string,
    reviewType: 'REMEDIATION' | 'RETENTION' | 'GENERALIZATION',
    learnerProfile: LearnerProfile
  ): Promise<ReviewActivitySelection>;
  
  // Generate equivalent but non-identical activity instance
  async generateEquivalentInstance(
    templateId: string,
    difficulty: DifficultyLevel,
    options?: { seed?: number }
  ): Promise<Activity>;
}
```

#### ReviewTriggerService
Purpose: Determine when to trigger review (checkpoint vs. retention)

```typescript
@Injectable()
export class ReviewTriggerService {
  // Check if this is a new learning session (for retention review)
  async isNewLearningSession(
    studentId: string,
    currentSessionId: string
  ): Promise<boolean>;
  
  // Detect checkpoint milestone (end of island/cycle)
  async detectCheckpointMilestone(
    studentId: string,
    islandId: string
  ): Promise<CheckpointMilestone | null>;
  
  // Determine review type based on context
  async determineReviewType(
    studentId: string,
    skillId: string,
    context: ReviewContext
  ): Promise<'REMEDIATION' | 'RETENTION' | 'GENERALIZATION'>;
}
```

#### LongitudinalComparisonService
Purpose: Compare baseline vs. review performance and classify progression

```typescript
@Injectable()
export class LongitudinalComparisonService {
  // Create comparison after review completion
  async createComparison(
    reviewAssignmentId: string,
    reviewInteractionId: string
  ): Promise<ReviewOutcome>;
  
  // Classify progression/regression
  async classifyProgression(
    baselineMetrics: PerformanceMetrics,
    reviewMetrics: PerformanceMetrics
  ): Promise<ProgressionClassification>;
  
  // Calculate normalized deltas
  private normalizeDeltas(
    deltas: PerformanceDelta[]
  ): NormalizedDeltas;
}
```

---

## PART 3: DESIGN DECISIONS

### 3.1 Review Priority Score Design

**Purpose**: Select WHAT should be reviewed (not ranking activities, but identifying skills)

**IMPORTANT**: The weights and thresholds below are **initial configurable heuristics**, NOT scientifically validated parameters. All weights are configurable and versioned. The scoring configuration used for each ReviewAssignment must be persisted for reproducibility.

**Behavioral Evidence Factors** (all normalized to [0, 1]):

For **REMEDIATION** review type, incorporate normalized evidence already available in the platform:

1. **Error Frequency** (configurable weight, default: 0.20)
   - `errorScore = incorrectAttempts / totalAttempts`
   - Normalized: 0 (all correct) → 1 (all incorrect)
   - Source: LearningEvent.correct, ExercisePerformance.isCorrect

2. **Attempt Efficiency** (configurable weight, default: 0.15)
   - `attemptScore = 1 - min(totalAttempts / maxExpectedAttempts, 1.0)`
   - Normalized: 0 (many attempts) → 1 (few attempts)
   - Source: ExercisePerformance.attemptNumber, RecommendationOutcome.attempts

3. **Help Dependency** (configurable weight, default: 0.15)
   - `helpScore = 1 - min(hintsUsed / maxExpectedHints, 1.0)`
   - Normalized: 0 (many hints) → 1 (no hints)
   - Source: LearningEvent.hintsUsed, ExercisePerformance.hintsUsed

4. **Engagement Signals** (configurable weight, default: 0.10)
   - `engagementScore = 1 - (skipCount + changeRequestCount) / totalExposures`
   - Normalized: 0 (frequent skips/changes) → 1 (engaged)
   - Source: LearningEvent.ACTIVITY_SKIPPED, AdaptationTransition.changeRequested

5. **Response Time** (configurable weight, default: 0.10)
   - **CRITICAL**: Normalized response time must NOT dominate the score
   - `responseTimeScore = sigmoid((medianResponseTime - slowThreshold) / slowThreshold)`
   - Normalized: 0 (very slow) → 1 (reasonable speed)
   - **Faster response alone NEVER means improvement**
   - Source: LearningEvent.responseTimeMs, ExercisePerformance.responseTimeMs

6. **Completion Rate** (configurable weight, default: 0.10)
   - `completionScore = completedActivities / presentedActivities`
   - Normalized: 0 (many abandoned) → 1 (all completed)
   - Source: RecommendationOutcome.status

7. **BKT Mastery State** (configurable weight, default: 0.10)
   - `masteryScore = 1 - abs(masteryProbability - targetSuccessProbability) / targetSuccessProbability`
   - Targets skills near decision boundary
   - Normalized: 0 (far from boundary) → 1 (near boundary)
   - Source: StudentSkillState.masteryProbability

8. **Recency/Retention** (configurable weight, default: 0.10)
   - `recencyScore = exp(-daysSinceLastExposure / retentionHalfLife)`
   - Exponential decay: skills not seen recently score higher
   - Normalized: 0 (seen today) → 1 (not seen in 30+ days)
   - Source: LearningEvent.timestamp

**Final Score** (Configurable Weighted Sum):
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

where all w_* are configurable (default: 0.20, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10)
and sum(w_*) = 1.0
```

**Normalization Strategy**:
- Each factor calculated independently with its own scale
- All factors normalized to [0, 1] using min-max, sigmoid, or exponential decay
- Weighted sum produces final score in [0, 1]
- **Response time normalization prevents millisecond-scale metrics from dominating**
- **Faster response is NOT automatically improvement**
- Scoring configuration (weights, thresholds, version) persisted in ReviewAssignment for reproducibility

### 3.2 Review Types and Baseline Selection

#### A. REMEDIATION
**When**: Skill shows low mastery or recent errors
**Trigger**: `masteryProbability < 0.5` OR `previousAccuracy < 0.7`

**Baseline Selection Strategy**:
- Select most recent interaction(s) with errors or low accuracy
- If multiple interactions: use last 3-5 interactions with `correct=false` or accuracy < 0.7
- Store all `sourceInteractionIds` and `sourceRecommendationIds` in ReviewAssignment
- Baseline must be reconstructable from stored source IDs

**Activity Selection**:
- Same or easier difficulty than baseline
- Same mathematical concept
- Different interaction format (avoid identical repetition)
- More scaffolding/support
**Composition**: 6 remediation + 2 retention + 2 generalization (in 10-item review, configurable)

#### B. RETENTION
**When**: Skill was mastered but not seen recently
**Trigger**: `daysSinceLastExposure > retentionHalfLife` AND `masteryProbability > 0.6`

**Baseline Selection Strategy**:
- Select most recent successful interaction(s) with high accuracy
- Use interactions from 7-30+ days ago (configurable window)
- Store all `sourceInteractionIds` and `sourceRecommendationIds` in ReviewAssignment
- Baseline must be reconstructable from stored source IDs

**Activity Selection**:
- Same difficulty as baseline
- Same or equivalent mathematical concept
- Different instance (parametric variation)
- Minimal scaffolding
**Composition**: 2 remediation + 6 retention + 2 generalization (configurable)

#### C. GENERALIZATION
**When**: Child solved skill with one representation, test with another
**Trigger**: `previousAccuracy > 0.8` AND `previousAttempts > 5`

**Baseline Selection Strategy**:
- Select most recent successful interaction(s) with high accuracy
- Baseline must have been completed with `correct=true` or accuracy > 0.8
- Store all `sourceInteractionIds` and `sourceRecommendationIds` in ReviewAssignment
- Baseline must be reconstructable from stored source IDs

**Activity Selection**:
- Same or slightly harder difficulty
- Same mathematical concept
- **Different ActivityInstance** (not identical repetition)
- Different representation (visual → symbolic, concrete → abstract)
- Different interaction format
**Composition**: 2 remediation + 2 retention + 6 generalization (configurable)

### 3.3 Semantic Filtering Before Ranking

**Pipeline**:
```
learnerProfile (accessibility, modality, language)
    ↓
ontology/semantic constraints
    ↓
eligible activities (passed semantic filter)
    ↓
ranking (by review priority score + hybrid scoring)
    ↓
recommendation
```

**Semantic Constraints** (hard blocks, not soft penalties):
- Sensory load: if learner has visual sensitivity, exclude high-sensory activities
- Motor demand: if learner has motor limitations, exclude high-motor activities
- Language load: if learner has language delays, exclude complex language activities
- Modality preference: if learner prefers kinesthetic, prioritize drag/manipulative

**Professional Constraints**:
- Educator-specified restrictions (e.g., "avoid video for this child")
- Applied as hard filters before ranking

### 3.4 Activity Template vs Instance

**Design Decision**: Extend Activity entity, don't create separate table

**Template** (isTemplate=true):
- Defines pedagogical structure
- Contains `templateMetadata` with difficulty dimensions
- Example: "Counting with 1-20 objects, multiple representations"

**Instance** (isTemplate=false):
- Concrete realization of template
- Contains `instanceMetadata` with specific parameters
- Example: "Count 7 apples, select number 7"
- References `templateId`

**Generation**:
- Parametric: vary numerical magnitude, number of steps, etc.
- Combinatorial: vary objects, colors, arrangements
- Semantic: vary representations (concrete → pictorial → symbolic)

**Benefit**: Child completing one instance doesn't eliminate template; can generate new instances

### 3.4.1 Generalization Instance Types

**EXACT_REPEAT**: Identical ActivityInstance
- Same template, same parameters
- **NOT classified as generalization**
- Used only for immediate practice/remediation

**EQUIVALENT_INSTANCE**: Same template, different parameters
- Same BNCC skill/concept
- Comparable pedagogical difficulty
- Different concrete numbers, objects, arrangements
- **Classified as generalization** (measures transfer to new instance)

**DIFFICULTY_PROGRESSION**: Same template, increased difficulty
- Same BNCC skill/concept
- Increased difficulty dimension (numerical magnitude, complexity, etc.)
- Different parameters
- **Classified as generalization with progression evidence**

**DIFFICULTY_SUPPORT**: Same template, decreased difficulty
- Same BNCC skill/concept
- Decreased difficulty dimension
- Different parameters
- **Classified as remediation/support**

**ReviewOutcome must record which type was used** in `metadata.instanceComparison` field

### 3.5 Review Session Composition

**Default**: 10 activities per review session (configurable)

**Composition Strategy** (initial heuristic, NOT empirically optimal):
- 60% difficulty/remediation probes (6 activities)
- 20% retention probes (2 activities)
- 20% generalization/control probes (2 activities)

**Graceful Degradation**:
- If insufficient candidates of a type, redistribute available slots
- Example: If only 4 remediation candidates available, allocate 4 + 3 + 3 instead of 6 + 2 + 2
- Never force empty slots or repeat activities

**Algorithm**:
```
1. Identify review candidates (skills needing review)
2. For each candidate:
   a. Determine review type (REMEDIATION|RETENTION|GENERALIZATION)
   b. Select activity using semantic filter + ranking
   c. Generate or select instance
3. Compose session:
   - Allocate slots by type (with graceful degradation)
   - Ensure no activity repeats in session
   - Ensure no identical instances (EXACT_REPEAT)
   - Ensure diversity of interaction formats
4. Return ordered list with explanations
```

**Constraints**:
- No activity from same session appears twice
- No identical instances (EXACT_REPEAT not allowed in review)
- Interaction formats vary (selection, drag, matching, etc.)
- Difficulty doesn't spike (gradual progression)

### 3.6 Review Triggers

#### Checkpoint Review
**Trigger**: End of island/cycle milestone
**Detection**: 
- `islandId` changed OR
- `cycleNumber` incremented OR
- Educator manually triggers

**Behavior**:
- Automatic review of skills from completed island
- Composition: 60% remediation + 20% retention + 20% generalization
- Presented as "Island Review" before moving to next island

#### Retention Review
**Trigger**: New learning session after time interval
**Detection**:
- `isNewLearningSession(studentId, currentSessionId)` returns true
- AND `daysSinceLastExposure > retentionHalfLife` for some skill

**Behavior**:
- Automatic review of skills not seen recently
- Composition: 20% remediation + 60% retention + 20% generalization
- Presented as "Welcome back! Let's review..." at session start

**Real Learning-Session Boundary** (IMPORTANT):
- A page refresh, route change, reconnect, or reopening the application during the same clinical encounter must NOT trigger a new retention review
- **Real session boundary** = clinical encounter boundary, not technical session ID change
- Detection strategy:
  - Track `lastActivityTimestamp` per student
  - If `currentTime - lastActivityTimestamp < sessionGapThreshold` (default: 1 hour), same session
  - If `currentTime - lastActivityTimestamp >= sessionGapThreshold`, new session
  - Educator can explicitly mark session boundaries (e.g., "end of clinical session")
- Tracked via `LearningEvent.SESSION_STARTED` and `LearningEvent.SESSION_COMPLETED`
- Compare `currentSessionId` with last `SESSION_COMPLETED` timestamp AND time gap

### 3.7 Longitudinal Linkage

**ReviewAssignment** links:
- Baseline evidence (`sourceInteractionIds`, `sourceRecommendationIds`)
- Review activity (`selectedActivityTemplateId`, `selectedActivityInstanceId`)
- Selection reason and priority score

**ReviewOutcome** links:
- `reviewAssignmentId` (back to baseline)
- `reviewInteractionId` (the actual interaction)
- Baseline metrics snapshot
- Review metrics calculated from interaction
- Deltas and classification

**Traceability Chain**:
```
LearningEvent (baseline interaction)
    ↓ (referenced by)
InteractionEvidence (baseline evidence)
    ↓ (triggers)
ReviewAssignment (selection decision)
    ↓ (selects)
Activity (review activity)
    ↓ (completed in)
LearningEvent (review interaction)
    ↓ (analyzed by)
ReviewOutcome (longitudinal comparison)
    ↓ (informs)
AdaptationTransition (next recommendation)
```

### 3.8 Progression/Regression Classification

**Conservative Model**: Only classify when sufficient evidence exists. Raw metrics are primary research data.

**CRITICAL**: Do NOT use simplistic rules like:
- ❌ IMPROVED = accuracy up AND efficiency up
- ❌ Faster response alone = improvement
- ❌ Slower response alone = regression

**Signals** (each normalized to [-1, +1]):
1. **Accuracy Signal**: `(reviewAccuracy - baselineAccuracy)`
   - Range: -1 (all wrong vs. all right) to +1 (all right vs. all wrong)
   - Normalized: [-1, +1]

2. **Efficiency Signal**: `(baselineResponseTime - reviewResponseTime) / baselineResponseTime`
   - Positive = faster, Negative = slower
   - Range: [-1, +1]
   - **Faster response ALONE does not indicate improvement**

3. **Independence Signal**: `(baselineHints - reviewHints) / max(baselineHints, 1)`
   - Positive = fewer hints, Negative = more hints
   - Range: [-1, +1]

4. **Consistency Signal**: `1 - abs(reviewAttempts - baselineAttempts) / max(baselineAttempts, 1)`
   - Positive = similar attempts, Negative = very different
   - Range: [-1, +1]

**Conservative Classification Logic**:
```
IMPROVED:
  accuracy_signal > +0.2 AND (efficiency_signal > -0.2 OR independence_signal > +0.1)
  OR
  accuracy_signal > +0.1 AND efficiency_signal > +0.1 AND independence_signal > +0.1

NEEDS_SUPPORT:
  accuracy_signal < -0.2 OR (efficiency_signal < -0.5 AND accuracy_signal < 0)
  OR
  (accuracy_signal < 0 AND independence_signal < -0.2)

STABLE:
  abs(accuracy_signal) < 0.1 AND abs(efficiency_signal) < 0.2 AND abs(independence_signal) < 0.2

INCONCLUSIVE:
  All other cases (conflicting signals, insufficient evidence)
```

**Examples of Conflicting Signals** (→ INCONCLUSIVE):
- Faster response + more errors = INCONCLUSIVE (not improvement)
- Slower response + higher accuracy = INCONCLUSIVE (may indicate deeper processing, not regression)
- Similar accuracy + fewer attempts = INCONCLUSIVE (efficiency gain, but not clear improvement)
- Maintained performance on harder task = INCONCLUSIVE (may indicate progression, requires explicit difficulty comparison)

**Evidence Signals** (recorded for research, not for classification):
- "accuracy improved" (if accuracy_signal > 0.1)
- "accuracy declined" (if accuracy_signal < -0.1)
- "response time faster" (if efficiency_signal > 0.1)
- "response time slower" (if efficiency_signal < -0.1)
- "fewer hints needed" (if independence_signal > 0.1)
- "more hints needed" (if independence_signal < -0.1)
- "consistent attempts" (if consistency_signal > 0.8)
- "variable attempts" (if consistency_signal < 0.2)
- "maintained performance on harder task" (if difficulty increased but accuracy stable)
- "success on equivalent unseen instance" (if instanceComparison = EQUIVALENT_INSTANCE and accuracy > 0.7)

**Key Principle**: Raw metrics always available; classification is conservative interpretation only

### 3.9 Adaptive Difficulty

**Difficulty Dimensions** (not single number):
- Numerical magnitude (1..20)
- Number of steps (1..5)
- Abstraction level (concrete → pictorial → symbolic)
- Distractor similarity (low → high)
- Language load (simple → complex)
- Motor demand (low → high)
- Sensory load (low → high)
- Scaffolding (high → low)

**Progression Logic**:
```
if classification == IMPROVED:
  increase 1-2 dimensions gradually
  reduce scaffolding by 1 level
elif classification == NEEDS_SUPPORT:
  reduce 1-2 dimensions
  increase scaffolding by 1 level
elif classification == STABLE:
  maintain dimensions
  vary representation/format only
```

**Integration with BKT**:
- BKT updates `masteryProbability`
- Difficulty selection uses BKT + longitudinal evidence
- Progression is recommendation-level, not mastery-level
- Next activity difficulty informed by both BKT and review outcomes

---

## PART 4: INTEGRATION POINTS

### 4.1 Integration with BKT

**Constraint**: ReviewAssignment and ReviewOutcome do NOT update `masteryProbability`

**Interaction**:
1. BKT updates mastery after every activity
2. ReviewCandidateGenerationService reads current `masteryProbability`
3. ReviewAssignment stores `masteryBefore` snapshot
4. Review activity completed → BKT updates mastery
5. ReviewOutcome stores `masteryAfter` snapshot
6. Comparison shows mastery delta, but doesn't modify BKT

**Benefit**: Complete audit trail; BKT remains single source of truth

### 4.2 Integration with Ontology

**Semantic Filtering**:
1. ReviewSelectionService calls `OntologyService.getValidActivityCandidates()`
2. Passes `RuntimeSemanticFacts` with:
   - `targetSkill` (BNCC code from ReviewAssignment)
   - `activities[]` (eligible activities)
   - `learnerProfile` (accessibility, modality)
   - `professionalConstraints` (educator restrictions)
3. Ontology returns `SemanticCandidateResult` with decision traces
4. Only semantically valid activities proceed to ranking

**Benefit**: Respects existing semantic filtering pipeline

### 4.3 Integration with HybridRecommendationService

**Review Activity Ranking**:
1. After semantic filtering, ReviewSelectionService ranks candidates
2. Uses HybridRecommendationService with modified weights:
   - Lower `novelty` weight (review should revisit)
   - Higher `semanticFit` weight (must match skill)
   - Adjusted `challengeFit` based on review type
3. Returns top-ranked activity

**Benefit**: Reuses existing ranking infrastructure

### 4.4 Integration with RecommendationDecision and RecommendationOutcome

**Workflow**:
1. ReviewAssignment created (selection decision)
2. ReviewAssignment.selectedActivityInstanceId → RecommendationDecision
3. RecommendationDecision → RecommendationOutcome (tracks lifecycle)
4. RecommendationOutcome completed → ReviewOutcome created
5. ReviewOutcome informs next AdaptationTransition

**Benefit**: Preserves existing recommendation tracking

### 4.5 Integration with InteractionEvidence

**Evidence Collection**:
1. Review activity completed → LearningEvent created
2. LearningEvent → InteractionEvidence (via existing pipeline)
3. ReviewOutcome reads InteractionEvidence for review metrics
4. Baseline evidence already captured in ReviewAssignment

**Benefit**: Reuses existing evidence collection

### 4.6 Integration with ExercisePerformance

**Metrics Source**:
1. ExercisePerformance tracks each attempt
2. ReviewOutcome reads ExercisePerformance for review metrics
3. Baseline metrics read from ExercisePerformance historical data
4. Deltas calculated from both

**Benefit**: Leverages existing performance tracking

---

## PART 5: ANALYTICS REQUIREMENTS

### 5.1 Answerable Research Questions

The system must support:

1. **Accuracy Change**: Did accuracy change when a skill was revisited?
   - Query: `ReviewOutcome.deltas.accuracyDelta` grouped by skillId, reviewType
   
2. **Hint Dependency**: Did hint dependency change?
   - Query: `ReviewOutcome.deltas.hintsDelta` grouped by skillId
   
3. **Attempt Efficiency**: Did number of attempts change?
   - Query: `ReviewOutcome.deltas.attemptsDelta` grouped by skillId
   
4. **Response Time**: Did normalized response time change?
   - Query: `ReviewOutcome.normalizedDeltas.responseTimeDeltaNormalized`
   
5. **Retention**: Was performance retained across sessions?
   - Query: `ReviewOutcome` filtered by `reviewType = 'RETENTION'`, grouped by daysSinceLastExposure
   
6. **Generalization**: Can child solve equivalent unseen instance?
   - Query: `ReviewOutcome` filtered by `reviewType = 'GENERALIZATION'`, `instanceComparison = 'equivalent'`
   
7. **BKT Alignment**: How did BKT mastery change between exposures?
   - Query: `ReviewOutcome.baselineMetrics.masteryProbability` vs `ReviewOutcome.reviewMetrics.masteryProbability`
   
8. **Remediation Patterns**: Which skills repeatedly require remediation?
   - Query: `ReviewAssignment` grouped by skillId, filtered by `reviewType = 'REMEDIATION'`, count
   
9. **Recommendation Accuracy**: How often did recommendation system correctly identify a skill needing review?
   - Query: `ReviewAssignment.priorityScore` vs `ReviewOutcome.progressionClassification`
   
10. **Adaptive Difficulty**: What happened after adaptive difficulty increased/decreased?
    - Query: `ReviewOutcome` grouped by difficultyComparison, analyze subsequent ReviewAssignments

### 5.2 Analytics Layer Design

**Distinction**:
- **Immediate Performance**: Activity result (correct/incorrect)
- **Adaptive Recommendation Behavior**: Which activity selected next
- **Longitudinal Performance**: Comparison across time

**Metrics Tables** (derived from ReviewOutcome):
- `review_progression_summary` (daily aggregates)
- `skill_retention_analysis` (by skill, by days since exposure)
- `generalization_success_rate` (by skill, by representation change)
- `adaptive_difficulty_impact` (by difficulty delta, outcome)

---

## PART 5.5: SCIENTIFIC CLAIMS AND LIMITATIONS

### What This System Measures
[PROPOSTA CONTA COMIGO]

The longitudinal review mechanism measures **behavioral and performance changes observed within ContaComigo** when a child revisits a previously practiced mathematical skill.

**Specifically**:
- Changes in accuracy (correct/incorrect responses)
- Changes in response time (milliseconds to complete activity)
- Changes in help-seeking behavior (hints, tutorials, instruction replays)
- Changes in engagement (completion, skips, change requests)
- Changes in BKT mastery probability (from Knowledge Tracing)

### What This System Does NOT Measure
[PROPOSTA CONTA COMIGO]

**This mechanism does NOT by itself establish**:
- That ContaComigo caused learning gains
- That observed changes indicate actual mathematical understanding
- Causality between platform use and learning outcomes
- Generalization to contexts outside ContaComigo
- Long-term retention beyond the observation period

**Interpretation of changes requires**:
- Experimental design with control groups
- Independent assessment of mathematical knowledge
- Triangulation with other evidence (educator observation, clinical assessment)
- Longitudinal follow-up beyond the platform

### Auditability and Reproducibility

For every ReviewAssignment, the complete decision chain must be reconstructable:

```
baseline interaction(s) [LearningEvent.id]
    ↓ (referenced by)
sourceInteractionIds in ReviewAssignment
    ↓ (analyzed to produce)
normalized behavioral evidence
    ↓ (weighted by)
scoringConfiguration (version, weights, thresholds)
    ↓ (produces)
priorityScore and scoringBreakdown
    ↓ (filtered by)
semantic constraints (OntologyService decision trace)
    ↓ (ranked by)
HybridRecommendationService
    ↓ (selects)
selectedActivityInstanceId
    ↓ (completed in)
review interaction [LearningEvent.id]
    ↓ (analyzed to produce)
ReviewOutcome with raw metrics and normalized deltas
    ↓ (informs)
next AdaptationTransition
```

**Persistence Requirements**:
- All sourceInteractionIds stored in ReviewAssignment (reconstructable)
- Scoring configuration (version, weights, thresholds) stored in ReviewAssignment
- All raw metrics stored in ReviewOutcome (not just deltas)
- Normalized deltas calculated deterministically from raw metrics
- Classification reasoning stored in ReviewOutcome.classificationReason
- Evidence signals stored as array for research analysis

**Reproducibility**:
- Same ReviewAssignment can be re-analyzed with different scoring configurations
- Raw metrics can be recalculated if metrics formulas change
- Decision chain can be audited at any point
- Historical recommendations remain valid even if algorithms improve

---

## PART 6: MISSING DATABASE ENTITIES/FIELDS

### New Entities Required
1. ✅ `ReviewAssignment` (full design above)
2. ✅ `ReviewOutcome` (full design above)

### Fields to Add to Existing Entities

**Activity** (extend):
```typescript
@Column({ type: 'uuid', nullable: true })
templateId: string;

@Column({ type: 'boolean', default: false })
isTemplate: boolean;

@Column({ type: 'jsonb', nullable: true })
templateMetadata: { ... };

@Column({ type: 'jsonb', nullable: true })
instanceMetadata: { ... };
```

**LearningEvent** (already sufficient, but consider adding):
```typescript
@Column({ type: 'uuid', nullable: true })
reviewAssignmentId: string; // Link to review context
```

**StudentSkillState** (already sufficient):
- No changes needed; remains single source of mastery

---

## PART 7: MIGRATION PLAN

### Phase 1: Database Schema (Week 1)
- [ ] Create `ReviewAssignment` migration
- [ ] Create `ReviewOutcome` migration
- [ ] Add fields to `Activity` (templateId, isTemplate, templateMetadata, instanceMetadata)
- [ ] Add `reviewAssignmentId` to `LearningEvent`
- [ ] Create indexes: `(studentId, skillId, createdAt)` on ReviewAssignment
- [ ] Create indexes: `(reviewAssignmentId)` on ReviewOutcome

### Phase 2: Core Services (Week 2)
- [ ] Implement `ReviewCandidateGenerationService`
- [ ] Implement `ReviewSelectionService`
- [ ] Implement `ReviewTriggerService`
- [ ] Implement `LongitudinalComparisonService`
- [ ] Unit tests for each service

### Phase 3: Integration (Week 3)
- [ ] Integrate ReviewTriggerService into session lifecycle
- [ ] Integrate ReviewSelectionService into recommendation pipeline
- [ ] Integrate LongitudinalComparisonService into activity completion flow
- [ ] Update RecommendationDecision to track ReviewAssignment
- [ ] Integration tests

### Phase 4: Frontend (Week 4)
- [ ] Display review session context ("Island Review", "Welcome back!")
- [ ] Show review activity with baseline comparison
- [ ] Display progression classification after review
- [ ] Update dashboard to show longitudinal trends

### Phase 5: Analytics & Validation (Week 5)
- [ ] Create analytics views/queries
- [ ] Validate research questions answerable
- [ ] Dashboard for educators
- [ ] Data export for research

---

## PART 8: IMPLEMENTATION BATCHES

### Batch 1: Foundation (1-2 weeks)
**Scope**: Database + core services (no frontend changes)
**Deliverables**:
- ReviewAssignment and ReviewOutcome entities
- ReviewCandidateGenerationService with Review Priority Score
- ReviewSelectionService with semantic filtering
- Unit tests (80%+ coverage)
- Database migrations

**Risks**: Low (additive, no existing code changes)

### Batch 2: Triggers & Integration (1-2 weeks)
**Scope**: Review trigger detection + recommendation pipeline integration
**Deliverables**:
- ReviewTriggerService (checkpoint + retention detection)
- Integration with session lifecycle
- Integration with recommendation pipeline
- Integration tests

**Risks**: Medium (touches recommendation flow)

### Batch 3: Comparison & Classification (1 week)
**Scope**: Longitudinal comparison and progression classification
**Deliverables**:
- LongitudinalComparisonService
- ReviewOutcome creation after review completion
- Progression classification algorithm
- Unit tests

**Risks**: Low (reads-only from existing entities)

### Batch 4: Frontend & Analytics (1-2 weeks)
**Scope**: UI and research analytics
**Deliverables**:
- Review session UI
- Progression display
- Analytics queries
- Dashboard views

**Risks**: Low (frontend only)

---

## PART 9: RISKS & MITIGATION

| Risk | Level | Mitigation |
|------|-------|-----------|
| BKT mastery modified by review system | CRITICAL | ReviewAssignment/ReviewOutcome are read-only; BKT updates only via KnowledgeTracingService |
| Duplicate review assignments | MEDIUM | Unique constraint on (studentId, skillId, reviewType, createdAt window) |
| Semantic filtering too restrictive | MEDIUM | Start with permissive constraints; tighten based on data |
| Review activity selection bias | MEDIUM | Log all candidates + scores; analyze selection patterns |
| Performance degradation from new queries | MEDIUM | Index ReviewAssignment and ReviewOutcome; use materialized views for analytics |
| Learner profile data incomplete | MEDIUM | Graceful fallback to default profile if missing |
| Session detection unreliable | MEDIUM | Use both sessionId change + time gap (>1 hour) as retention trigger |

---

## PART 10: RESEARCH TRACEABILITY

**Complete Audit Trail**:
```
LearningEvent (baseline interaction)
  ├─ timestamp, activityId, correct, responseTimeMs, hintsUsed
  └─ recommendationId (links to RecommendationOutcome)

InteractionEvidence (baseline evidence)
  ├─ eventType, interactionType[], representation[]
  ├─ motorDemand, sensoryLoad, languageLoad
  └─ metadata (interaction signals)

ReviewAssignment (selection decision)
  ├─ sourceInteractionIds, sourceRecommendationIds
  ├─ priorityScore, scoringBreakdown
  ├─ baselineState (mastery, difficulty, attempts, accuracy, hints, responseTime)
  └─ selectedActivityInstanceId

Activity (review activity)
  ├─ templateId, difficulty, bnccSkills
  └─ content (instructions, validation, etc.)

LearningEvent (review interaction)
  ├─ timestamp, activityId, correct, responseTimeMs, hintsUsed
  └─ reviewAssignmentId (links back)

ReviewOutcome (longitudinal comparison)
  ├─ baselineMetrics (accuracy, responseTime, attempts, hints, mastery, difficulty)
  ├─ reviewMetrics (same)
  ├─ deltas (review - baseline)
  ├─ normalizedDeltas (scaled -1..+1)
  ├─ progressionClassification (IMPROVED|STABLE|NEEDS_SUPPORT|INCONCLUSIVE)
  └─ evidenceSignals (list of observed signals)

AdaptationTransition (next recommendation)
  ├─ triggerEventId (ReviewOutcome)
  ├─ replacementActivityId
  └─ difficultyDelta (informed by ReviewOutcome)
```

**Reconstruction**: Any point in chain can be traced backward to original evidence

---

## PART 11: CONFORMANCE CHECKLIST

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

## NEXT STEPS

1. **Review this design** with team
2. **Validate assumptions** about existing infrastructure
3. **Approve architecture** before implementation
4. **Proceed with Batch 1** (database + core services)

---

**Document Status**: 🔍 DESIGN COMPLETE — READY FOR REVIEW  
**Implementation Status**: ⏸️ NOT STARTED  
**Estimated Timeline**: 5-6 weeks (4 batches, 1-2 weeks each)
