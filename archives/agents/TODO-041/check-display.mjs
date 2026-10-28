// TODO-041: ページを開き、種類ごとの代表 1 行に日時が出ること、JS の例外・外への通信が無いことを見る。
// 使い方: python3 -m http.server 8080 を流しておいて node check-display.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage();
const errs = [], outside = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
p.on('request', r => { if (!r.url().startsWith('http://localhost:8080/')) outside.push(r.url()); });
p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
await p.goto('http://localhost:8080/'); await p.waitForTimeout(1500);
const o = await p.$$eval('#preset-select option', os => Object.fromEntries(os.map(o => [o.value, o.textContent])));
for (const k of ['news-summary', 'claude-0', 'claude-code', 'code-ja-0', 'cachy-en-0', 'cachy-ja-0']) console.log(k.padEnd(13), o[k]);
console.log('btn-fetch-news:', await p.$('#btn-fetch-news'));
console.log('errors:', JSON.stringify(errs), 'outside:', JSON.stringify(outside));
await b.close();
