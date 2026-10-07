import * as pw from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.route(/^(?!http:\/\/localhost:8080).*/, r => r.abort());
await page.goto('http://localhost:8080/');
await page.waitForTimeout(500);
const load = (t) => page.evaluate((t) => { app.timeLimit = 0; app.loadArticle({ text: t, author: 'x' }); }, t);
const st = () => page.evaluate(() => ({
  idx: app.currentIndex, val: app.dom.typingInput.value,
  miss: app.charElements.map((e, i) => e.classList.contains('miss') ? i : -1).filter(i => i >= 0),
  active: app.charElements.map((e, i) => e.classList.contains('active') ? i : -1).filter(i => i >= 0),
}));
const type = async (s) => { await page.locator('#typing-input').focus(); await page.keyboard.insertText(s); await page.waitForTimeout(50); };
const clear = async () => { await page.locator('#typing-input').focus(); await page.keyboard.press('Control+a'); await page.keyboard.press('Backspace'); await page.waitForTimeout(50); };

await load('あいうえお');
await type('あX'); console.log('A partial+miss', JSON.stringify(await st()));
await clear(); console.log('B clear all', JSON.stringify(await st()));
await type('X'); await page.keyboard.press('Backspace'); await page.waitForTimeout(50); console.log('B2 backspace', JSON.stringify(await st()));
await type('Y'); await type('い'); console.log('B3 wrong then more', JSON.stringify(await st()));

await load('あい\nうえ');
await type('あい'); console.log('C0 up to newline', JSON.stringify(await st()));
await type('X'); console.log('C mismatch after newline', JSON.stringify(await st()));
await clear(); console.log('C2 clear', JSON.stringify(await st()));

await load('あい\nうえ');
await type('あいX'); console.log('D match through newline then miss', JSON.stringify(await st()));

await load('あいうえお');
await type('X'); await page.evaluate(() => app.restart()); console.log('E restart', JSON.stringify(await st()));
await type('X'); await page.evaluate(() => app.loadArticle({ text: 'かきくけこ', author: 'y' })); console.log('E2 switch', JSON.stringify(await st()));

await load('あいうえお');
await type('X'); await page.evaluate(() => app.finish(true)); console.log('F timeup', JSON.stringify(await st()));
await page.evaluate(() => app.closeResultModal()); await clear(); console.log('F2 after close+clear', JSON.stringify(await st()));

for (const w of [1440, 1280, 1000, 980, 800, 500]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const m = document.querySelector('main'), s = document.querySelector('.stats-panel');
    const mc = getComputedStyle(m), sc = getComputedStyle(s);
    const mr = m.getBoundingClientRect(), sr = s.getBoundingClientRect();
    return { mainL: mr.left + parseFloat(mc.paddingLeft), mainR: mr.right - parseFloat(mc.paddingRight),
      statL: sr.left + parseFloat(sc.paddingLeft), statR: sr.right - parseFloat(sc.paddingRight), body: document.body.clientWidth };
  });
  console.log('G', w, JSON.stringify(r));
}
await browser.close();
