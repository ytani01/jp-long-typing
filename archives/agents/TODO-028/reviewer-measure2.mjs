// TODO-028 のレビュー用の実測（続き）: 行末で入力欄が左に寄ったときの重なり、横のはみ出し、サロゲートペアの分かれ方
// 使い方: node archives/agents/TODO-028/reviewer-measure2.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8080/';
async function freshPage(browser, text, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.selectOption('#preset-select', 'custom');
  await page.waitForSelector('#custom-modal.active');
  await page.fill('#custom-textarea', text);
  await page.click('#btn-apply-custom');
  await page.waitForFunction(() => !document.getElementById('custom-modal').classList.contains('active'));
  return { ctx, page };
}
async function commit(page, s) {
  await page.evaluate(() => document.getElementById('typing-input').focus({ preventScroll: true }));
  await page.keyboard.insertText(s);
  await page.waitForTimeout(300);
}
const lineLen = (page) => page.evaluate(() => {
  const cs = [...document.querySelectorAll('#text-display .char')];
  return cs.findIndex((c) => c.offsetTop !== cs[0].offsetTop);
});
const browser = await chromium.launch({ headless: true });
const long = 'あ'.repeat(200);

for (const width of [1280, 375]) {
  // 行末の 3 字手前まで打つ: 入力欄が左に寄せられ、済んだ字の下の入力した字と重なるか
  const { ctx, page } = await freshPage(browser, long, width);
  const n = await lineLen(page);
  await commit(page, 'あ'.repeat(n - 3));
  const ov = await page.evaluate(() => {
    const inp = document.getElementById('typing-input').getBoundingClientRect();
    const hit = [...document.querySelectorAll('.typed > span')].filter((s) => {
      const r = s.getBoundingClientRect();
      return r.right > inp.left && r.left < inp.right && r.bottom > inp.top && r.top < inp.bottom;
    });
    return { inputLeft: Math.round(inp.left), inputTop: Math.round(inp.top), overlappedTyped: hit.length };
  });
  console.log(`--- width ${width}, line length ${n}, typed ${n - 3}:`, JSON.stringify(ov));
  await page.screenshot({ path: `/home/ytani/work/jp-long-typing/archives/agents/TODO-028/reviewer-lineend-${width}.png` });
  await ctx.close();
}

// 行末の字の下に余計な字を何字詰めると横スクロールが出るか（1280）
for (const extra of [1, 2, 3, 4, 6]) {
  const { ctx, page } = await freshPage(browser, long);
  const n = await lineLen(page);
  await commit(page, 'あ'.repeat(n - 1) + 'x'.repeat(extra));
  const m = await page.evaluate(() => { const d = document.getElementById('text-display'); return [d.scrollWidth, d.clientWidth]; });
  console.log(`--- extra ${extra} (半角) under line-end char: scrollWidth/clientWidth`, m);
  await ctx.close();
}
for (const extra of [1, 2, 3]) {
  const { ctx, page } = await freshPage(browser, long);
  const n = await lineLen(page);
  await commit(page, 'あ'.repeat(n - 1) + 'い'.repeat(extra));
  const m = await page.evaluate(() => { const d = document.getElementById('text-display'); return [d.scrollWidth, d.clientWidth]; });
  console.log(`--- extra ${extra} (全角) under line-end char: scrollWidth/clientWidth`, m);
  await ctx.close();
}

// サロゲートペアが別の字の下に分かれるか
{
  const { ctx, page } = await freshPage(browser, 'あいうえお');
  await commit(page, 'あ𠮷');
  console.log('--- surrogate split', JSON.stringify(await page.evaluate(() =>
    [...document.querySelectorAll('.char')].map((c) => [c.firstChild.data, [...c.querySelector('.typed').children].map((s) => s.textContent.codePointAt(0).toString(16))]))));
  const box = await page.locator('#text-display').boundingBox();
  await page.screenshot({ path: '/home/ytani/work/jp-long-typing/archives/agents/TODO-028/reviewer-surrogate.png', clip: { x: box.x, y: box.y, width: 400, height: 120 } });
  await ctx.close();
}
await browser.close();
