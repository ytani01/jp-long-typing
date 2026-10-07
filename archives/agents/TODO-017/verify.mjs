import { chromium } from '/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const run = async (failChangelog) => {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const urls = [], cons = [], dialogs = [];
  p.on('request', r => urls.push(r.url()));
  p.on('console', m => { if (['error','warning'].includes(m.type())) cons.push(m.type()+': '+m.text()); });
  p.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  if (failChangelog) await p.route('**/raw.githubusercontent.com/**', r => r.abort());
  return { p, urls, cons, dialogs };
};
const txt = p => p.evaluate(() => document.getElementById('text-display').textContent.replace(/\s+/g,' ').trim());
const sel = p => p.evaluate(() => document.getElementById('preset-select')?.value ?? [...document.querySelectorAll('select')].map(s=>s.value));
// A
let { p, urls, cons, dialogs } = await run(false);
await p.goto('http://localhost:8080/'); await p.waitForTimeout(5000);
console.log('1 total', urls.length, 'allorigins', urls.filter(u=>u.includes('allorigins')).length, 'platform', urls.filter(u=>u.includes('platform.claude.com')).length, 'changelog', urls.filter(u=>u.includes('raw.githubusercontent.com')));
console.log('2 console', cons);
console.log('3', await p.evaluate(() => [...document.querySelectorAll('#optgroup-claude option')].map(o => o.value+' | '+o.textContent)));
console.log('7 default has sentence', (await p.evaluate(()=>document.body.textContent)).includes('リリースノートは日本語に訳して内蔵しています'), 'display', (await txt(p)).includes('リリースノートは日本語に訳して内蔵しています'));
const selId = await p.evaluate(()=>document.querySelector('#optgroup-claude').parentElement.id);
console.log('select id', selId);
await p.selectOption('#'+selId, 'claude-summary'); await p.waitForTimeout(500);
let t = await txt(p);
console.log('4 head', t.slice(0,40), 'count 【', (t.match(/【/g)||[]).length, [...t.matchAll(/【[^】]*】/g)].map(m=>m[0]));
await p.click('#btn-fetch-news'); await p.waitForTimeout(6000);
t = await txt(p);
console.log('5 value', await p.inputValue('#'+selId), 'dialogs', dialogs, 'head', t.slice(0,120));
await p.close();
// B
({ p, urls, cons, dialogs } = await run(true));
await p.goto('http://localhost:8080/'); await p.waitForTimeout(3000);
await p.click('#btn-fetch-news'); await p.waitForTimeout(6000);
t = await txt(p);
console.log('6 value', await p.inputValue('#'+selId), 'dialogs', dialogs, 'head', t.slice(0,120), 'opts', await p.evaluate(() => [...document.querySelectorAll('#optgroup-claude option')].map(o => o.textContent)));
await b.close();
