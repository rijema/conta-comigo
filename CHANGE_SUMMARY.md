# Change Summary

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
