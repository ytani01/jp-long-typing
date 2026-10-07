// TODO-007 実測。python3 -m http.server 8080 を起動してから node verify.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const OUT = '/home/ytani/work/jp-long-typing/archives/agents/TODO-007';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.route(u => !u.href.startsWith('http://localhost:8080/'), r => r.abort());
await page.goto('http://localhost:8080/');
await page.waitForTimeout(1500);
const j = x => console.log(JSON.stringify(x));
j(await page.evaluate(() => {
  const s = document.getElementById('preset-select');
  const t = app.cleanText;
  return { value: s.value, selected: s.selectedOptions[0].textContent,
    firstOption: s.options[0].textContent, firstValue: s.options[0].value,
    title: document.getElementById('article-title').textContent,
    head20: t.slice(0, 20), newlines: (t.match(/\n/g) || []).length, len: t.length };
}));
await page.screenshot({ path: OUT + '/startup.png' });
const head = await page.evaluate(() => app.cleanText.slice(0, 10));
await page.keyboard.insertText(head);
j(await page.evaluate(() => ({ head: app.cleanText.slice(0,10), currentIndex: app.currentIndex,
  miss: app.mistakesCount })));
for (const v of ['1', '6']) {
  await page.selectOption('#preset-select', v);
  await page.waitForTimeout(300);
  j({ v, title: await page.textContent('#article-title') });
}
j({ pageerrors: errs });
await b.close();
