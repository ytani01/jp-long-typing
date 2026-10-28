// TODO-041 確認: 表示の文字列・外への通信・alert・記事ごとの練習文を Playwright で読み出す（verifier）
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const dialogs = [];
const external = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message()); await d.dismiss(); });
page.on('request', r => { const u = r.url(); if (!u.startsWith('http://localhost:8080/')) external.push(u); });

await page.goto('http://localhost:8080/', { waitUntil: 'load' });
await page.waitForTimeout(1500);

const out = await page.evaluate(() => {
  const opts = [...document.querySelectorAll('#preset-select option')];
  const byVal = v => opts.find(o => o.value === v)?.textContent;
  const groups = {};
  document.querySelectorAll('#preset-select optgroup').forEach(g => {
    groups[g.label] = [...g.querySelectorAll('option')].map(o => o.textContent);
  });
  const buttons = [...document.querySelectorAll('button')].map(b => (b.textContent || b.getAttribute('aria-label') || b.title || '').trim());
  return {
    newsSummary: byVal('news-summary'),
    newsRow0: byVal('news-0'),
    newsRowCount: opts.filter(o => /^news-\d+$/.test(o.value)).length,
    claudeSummary: byVal('claude-summary'),
    claudeCodeEn: byVal('claude-code'),
    claudeCodeJa0: byVal('code-ja-0'),
    cachyEn0: byVal('cachy-en-0'),
    cachyJa0: byVal('cachy-ja-0'),
    claudePlatform0: byVal('claude-0'),
    buttonsWithUpdate: buttons.filter(t => /更新/.test(t)),
    groupsFirstRows: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.slice(0, 2)])),
  };
});

// 記事ごとの行を 1 つ選び、練習文がその記事の本文だけになるか
await page.selectOption('#preset-select', 'news-0');
await page.waitForTimeout(300);
const pick = await page.evaluate(() => {
  const a = app.article;
  return {
    title: a.title,
    author: a.author,
    fullTextEqualsArticle: app.fullText === FALLBACK_NHK_NEWS[0].text.trim(),
    fullTextLen: app.fullText.length,
    articleLen: FALLBACK_NHK_NEWS[0].text.trim().length,
    displayStartsWith: document.getElementById('text-display').textContent.slice(0, 30),
    summaryFlag: app.isSummary,
  };
});
// 制御の確認: まとめを選んだときは全記事が入る（記事 1 の本文が入っていること）
await page.selectOption('#preset-select', 'news-summary');
await page.waitForTimeout(300);
const sum = await page.evaluate(() => ({ fullHasAll: FALLBACK_NHK_NEWS.every(a => app.fullText.includes(a.text.trim().slice(0, 20))), fullLen: app.fullText.length }));

await page.waitForTimeout(500);
console.log(JSON.stringify({ out, pick, sum, errors, dialogs, external }, null, 2));
await browser.close();
