// TODO-026 の確認: 誤字を含む確定で先へ進むか、赤字、ミス数、入力欄、正確率を実測する
// 使い方: node archives/agents/TODO-026/verify.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8080/';
const TEXT = '今日は晴れです。明日は雨です。';
const SHOT = '/home/ytani/work/jp-long-typing/archives/agents/TODO-026/case2.png';

const errors = [];

async function freshPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#preset-select');
  await page.selectOption('#preset-select', 'custom');
  await page.waitForSelector('#custom-modal.active');
  await page.fill('#custom-textarea', TEXT);
  await page.click('#btn-apply-custom');
  await page.waitForFunction(() => document.querySelectorAll('#text-display .char').length > 0);
  await page.waitForFunction(() => !document.getElementById('custom-modal').classList.contains('active'));
  return { ctx, page };
}

async function commit(page, s) {
  await page.evaluate(() => document.getElementById('typing-input').focus({ preventScroll: true }));
  await page.keyboard.insertText(s);
  await page.waitForTimeout(400); // 色の transition（0.12s）が終わってから測る
}

async function measure(page) {
  return page.evaluate(() => {
    const missedEls = [...document.querySelectorAll('.char.done.missed')];
    return {
      done: document.querySelectorAll('.char.done').length,
      missed: missedEls.map((e) => `${e.textContent}(color=${getComputedStyle(e).color})`),
      mistakes: document.getElementById('stat-mistakes').textContent.trim(),
      inputValue: document.getElementById('typing-input').value,
      resultOpen: document.getElementById('result-modal').classList.contains('active'),
      active: document.querySelector('.char.active')?.textContent ?? null,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const results = {};

const cases = [
  ['1', '今日は晴れです。'],
  ['2', '今日わ晴れです。'],
  ['3', '今日晴れです。'],
  ['4', ['今日はは', '晴れです。']],
  ['5', '今日わ'],
];

for (const [id, input] of cases) {
  const { ctx, page } = await freshPage(browser);
  const steps = Array.isArray(input) ? input : [input];
  for (const s of steps) await commit(page, s);
  results[id] = await measure(page);
  if (id === '2') {
    results['2_color_of_missed'] = await page.evaluate(() => {
      const e = document.querySelector('.char.done.missed');
      return e ? getComputedStyle(e).color : null;
    });
    await page.screenshot({ path: SHOT });
    // ケース 6 は同じ画面の続きで、残りを正しく打つ
    await commit(page, '明日は雨です。');
    await page.waitForFunction(() => document.getElementById('result-modal').classList.contains('active'), null, { timeout: 5000 }).catch(() => {});
    results['6'] = await page.evaluate(() => ({
      resultOpen: document.getElementById('result-modal').classList.contains('active'),
      resAccuracy: document.getElementById('res-accuracy').textContent.trim(),
      statAccuracy: document.getElementById('stat-accuracy').textContent.trim(),
      mistakes: document.getElementById('stat-mistakes').textContent.trim(),
      done: document.querySelectorAll('.char.done').length,
      total: document.querySelectorAll('#text-display .char').length,
    }));
  }
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify({ results, errors }, null, 2));
