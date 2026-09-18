# Change Summary

## Batch B7 — Interactive exercise formats

- Added 26 authored visual format families with two difficulty stages, including grouping, quantity building, bidirectional matching, six spatial relations, length and container fullness.
- Reused the existing activity renderer, server answer validation, seed, activity tree, attempt tracking, and ARASAAC registry.
- Corrected four legacy BNCC links through the idempotent seed and labeled exploratory activities honestly in the island map and activity badge.
- Added catalog and answer validation tests plus Portuguese research documentation. No database schema migration is needed because all new interaction data uses the existing JSON content field.

## Batch B6.1 — Push-to-talk and neural TitiA speech

- Added feature-flagged, explicit push-to-talk with conservative Portuguese command interpretation.
- Reused help, instruction replay, speech stop, and “Quero outro” flows instead of duplicating actions.
- Added in-memory Faster-Whisper STT and optional Piper pt-BR TTS with browser fallback and generated-TitiA-audio caching only.
- Added sanitized semantic voice events without persisting audio or raw transcripts.
- Added PostgreSQL enum migration, privacy/provider tests, deployment settings, and Portuguese research documentation.
- Moved neural-speech validation into an imported DTO to avoid decorator metadata initialization errors at application startup.
- Provisioned the pinned Piper Brazilian Portuguese voice and its model card in the ML image so neural speech can be tested after deployment.
- Forwarded public voice feature flags into the frontend Docker build, preventing production bundles from silently disabling microphone and neural speech controls.


## InteractionEvidence PostgreSQL metadata fix

- Declared nullable interaction-demand and outcome fields explicitly as `varchar`, preventing TypeORM from inferring the unsupported `Object` type during startup and database seeding.
- Added entity-metadata regression coverage; no database migration is required because the persisted schema already uses text-compatible columns.


## Batch B5.1 — Longitudinal Learning Analytics dashboards

- Added backend-aggregated longitudinal views for protected professional and guardian routes.
- Clearly separated observed interaction data from BKT model estimates and preserved missing evidence as `null`/insufficient data.
- Added recommendation outcome, adaptation, format, interaction-context, and professional-feedback summaries without exposing raw event payloads.
- Replaced fabricated guardian skill-radar values and fixed performance thresholds with evidence-aware, plain-language presentation.
- Added automated aggregation/privacy tests and updated the existing Portuguese Learning Analytics research documentation.


## Batch B4.4 — Adaptive feedback loop and professional review

- Added the child-facing accessible “Quero outro” action without ending the learning session.
- Connected skip, semantic filtering, hybrid reranking, replacement presentation, and AdaptationTransition completion.
- Preserved the current BNCC target when semantically available while excluding the exact rejected activity.
- Added post-session adaptation review and optional professional feedback without changing BKT, ontology, weights, or learner characteristics.
- Extended the protected research trace with the complete adaptation sequence and added migrations, tests, and Portuguese documentation.


## Batch B2.5 — Recommendation outcome traceability

- Added idempotent RecommendationOutcome synchronization from append-only LearningEvents.
- Propagated optional recommendation IDs through presentation, assistance, skip, answer, and completion events while preserving manual activity flows.
- Added pending/completable AdaptationTransition records for future replacement recommendations.
- Added contextual InteractionEvidence without modifying BKT mastery or permanent learner characteristics.
- Added additive database schema changes and backend/frontend propagation coverage.


## Batch B2.4 — Hybrid recommendation ranking

- Added deterministic six-factor ranking after formal semantic filtering.
- Kept StudentSkillState/BKT as the sole mastery source and missing interaction evidence neutral.
- Added exact-activity recency and skip penalties without blacklisting activity families.
- Persisted selected activity, candidate scores, configuration/version, provenance, and explicit fallback status on the existing AdeDecision.
- Added an additive database migration, automated tests, environment configuration, and Portuguese research documentation.


## Batch B4.2 — TitiA speech and guided instructions

- Added a replaceable `TitiaSpeechService` that centralizes browser TTS, sequential instructions, cancellation, replay, rate, language, hints, feedback, and pictogram speech.
- Added optional authored speech fields and a visible step-by-step guidance panel with listen, replay, and stop controls.
- Added persisted voice, speech-rate, automatic-instruction, language, and sound controls through the application accessibility provider.
- Reused the current learning-session ID and deduplicated automatic speech per session/activity across React remounts.
- Added spoken pictograms to the ARASAAC library and learning menu without automatically speaking every interaction.
- Added five sanitized append-only speech event types and an authenticated endpoint without storing spoken or child-entered text.
- Added explicit short speech sequences to two parametric seed examples while retaining sentence-based fallback for existing activities.
- Added behavioral service tests plus frontend/backend integration and migration coverage.

The migration only extends the LearningEvent enum. No speech replay is interpreted as inability, and no voice recording, recognition, recommendation change, or adaptive threshold was added.

## Batch B4.1 — ARASAAC visual communication and learning library

- Added a centralized, extensible `PictogramConcept`/`PictogramRegistry` vocabulary, including numbers 0–20 and backward-compatible activity aliases.
- Added one accessible `ArasaacPictogram` component with text-by-default behavior and remote-image fallback.
- Restored the six-section “Aprender com a TitiA” visual library with optional examples and browser speech actions, explicitly outside adaptive recommendation.
- Removed ARASAAC CDN construction and numeric IDs from React components and reused the registry in activities, the learning menu, and the public ARASAAC section.
- Added official in-application attribution and documented CC BY-NC-SA provenance from ARASAAC terms.
- Added three sanitized append-only visual interaction event types, an authenticated endpoint, and non-blocking frontend tracking using the current learning-session ID.
- Added backend and frontend regression coverage for the enum migration, metadata boundary, registry, fallback, alt text, visible labels, categories, and tracking.

The database migration only extends the existing learning-event enum. It does not alter recommendation behavior, download the ARASAAC catalog, or make the visual library adaptive.

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

## Child activity guidance and drag interaction refinement

- Enabled automatic spoken instructions by default for new accessibility profiles while preserving saved preferences and per-session deduplication.
- Removed the redundant Listen control and duplicated written prompt from the TitiA guidance panel; Repeat remains available and can initiate playback if needed.
- Replaced generic, repeated help copy with one family-aware visual tutorial entry point using centralized pictograms.
- Added responsive TitiA companion artwork beside the activity and enlarged correct/retry feedback artwork.
- Fixed the drag-and-drop offset duplicate by keeping movement exclusively in `DragOverlay` and hiding the source item during drag.
- Added frontend regression tests and updated Portuguese research documentation.

No database migration is required because these changes only affect frontend presentation and interaction.

## ML service Docker context correction

- Updated the ML Dockerfile to copy files from `ml-service/` when Railway supplies the monorepo root as the Docker build context.
- Replaced the ML Railpack plan with the repository Dockerfile so the Piper model is included in the deployed image.
- Added a regression check for Docker context paths and Railway builder selection.

No database migration is required because this only changes deployment packaging.

## Empty analytics response handling

- Updated the shared frontend API client to accept successful `204` and empty response bodies without attempting invalid JSON parsing.
- Preserved structured JSON errors and added safe plain-text error handling.
- Added regression coverage for non-blocking Learning Analytics requests.

No database migration is required because this is a frontend transport correction.

## TitiA neural speech runtime completion

- Initialized one neural-first speech engine lifecycle over the shared TitiA speech service, retaining browser speech only as fallback.
- Propagated request cancellation into `fetch`, discarded stale neural responses, cleaned transient audio, and added content-free development diagnostics.
- Delayed spoken analytics and automatic-instruction deduplication until playback starts.
- Added automatic navigation cancellation, spoken tutorial steps, progressive hint speech, existing feedback speech, and a production-blocked voice QA page.
- Added configurable Piper model/config paths and selected the documented female pt-BR Dii model, with its non-commercial CC BY-NC-ND 4.0 restriction recorded explicitly.
- Added safe backend ML gateway errors and expanded frontend, backend, and ML tests.

No database migration is required because no persisted schema changed.

## Child experience consistency pass

- Centered and compacted the learning activity, removed decorative side characters and competing difficulty/reward stars, and retained one session progress indicator.
- Anchored drag overlays to mouse/touch coordinates, added restrained hover/press feedback, and kept tap-based drag alternatives.
- Consolidated correct/incorrect feedback into one larger TitiA reaction with a brief color cue.
- Added contextual speech controls, spoken choices, automatic spoken help, and self-resetting spoken voice-command recovery.
- Added same-student, eight-hour local activity restoration and changed logout navigation to the public home page.
- Separated shape prompts from text-only alternatives and explicitly authored the commutative order accepted by the addition sequence.
- Added frontend and backend regression tests and Portuguese research documentation.

No database migration is required because persistence is browser-local and the activity content remains JSONB-compatible.

## Child experience visual refinement

- Widened the activity canvas and restored stronger visual scale without reintroducing decorative side characters.
- Replaced the remaining joystick fallback in core learning navigation with registered ARASAAC imagery.
- Made speech initiation explicit, kept the stop control spatially stable, and renamed help around learning how to play with TitiA.
- Unified every activity family under one colored sweep feedback animation and removed persistent local correctness messages.
- Increased color and interaction feedback while respecting reduced-motion preferences.
- Expanded the trail map and made its two-column accordion exclusive, visually de-emphasizing the inactive sibling trail.
- Removed the low-information visual-modality sentence from child recommendation explanations.

No database migration is required because these are presentation, speech-control, and deterministic explanation-copy changes.

## BNCC transparency and child action refinement

- Exposed all activity BNCC codes and human-readable activity-family labels in gameplay and trail cards.
- Confirmed EF01MA01 diversity comes from two existing, validated interaction families instead of fabricating curriculum mappings.
- Grouped change, child chat, and visual help into one action row and kept the progress header focused.
- Turned “Falar com a TitiA” into the existing child chatbot, with text input and ephemeral voice transcription inside the dialog.
- Extended spoken guidance beyond prompt reading with interaction-specific steps.
- Removed low-information child recommendation copy and lengthened the unified feedback sweep to provide a readable hold phase.

No database migration is required because persisted entities and analytics payloads are unchanged.

## Neural speech backend proxy correction

- Replaced the Axios/RxJS synthesis bridge with the native Node fetch path already proven against the deployed ML service.
- Added a configurable 30-second abort timeout, base-URL validation, `audio/wav` verification, single binary-body consumption, empty-audio rejection, and transient base64 conversion.
- Added privacy-safe operational diagnostics for upstream status, content type, byte count, timeout, and network failures.
- Added mocked proxy tests for success, forwarding, binary conversion, upstream errors, timeout, network failure, content type, URL normalization, and log privacy.

No database migration is required because the HTTP contract and persisted schema are unchanged.
## Batch B3.1 — Adaptive activity framework consolidation

- Added one runtime semantic contract for Counting, Multiple Choice, Quiz, Drag and Drop, and Number Line.
- Exposed normalized activity type, resolved BNCC skill ID, documented mathematical concepts, representations, interactions, multidimensional difficulty, affordances, and child-communication cues.
- Preserved the persisted `easy`/`medium`/`hard` label and existing answer/rendering behavior.
- Kept unsupported values explicit through nulls, unannotated dimensions, mapping status, and engineering provenance.
- Reused the repository's existing BNCC and activity-ontology mappings without deriving difficulty from ASD support level.
- Added backend unit coverage and matching frontend TypeScript contracts.

No database migration is required because the semantic fields are derived response metadata and no persisted schema changed.
## Batch B3.2 — Parametric mathematics activity families

- Added six configurable activity families: composition/decomposition, missing number, pattern completion, representation matching, error detection, and contextual problem solving.
- Added one shared frontend renderer, centralized pictogram concept registry, optional scaffolding, and two-stage error reasoning.
- Added configurable backend answer validation while preserving legacy answer behavior.
- Added five coverage-driven seed instances for EF01MA07, EF01MA06, EF01MA14, and EF01MA08; Pattern Completion remains unseeded until its curriculum mapping is verified.
- Added the missing officially documented EF01MA07 and EF01MA14 seed records.
- Added an additive activity-type migration and made activity seeding incremental for existing installations.
- Updated semantic coverage snapshots and added backend/frontend regression tests, including Learning Analytics tracking.

No recommendation ranking, Generalization Score, full ARASAAC integration, learner mastery logic, or legacy activity remapping changed in this batch.
# Batch 04.3 — Role-appropriate recommendation explanations

- Added a deterministic `RecommendationExplanationService` that derives child, guardian, professional, and technical explanations from the same persisted `AdeDecision`.
- Sanitized child and guardian recommendation responses and replaced raw technical UI output with audience-appropriate language.
- Added readable professional summaries with optional details.
- Added an authorized research/debug endpoint and a hidden panel requiring the environment flag, `?research=true`, and an existing professional/admin role.
- Represented unsupported ranking metrics explicitly as `not_recorded` instead of inventing scores.
- Added backend and frontend tests plus Portuguese research documentation.
- No database migration was required because the existing `ade_decisions` record remains the source decision and no schema changed.
# Batch 02.3 — Formal ontology runtime integration

- Replaced the unused LASDONT JSON `OntologyService` implementation with a startup-validated, cached loader for `ontology/contacomigo/contacomigo.owl`.
- Added ephemeral runtime semantic materialization and non-ranking activity candidate filtering.
- Integrated formal filtering into the real `AdeService → ActivitiesService` selection path and persisted versioned semantic traces in the existing decision JSONB.
- Kept BKT as the sole mastery source and separated legacy procedural modality signals from formal ontology inferences.
- Added explicit, honestly labeled legacy fallback behavior for missing semantic coverage.
- Packaged/mounted the ontology for production and development containers.
- Added loader, filtering, missing-file, fallback, and production-call-path tests.
- No database migration was required because no schema changed.

## 2026-09-18 — Difficulty progression and activity pools

- Added five difficulty levels while retaining the existing three values, and optional weighted primary/secondary BNCC metadata.
- Reused ADE, BKT, hybrid ranking and learning events for evidence based progression and cooldown across attempts and skips.
- Added 60 authored activity structures across 12 niches, with five levels per niche and contextual/sensory metadata.
- Updated the runtime SQL migration, tests and Portuguese research documentation. Thresholds and curricular mappings require experimental and specialist validation.

## 2026-09-18 — Ontology-informed recommendation refinement

- Reused the formal ontology filter and existing hybrid ranking to identify concept-linked skills with explicit provenance; no unsupported prerequisite, complement or contrast assertions were added.
- Added reinforcement for slow correct responses, controlled related-skill exploration, and checks of authored activity prerequisites against observed BKT mastery.
- Extended the versioned ranking with sensory, format, structure repetition and response-time-related frustration factors, retaining existing score components and recommendation tracking.
- Expanded persisted candidate evidence and research explanations. Updated configurable parameter examples, automated tests and Portuguese research documentation. No database migration was needed because existing decision fields are JSON.
