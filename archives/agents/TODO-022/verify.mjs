import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
const out = [];
const log = (k, v) => { out.push(k + ': ' + JSON.stringify(v)); console.log(k + ': ' + JSON.stringify(v)); };
const browser = await chromium.launch();
for (const [w, h] of [[1280, 800], [390, 844]]) {
  const tag = `[${w}]`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror ' + e.message));
  page.on('dialog', d => { log(tag + ' dialog', d.message().slice(0, 60)); d.dismiss(); });
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(800);
  // 1
  log(tag + ' 1 header children ids', await page.$$eval('header .controls-bar > *', els => els.map(e => e.id)));
  log(tag + ' 1 header all buttons', await page.$$eval('header button', els => els.map(e => e.id)));
  log(tag + ' 1 containment', await page.evaluate(() => ({
    select: !!document.querySelector('.time-item #time-limit-select'),
    restart: !!document.querySelector('.time-item #btn-restart'),
    fetch: !!document.querySelector('.preset-group #btn-fetch-news') })));
  // 2
  log(tag + ' 2 scrollWidth/innerWidth', await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
  log(tag + ' 2 header child tops', await page.evaluate(() => [...document.querySelector('header').children].map(e => [e.className, Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().height)])));
  log(tag + ' 2 header ctrl tops', await page.evaluate(() => [...document.querySelectorAll('header .controls-bar > *')].map(e => Math.round(e.getBoundingClientRect().top))));
  log(tag + ' 2 time-row tops', await page.evaluate(() => [...document.querySelector('.time-row').children].map(e => [e.id, Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().height), Math.round(e.getBoundingClientRect().right)])));
  log(tag + ' 2 author vs preset', await page.evaluate(() => { const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom), Math.round(b.right)]; }; return { author: r('article-author'), preset: r('preset-select'), fetch: r('btn-fetch-news') }; }));
  // 3
  log(tag + ' 3 btn-label visibility', await page.evaluate(() => {
    const f = s => [...document.querySelectorAll(s)].map(e => { const b = e.getBoundingClientRect(); return { text: e.textContent, display: getComputedStyle(e).display, vis: getComputedStyle(e).visibility, w: Math.round(b.width) }; });
    return { header: f('header .btn-label'), fetch: f('#btn-fetch-news .btn-label'), restart: f('#btn-restart .btn-label') }; }));
  log(tag + ' 3 text-display-card height', await page.evaluate(() => document.querySelector('.text-display-card').getBoundingClientRect().height));
  // 4
  await page.selectOption('#time-limit-select', '60');
  await page.waitForTimeout(200);
  log(tag + ' 4 stat-time after 60', await page.textContent('#stat-time'));
  const first = await page.evaluate(() => document.getElementById('text-display').textContent.trim().slice(0, 3));
  const state = () => page.evaluate(() => ({ progress: document.getElementById('stat-progress').textContent, value: document.getElementById('typing-input').value, focus: document.activeElement.id }));
  await page.click('#typing-input');
  await page.keyboard.insertText(first);
  await page.waitForTimeout(200);
  log(tag + ' 4 typed ' + first, await state());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  log(tag + ' 4 after Esc', await state());
  await page.keyboard.insertText(first);
  await page.waitForTimeout(200);
  log(tag + ' 4 typed again', await state());
  await page.click('#btn-restart');
  await page.waitForTimeout(300);
  log(tag + ' 4 after restart btn', await state());
  // 5
  await page.click('#typing-input');
  await page.keyboard.insertText(first);
  await page.waitForTimeout(200);
  await page.evaluate(() => { const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }); Object.defineProperty(ev, 'keyCode', { value: 229 }); document.getElementById('typing-input').dispatchEvent(ev); });
  await page.waitForTimeout(300);
  log(tag + ' 5 after keyCode229 Esc (expect not reset)', await state());
  // 6
  const ap = () => page.getAttribute('#btn-sound', 'aria-pressed');
  const a0 = await ap(); await page.click('#btn-sound'); log(tag + ' 6 aria-pressed', [a0, await ap()]);
  // 7
  await page.click('#btn-fetch-news');
  log(tag + ' 7 disabled right after', await page.$eval('#btn-fetch-news', e => e.disabled));
  try { await page.waitForFunction(() => !document.getElementById('btn-fetch-news').disabled, null, { timeout: 40000 }); } catch (e) { log(tag + ' 7 timeout', true); }
  log(tag + ' 7 disabled at end', await page.$eval('#btn-fetch-news', e => e.disabled));
  // 8
  log(tag + ' 8 author', await page.textContent('#article-author'));
  if (w === 390) await page.screenshot({ path: 'archives/agents/TODO-022/narrow.png', fullPage: true });
  log(tag + ' 9 console errors', errs);
  await page.close();
}
await browser.close();
