// usage: node verify-linestart.js  (http://localhost:8080/ を配信しておく)
const { chromium } = require('playwright');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../../../index.html', 'utf8');
const m = html.match(/NO_LINE_START = new Set\('([^']*)'\)/);
const NLS = new Set([...m[1]]);
(async () => {
  const b = await chromium.launch();
  for (const [w, preset] of [[1280, null], [800, null], [375, null], [1280, '4'], [800, '4'], [375, '4'], [375, '5']]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8080/');
    await p.waitForTimeout(1500);
    if (preset) { await p.selectOption('#preset-select', preset); await p.waitForTimeout(500); }
    const r = await p.evaluate(() => {
      const cs = [...document.querySelectorAll('#text-display .char')];
      const rows = []; let lastTop = null, prev = null;
      for (const c of cs) {
        const t = Math.round(c.getBoundingClientRect().top);
        if (lastTop === null || Math.abs(t - lastTop) > 5) { rows.push({ first: c.textContent, nl: prev && prev.classList.contains('linebreak'), n: 0, right: 0 }); lastTop = t; }
        const row = rows[rows.length - 1]; row.n++;
        row.right = Math.max(row.right, c.getBoundingClientRect().right);
        prev = c;
      }
      const d = document.querySelector('#text-display').getBoundingClientRect();
      return { total: cs.length, rows, right: d.right };
    });
    const bad = r.rows.filter(x => NLS.has(x.first));
    console.log(`w=${w} preset=${preset || 'default'} chars=${r.total} rows=${r.rows.length} bad=${bad.length}`, bad.map(x => x.first).join(''));
    if (w === 1280 && !preset) {
      await p.screenshot({ path: __dirname + '/shot-1280.png', fullPage: true });
      console.log(' row fill (right edge vs card right', Math.round(r.right), '):', r.rows.map(x => Math.round(x.right)).join(','));
      // typing
      const txt = await p.evaluate(() => [...document.querySelectorAll('#text-display .char')].slice(0, 5).map(c => c.textContent).join(''));
      await p.click('#typing-input');
      await p.keyboard.insertText(txt);
      await p.waitForTimeout(300);
      console.log(' typed', txt, 'done=', await p.evaluate(() => document.querySelectorAll('#text-display .char.done').length),
        'progress=', await p.textContent('#stat-progress'), 'mistakes=', await p.textContent('#stat-mistakes'));
    }
    if (r.rows.some(x => x.nl)) console.log(' rows starting after linebreak:', r.rows.filter(x => x.nl).length, 'linebreak chars:', await p.evaluate(() => document.querySelectorAll('#text-display .char.linebreak').length));
    await p.close();
  }
  await b.close();
})();
