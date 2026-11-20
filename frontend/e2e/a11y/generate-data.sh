#!/usr/bin/env bash
# Builds the island map used by the accessibility audit from the backend seeds
# (island catalog + 2º–5º ano exercises), so logged-in pages render real
# content without a database.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT/backend"
npx ts-node --transpile-only -e "
const { curriculumProgressionActivities } = require('./src/database/seeds/curriculum-progression.seed');
const { ISLAND_CATALOG, classifyActivityIsland } = require('./src/database/seeds/island-catalog.seed');
const acts = curriculumProgressionActivities().map((a, i) => ({ ...a, id: '00000000-0000-4000-8000-' + String(i).padStart(12, '0') }));
const islands = ISLAND_CATALOG.map((island, order) => {
  const mine = acts.filter((a) => classifyActivityIsland(a) === island.islandId).map((a, k) => ({
    id: a.id, title: a.title, type: a.type, difficulty: a.difficulty, modality: 'visual',
    completed: k % 3 === 0, recommended: order === 0 && k === 1, bnccSkills: a.bnccSkills,
    sequenceInIsland: k + 1, content: a.content, accessibility: a.accessibility,
    targetModalities: a.targetModalities, pointsReward: a.pointsReward, locked: false,
  }));
  return { ...island, sequenceOrder: order + 1, totalActivities: mine.length,
    completedCount: mine.filter((a) => a.completed).length, activities: mine, locked: false };
});
const map = { islands, completedTotal: islands.reduce((s, i) => s + i.completedCount, 0),
  totalActivities: islands.reduce((s, i) => s + i.totalActivities, 0) };
require('fs').writeFileSync('$ROOT/frontend/e2e/a11y/.islands-map.json', JSON.stringify(map));
// One exercise of each type from every seed, to audit each format on /learn.
const pools = [acts, require('./src/database/seeds/interactive-formats.seed').interactiveFormatActivities(),
  require('./src/database/seeds/template-activities.seed').templateActivities(),
  require('./src/database/seeds/activity-pools.seed').expandedActivityPools()];
const byType = {};
pools.flat().forEach((a, i) => { if (!byType[a.type]) byType[a.type] = { ...a, id: a.id ?? '00000000-0000-4000-9000-' + String(i).padStart(12, '0') }; });
require('fs').writeFileSync('$ROOT/frontend/e2e/a11y/.activity-samples.json', JSON.stringify(Object.values(byType)));
console.log('exercise types: ' + Object.keys(byType).join(', '));
console.log(islands.map((i) => i.name + ': ' + i.totalActivities).join('\n'));
"
