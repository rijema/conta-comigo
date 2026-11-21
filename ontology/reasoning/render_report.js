// Imprime ontology/reasoning/out/verification-report.html em PDF com o
// Chromium do Playwright (dependência do frontend).
// Uso, da raiz do repositório: node ontology/reasoning/render_report.js [destino.pdf]
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '../../frontend/node_modules/playwright'));

(async () => {
  const out = path.join(__dirname, 'out');
  const version = fs.readFileSync(path.join(out, 'verification-report.version'), 'utf8').trim();
  const target = process.argv[2]
    ?? path.join(__dirname, '../../docs/dissertacao/anexos', `Verificacao-Ontologia-ContaComigo-v${version}.pdf`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(out, 'verification-report.html'), { waitUntil: 'load' });
  await page.pdf({
    path: target,
    format: 'A4',
    preferCSSPageSize: true,
    // Sem numeração própria: ao ser inserido na dissertação, o apêndice segue
    // a numeração do documento principal.
    displayHeaderFooter: false,
    printBackground: false,
  });
  await browser.close();
  console.log(target);
})();
