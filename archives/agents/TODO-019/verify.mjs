import { chromium } from '/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const page = await b.newPage();
const errs = []; page.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('pageerror: '+e.message));
await page.goto('http://localhost:8080/'); await page.waitForTimeout(3000);
console.log('1 groups', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#preset-select optgroup')].map(g => ({label: g.label, opts: [...g.querySelectorAll('option')].map(o => o.value+':'+o.textContent.trim())})))));
const sel = page.locator('#preset-select');
for (const v of ['0','1','2','3']) {
  await sel.selectOption(v); await page.waitForTimeout(300);
  console.log('2', v, JSON.stringify(await page.evaluate(() => ({author: document.getElementById('article-author').textContent, head: document.getElementById('text-display').textContent.trim().slice(0,25)}))));
}
// 3: value 3 -> finish by typing
await sel.selectOption('3'); await page.waitForTimeout(300);
const text = await page.evaluate(() => document.getElementById('text-display').textContent.replace(/\s+/g,''));
await page.focus('#typing-input');
for (const ch of text) { await page.keyboard.insertText(ch); }
await page.waitForTimeout(800);
console.log('3 modal title', await page.evaluate(() => document.getElementById('res-modal-title').textContent), 'visible', await page.locator('#btn-result-next').isVisible());
await page.click('#btn-result-next'); await page.waitForTimeout(500);
console.log('3 after next', JSON.stringify(await page.evaluate(() => ({value: document.getElementById('preset-select').value, author: document.getElementById('article-author').textContent, head: document.getElementById('text-display').textContent.trim().slice(0,25)}))));
console.log('4 errors', JSON.stringify(errs));
await b.close();
