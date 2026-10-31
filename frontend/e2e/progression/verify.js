const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const acts = JSON.parse(fs.readFileSync(process.argv[2] ?? path.join(__dirname, '../../public/__progression-preview.json'), 'utf8'));
const shots = process.argv[3] ?? path.join(__dirname, 'shots');
fs.mkdirSync(shots, { recursive: true });
const BASE = `${process.env.BASE_URL ?? 'http://localhost:3123'}/pt/dev/progression-preview`;
const VIEWPORTS = {
  phone: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, mode: 'tap' },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, mode: 'tap' },
  desktop: { viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false, mode: 'drag' },
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function solve(page, a, mode) {
  const c = a.content;
  if (a.type === 'quiz') {
    await page.getByRole('button', { name: `Opção: ${c.correctAnswer}`, exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar resposta' }).click();
    return (ans) => ans.isCorrect === true && ans.selectedText === c.correctAnswer;
  }
  if (a.type === 'drag_drop') {
    for (let k = 0; k < c.correctOrder.length; k++) {
      const item = c.items.find((it) => it.id === c.correctOrder[k]);
      const piece = page.getByRole('button', { name: new RegExp(`^${esc(item.label)}\\. Arraste`) }).first();
      const slot = page.getByRole('button', { name: new RegExp(`^${esc(c.slotLabels[k])}: vazia$`) });
      if (mode === 'drag') {
        const from = await piece.boundingBox(); const to = await slot.boundingBox();
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
        await page.mouse.up();
      } else { await piece.tap(); await slot.tap(); }
      await page.waitForTimeout(150);
    }
    await page.getByRole('button', { name: /Confirmar/ }).click();
    return (ans) => JSON.stringify(ans.arrangement) === JSON.stringify(c.correctOrder);
  }
  for (let k = 0; k < c.items.length; k++) {
    const item = c.items[k]; const bin = c.bins.find((b) => b.id === c.correctOrder[k]);
    const itemBtn = page.getByRole('button', { name: new RegExp(`^${esc(item.label)}$`) });
    const binBtn = page.getByRole('button', { name: new RegExp(`^Grupo ${esc(bin.label)}:`) });
    if (mode === 'drag') { await itemBtn.click(); await binBtn.click(); } else { await itemBtn.tap(); await binBtn.tap(); }
  }
  await page.getByRole('button', { name: /Confirmar/ }).click();
  return (ans) => JSON.stringify(ans) === JSON.stringify(c.correctOrder);
}
(async () => {
  const browser = await chromium.launch();
  const failures = []; let checks = 0;
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: vp.viewport, hasTouch: vp.hasTouch, isMobile: vp.isMobile });
    const page = await ctx.newPage();
    for (let i = 0; i < acts.length; i++) {
      const a = acts[i];
      if (vpName === 'desktop' && a.type === 'quiz' && i % 4) continue;
      const tag = `[${vpName}] #${i} ${a.type} ${a.title}`;
      try {
        await page.goto(`${BASE}?i=${i}`, { waitUntil: 'networkidle' });
        await page.getByText(a.content.question, { exact: true }).first().waitFor({ timeout: 15000 });
        const layout = await page.evaluate(() => {
          const imgs = [...document.querySelectorAll('main img')];
          return {
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            broken: imgs.filter((img) => !(img.complete && img.naturalWidth > 0)).map((img) => img.getAttribute('alt')),
            fallbacks: [...document.querySelectorAll('main [data-pictogram-fallback]')].map((n) => n.getAttribute('aria-label')),
          };
        });
        if (layout.overflow > 1) failures.push(`${tag}: horizontal overflow ${layout.overflow}px`);
        if (layout.broken.length) failures.push(`${tag}: broken images ${layout.broken.join(', ')}`);
        if (layout.fallbacks.length) failures.push(`${tag}: emoji fallbacks ${layout.fallbacks.join(', ')}`);
        if ([1, 3, 14, 25, 84].includes(i)) await page.screenshot({ path: `${shots}/${vpName}-${i}.png`, fullPage: true });
        const ok = await solve(page, a, vp.mode);
        await page.waitForFunction(() => document.querySelector('#__answer')?.dataset.answer, null, { timeout: 5000 });
        const ans = JSON.parse(await page.locator('#__answer').getAttribute('data-answer'));
        if (!ok(ans)) failures.push(`${tag}: wrong payload ${JSON.stringify(ans)}`);
        checks++;
      } catch (e) { failures.push(`${tag}: ERROR ${e.message.split('\n')[0]}`); }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`checked ${checks} renders`);
  console.log(failures.length ? failures.join('\n') : 'ALL OK');
  if (failures.length) process.exitCode = 1;
})();
