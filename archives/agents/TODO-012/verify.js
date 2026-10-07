const pw = require('playwright');
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror ' + e.message));
  await page.route(/^(?!http:\/\/localhost:8080).*/, r => r.abort());
  await page.clock.install();
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(500);
  const L = (k, v) => console.log(k, JSON.stringify(v));
  const load = t => page.evaluate(t => { app.loadArticle({ text: t, author: 'x' }); }, t);
  const st = () => page.evaluate(() => ({ idx: app.currentIndex, val: app.dom.typingInput.value,
    miss: app.charElements.map((e, i) => e.classList.contains('miss') ? i : -1).filter(i => i >= 0) }));
  const type = async s => { await page.locator('#typing-input').focus(); await page.keyboard.insertText(s); await page.waitForTimeout(50); };
  const clear = async () => { await page.locator('#typing-input').focus(); await page.keyboard.press('Control+a'); await page.keyboard.press('Backspace'); await page.waitForTimeout(50); };

  // 1
  await load('あいうえお');
  await type('X'); L('1a miss', await st());
  L('1a css', await page.evaluate(() => { const c = getComputedStyle(app.charElements[0]); return { bg: c.backgroundColor, color: c.color, shadow: c.boxShadow }; }));
  await clear(); L('1b cleared', await st());
  await type('X'); await type('あ'); L('1c after wrong+あ (input X あ?)', await st());
  await clear(); await type('あ'); L('1d correct', await st());
  // 2
  await load('あい\nうえ');
  await type('あいX'); L('2a', await st());
  await clear(); await type('う'); L('2b after う', await st());
  // 3
  await page.selectOption('#time-limit-select', '30');
  await load('あいうえお');
  await type('X'); L('3a before', await st());
  await page.clock.runFor(31000); await page.waitForTimeout(100);
  L('3b finished', await page.evaluate(() => ({ fin: app.isFinished, miss: app.charElements.filter(e => e.classList.contains('miss')).length })));
  await page.evaluate(() => app.closeResultModal());
  L('3c after close', await page.evaluate(() => ({ miss: app.charElements.filter(e => e.classList.contains('miss')).length, modalOpen: !!document.querySelector('.modal-overlay.active, .modal-overlay.show') })));
  // 4
  L('4', await page.evaluate(() => ({ preview: !!document.getElementById('target-preview-text'), instr: !!document.querySelector('.input-instruction') })));
  L('4 errors', errs);
  // 5
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(100);
  L('5', await page.evaluate(() => { const i = document.getElementById('typing-input'); const cv = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(i); cv.font = cs.font; return { ph: i.placeholder, sw: i.scrollWidth, cw: i.clientWidth, padL: cs.paddingLeft, padR: cs.paddingRight, textW: cv.measureText(i.placeholder).width }; }));
  await page.screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo012-390.png', fullPage: true });
  // 6
  await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForTimeout(100);
  await load('あいうえお'); await type('あい');
  L('6', await page.evaluate(() => {
    const it = document.querySelectorAll('.stats-panel .stat-item'); const f = it[0].getBoundingClientRect(), l = it[it.length - 1].getBoundingClientRect();
    const card = document.getElementById('text-display').closest('.card, .text-card, section, div[class*=card]'); const c = card.getBoundingClientRect();
    return { n: it.length, firstL: f.left, lastR: l.right, cardCls: card.className, cardL: c.left, cardR: c.right, progress: document.getElementById('stat-progress').textContent };
  }));
  await page.screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo012-1280.png' });
  await browser.close();
})();
