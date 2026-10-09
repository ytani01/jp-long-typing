// TODO-028 再レビューの実測: 行末での重なり、余計な字の有無での入力欄の高さ、済んだ字の下の色、次の行との重なり
// 使い方: node archives/agents/TODO-028/reviewer-measure3.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8080/';
const errors = [];
async function freshPage(browser, text, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
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
const geo = (page) => page.evaluate(() => {
  const inp = document.getElementById('typing-input').getBoundingClientRect();
  const act = document.querySelector('.char.active');
  const a = act.getBoundingClientRect();
  const hit = [...document.querySelectorAll('.typed > span')].filter((s) => {
    const r = s.getBoundingClientRect();
    return r.right > inp.left && r.left < inp.right && r.bottom > inp.top && r.top < inp.bottom;
  }).length;
  // 次の行の字の上端（今の字より下にある最初の字）
  const next = [...document.querySelectorAll('.char')].map((c) => c.getBoundingClientRect()).find((r) => r.top > a.bottom);
  return {
    activeBottom: Math.round(a.bottom), typedH: act.querySelector('.typed').offsetHeight,
    inputTop: Math.round(inp.top), inputBottom: Math.round(inp.bottom), inputLeft: Math.round(inp.left),
    nextLineTop: next ? Math.round(next.top) : null, overlappedTyped: hit,
  };
});
const browser = await chromium.launch({ headless: true });
const long = 'あ'.repeat(200);

for (const width of [1280, 375]) {
  // (1) 行末の 3 字手前まで打つ
  {
    const { ctx, page } = await freshPage(browser, long, width);
    const n = await lineLen(page);
    await commit(page, 'あ'.repeat(n - 3));
    console.log(`(1) width ${width} line ${n} typed ${n - 3}`, JSON.stringify(await geo(page)));
    await page.screenshot({ path: `/home/ytani/work/jp-long-typing/archives/agents/TODO-028/reviewer-lineend-${width}-r2.png` });
    await ctx.close();
  }
  // (2) 同じ字数を打って、最後に余計な字が付くかだけを変える
  for (const [label, s] of [['no-extra', 'あああ'], ['extra-1', 'あああx'], ['extra-10', 'あああxxxxxxxxxx']]) {
    const { ctx, page } = await freshPage(browser, long, width);
    await commit(page, s);
    console.log(`(2) width ${width} ${label}`, JSON.stringify(await geo(page)));
    await ctx.close();
  }
}
// (3) 済んだ字と、その下の入力した字の computed の opacity と color
{
  const { ctx, page } = await freshPage(browser, '今日は晴れです。');
  await commit(page, '今日わ');
  console.log('(3)', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.char.done')].map((c) => {
    const t = c.querySelector('.typed > span');
    const op = (e) => { let o = 1; for (; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    return { char: c.firstChild.data, charColor: getComputedStyle(c).color, charOpacity: getComputedStyle(c).opacity,
      typed: t.textContent, cls: t.className, typedColor: getComputedStyle(t).color, typedEffectiveOpacity: op(t) };
  }))));
  await ctx.close();
}
console.log('errors', JSON.stringify(errors));
await browser.close();
