// TODO-006 実測。python3 -m http.server 8080 を起動してから node verify.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const OUT = '/home/ytani/work/jp-long-typing/archives/agents/TODO-006';
const CL = '# Changelog\n\n## 9.9.9\n\n- Fixed the first bug in the terminal rendering of long lines\n- Added a second feature for session handling and resume\n- Improved the third thing about startup time\n\n## 9.9.8\n\n- Fixed another bug\n- Added another feature\n';
const browser = await chromium.launch();
async function mk(changelog) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.route(u => new URL(u).hostname !== 'localhost', r => {
    if (changelog && r.request().url().includes('githubusercontent'))
      return r.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: CL });
    return r.abort();
  });
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  return { page, errs };
}
const measure = page => page.evaluate(() => {
  const t = app.cleanText, els = app.charElements, rows = [];
  const R = i => { const r = els[i].getBoundingClientRect(); return { top: r.top, left: r.left }; };
  const first = R(0); let n = 0, bad = 0;
  for (let i = 0; i < t.length; i++) if (t[i] === '\n') {
    n++;
    if (i + 1 >= t.length) { bad++; continue; }
    const a = R(i - 1), b = R(i + 1);
    const ok = b.top > a.top && Math.abs(b.left - first.left) < 0.5;
    if (!ok) bad++;
    if (rows.length < 3) rows.push({ i, prev: a, next: b, first, ok });
  }
  return { len: t.length, n, bad, rows };
});
const log = (k, v) => console.log('[' + k + ']', JSON.stringify(v));
{
  const { page, errs } = await mk(false);
  await page.selectOption('#preset-select', 'news-summary'); await page.waitForTimeout(300);
  log('select', await page.evaluate(() => document.getElementById('preset-select').value));
  log('head', await page.evaluate(() => app.cleanText.slice(0, 30)));
  log('1 jp', await measure(page));
  // 3
  const t = await page.evaluate(() => app.cleanText);
  const nl = t.indexOf('\n');
  await page.locator('#typing-input').focus();
  await page.keyboard.insertText(t.slice(0, nl));
  await page.waitForTimeout(200);
  const st = () => page.evaluate(() => { const a = document.querySelector('.char.active'); const r = a.getBoundingClientRect(); return { idx: app.currentIndex, activeIdx: +a.dataset.index, top: r.top, left: r.left, isLinebreak: a.classList.contains('linebreak'), top106: app.charElements[106].getBoundingClientRect().top, top109: app.charElements[109].getBoundingClientRect().top }; });
  log('3 nl index', nl);
  log('3 before nl', await st());
  await page.screenshot({ path: OUT + '/before-linebreak.png', clip: { x: 0, y: 0, width: 1280, height: 800 } });
  let k = nl; while (t[k] === '\n') k++;
  log('3 next non-nl index', k);
  await page.keyboard.insertText(t[k]);
  await page.waitForTimeout(1200);
  log('3 after next char', await st());
  await page.screenshot({ path: OUT + '/after-linebreak.png' });
  log('pageerrors', errs);
}
{
  const { page, errs } = await mk(true);
  await page.selectOption('#preset-select', 'claude-code'); await page.waitForTimeout(300);
  log('2 text', await page.evaluate(() => app.cleanText.slice(0, 80)));
  log('2 en', await measure(page));
  log('pageerrors', errs);
}
await browser.close();
