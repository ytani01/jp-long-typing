// TODO-040 の確認スクリプト（verifier 用）。コードは変更しない。
// 実行: node archives/agents/TODO-040/verifier-check.mjs  （http://localhost:8080/ で配信中であること）
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const URL_TOP = 'http://localhost:8080/';
const here = path.dirname(fileURLToPath(import.meta.url));
const SHOT = path.join(here, 'verifier.png');
const OPT_SEL = '#optgroup-news option[value="news-summary"]';

// 内蔵データの最新 pubDate（UTC 換算）を JST の "M/D HH:MM" にする。ブラウザ内で FALLBACK_NHK_NEWS を読む
const readOptionText = (page) => page.$eval(OPT_SEL, o => o.textContent);

async function openWith(browser, { abortApi, rssBody, shot }) {
  const context = await browser.newContext({ timezoneId: 'America/New_York' });
  const page = await context.newPage();
  const errors = [];
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(`${d.type()}: ${d.message()}`); d.dismiss(); });
  page.on('pageerror', e => errors.push(String(e)));
  if (abortApi) {
    await page.route('**/api.rss2json.com/**', r => r.abort());
  } else if (rssBody !== undefined) {
    await page.route('**/api.rss2json.com/**', r => r.fulfill({
      status: 200, contentType: 'application/json', body: rssBody
    }));
  }
  await page.goto(URL_TOP, { waitUntil: 'load' });
  return { context, page, errors, dialogs };
}

const results = [];
const browser = await chromium.launch();
try {
  // ---- 1. 内蔵データ（取得を abort） ----
  {
    const { context, page, errors, dialogs } = await openWith(browser, { abortApi: true });
    // 取得失敗の処理が終わるまで少し待つ
    await page.waitForTimeout(2000);
    const fallback = await page.evaluate(() => FALLBACK_NHK_NEWS.map(a => a.pubDate));
    const newest = await page.evaluate(() => {
      const t = Math.max(...FALLBACK_NHK_NEWS.map(a => Date.parse(a.pubDate)));
      const j = new Date(t + 9 * 3600 * 1000), z = n => String(n).padStart(2, '0');
      return `${j.getUTCMonth() + 1}/${j.getUTCDate()} ${z(j.getUTCHours())}:${z(j.getUTCMinutes())}`;
    });
    const text = await readOptionText(page);
    const expected = `📰 NHK主要ニュースまとめ (6本・${newest})`;
    results.push({ name: '1. 内蔵データ（取得 abort）', text, expected, ok: text === expected,
      extra: { fallbackPubDates: fallback, newestJST: newest, errors, dialogs } });
    await page.screenshot({ path: SHOT, fullPage: false });
    const layout = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth, winW: window.innerWidth,
      selBox: (() => { const r = document.getElementById('preset-select').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })()
    }));
    results[results.length - 1].extra.layout = layout;
    await context.close();
  }

  // ---- 2. 取得成功（2 本、JST 20:53 と 22:22 を期待） ----
  {
    const body = JSON.stringify({ status: 'ok', items: [
      { title: 'A', pubDate: '2026-10-28 11:53:00', description: 'あ。' },
      { title: 'B', pubDate: '2026-10-28 13:22:06', description: 'い。' }
    ] });
    const { context, page, errors, dialogs } = await openWith(browser, { rssBody: body });
    try {
      await page.waitForFunction(sel => {
        const o = document.querySelector(sel); return o && o.textContent.includes('(2本');
      }, OPT_SEL, { timeout: 10000 });
    } catch (e) { /* 下の比較で失敗として記録する */ }
    const text = await readOptionText(page);
    const expected = '📰 NHK主要ニュースまとめ (2本・10/28 22:22)';
    results.push({ name: '2. 取得成功（pubDate あり）', text, expected, ok: text === expected,
      extra: { errors, dialogs } });
    await context.close();
  }

  // ---- 3. 取得成功、pubDate が空 ----
  {
    const body = JSON.stringify({ status: 'ok', items: [
      { title: 'A', pubDate: '', description: 'あ。' },
      { title: 'B', pubDate: '', description: 'い。' }
    ] });
    const { context, page, errors, dialogs } = await openWith(browser, { rssBody: body });
    try {
      await page.waitForFunction(sel => {
        const o = document.querySelector(sel); return o && o.textContent.includes('(2本');
      }, OPT_SEL, { timeout: 10000 });
    } catch (e) { /* 下の比較で失敗として記録する */ }
    const text = await readOptionText(page);
    const expected = '📰 NHK主要ニュースまとめ (2本)';
    results.push({ name: '3. 取得成功（pubDate 空）', text, expected, ok: text === expected && errors.length === 0,
      extra: { errors, dialogs } });
    await context.close();
  }
} finally {
  await browser.close();
}

for (const r of results) {
  console.log(`${r.ok ? 'OK  ' : 'NG  '} ${r.name}`);
  console.log(`     表示: ${JSON.stringify(r.text)}`);
  console.log(`     期待: ${JSON.stringify(r.expected)}`);
  console.log(`     補足: ${JSON.stringify(r.extra)}`);
}
console.log(`screenshot: ${SHOT}`);
process.exitCode = results.every(r => r.ok) ? 0 : 1;
