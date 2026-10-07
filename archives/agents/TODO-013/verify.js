const pw = require('playwright');
const SH = process.env.HOME + '/tmp/playwright-mcp/todo013-';
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror ' + e.message));
  await page.route(/^(?!http:\/\/localhost:8080).*/, r => r.abort());
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(500);
  const L = (k, v) => console.log(k, JSON.stringify(v));
  await page.evaluate(() => app.loadArticle({ text: 'あいうえおかきくけこ', author: 'x' }));
  // 1
  L('1', await page.evaluate(() => {
    const r = e => { const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
    const bar = document.querySelector('.controls-bar'); const rs = document.getElementById('btn-restart');
    return { kids: [...bar.children].map(c => c.id || c.className || c.tagName),
      restartInHeader: !!document.querySelector('header #btn-restart'), restartParent: rs.parentElement.className,
      restart: r(rs), input: r(document.getElementById('typing-input')) };
  }));
  // 2
  await page.locator('#typing-input').focus(); await page.keyboard.insertText('あいう');
  await page.waitForTimeout(50);
  L('2 before', await page.evaluate(() => document.getElementById('stat-progress').textContent));
  await page.click('#btn-restart');
  L('2 after', await page.evaluate(() => ({ p: document.getElementById('stat-progress').textContent, idx: app.currentIndex, val: document.getElementById('typing-input').value, active: document.activeElement.id })));
  // 3
  const col = () => page.evaluate(() => { const s = document.getElementById('time-limit-select'); const o = s.querySelector('option'); const a = getComputedStyle(s), b = getComputedStyle(o);
    return { selBg: a.backgroundColor, selColor: a.color, optColor: b.color, optBg: b.backgroundColor, selBorder: a.borderTopColor }; });
  L('3 dark', await col());
  await page.screenshot({ path: SH + '1280-dark.png' });
  await page.click('#btn-theme'); await page.waitForTimeout(500);
  L('3 theme', await page.evaluate(() => document.body.dataset.theme));
  L('3 light', await col());
  await page.screenshot({ path: SH + '1280-light.png' });
  await page.click('#btn-theme'); await page.waitForTimeout(500);
  // 4
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(100);
  L('4', await page.evaluate(() => {
    const i = document.getElementById('typing-input'), rs = document.getElementById('btn-restart');
    const a = i.getBoundingClientRect(), b = rs.getBoundingClientRect();
    return { cw: i.clientWidth, sw: i.scrollWidth, ph: i.placeholder, inputBottom: a.bottom, restartTop: b.top, restartLeft: b.left, restartW: b.width,
      sepDisplay: getComputedStyle(document.querySelector('.controls-sep')).display, docScrollW: document.documentElement.scrollWidth };
  }));
  await page.screenshot({ path: SH + '390.png', fullPage: true });
  L('5 errors', errs);
  await browser.close();
})();
