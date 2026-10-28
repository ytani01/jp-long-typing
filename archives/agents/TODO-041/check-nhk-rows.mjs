// TODO-041 直し: NHK の記事ごとの行を 1 つ選び、その記事だけが練習文になること、JS の例外が無いことを見る。
// 使い方: python3 -m http.server 8080 を流しておいて node check-nhk-rows.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage();
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
await p.goto('http://localhost:8080/'); await p.waitForTimeout(1000);
const rows = await p.$$eval('#optgroup-news option', os => os.map(o => [o.value, o.textContent]));
rows.forEach(r => console.log(r.join('  ')));
const claude0 = await p.$eval('#optgroup-claude option[value="claude-0"]', o => o.textContent);
console.log('claude-0:', claude0);
const strip = s => s.replace(/\s/g, '');
const arts = await p.evaluate(() => FALLBACK_NHK_NEWS);
await p.selectOption('#preset-select', 'news-2'); await p.waitForTimeout(500);
const body = strip(await p.evaluate(() => document.body.innerText));
console.log('選んだ記事の本文が出る:', body.includes(strip(arts[2].text)));
console.log('ほかの記事の本文が出ない:', arts.every((a, i) => i === 2 || !body.includes(strip(a.text.split('\n')[0]))));
console.log('まとめの印（【ニュース1】）が出ない:', !body.includes('【ニュース1】'));
console.log('字数表示:', await p.$eval('#article-author, .article-author', e => e.textContent).catch(() => '?'), '期待', strip(arts[2].text).length);
console.log('errors:', JSON.stringify(errs));
await b.close();
