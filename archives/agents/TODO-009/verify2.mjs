// TODO-009 再確認（label と placeholder）。サーバー 8080 を起動してから node verify2.mjs
import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const b = await chromium.launch();
for (const [w, h] of [[375, 812], [1280, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.route(x => !x.href.startsWith('http://localhost:8080/'), r => r.abort());
  await p.goto('http://localhost:8080/'); await p.waitForTimeout(1200);
  console.log(w, JSON.stringify(await p.evaluate(() => {
    const q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
    const i = q('#typing-input'), ph = getComputedStyle(i, '::placeholder'), s = getComputedStyle(i);
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${ph.fontStyle} ${ph.fontWeight} ${ph.fontSize} ${ph.fontFamily}`;
    const inner = i.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    const l = q('.preset-label'), sel = q('#preset-select');
    return { phFont: ph.fontSize, inputFont: s.fontSize, textW: +c.measureText(i.placeholder).width.toFixed(1), inner,
      labelH: R(l).height, labelW: R(l).width, selH: R(sel).height, labelRight: R(l).right, selLeft: R(sel).left,
      labelTB: [R(l).top, R(l).bottom], selTB: [R(sel).top, R(sel).bottom],
      selRight: R(sel).right, mainRight: R(q('main')).right, docSW: document.documentElement.scrollWidth, iw: innerWidth };
  })));
  if (w === 375) { await p.locator('.typing-input-card').scrollIntoViewIfNeeded(); await p.locator('.typing-input-card').screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo-009-375-input.png' }); await p.locator('.article-info').screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo-009-375-info.png' }); }
  await p.close();
}
await b.close();
