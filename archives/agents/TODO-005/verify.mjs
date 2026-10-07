// TODO-005 実測。使い方: python3 -m http.server 8080 を起動してから node verify.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
import fs from 'fs';
const S = '/tmp/claude-649/-home-ytani-work-jp-long-typing/1bfe7069-c6fd-4243-a453-47573408bfa9/scratchpad';
const rn = fs.readFileSync(S + '/rn.md', 'utf8').replace('### 2026年9月28日', '### 2026年10月1日');
const cl = fs.readFileSync(S + '/cl.md', 'utf8').replace('## 2.1.292', '## 9.9.9');
const OUT = '/home/ytani/work/jp-long-typing/archives/agents/TODO-005';
const browser = await chromium.launch();
const ext = []; // 外部に出ようとした URL

async function mk(mode) { // mode: abort | ok | slow | notes500
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [], dialogs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  const state = { mode };
  await page.route(u => new URL(u).hostname !== 'localhost', async route => {
    const url = route.request().url();
    ext.push(url);
    const m = state.mode;
    if (m === 'abort') return route.abort();
    if (m === 'slow') await new Promise(r => setTimeout(r, 1500));
    if (url.includes('allorigins')) return m === 'notes500' ? route.fulfill({ status: 500, body: 'x' }) : route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: rn });
    if (url.includes('githubusercontent')) return route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: cl });
    if (url.includes('rss2json')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ title: 'テスト', description: '本文です。' }] }) });
    return route.abort();
  });
  return { page, errs, dialogs, state };
}
const sel = p => p.evaluate(() => document.getElementById('preset-select').value);
const claudeOpts = p => p.evaluate(() => [...document.querySelectorAll('#optgroup-claude option')].map(o => o.value + ' | ' + o.textContent));
const clean = p => p.evaluate(() => app.cleanText);
const log = (k, v) => console.log('[' + k + ']', typeof v === 'string' ? v : JSON.stringify(v));

// 1
{
  const { page, errs } = await mk('abort');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  log('1 select', await sel(page));
  log('1 opts', await claudeOpts(page));
  log('1 first optgroup is claude', await page.evaluate(() => document.querySelector('#preset-select optgroup').id));
  log('1 pageerrors', errs);
  log('1 cleanText head', (await clean(page)).slice(0, 40));
  await page.context().close();
}
// 2
{
  const { page, errs } = await mk('ok');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  log('2 select', await sel(page));
  const c = await clean(page);
  log('2 summary has 10月1日', c.includes('10月1日'));
  log('2 summary head', c.slice(0, 40));
  log('2 opts', await claudeOpts(page));
  await page.selectOption('#preset-select', 'claude-code');
  const cc = await clean(page);
  log('2 code lines', cc.split('\n').length);
  log('2 code text', cc);
  log('2 markdown残り', { backtick: cc.includes('`'), bold: cc.includes('**'), link: cc.includes('](') });
  log('2 summary markdown残り', await page.evaluate(() => { app.loadClaudeSummary(); const c = app.cleanText; return { backtick: c.includes('`'), bold: c.includes('**'), link: c.includes('](') }; }));
  log('2 pageerrors', errs);
  await page.context().close();
}
// 3
{
  const { page } = await mk('slow');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(200);
  const before = await clean(page);
  await page.locator('#typing-input').focus().catch(() => {});
  await page.keyboard.insertText(before[0]);
  log('3 startTime set', await page.evaluate(() => !!app.startTime));
  await page.waitForTimeout(3000);
  const after = await clean(page);
  log('3 not replaced', after === before && !after.includes('10月1日'));
  log('3 opts (data itself updated?)', (await claudeOpts(page)).slice(0, 2));
  await page.context().close();
}
// 4
{
  const { page, dialogs, state } = await mk('ok');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  const o1 = await claudeOpts(page);
  state.mode = 'notes500';
  await page.click('#btn-fetch-news'); await page.waitForTimeout(1500);
  log('4 dialogs', dialogs);
  log('4 select', await sel(page));
  const o2 = await claudeOpts(page);
  log('4 options same as before', JSON.stringify(o1) === JSON.stringify(o2));
  log('4 notes[0] / code', [o2[1], o2[o2.length - 1]]);
  log('4 body has 10月1日', (await clean(page)).includes('10月1日'));
  await page.context().close();
}
// 5, 6
{
  const { page } = await mk('ok');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const res = [];
    for (const o of document.getElementById('preset-select').options) {
      if (o.value === 'custom') continue;
      const s = document.getElementById('preset-select'); s.value = o.value; s.dispatchEvent(new Event('change'));
      const c = app.cleanText;
      res.push({ v: o.value, len: c.length,
        dbl: /  /.test(c), jpSp: /[　-ヿ一-鿿＀-￯] | [　-ヿ一-鿿＀-￯]/.test(c),
        lineEdge: /^ | $| \n|\n /m.test(c) || /^\s|\s$/.test(c), otherWs: /[^\S\n ]/.test(c), spaces: (c.match(/ /g) || []).length });
    }
    return res;
  });
  log('5 count', r.length);
  log('5 bad', r.filter(x => x.dbl || x.jpSp || x.lineEdge || x.otherWs));
  log('5 all', r.map(x => x.v + ':' + x.len + '/sp' + x.spaces).join(' '));
  await page.selectOption('#preset-select', 'claude-code');
  log('5 marketplace', (await clean(page)).includes('Added --marketplace <source> to'));
  await page.selectOption('#preset-select', '0');
  const c0 = await clean(page);
  log('5 概要 has Claude Code', [c0.includes('Claude Code'), c0.slice(0, 60)]);
  // 6
  await page.selectOption('#preset-select', 'claude-code');
  const m = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('#text-display .char')];
    const sp = spans.filter(s => s.textContent === ' ' && !s.classList.contains('linebreak'));
    const ws = sp.map(s => s.getBoundingClientRect().width);
    const lat = spans.filter(s => /[A-Za-z]/.test(s.textContent)).map(s => s.getBoundingClientRect().width);
    // 単語の途中の折り返し: 隣り合う英字 span で top が異なる箇所
    let mid = [];
    for (let i = 1; i < spans.length; i++) {
      const a = spans[i - 1], b = spans[i];
      if (/[A-Za-z0-9]/.test(a.textContent) && /[A-Za-z0-9]/.test(b.textContent) && Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) > 5) mid.push(i + ':' + a.textContent + '|' + b.textContent);
    }
    const lines = new Set(spans.map(s => Math.round(s.getBoundingClientRect().top))).size;
    return { nSpaceSpans: sp.length, spaceW: [Math.min(...ws), Math.max(...ws)], latinW: [Math.min(...lat), Math.max(...lat)], lines, midWordBreaks: mid.length, midSamples: mid.slice(0, 10), font: getComputedStyle(spans[0]).fontFamily + ' ' + getComputedStyle(spans[0]).fontSize + ' ws=' + getComputedStyle(spans[0]).whiteSpace + ' disp=' + getComputedStyle(spans[0]).display };
  });
  log('6 measure', m);
  await page.locator('#text-display').screenshot({ path: OUT + '/claude-code.png' });
  await page.screenshot({ path: OUT + '/claude-code-full.png' });
  await page.context().close();
}
// 7
{
  const { page, errs } = await mk('ok');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const res = [];
    const FW = /[\uff01-\uff5e“”‘’−‐‑]/g;
    for (const o of document.getElementById('preset-select').options) {
      if (o.value === 'custom') continue;
      const s = document.getElementById('preset-select'); s.value = o.value; s.dispatchEvent(new Event('change'));
      const c = app.cleanText, f = app.fullText.replace(/\r\n?|[\u2028\u2029]/g, '\n');
      const strip = t => t.replace(/[^\S\n]+/g, '');
      res.push({ v: o.value, sameChars: strip(c) === strip(f), fwClean: (c.match(FW) || []).length, fwFull: (f.match(FW) || []).length });
    }
    return { n: res.length, notSame: res.filter(x => !x.sameChars || x.fwClean !== x.fwFull).map(x => x.v), withFullwidth: res.filter(x => x.fwClean > 0).map(x => x.v + ':' + x.fwClean), };
  });
  log('7p', r);
  await page.context().close();
}
// 8, 9
for (const w of [1280, 375]) {
  const { page, errs } = await mk('ok');
  await page.setViewportSize({ width: w, height: 800 });
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  await page.selectOption('#preset-select', 'claude-code');
  const m = await page.evaluate(() => {
    const td = document.getElementById('text-display');
    const spans = [...td.querySelectorAll('.char')];
    const tops = spans.map(s => Math.round(s.getBoundingClientRect().top));
    let startsSpace = 0, mid = [];
    for (let i = 0; i < spans.length; i++) {
      const newLine = i === 0 || Math.abs(tops[i] - tops[i - 1]) > 5;
      if (newLine && spans[i].textContent === ' ' && !spans[i].classList.contains('linebreak')) startsSpace++;
      if (i && newLine && /[A-Za-z0-9]/.test(spans[i].textContent) && /[A-Za-z0-9]/.test(spans[i - 1].textContent)) mid.push(i + ':' + spans[i - 1].textContent + '|' + spans[i].textContent);
    }
    const sp = spans.filter(s => s.textContent === ' ' && !s.classList.contains('linebreak')).map(s => s.getBoundingClientRect().width);
    const long = spans.find(s => s.textContent === 'C' && s.parentElement.textContent.startsWith('CLAUDE_CODE_OVERLOADED'));
    const word = [...td.querySelectorAll('.word')].find(e => e.textContent.includes('CLAUDE_CODE_OVERLOADED'));
    const chars = []; // CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS の各文字の right の最大
    const idx = app.cleanText.indexOf('CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS');
    let maxRight = 0, minLeft = 1e9;
    for (let i = idx; i < idx + 43; i++) { const r = spans[i].getBoundingClientRect(); maxRight = Math.max(maxRight, r.right); minLeft = Math.min(minLeft, r.left); }
    const tr = td.getBoundingClientRect();
    return { w: innerWidth, lines: new Set(tops).size, startsWithSpaceLines: startsSpace, midWordBreaks: mid.length, midSamples: mid.slice(0, 10), spaceW: [Math.min(...sp), Math.max(...sp)],
      scrollWidth: td.scrollWidth, clientWidth: td.clientWidth, longWordLeft: minLeft, longWordMaxRight: maxRight, tdLeft: tr.left, tdRight: tr.right, longWordInWord: !!word, wordCount: td.querySelectorAll('.word').length };
  });
  log(w === 1280 ? '8' : '9', m);
  log((w === 1280 ? '8' : '9') + ' pageerrors', errs);
  if (w === 375) await page.screenshot({ path: OUT + '/claude-code-375.png', fullPage: true });
  await page.context().close();
}
// 10
{
  const { page, errs } = await mk('ok');
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  const src = 'ＡＢＣ（テスト）［１］2026-04-07 “a” 1〜3、です。';
  await page.selectOption('#preset-select', 'custom');
  await page.fill('#custom-textarea', src);
  await page.click('#btn-apply-custom');
  const c = await clean(page);
  log('10 cleanText', [c, c === src]);
  await page.locator('#typing-input').focus();
  await page.keyboard.insertText('ABC(テスト)[1]２０２６ー04－07　"a"　1~3、です。');
  log('10 typed', await page.evaluate(() => ({ currentIndex: app.currentIndex, mistakes: app.mistakesCount, len: app.cleanText.length, finished: app.isFinished })));
  const p2 = await mk('ok');
  await p2.page.goto('http://localhost:8080/'); await p2.page.waitForTimeout(1000);
  await p2.page.selectOption('#preset-select', 'custom');
  await p2.page.fill('#custom-textarea', 'ＡＢ、');
  await p2.page.click('#btn-apply-custom');
  await p2.page.locator('#typing-input').focus();
  await p2.page.keyboard.insertText('AB,');
  log('10 mismatch(、 vs ,)', await p2.page.evaluate(() => ({ currentIndex: app.currentIndex, mistakes: app.mistakesCount, len: app.cleanText.length })));
  log('10 pageerrors', [...errs, ...p2.errs]);
  await page.context().close(); await p2.page.context().close();
}
log('external urls', [...new Set(ext)]);
await browser.close();
