// Real rendering tests for the composition/decomposition minigames.
//
// Unlike the other tests in this suite (which assert on raw source text with
// regexes), these tests actually compile the .tsx components with the
// TypeScript compiler API and render them to static HTML with
// react-dom/server. This verifies the *actual DOM output* that a parent
// (and child) would see: real pixel sizes that differ per block/bar, and
// the complete absence of textual size labels ("grande"/"pequeno"/etc).
//
// No jsdom/testing-library is installed in this project, so interactive
// behaviour (drag/drop, clicks) is not exercised here — only the
// server-renderable markup, which is sufficient to catch the "all blocks
// are the same size" / "size shown as text" regressions that were reported.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'src');

const moduleCache = new Map();

function resolveFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Cannot resolve module file: ${basePath}`);
}

// Minimal CommonJS-style loader that transpiles TSX on the fly (JSX ->
// React.createElement) so we can execute real component source without any
// bundler, matching the project's existing lightweight `node --test` setup.
function loadModule(absPath) {
  const cached = moduleCache.get(absPath);
  if (cached) return cached.exports;

  const source = fs.readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: absPath,
  });

  const mod = { exports: {} };
  moduleCache.set(absPath, mod);

  const requireShim = (spec) => customRequire(spec, absPath);
  const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', outputText);
  fn(mod, mod.exports, requireShim, absPath, path.dirname(absPath));
  return mod.exports;
}

function customRequire(spec, fromFile) {
  // Stub the ARASAAC pictogram component: in the real app it fetches
  // images/registry data. For rendering tests we only care that an icon
  // slot is present, not its network behaviour.
  if (spec === '@/components/arasaac/arasaac-pictogram') {
    return {
      ArasaacPictogram: (props) =>
        React.createElement('span', {
          'data-testid': 'arasaac-stub',
          'data-concept-id': String(props?.conceptId ?? ''),
        }),
    };
  }

  if (spec.startsWith('@/')) {
    return loadModule(resolveFile(path.join(SRC_DIR, spec.slice(2))));
  }

  if (spec.startsWith('.')) {
    return loadModule(resolveFile(path.resolve(path.dirname(fromFile), spec)));
  }

  // react, framer-motion, react/jsx-runtime, node builtins, etc. — use the
  // real packages exactly as the app does.
  return require(spec);
}

// `new Function` above runs in CJS-ish scope but this test file is an ESM
// module, so it has no ambient `require`. Provide one via createRequire.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function render(Component, props) {
  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, props));
  return html;
}

function extractInlineSizes(html, idPrefix) {
  // Pull every `style="...width:Npx...height:Mpx..."` occurring on an
  // element whose id/testid matches idPrefix, in source order.
  const re = /style="([^"]*)"/g;
  const sizes = [];
  let match;
  while ((match = re.exec(html))) {
    const style = match[1];
    const widthMatch = style.match(/width:\s*(\d+)px/);
    const heightMatch = style.match(/height:\s*(\d+)px/);
    if (widthMatch && heightMatch) {
      sizes.push({ width: Number(widthMatch[1]), height: Number(heightMatch[1]) });
    }
  }
  return idPrefix ? sizes : sizes;
}

test('BlockStackingMinigame renders blocks with genuinely different pixel sizes and no text size-labels', () => {
  const { BlockStackingMinigame } = loadModule(
    resolveFile(path.join(SRC_DIR, 'components/minigames/block-stacking-minigame')),
  );

  const activity = {
    id: 'activity-1',
    title: 'Pilha Crescente - Do Menor para o Maior!',
    content: {
      instructionsPt: 'Arraste do menor para o maior',
      example: 'Comece pelo bloquinho e termine no blocão',
      spokenHint: 'Olhe o tamanho de cada bloco antes de arrastar',
      items: [
        { id: 'b1', size: 'xsmall', color: '#FF6B6B' },
        { id: 'b2', size: 'medium', color: '#4ECDC4' },
        { id: 'b3', size: 'xxxxlarge', color: '#45B7D1' },
      ],
      validation: { kind: 'sequence' },
      correctAnswer: ['b1', 'b2', 'b3'],
    },
  };

  const html = render(BlockStackingMinigame, {
    skill: 'EF01MA06',
    difficulty: 'easy',
    onComplete: () => {},
    activity,
  });

  const sizes = extractInlineSizes(html);
  assert.ok(sizes.length >= 3, `expected at least 3 sized elements, got ${sizes.length}`);

  const distinctSizes = new Set(sizes.map((s) => `${s.width}x${s.height}`));
  assert.ok(
    distinctSizes.size >= 3,
    `expected at least 3 distinct block sizes in rendered HTML, got: ${[...distinctSizes].join(', ')}`,
  );

  // The three configured sizes (width is the authoritative per-size value;
  // height is a fixed 0.6 ratio of width) must actually appear.
  assert.ok(sizes.some((s) => s.width === 20), 'xsmall (20px width) block missing from render');
  assert.ok(sizes.some((s) => s.width === 50), 'medium (50px width) block missing from render');
  assert.ok(sizes.some((s) => s.width === 150), 'xxxxlarge (150px width) block missing from render');

  // No textual size labels should ever be printed on the blocks themselves.
  const forbiddenLabels = ['GRANDE', 'PEQUENO', 'Bloco 1', 'Bloco 2', 'Bloco 3'];
  for (const label of forbiddenLabels) {
    assert.ok(!html.includes(label), `forbidden text label "${label}" found in rendered HTML`);
  }
});

test('BlockStackingMinigame shows distinct block counts/sizes per activity (no fixed block count across exercises)', () => {
  const { BlockStackingMinigame } = loadModule(
    resolveFile(path.join(SRC_DIR, 'components/minigames/block-stacking-minigame')),
  );

  const smallActivity = {
    id: 'a-small',
    title: 'Exercise A',
    content: { items: [{ id: 'x1', size: 'small' }, { id: 'x2', size: 'large' }] },
  };
  const bigActivity = {
    id: 'a-big',
    title: 'Exercise B',
    content: {
      items: Array.from({ length: 6 }, (_, i) => ({ id: `y${i}`, size: 'medium' })),
    },
  };

  const htmlSmall = render(BlockStackingMinigame, { skill: 's', difficulty: 'easy', onComplete: () => {}, activity: smallActivity });
  const htmlBig = render(BlockStackingMinigame, { skill: 's', difficulty: 'easy', onComplete: () => {}, activity: bigActivity });

  const countBlocks = (html) => (html.match(/draggable="true"/g) || []).length;
  assert.equal(countBlocks(htmlSmall), 2, 'expected exactly 2 draggable blocks for the 2-item activity');
  assert.equal(countBlocks(htmlBig), 6, 'expected exactly 6 draggable blocks for the 6-item activity');
  assert.notEqual(countBlocks(htmlSmall), countBlocks(htmlBig), 'different activities must not always show the same block count');
});

test('BarCombinationMinigame renders each bar as countable unit squares (no numeric/text labels)', () => {
  const { BarCombinationMinigame } = loadModule(
    resolveFile(path.join(SRC_DIR, 'components/minigames/bar-combination-minigame')),
  );

  const activity = {
    id: 'bars-1',
    title: 'Jogo da Composição: Combine os Blocos!',
    content: {
      targetValue: 8,
      example: 'Combine barras cujas quantidades somem 8',
      spokenHint: 'Conte os quadradinhos de cada barra',
      bars: [
        { id: 'bar1', value: 1, color: '#FF6B6B' },
        { id: 'bar2', value: 3, color: '#4ECDC4' },
        { id: 'bar3', value: 5, color: '#45B7D1' },
      ],
    },
  };

  const html = render(BarCombinationMinigame, { onComplete: () => {}, activity });

  // Each bar must render a number of unit-square child elements equal to
  // its value — this is how quantity is conveyed without any text.
  for (const bar of activity.content.bars) {
    const re = new RegExp(`data-bar-id="${bar.id}"[^]*?(?=data-bar-id="|$)`);
    const chunk = html.match(re)?.[0] ?? '';
    const unitCount = (chunk.match(/data-unit="true"/g) || []).length;
    assert.equal(unitCount, bar.value, `bar ${bar.id} should render ${bar.value} unit squares, got ${unitCount}`);
  }

  // No raw digits should be printed as a value label anywhere in the bars.
  assert.ok(!/>\s*[0-9]+\s*</.test(html), 'a numeric label appears to be rendered as text content');
});

test('TwoGroupSplitMinigame renders one unit block per item with no group-size text labels', () => {
  const { TwoGroupSplitMinigame } = loadModule(
    resolveFile(path.join(SRC_DIR, 'components/minigames/two-group-split-minigame')),
  );

  const activity = {
    id: 'split-7',
    title: 'Decomponha o número 7',
    content: {
      items: Array.from({ length: 7 }, (_, i) => ({ id: `u${i}`, color: '#FFD700' })),
      example: '7 pode ser 3 + 4, ou 2 + 5...',
      spokenHint: 'Arraste as bolinhas para os dois grupos',
    },
  };

  const html = render(TwoGroupSplitMinigame, { skill: 's', difficulty: 'easy', onComplete: () => {}, activity });

  const unitCount = (html.match(/draggable="true"/g) || []).length;
  assert.equal(unitCount, 7, `expected 7 draggable unit blocks for "Decomponha o número 7", got ${unitCount}`);

  const forbiddenLabels = ['GRANDE', 'PEQUENO'];
  for (const label of forbiddenLabels) {
    assert.ok(!html.includes(label), `forbidden text label "${label}" found in rendered HTML`);
  }
});
