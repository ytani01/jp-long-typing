import fs from 'fs';
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
const html = fs.readFileSync('/home/ytani/work/jp-long-typing/index.html', 'utf8');
const arr = eval(html.match(/const FALLBACK_NHK_NEWS = (\[[\s\S]*?\n\s*\]);/)[1]);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('**/api.rss2json.com/**', r => r.abort());
await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.selectOption('#preset-select', 'news-summary');
await page.waitForTimeout(500);
const raw = await page.evaluate(() => document.getElementById('text-display').textContent);
// 表示は文字ごとの span なので、空白と改行を除いて照合する
const squash = s => s.replace(/\s+/g, '');
const shown = squash(raw);
const marks = [...raw.matchAll(/【ニュース(\d)】/g)].map(m => m[1]);
console.log('markers in display =', marks.join(','));
let ok = marks.join(',') === '1,2,3,4,5,6';
arr.forEach((it, i) => {
  const expHead = squash(it.text.split('\n')[0]);
  const expBody = squash(it.text.split('\n').slice(1).join(''));
  const headIn = shown.includes(`【ニュース${i + 1}】${expHead}`) || shown.includes(`【ニュース${i + 1}】${expHead.replace(/。$/, '')}`);
  const bodyIn = expBody === '' || shown.includes(expBody);
  if (!headIn || !bodyIn) ok = false;
  console.log(`${i + 1}: headIn=${headIn} bodyIn=${bodyIn}`);
});
console.log('ALL IN DISPLAY =', ok);
// 最後の記事の末尾まで出ているか
console.log('tail =', JSON.stringify(raw.trim().slice(-40)));
await browser.close();
