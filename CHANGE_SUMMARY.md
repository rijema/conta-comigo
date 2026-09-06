# Change Summary

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
