// TODO-009 実測（2 回目）。python3 -m http.server 8080 を起動してから node verify.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const j = (k, x) => console.log(k, JSON.stringify(x));
const errs = [];
for (const [w, h] of [[1280, 800], [375, 812]]) {
  const page = await b.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => errs.push(w + ' ' + String(e)));
  await page.route(u => !u.href.startsWith('http://localhost:8080/'), r => r.abort());
  await page.goto('http://localhost:8080/'); await page.waitForTimeout(1500);
  const geo = () => page.evaluate(() => {
    const q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
    const sel = q('#preset-select'), grp = q('.preset-group'), main = q('main'), lab = q('.preset-label'), ai = q('.article-info'), au = q('#article-author'), inp = q('#typing-input');
    const au_vis = au && R(au).width > 0;
    return { w: innerWidth, noTitle: !q('#article-title'), noHint: !q('.start-hint'), selInHeader: !!q('header #preset-select'), selInInfo: !!q('main .article-info #preset-select'),
      labelText: lab.textContent, label: [R(lab).left, R(lab).right, R(lab).top, R(lab).bottom].map(Math.round), select: [R(sel).left, R(sel).right, R(sel).top, R(sel).bottom].map(Math.round),
      selRight: R(sel).right, grpRight: R(grp).right, mainRight: R(main).right, docSW: document.documentElement.scrollWidth,
      authorVisible: au_vis, authorText: au.textContent, authorRect: [R(au).left, R(au).right, R(au).top, R(au).bottom].map(Math.round),
      placeholder: inp.placeholder, inpSW: inp.scrollWidth, inpCW: inp.clientWidth,
      noFocusKeep: !document.body.textContent.includes('フォーカス維持'), noFooter: !q('footer') };
  });
  j(w + ' initial', await geo());
  // placeholder width: measure text width with canvas using input font
  j(w + ' placeholderTextWidth', await page.evaluate(() => { const i = document.querySelector('#typing-input'), c = document.createElement('canvas').getContext('2d'), s = getComputedStyle(i); c.font = s.font; const p = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight); return { textW: Math.round(c.measureText(i.placeholder).width), innerW: Math.round(i.clientWidth - p) }; }));
  await page.screenshot({ path: process.env.HOME + `/tmp/playwright-mcp/todo-009-${w}.png` });
  // custom
  await page.selectOption('#preset-select', 'custom');
  const title = 'あ'.repeat(80);
  await page.fill('#custom-title-input', title);
  await page.fill('#custom-textarea', 'カスタム本文のテストです。これは確認用の文章です。');
  await page.click('#btn-apply-custom'); await page.waitForTimeout(300);
  j(w + ' afterCustom', await page.evaluate(() => { const s = document.querySelector('#preset-select'); return { value: s.value, text: s.selectedOptions[0].textContent.length, head: s.selectedOptions[0].textContent.slice(0, 5), selRight: s.getBoundingClientRect().right, mainRight: document.querySelector('main').getBoundingClientRect().right, docSW: document.documentElement.scrollWidth, iw: innerWidth }; }));
  await page.screenshot({ path: process.env.HOME + `/tmp/playwright-mcp/todo-009-${w}-custom.png` });
  await page.selectOption('#preset-select', '4'); await page.waitForTimeout(200);
  const t1 = await page.evaluate(() => app.cleanText.slice(0, 10));
  await page.selectOption('#preset-select', 'custom-text'); await page.waitForTimeout(200);
  j(w + ' reselect', { before: t1, after: await page.evaluate(() => app.cleanText.slice(0, 10)), value: await page.evaluate(() => document.querySelector('#preset-select').value) });
  // measure start
  await page.selectOption('#preset-select', '0'); await page.waitForTimeout(200);
  const t0 = await page.textContent('#stat-time');
  await page.focus('#typing-input'); await page.keyboard.insertText('日');
  await page.waitForTimeout(2200);
  j(w + ' timer', { before: t0, after: await page.textContent('#stat-time') });
  await page.close();
}
j('pageerrors', errs);
await b.close();
