#!/usr/bin/env bash
# Writes the 2º–5º ano exercises (backend seed) to public/__progression-preview.json
# so the dev page /pt/dev/progression-preview can render them without a database.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/backend"
npx ts-node --transpile-only -e "
const { curriculumProgressionActivities } = require('./src/database/seeds/curriculum-progression.seed');
const acts = curriculumProgressionActivities().map((a, i) => ({ ...a, id: '00000000-0000-4000-8000-' + String(i).padStart(12, '0') }));
require('fs').writeFileSync('$ROOT/frontend/public/__progression-preview.json', JSON.stringify(acts));
console.log(acts.length + ' exercises written');
"
