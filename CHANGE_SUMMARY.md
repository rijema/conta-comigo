# Change Summary

## Batch B2.2E — Activity and Learning Analytics semantics

- Added a distinct activity semantic root, reusable family profiles, representations, interaction types, difficulty profiles, and activity affordances.
- Mapped the current Counting, Multiple Choice, Quiz, Drag and Drop, and Number Line implementations, plus incomplete backend enum placeholders, without adding new activity families.
- Connected family profiles to current BNCC claims and mathematical concepts while keeping inconsistent mappings explicitly partial, review-required, or incomplete.
- Added developer-provenance multidimensional difficulty vocabulary while preserving easy/medium/hard compatibility and leaving content-specific numeric values unassigned.
- Added aggregate Learning Analytics evidence types and source-event provenance hints without embedding raw events, attempts, BKT mastery, or runtime child/session instances in OWL.
- Documented the B2.3 materialization contract, hybrid-recommender feature boundaries, competency questions, hypotheses, and limitations.
- Added structural and query-fixture coverage for activity separation, metadata, incomplete mappings, and the Learning Analytics bridge.

No database schema, activity seed, runtime recommendation behavior, BKT calculation, interface, or historical LASDONT artifact changed in this batch.

## Batch B2.2D — BNCC early-mathematics curriculum layer

- Added six officially sourced first-year BNCC skill individuals with exact codes, descriptions, grade, curriculum, and thematic-domain context.
- Added provenance-annotated mappings from curriculum skills to existing mathematical concepts without equivalence or skill-to-skill prerequisite assertions.
- Recorded seed-derived activity counts and explicit partial, missing, or review-required coverage statuses.
- Added curriculum, domain, grade, activity-link, code, description, mapping-status, and coverage vocabulary.
- Documented incomplete seed descriptions, missing skill records, suspicious activity claims, and unsafe deprecated numeric-progression implementations.
- Added TODO markers to the two deprecated ML progression paths without changing their behavior.
- Added structural and query-fixture tests for uniqueness, official descriptions, concept mappings, semantic separation, coverage gaps, and suspicious activity claims.

No database schema, seed data, BKT logic, recommendation behavior, interface, or historical LASDONT artifact changed in this batch.

## Batch B2.2C — Neuroinclusive evidence-based learner model

- Extended the ContaComigo OWL vocabulary with contextual observed characteristics, interaction and learning evidence, evidence windows, sufficiency assessments, and temporal/provenance properties.
- Reinterpreted the five historical LASDONT dimensions as distinct strengths, preferences, support needs, compatibility, or reasoning evidence without importing legacy classes or asserting equivalence.
- Kept mathematical mastery under BKT ownership and separated mathematical difficulty from interaction difficulty.
- Added conservative PROV-O alignments without `owl:imports`, runtime individuals, inference thresholds, or diagnosis-based axioms.
- Documented the scientific basis, current-runtime conflicts, provenance, historical mappings, competency questions, experimental hypotheses, and privacy limitations in Portuguese.
- Added structural regression tests for semantic separation, longitudinal evidence, historical traceability, and absence of fixed learning-style or threshold axioms.

No production behavior, database schema, recommendation formula, or historical LASDONT artifact changed in this batch.

## Batch B2.2B — OntoMathEdu educational mathematics foundation

- Added an independent ContaComigo OWL foundation partitioning mathematical, curricular, learner, activity, and Learning Analytics knowledge.
- Introduced early-mathematics concepts plus reified didactic and prerequisite relations without importing OntoMathEdu.
- Recorded source ontology, source IRI, and conservative `related` or `adapted` provenance for every OntoMathEdu alignment.
- Documented the inspected OntoMathEdu artifact, literature-only or planned elements, distributed plane-geometry limitation, LASDONT's historical role, and competency questions.
- Added structural regression coverage ensuring the required layers, provenance, and absence of OWL imports/equivalence claims.

No runtime service, LASDONT artifact, or database schema changed in this batch.

## LearningEvent PostgreSQL metadata fix

- Declared `recommendationId` explicitly as nullable `varchar` so TypeORM does not infer the unsupported `Object` type during database initialization.
- Added a metadata regression test covering the PostgreSQL column type.
- No database migration is required because the existing migration and production schema already define `recommendationId` as `VARCHAR`.

## Batch B2.2A — Historical LASDONT ontology baseline

- Preserved the supplied LASDONT 1.0 OWL/XML artifact under `ontology/lasdont` for historical traceability only.
- Compared its declared concepts and axioms with the current profile, activity, recommendation, mastery, and Learning Analytics implementations.
- Documented concept-level statuses and recommended actions without asserting unsupported inheritance or equivalence.
- Identified current concepts absent from LASDONT and recorded concrete divergences between historical axioms and current TypeScript rules.
- Explicitly excluded legacy agents, messaging, JDBC configuration, and OWL runtime integration.

No production behavior, database schema, or runtime dependency changed in this batch.

## Batch B2.1 — Canonical Bayesian Knowledge Tracing

- Added the canonical `StudentSkillState` model and transactional `KnowledgeTracingService` writer.
- Connected validated activity attempts to the existing Python BKT equations for correct and incorrect observations.
- Switched runtime ADE mastery reads and dashboard-facing mastery maps to `StudentSkillState`.
- Preserved and deprecated legacy profile/snapshot mastery fields and removed their heuristic update path.
- Repaired the registered Python BKT adapter and made canonical BKT parameters and thresholds configurable.
- Added backend and Python tests plus Portuguese research documentation of inputs, outputs, equations, parameters, and limitations.

The additive migration creates only `student_skill_states`; legacy mastery columns remain intact.

## Batch B1.4 — Deterministic Learning Analytics aggregations

- Added `LearningAnalyticsMetricsService` with deterministic event-derived calculations and explicit zero-denominator behavior.
- Added student, session, BNCC skill, and activity-type metric endpoints.
- Counted distinct student/session/activity instances so repeated attempts do not inflate lifecycle counts.
- Added unit coverage for every metric, zero denominators, duplicate lifecycle events, and missing event fields.
- Documented the exact formulas and explicitly avoided a combined engagement score.

No database migration is required because this batch reads the existing learning-event and activity tables.

## Batch B1.3 — Assistance and skip interaction signals

- Instrumented explicit help requests, tutorial openings, repeated tutorial instructions, and activity skips in the active learning flow.
- Added available `timeBeforeSkipMs`, `attemptsBeforeSkip`, and `hintsBeforeSkip` observations to skip-event metadata.
- Kept repeatable click-driven events separate from render-transition deduplication.
- Documented that skips and assistance actions are observational interaction signals, not disengagement labels or clinical/psychological diagnoses.
- Added backend payload/validation coverage and frontend instrumentation regression tests.

No database migration is required because skip context uses the existing nullable JSONB metadata field.

## Batch B1.2 — Activity lifecycle instrumentation

- Instrumented the active learning-session flow with `ACTIVITY_PRESENTED`, `ACTIVITY_STARTED`, `ANSWER_SUBMITTED`, and `ACTIVITY_COMPLETED` events.
- Reused one frontend-generated session ID until the current session is stopped and deduplicated presentation/start transitions across React re-renders.
- Kept `ActivityAttempt` persistence unchanged and started answer analytics only after the attempt is saved.
- Added exact response time, server-calculated correctness, attempt number, activity ID, and resolved BNCC skill ID without copying raw child answers into analytics metadata.
- Added backend event-payload tests, frontend instrumentation regression tests, and the documented implemented event flow.

No database migration is required for this batch because it uses the append-only schema introduced in B1.1.

## Batch B1.1 — Append-only Learning Analytics events

- Added the `LearningEvent` entity and its initial event-type vocabulary without replacing existing attempts, analytics snapshots, or ADE decisions.
- Added `LearningEventsModule` and failure-contained `LearningEventService.track()` persistence with error logging.
- Added an additive database migration, production `schema.sql` support, query indexes, and database-level rejection of historical updates and deletes.
- Added unit coverage for successful persistence and non-propagating persistence failures.
- Documented the model, derivable metrics, limitations, and privacy implications in `docs/research/BATCH_01_LEARNING_ANALYTICS_PT.md`.

The migration is additive. Its rollback removes only the learning-event table, enum, indexes, trigger, and trigger function.

## Conta Comigo visual identity and public asset delivery

- Preserved the existing Next.js, NestJS, and Python service architecture.
- Integrated the supplied Conta Comigo and TitiA assets into the existing home, authentication, and activity feedback runtime paths.
- Preserved the reward star and added reduced-motion-aware decorative animation.
- Fixed the standalone frontend image so `public/assets` is copied to the runtime container.
- Added an automated regression test for required assets, GIF validity, Docker delivery, and home-page usage.
- Documented the runtime path, accessibility behavior, scope, and limitations in `docs/research/integracao-recursos-visuais.md`.

No database migration is required because this batch changes presentation and container packaging only.

## Authentication integration cleanup

- Removed the orphaned `auth.tsx` implementation and retained `auth.ts` as the single authentication client.
- Routed both registration interfaces through the shared `authService`.
- Aligned frontend registration role types with the lowercase backend enum values.
- Preserved the existing standalone authentication routes and refresh client method for backward compatibility.
- Added frontend structural regression tests and a backend DTO contract test.
- Documented the authentication runtime path and compatibility boundaries in `docs/research/fluxo-autenticacao-interface.md`.

No database migration is required because API payload shape and persisted entities remain unchanged.

## Home modal accessibility

- Removed the viewport restriction that prevented browser zoom.
- Extracted the existing authentication focus behavior into one shared modal-focus hook.
- Applied the same Escape, Tab containment, scroll locking, initial focus, and focus restoration behavior to the TitiA information modal.
- Added explicit pressed-state semantics to authentication view and role selectors.
- Added automated accessibility regression checks and Portuguese research documentation.

No database migration is required because this batch only changes client-side interaction behavior.

## Research documentation claim classification

- Added explicit literature, Conta Comigo proposal, engineering decision, experimental parameter, and hypothesis labels to every research document.
- Explicitly records when a document has no verified literature source or experimental parameter instead of inferring one.
- Added a dissertation drafting section covering methodology, project decisions, limitations, and evidence required in an experiment.
- Added an automated documentation test that enforces the classification labels and final dissertation structure for every Markdown document under `docs/research/`.

No database migration is required because this batch changes research documentation and its validation only.
