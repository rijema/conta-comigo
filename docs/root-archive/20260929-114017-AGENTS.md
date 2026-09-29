# ContaComigo — Project Instructions

## Architecture

- Preserve the existing NestJS, Next.js, and Python ML service architecture.
- Do not redesign the application unless explicitly requested.
- Preserve backward compatibility whenever practical.
- Do not create duplicate implementations.

## Research integrity

- Do not invent scientific claims, citations, thresholds, formulas, or ontology relations.
- Treat experimental thresholds as configurable research parameters.
- Stop and report when required scientific information is unknown.
- Do not introduce camera, facial recognition, biometrics, video recording, or additional personal data collection.

## Development workflow

Before changing code, report:

- Existing relevant implementations.
- Files that will be modified.
- Conflicting implementations.
- Migration risks.

Every implementation batch must include:

- Automated tests.
- Database migration when required.
- Documentation under `docs/research/`.
- An update to `CHANGE_SUMMARY.md`.

## Language

- Code, identifiers, comments, tests, and commit messages must be in English.
- Research documentation must be written in Portuguese.

## Scientific documentation

Classify statements with:

- `[LITERATURA]`
- `[PROPOSTA CONTA COMIGO]`
- `[DECISÃO DE ENGENHARIA]`
- `[PARÂMETRO EXPERIMENTAL]`
- `[HIPÓTESE A VALIDAR]`

Every document under `docs/research/` must end with:

## Texto potencial para a dissertação

### Metodologia

### Decisão de projeto

### Limitações

### Evidência necessária no experimento