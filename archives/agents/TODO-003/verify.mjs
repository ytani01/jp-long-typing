import { chromium } from '/home/ytani/.local/share/mise/installs/npm-playwright/latest/node_modules/playwright/index.mjs';
const port = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForTimeout(1500);
const st = () => page.evaluate(() => ({ clean: app.cleanText, author: app.dom.articleAuthor.textContent, total: app.dom.charTotalCount.textContent, idx: app.currentIndex, mist: app.mistakesCount, fin: app.isFinished }));
// 1
const input = 'ＡＢＣ　ｘｙｚ １２３\r\nNew York。\r単独 行\n「全角！？」＄ 末尾';
await page.selectOption('#preset-select', 'custom');
await page.fill('#custom-textarea', input);
await page.click('#btn-apply-custom');
let s = await st();
console.log('1 clean', JSON.stringify(s.clean), s.clean.length, '|', s.author, '|', s.total);
const exp = 'ABCxyz123\nNewYork。\n単独行\n「全角！？」＄\n末尾';
console.log('1 match expected:', s.clean === exp, 'len==display:', s.author.includes(`文字数: ${s.clean.length}字`) && s.total == s.clean.length, 'hasSpace', /[^\S\n]/.test(s.clean), 'hasFullAlnum', /[Ａ-Ｚａ-ｚ０-９]/.test(s.clean), 'CR', s.clean.includes('\r'));
// 2
await page.selectOption('#preset-select', '0');
s = await st();
console.log('2 preset', s.author, 'space', /[^\S\n]/.test(s.clean), 'fullalnum', /[Ａ-Ｚａ-ｚ０-９]/.test(s.clean), 'len', s.clean.length, 'display', s.total, JSON.stringify(s.clean.slice(0, 40)));
// 3
await page.selectOption('#preset-select', 'custom');
await page.fill('#custom-textarea', input);
await page.click('#btn-apply-custom');
await page.focus('#typing-input');
await page.keyboard.insertText('ABC');
s = await st(); console.log('3a after ABC idx', s.idx, 'mist', s.mist);
await page.keyboard.insertText('xyz１');
s = await st(); console.log('3b after xyz+fullwidth１ idx', s.idx, 'mist', s.mist, '(expect idx 6, mist 1)');
await page.fill('#typing-input', '');
await page.keyboard.insertText('1');
s = await st(); console.log('3c after half 1 idx', s.idx, 'mist', s.mist);
const rest = s.clean.slice(s.idx).replace(/\n/g, '');
for (const ch of rest) await page.keyboard.insertText(ch);
s = await st();
const modal = await page.evaluate(() => document.getElementById('result-modal').classList.contains('active'));
console.log('3d finished', s.fin, 'idx', s.idx, '/', s.clean.length, 'result modal', modal);
console.log('4 errors', JSON.stringify(errs));
await b.close();
