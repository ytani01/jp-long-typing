import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
const tag = process.argv[2];
const h = [];
for (let i = 0; i < 12; i++) h.push({ date: Date.now() - (12 - i) * 3600e3, title: 'テスト文章 ' + i, timeLimit: 300, rank: 'B', time: '05:00', cpm: 150 + i * 5, chars: 700, accuracy: 95,
  kinds: { 'ひらがな': { n: 400, ms: 160000, miss: 8 }, 'カタカナ': { n: 60, ms: 30000, miss: 4 }, '漢字': { n: 200, ms: 140000, miss: 6 }, '英数字': { n: 30, ms: 12000, miss: 1 }, '記号': { n: 40, ms: 9000, miss: 0 } },
  miss: { 'は': [3, 'それはまた'], '機': [2, '機械学習'], 'ー': [2, 'データ'] }, slow: [['オーケストレーション', 1200], ['恣意的', 900]] });
const b = await chromium.launch();
for (const [w, hh] of [[1280, 900], [375, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: hh } });
  await p.addInitScript(d => localStorage.setItem('jp-long-typing-history', d), JSON.stringify(h));
  await p.goto('http://localhost:8080/');
  await p.click('#btn-history');
  await p.waitForTimeout(500);
  console.log(w, await p.evaluate(() => { const t = document.querySelector(".analysis table"); return [t.scrollWidth, t.parentElement.clientWidth]; })); await p.screenshot({ path: `/home/ytani/tmp/playwright-mcp/todo029-${tag}-${w}-full.png`, fullPage: false }); await p.evaluate(() => document.querySelector(".history-wrap").scrollTop = 400); await p.screenshot({ path: `/home/ytani/tmp/playwright-mcp/todo029-${tag}-${w}.png` });
  await p.close();
}
await b.close();
