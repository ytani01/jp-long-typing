// TODO-004 実測。使い方: python3 -m http.server 8080 を起動してから node verify.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const ITEMS = [
  { title: '記事AAA', description: 'AAAの本文です。' },
  { title: '記事BBB', description: 'BBBの本文です。' },
];
const ok = JSON.stringify({ status: 'ok', items: ITEMS });
const snap = (page) => page.evaluate(() => ({
  sel: document.getElementById('preset-select').value,
  tl: document.getElementById('time-limit-select').value,
  gameTL: app.timeLimit,
  title: document.getElementById('article-title').textContent,
  text: app.cleanText.slice(0, 40),
  isNews: app.isNewsSummary,
}));
const browser = await chromium.launch();
async function open(mode, delay = 2000) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/api.rss2json.com/**', async (r) => {
    if (mode === 'fail') return r.abort();
    if (mode === 'slow') await new Promise(s => setTimeout(s, delay));
    r.fulfill({ status: 200, contentType: 'application/json', body: ok });
  });
  await page.goto('http://localhost:8080/');
  return page;
}
const out = (k, v) => console.log(k, JSON.stringify(v));

// 1
let p = await open('fail'); await p.waitForTimeout(1000);
out('1 fail-start', await snap(p));
out('1 remaining', await p.evaluate(() => document.body.innerText.match(/\d+:\d\d/g)));
// 2
out('2 optgroups', await p.evaluate(() => [...document.querySelectorAll('#preset-select optgroup')].map(g => [g.label, [...g.children].map(o => o.value + ':' + o.textContent)])));
for (const v of ['0', '2', '3', '5']) {
  await p.selectOption('#preset-select', v);
  const s = await p.evaluate((v) => ({ title: document.getElementById('article-title').textContent, expectTitle: PRESETS[v].title, textMatch: app.fullText === PRESETS[v].text.trim() }), v);
  out('2 select ' + v, s);
}
out('0 branding', await p.evaluate(() => ({ docTitle: document.title, h1: document.querySelector('h1').textContent, bodyHas: /速打|Hayauchi/.test(document.documentElement.outerHTML) })));
// 5
await p.selectOption('#time-limit-select', '60');
out('5 limit60', await snap(p));
await p.close();

// 3a
p = await open('slow'); out('3a before', await snap(p)); await p.waitForTimeout(3000); out('3a after', await snap(p)); await p.close();
// 3b
p = await open('slow'); await p.focus('#typing-input'); await p.keyboard.insertText('あ');
out('3b typed', await p.evaluate(() => !!app.startTime));
const b0 = await snap(p); await p.waitForTimeout(3000); const b1 = await snap(p);
out('3b', { before: b0, after: b1, unchanged: b0.text === b1.text && b1.sel === 'news-summary' }); await p.close();
// 3c
p = await open('slow'); await p.selectOption('#preset-select', 'custom');
await p.fill('#custom-title-input', 'マイ'); await p.fill('#custom-textarea', 'カスタム本文です。'); await p.click('#btn-apply-custom');
const c0 = await snap(p); await p.waitForTimeout(3000); out('3c', { before: c0, after: await snap(p) }); await p.close();
// 3d
p = await open('slow'); await p.selectOption('#preset-select', 'news-0');
const d0 = await snap(p); await p.waitForTimeout(3000); out('3d', { before: d0, after: await snap(p) }); await p.close();
// 4
p = await open('fail'); await p.waitForTimeout(500);
await p.selectOption('#preset-select', 'custom'); await p.click('#btn-cancel-custom');
out('4', await snap(p)); await p.close();
await browser.close();
