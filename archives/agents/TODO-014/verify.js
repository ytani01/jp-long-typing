const pw = require('playwright');
const SH = process.env.HOME + '/tmp/playwright-mcp/todo014-';
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
  const ls = () => page.evaluate(() => {
    const out = { ascii: {}, ja: {} };
    document.querySelectorAll('#text-display .char, .char').forEach(s => {
      const t = s.textContent; if (t.length !== 1) return;
      const k = /[A-Za-z0-9]/.test(t) ? 'ascii' : (/[぀-ヿ一-鿿]/.test(t) ? 'ja' : null);
      if (!k) return;
      const v = getComputedStyle(s).letterSpacing;
      out[k][v] = (out[k][v] || 0) + 1;
    });
    return out;
  });
  // 1 default
  L('1 default', await ls());
  L('1 default fontsize', await page.evaluate(() => getComputedStyle(document.querySelector('.char')).fontSize));
  await page.evaluate(() => app.loadArticle({ text: 'abcdefghijklmnopqrstuvwxyz あいう', author: 'x' }));
  L('1 long', await page.evaluate(() => {
    const cs = [...document.querySelectorAll('.char')];
    const first = cs.slice(0, 26);
    return { text: first.map(c => c.textContent).join(''), ls: [...new Set(first.map(c => getComputedStyle(c).letterSpacing))],
      inWord: first.some(c => c.parentElement.classList.contains('word')),
      ja: [...new Set(cs.slice(27).map(c => getComputedStyle(c).letterSpacing))] };
  }));
  // 2 typing
  await page.evaluate(() => app.loadArticle({ text: 'Claude 練習 abcdefghijklmnopqrstuvwxyz', author: 'x' }));
  await page.locator('#typing-input').focus();
  await page.keyboard.insertText('Cla');
  await page.waitForTimeout(80);
  L('2 classes', await page.evaluate(() => [...document.querySelectorAll('.char')].slice(0, 6).map(c => c.className + ':' + getComputedStyle(c).letterSpacing)));
  await page.keyboard.insertText('ude ');
  await page.waitForTimeout(80);
  L('2 after more', await page.evaluate(() => [...document.querySelectorAll('.char')].slice(0, 9).map(c => c.className + ':' + c.textContent + ':' + getComputedStyle(c).letterSpacing)));
  // 3 logo
  const logo = () => page.evaluate(() => {
    const l = document.querySelector('.brand-icon'); const b = l.getBoundingClientRect();
    const bi = document.querySelector('#btn-theme svg'); const tagged = [...document.querySelectorAll('header .icon')].map(e => e.tagName);
    const root = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
    const probe = document.createElement('i'); probe.style.color = 'var(--accent-color)'; document.body.appendChild(probe);
    const accent = getComputedStyle(probe).color; probe.remove();
    return { tag: l.tagName, w: b.width, h: b.height, color: getComputedStyle(l).color, accentVar: root, accentResolved: accent,
      btnSvgColor: bi && getComputedStyle(bi).color, btnColor: getComputedStyle(document.getElementById('btn-theme')).color,
      kbdEmoji: document.body.innerHTML.includes('⌨'), kbdInText: document.body.textContent.includes('⌨') };
  });
  L('3 dark', await logo());
  await page.screenshot({ path: SH + '1280-dark.png' });
  await page.click('#btn-theme'); await page.waitForTimeout(500);
  L('3 light', await logo());
  await page.screenshot({ path: SH + '1280-light.png' });
  await page.click('#btn-theme'); await page.waitForTimeout(500);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(100);
  await page.screenshot({ path: SH + '390.png', fullPage: true });
  L('4 errors', errs);
  await browser.close();
})();
