// WCAG 2.2 A/AA audit of every Conta Comigo screen with axe-core.
//
// The API is answered by Playwright with fixed data (see fixtures below), so
// logged-in screens (child, guardian, professional) render without a backend.
// Run:  ./e2e/a11y/generate-data.sh && npx next dev -p 3124   (other terminal)
//       npm run test:a11y                 # BASE_URL=http://localhost:3124
// Exit code is 1 when any screen has a violation.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE_URL ?? 'http://localhost:3124';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const ISLANDS = JSON.parse(fs.readFileSync(path.join(__dirname, '.islands-map.json'), 'utf8'));
const SAMPLES = JSON.parse(fs.readFileSync(path.join(__dirname, '.activity-samples.json'), 'utf8'));
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const USERS = {
  child: { id: 'u-child', name: 'Olívia', email: 'olivia@exemplo.org', role: 'child', lgpdConsentGiven: true, isActive: true },
  guardian: { id: 'u-guardian', name: 'Ana Souza', email: 'ana@exemplo.org', role: 'guardian', lgpdConsentGiven: true, isActive: true },
  professional: { id: 'u-prof', name: 'Carla Lima', email: 'carla@exemplo.org', role: 'professional', lgpdConsentGiven: true, isActive: true },
};
const LEARNERS = [
  { id: 'l1', name: 'Olívia', age: 7, asdSupportLevel: 'mild' },
  { id: 'l2', name: 'Pedro Silva', age: 8, asdSupportLevel: 'moderate' },
  { id: 'l3', name: 'Lucas Muniz', age: 9, asdSupportLevel: 'strong' },
];
const LONGITUDINAL = {
  evidenceState: { status: 'SUFFICIENT' },
  observedData: {
    answers: 57, accuracy: 0.8, activitiesCompleted: 43, hints: 6,
    recommendationSummary: { completionRate: 0.76, skipRate: 0.02 },
    activityFormats: [{ type: 'quiz', count: 18 }, { type: 'drag_drop', count: 11 }, { type: 'counting', count: 8 }],
  },
  longitudinal: {
    trendMessage: 'Série observada por sessão; a linha, isoladamente, não demonstra melhora.',
    sessions: [
      { sessionId: 's1', date: '2026-11-07', activitiesCompleted: 11, attempts: 20, hints: 5, instructionReplays: 2, accuracy: 0.85, averageResponseTimeMs: 6079 },
      { sessionId: 's2', date: '2026-11-12', activitiesCompleted: 0, attempts: 0, hints: 1, instructionReplays: 0, accuracy: null, averageResponseTimeMs: null },
    ],
  },
  learningProgress: { masteryEstimates: [
    { skillCode: 'EF01MA01', estimatedMastery: 1, observations: 7 },
    { skillCode: 'EF01MA02', estimatedMastery: 0.4, observations: 1 },
    { skillCode: 'EF01MA07', estimatedMastery: null, observations: 0 },
  ] },
  adaptations: { totalChangeRequests: 1, pauses: 0, pauseSuggestions: 0, sameSkillReplacements: 1, items: [] },
  professionalFeedback: [],
  interactionHistory: { status: 'OK', items: [{ representation: 'visual', interactionType: 'tap', motorDemand: 'low', sensoryLoad: 'low', count: 4 }] },
};
const PROFILE = {
  asdSupportLevel: 'mild', currentStreak: 2,
  stats: { totalAttempts: 20, correctAttempts: 19, accuracy: 95 },
  strengths: { visual: true, logical: true }, weaknesses: { motor: true },
  bnccProgress: { EF01MA01: { attempted: 7, mastered: true, accuracy: 100 }, EF01MA02: { attempted: 3, mastered: false, accuracy: 60 } },
  uiPreferences: {},
};
const ADAPTATIONS = [{
  id: 'ad1', skill: 'EF01MA02', previousActivity: { title: 'Contar as estrelas' }, replacementActivity: { title: 'Contar figuras' },
  previousOutcome: { status: 'SKIPPED' }, replacementOutcome: { status: 'COMPLETED' },
  professionalExplanation: 'A criança pediu outro exercício; a TitiA manteve a mesma habilidade.', feedback: null,
}];
const firstActivity = ISLANDS.islands[0].activities[1];

function fixture(method, p, role, screen = {}) {
  const user = USERS[role];
  if (p === '/auth/me') return user;
  if (p === '/activities/islands/map') return ISLANDS;
  if (p.startsWith('/activities/next')) {
    const id = new URLSearchParams(p.split('?')[1] ?? '').get('activityId');
    return { activity: SAMPLES.find((a) => a.id === id) ?? firstActivity, adeDecision: { id: 'rec-1', reason: 'Recomendado', strategy: 'mastery' }, preferredModality: 'visual' };
  }
  if (p === '/activities/change') return { activity: ISLANDS.islands[0].activities[2], adeDecision: { id: 'rec-2', reason: 'Troca', strategy: 'same_skill' }, pauseSuggested: true };
  if (/^\/educator\/learners\/[^/]+\/report$/.test(p)) return {
    generatedAt: '2026-11-20T12:00:00Z', learner: { name: 'Olívia', age: 7, asdSupportLevel: 'mild' }, totalAttempts: 20,
    bnccChart: [{ skill: 'EF01MA01', attempts: 7, accuracy: 100 }, { skill: 'EF01MA02', attempts: 3, accuracy: 60 }],
    adeDecisions: [{ id: 'd1', createdAt: '2026-11-07T10:00:00Z', reason: 'Manter habilidade', strategy: 'mastery' }],
  };
  if (p.startsWith('/users/') && p.endsWith('/child-profile')) return { name: 'Olívia', age: 7, uiPreferences: screen.childPrefs ?? {} };
  if (/^\/educator\/learners\/[^/]+\/skills$/.test(p)) return { success: true };
  if (p === '/educator/learners' || p === '/users/educator/learners') return LEARNERS;
  if (p === '/educator/attendance/active') return [{ attendanceId: 'a1', learnerId: 'l1', learnerName: 'Olívia', startedAt: '2026-11-03T17:28:33Z' }];
  if (/\/longitudinal-analytics$/.test(p)) return LONGITUDINAL;
  if (/^\/educator\/learners\/[^/]+\/profile$/.test(p)) return PROFILE;
  if (/\/adaptations$/.test(p)) return ADAPTATIONS;
  if (/\/ade-history$/.test(p) || p.startsWith('/ade/decisions/')) return [];
  if (p.startsWith('/learning-events/review/evidence/')) return [];
  if (p === '/guardian/children-summary') return [{ id: 'c1', name: 'Olívia', age: 7, asdSupportLevel: 'mild', totalAttempts: 20, accuracy: 95 }];
  if (/^\/guardian\/children\/[^/]+$/.test(p)) return { id: 'c1', name: 'Olívia', age: 7, profile: PROFILE, stats: PROFILE.stats, recentSessions: [] };
  if (/\/cycles$/.test(p)) return { cycles: [] };
  if (method !== 'GET') return {};
  return null;
}

// Each screen: role (null = signed out), path and optional steps that reveal
// states WAVE also sees (dialogs, tabs).
const SCREENS = [
  { name: 'home', role: null, path: '/pt' },
  { name: 'home-login-dialog', role: null, path: '/pt', open: async (page) => { await page.getByRole('button', { name: /entrar/i }).first().click(); } },
  { name: 'auth-login', role: null, path: '/pt/auth/login' },
  { name: 'auth-register', role: null, path: '/pt/auth/register' },
  { name: 'learn-menu', role: 'child', path: '/pt/learn/menu' },
  { name: 'learn-islands', role: 'child', path: '/pt/learn/islands' },
  { name: 'learn-exercise', role: 'child', path: '/pt/learn' },
  { name: 'learn-help-menu', role: 'child', path: '/pt/learn', open: async (page) => { await page.getByRole('button', { name: /^Ajuda/ }).click(); } },
  { name: 'learn-pause-suggestion', role: 'child', path: '/pt/learn', open: async (page) => {
    // Keyboard activates "Quero outro" at once (the hold is pointer-only).
    await page.getByRole('button', { name: 'Quero outro exercício' }).focus(); await page.keyboard.press('Enter');
    await page.getByText('Quer fazer uma pausa?').waitFor(); } },
  { name: 'learn-hold-activates', role: 'child', path: '/pt/learn', open: async (page) => {
    // Pointer: holding for 600 ms+ triggers the change (and the pause suggestion fixture).
    const box = await page.getByRole('button', { name: 'Quero outro exercício' }).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.waitForTimeout(900); await page.mouse.up();
    await page.getByText('Quer fazer uma pausa?').waitFor(); } },
  { name: 'learn-calm-pause', role: 'child', path: '/pt/learn', open: async (page) => { await page.getByRole('button', { name: 'Quero fazer uma pausa' }).click(); await page.getByText('Hora da pausa').waitFor(); } },
  ...SAMPLES.map((a) => ({ name: `exercise-${a.type}`, role: 'child', path: `/pt/learn?activityId=${a.id}&islandId=island-numbers` })),
  // /pt/progress is left out: nothing links to it and it crashes on main
  // (it still uses the old AuthContext without a provider).
  { name: 'settings', role: 'child', path: '/pt/settings' },
  { name: 'guardian-dashboard', role: 'guardian', path: '/pt/dashboard/guardian' },
  { name: 'educator-dashboard', role: 'professional', path: '/pt/dashboard/educator' },
  ...['Perfil e experiência', 'IA/ADE', 'Relatório'].map((tab) => ({
    name: `educator-tab-${tab.normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}`, role: 'professional', path: '/pt/dashboard/educator',
    open: async (page) => { await page.getByRole('button', { name: new RegExp(tab) }).first().click(); },
  })),
  { name: 'educator-ade-log', role: 'professional', path: '/pt/educator/ade-log' },
  // Child display settings (gear), reading mode and every color theme.
  { name: 'learn-display-settings', role: 'child', path: '/pt/learn', open: async (page) => { await page.getByRole('button', { name: /^Ajustes da tela/ }).click(); await page.getByText('Ajustes da tela', { exact: true }).waitFor(); } },
  { name: 'learn-reading-mode', role: 'child', path: '/pt/learn', open: async (page) => { await page.getByRole('button', { name: /^Ajustes da tela/ }).click(); await page.getByRole('button', { name: 'Modo leitura' }).click(); await page.getByText('Voltar ao exercício').waitFor(); } },
  ...[['cream', 'atkinson'], ['calm', 'lexend'], ['default', 'atkinson']].map(([colorTheme, readingFont]) => ({
    name: `learn-theme-${colorTheme}-${readingFont}`, role: 'child', path: '/pt/learn', display: { colorTheme, readingFont, pictogramScale: 1.5, itemScale: 1.3 } })),
  { name: 'learn-theme-high-contrast', role: 'child', path: '/pt/learn', display: { highContrast: true, pictogramScale: 2 } },
  ...['cream', 'calm'].map((colorTheme) => ({ name: `exercise-drag_drop-${colorTheme}`, role: 'child', display: { colorTheme },
    path: `/pt/learn?activityId=${SAMPLES.find((a) => a.type === 'drag_drop').id}&islandId=island-numbers` })),
  // Professional-hidden controls and the press-and-hold hint (GAIA G28).
  ...['icons', 'text'].map((buttonLabels) => ({ name: `learn-buttons-${buttonLabels}`, role: 'child', path: '/pt/learn', display: { buttonLabels } })),
  { name: 'learn-hidden-controls', role: 'child', path: '/pt/learn', childPrefs: { hiddenControls: ['change', 'pause', 'map', 'guide'] } },
  { name: 'learn-hold-hint', role: 'child', path: '/pt/learn', open: async (page) => { await page.getByRole('button', { name: 'Quero outro exercício' }).click(); await page.getByText(/Segure o botão um pouquinho/).waitFor(); } },
  { name: 'educator-tab-tela-da-crianca', role: 'professional', path: '/pt/dashboard/educator', open: async (page) => {
    await page.getByRole('button', { name: /Ajustar tela da criança/ }).click();
    await page.getByRole('button', { name: 'Ocultar: Quero outro' }).click();
    await page.getByRole('button', { name: 'Ocultar: Mapa (sair da atividade)' }).click();
  } },
];

// Color helpers shared by the in-page checks below.
const COLOR_HELPERS = `
  window.__a11y = (() => {
    const parse = (c) => { const m = (c || '').match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
    const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
    // Solid background behind an element (ignores gradients, like WAVE).
    const bgOf = (el) => { const stack = []; let n = el; while (n && n.nodeType === 1) { const bg = parse(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0) { stack.push(bg); if (bg.a >= 1) break; } n = n.parentElement; } let out = { r: 255, g: 255, b: 255, a: 1 }; for (const l of stack.reverse()) out = blend(l, out); return out; };
    const label = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.name || el.tagName).trim().slice(0, 50);
    return { parse, blend, ratio, bgOf, label };
  })();`;

// Checks axe does not automate: 1.4.11 (field borders, focus indicator),
// 2.4.7 + 2.4.11 (focus visible and not hidden by sticky/fixed bars, walking
// the page with Tab like a keyboard user), 1.4.12 (text spacing) and 2.4.2
// (each screen has its own title).
async function extraChecks(page, role) {
  await page.addScriptTag({ content: COLOR_HELPERS });
  const fields = await page.evaluate(() => {
    const { parse, blend, ratio, bgOf, label } = window.__a11y;
    const out = [];
    for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select')) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width < 2 || cs.visibility === 'hidden' || el.disabled || el.closest('[aria-hidden="true"]')) continue;
      const outer = bgOf(el.parentElement); const inner = bgOf(el);
      const border = parse(cs.borderTopColor); const width = parseFloat(cs.borderTopWidth);
      const edge = width >= 1 && border ? Math.max(ratio(blend(border, inner), outer), ratio(blend(border, inner), inner)) : ratio(inner, outer);
      if (edge < 3) out.push({ target: `"${label(el)}"`, html: el.className.slice(0, 110), summary: `field boundary ${edge.toFixed(2)}:1, needs 3:1` });
    }
    return out;
  });
  const focus = [];
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120); // let focus transitions settle
    const f = await page.evaluate(() => {
      const { parse, ratio, bgOf, label } = window.__a11y;
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el); const bg = bgOf(el.parentElement || el);
      const outline = parse(cs.outlineColor);
      const outlineOk = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 && outline && outline.a > 0 && ratio(outline, bg) >= 3;
      const shadows = (cs.boxShadow.match(/rgba?\([^)]+\)/g) || []).map(parse).filter((c) => c && c.a > 0.5);
      const shadowOk = shadows.some((c) => ratio(c, bg) >= 3);
      const r = el.getBoundingClientRect();
      const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 3, r.top + 3], [r.right - 3, r.top + 3], [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3]]
        .filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
      const hitEl = pts.length ? document.elementFromPoint(pts[0][0], pts[0][1]) : null; const hit = hitEl ? hitEl.tagName + '.' + String(hitEl.className?.baseVal ?? hitEl.className).slice(0, 90) : ''; const visible = pts.some(([x, y]) => { const hit = document.elementFromPoint(x, y); return hit && (hit === el || el.contains(hit) || hit.contains(el)); });
      const key = el.outerHTML.slice(0, 200);
      return { hit, dbg: [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, bg.r + ',' + bg.g + ',' + bg.b, el.matches(':focus-visible')].join(' '), key, label: label(el), cls: (el.className?.baseVal ?? el.className ?? '').slice(0, 110), indicatorOk: outlineOk || shadowOk, visible, onScreen: pts.length > 0 };
    });
    if (!f) continue;
    if (seen.has(f.key)) break; // wrapped around
    seen.add(f.key);
    if (!f.indicatorOk) focus.push({ target: `"${f.label}"`, html: f.cls, summary: 'focus indicator missing or below 3:1 (2.4.7 / 1.4.11) ' + f.dbg });
    else if (f.onScreen && !f.visible) focus.push({ target: `"${f.label}"`, html: f.cls, summary: 'focused element entirely hidden by other content (2.4.11) ' + f.hit });
  }
  const spacing = await page.evaluate(() => {
    const clipped = () => {
      const set = new Map();
      for (const el of document.querySelectorAll('body *')) {
        if (!el.innerText || !/[\p{L}\p{N}]/u.test(el.innerText) || el.closest('[aria-hidden="true"]')) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const hidesX = /hidden|clip/.test(cs.overflowX); const hidesY = /hidden|clip/.test(cs.overflowY);
        if ((hidesX && el.scrollWidth > el.clientWidth + 2) || (hidesY && el.scrollHeight > el.clientHeight + 2)) set.set(el, el.innerText.trim().slice(0, 50));
      }
      return set;
    };
    const before = clipped();
    const style = document.createElement('style');
    style.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
    document.head.appendChild(style);
    const after = clipped();
    style.remove();
    return [...after].filter(([el]) => !before.has(el)).map(([el, text]) => ({ target: `"${text}"`, html: (el.className?.baseVal ?? el.className ?? '').slice(0, 110), summary: 'text cut off with WCAG text spacing applied (1.4.12)' }));
  });
  // GAIA G03 (legibilidade): child-facing lines stay within 80 characters.
  const longLines = role !== 'child' ? [] : await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode; const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (text.length <= 80 || node.parentElement.closest('[aria-hidden="true"], script, style, .sr-only')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      if (!lines.size) continue;
      const perLine = text.length / lines.size;
      if (perLine > 80) out.push({ target: `"${text.slice(0, 50)}"`, html: (node.parentElement.className?.baseVal ?? node.parentElement.className ?? '').slice(0, 110), summary: `~${Math.round(perLine)} characters per line, GAIA G03 asks for <= 80` });
    }
    return out;
  });
  const title = await page.title();
  const titled = [{ target: `"${title}"`, html: '', summary: 'page has no route-specific title (2.4.2)' }].filter(() => title.trim() === '' || title.trim() === 'Conta Comigo' && !/^\/pt\/?(\?.*)?$/.test(new URL(page.url()).pathname + new URL(page.url()).search));
  return [
    { id: 'field-boundary-contrast', impact: 'serious', help: 'Form field boundary needs 3:1', tags: ['wcag1411'], nodes: fields },
    { id: 'keyboard-focus', impact: 'serious', help: 'Visible, unobscured focus indicator (Tab walk)', tags: ['wcag247', 'wcag1411', 'wcag2411'], nodes: focus },
    { id: 'text-spacing', impact: 'serious', help: 'No loss of content with WCAG text spacing', tags: ['wcag1412'], nodes: spacing },
    { id: 'gaia-line-length', impact: 'moderate', help: 'Lines of at most 80 characters on child screens (GAIA G03)', tags: ['gaia-g03'], nodes: longLines },
    { id: 'page-title', impact: 'serious', help: 'Route-specific page title', tags: ['wcag242'], nodes: titled },
  ];
}

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch();
  let total = 0;
  const summary = [];
  for (const screen of SCREENS.filter((s) => !only || s.name.includes(only))) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'pt-BR' });
    const unmocked = new Set();
    await ctx.route(/\/api\//, async (route) => {
      const req = route.request();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const url = new URL(req.url());
      const p = url.pathname.replace(/^.*?\/api/, '') + (url.search || '');
      const body = fixture(req.method(), p, screen.role, screen) ?? fixture(req.method(), p.split('?')[0], screen.role, screen);
      if (body === null) { unmocked.add(`${req.method()} ${p}`); return route.fulfill({ status: 404, headers: cors, body: '{}' }); }
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    });
    // Third-party pictogram images and fonts still load from the network.
    if (screen.role) {
      if (screen.display) await ctx.addInitScript((display) => localStorage.setItem('a11y_settings', JSON.stringify(display)), screen.display);
      await ctx.addInitScript((user) => {
        localStorage.setItem('access_token', 'a11y-audit');
        localStorage.setItem('refresh_token', 'a11y-audit');
        localStorage.setItem('asd-platform-auth', JSON.stringify({ state: { user, token: 'a11y-audit', isAuthenticated: true }, version: 0 }));
      }, USERS[screen.role]);
    }
    const page = await ctx.newPage();
    if (process.env.DEBUG_A11Y) { page.on('framenavigated', (f) => f === page.mainFrame() && console.log('NAV', f.url())); page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300))); }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await page.goto(BASE + screen.path, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      if (screen.open) { await screen.open(page); await page.waitForTimeout(800); }
      if (screen.name === 'educator-tab-relatorio') { await page.getByRole('button', { name: /Gerar Relatório/ }).click(); await page.waitForTimeout(800); }
    } catch (e) {
      console.log(`\n### ${screen.name}: could not open (${e.message.split('\n')[0]})`);
    }
    if (!screen.open) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(SHOTS, `${screen.name}.png`), fullPage: true });
    await page.addScriptTag({ content: AXE });
    const result = await page.evaluate(async (tags) => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] });
      const pick = (v) => ({ id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => /^wcag\d/.test(t)),
        nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.failureSummary || '').split('\n').slice(1).join(' ').slice(0, 220) })) });
      return { violations: r.violations.map(pick), incomplete: r.incomplete.filter((v) => v.id === 'color-contrast').map(pick) };
    }, TAGS);
    // WAVE-style contrast: WAVE measures text against the nearest solid
    // background-color and ignores gradients/images, so a gradient button
    // without a solid fallback color is reported (WCAG asks for that fallback).
    const wave = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
      const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        if (!el || seen.has(el) || !walker.currentNode.textContent.trim()) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2 || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], svg, script, style, noscript')) continue;
        // Inactive controls are exempt from 1.4.3 (WAVE and axe skip them too).
        if (el.closest(':disabled, [aria-disabled="true"]')) continue;
        if (cs.position === 'absolute' && cs.clip === 'rect(0px, 0px, 0px, 0px)') continue; // sr-only
        // Skip text that is only emoji/pictographs.
        if (!/[\p{L}\p{N}]/u.test(el.innerText || '')) continue;
        let opacity = 1; let bgStack = []; let node = el;
        while (node && node.nodeType === 1) {
          const s = getComputedStyle(node);
          if (s.display === 'none') { opacity = 0; break; }
          opacity *= Number(s.opacity);
          const bg = parse(s.backgroundColor);
          if (bg && bg.a > 0) { bgStack.push(bg); if (bg.a >= 1) break; }
          node = node.parentElement;
        }
        if (opacity === 0) continue;
        let bg = { r: 255, g: 255, b: 255, a: 1 };
        for (const layer of bgStack.reverse()) bg = blend(layer, bg);
        let fg = parse(cs.color); if (!fg) continue;
        fg = blend({ ...fg, a: fg.a * opacity }, bg);
        const size = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700;
        const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
        const r = ratio(fg, bg);
        if (r < need) out.push({ ratio: Math.round(r * 100) / 100, need, text: (el.innerText || '').trim().slice(0, 50), cls: (el.className?.baseVal ?? el.className ?? '').slice(0, 110) });
      }
      return out;
    });
    result.violations.push(...(wave.length ? [{ id: 'wave-style-contrast', impact: 'serious', help: 'Text vs. nearest solid background color (how WAVE measures)', tags: ['wcag143'],
      nodes: wave.map((w) => ({ target: `"${w.text}"`, html: w.cls, summary: `ratio ${w.ratio}:1, needs ${w.need}:1` })) }] : []));
    for (const v of await extraChecks(page, screen.role)) if (v.nodes.length) result.violations.push(v);
    const count = result.violations.reduce((s, v) => s + v.nodes.length, 0);
    total += count;
    summary.push({ screen: screen.name, url: page.url().replace(BASE, ''), violations: count, needsReview: result.incomplete.reduce((s, v) => s + v.nodes.length, 0) });
    console.log(`\n### ${screen.name} (${page.url().replace(BASE, '')}) — ${count} violation node(s)`);
    for (const v of result.violations) {
      console.log(`- [${v.impact}] ${v.id} (${v.tags.join(', ')}): ${v.help}`);
      for (const n of v.nodes) console.log(`    ${n.target}\n      ${n.html}\n      ${n.summary}`);
    }
    if (unmocked.size) console.log(`  (unmocked API: ${[...unmocked].join(', ')})`);
    await ctx.close();
  }
  await browser.close();
  console.log('\n' + summary.map((s) => `${s.violations === 0 ? 'OK  ' : 'FAIL'} ${s.screen.padEnd(28)} ${String(s.violations).padStart(3)} violations, ${s.needsReview} contrast to review  ${s.url}`).join('\n'));
  process.exit(total ? 1 : 0);
})();
