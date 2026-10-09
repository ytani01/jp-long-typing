// TODO-030 確認: 履歴の分析画面の「よく誤る字」が上位 5 件だけを出すか
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8080/';
const KEY = 'jp-long-typing-history'; // index.html の HISTORY_KEY

// missCounts: [字, 回数] の配列。記録の形は index.html の statsForHistory と結果保存の処理に合わせる
function makeHistory(missCounts) {
  const miss = {};
  for (const [c, n] of missCounts) miss[c] = [n, `例${c}`];
  return [{
    date: Date.now(), title: 'テスト文章', timeLimit: 60, rank: 'A', time: '1:00',
    cpm: 300, chars: 500, accuracy: 95,
    kinds: { 'ひらがな': { n: 400, ms: 200000, miss: 20 } },
    miss, slow: []
  }];
}

async function runCase(browser, name, missCounts) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(BASE);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(makeHistory(missCounts))]);
  await page.reload();
  await page.click('#btn-history');
  await page.waitForSelector('#history-modal.active');
  const items = await page.evaluate(() => {
    const h4 = [...document.querySelectorAll('#history-analysis h4')].find(h => h.textContent === 'よく誤る字');
    if (!h4) return null;
    const ol = h4.parentElement.querySelector('ol');
    return ol ? [...ol.querySelectorAll(':scope > li')].map(li => li.textContent) : 'no-ol';
  });
  await context.close();
  return { name, items, errors };
}

const browser = await chromium.launch({ headless: true });
const eight = [['あ', 9], ['い', 8], ['う', 7], ['え', 6], ['お', 5], ['か', 4], ['き', 3], ['く', 2]];
const three = [['あ', 4], ['い', 2], ['う', 1]];
const results = [];
results.push(await runCase(browser, 'eight-kinds', eight));
results.push(await runCase(browser, 'three-kinds', three));
await browser.close();
console.log(JSON.stringify(results, null, 2));
