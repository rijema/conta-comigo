import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const educator = readFileSync(new URL('../src/app/[locale]/dashboard/educator/page.tsx', import.meta.url), 'utf8');
const guardian = readFileSync(new URL('../src/app/[locale]/dashboard/guardian/page.tsx', import.meta.url), 'utf8');

test('professional dashboard distinguishes observations from BKT estimates', () => {
  assert.match(educator, /longitudinal-analytics/);
  assert.match(educator, /Dados observados/);
  assert.match(educator, /Estimativas do modelo BKT/);
  assert.match(educator, /dados insuficientes/i);
});

test('guardian dashboard uses its reduced endpoint and avoids fabricated radar scores', () => {
  assert.match(guardian, /children\/\$\{child\.id\}\/longitudinal-analytics/);
  assert.match(guardian, /Precisão observada/);
  assert.doesNotMatch(guardian, /return 80|return 20|return 45/);
  assert.doesNotMatch(guardian, /Acima de 60%/);
});
