// TODO-028 のレビュー用の実測: 入力した字の配置、入力欄の位置、はみ出し
// 使い方: node archives/agents/TODO-028/reviewer-measure.mjs
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8080/';
const errors = [];

async function freshPage(browser, text, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#preset-select');
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

const state = (page) => page.evaluate(() => {
  const d = document.getElementById('text-display');
  const chars = [...d.querySelectorAll('.char')];
  const inp = document.getElementById('typing-input');
  const act = d.querySelector('.char.active');
  const r = (e) => e.getBoundingClientRect();
  return {
    under: chars.map((c) => {
      const t = c.querySelector('.typed');
      const own = c.firstChild.nodeType === 3 ? c.firstChild.data : '?';
      const typed = [...t.children].map((s) => `${s.className}:${JSON.stringify(s.textContent)}`).join(',');
      return typed ? `${JSON.stringify(own)}<-[${typed}]` : null;
    }).filter(Boolean),
    activeTypedH: act ? act.querySelector('.typed').offsetHeight : null,
    activeBottom: act ? Math.round(r(act).bottom) : null,
    activeTypedBottom: act ? Math.round(r(act.querySelector('.typed')).bottom) : null,
    inputTop: Math.round(r(inp).top), inputBottom: Math.round(r(inp).bottom),
    scrollW: d.scrollWidth, clientW: d.clientWidth,
    mistakes: document.getElementById('stat-mistakes').textContent,
    finished: document.getElementById('result-modal').classList.contains('active'),
  };
});

const browser = await chromium.launch({ headless: true });
const run = async (name, text, inputs, width) => {
  const { ctx, page } = await freshPage(browser, text, width);
  for (const s of inputs) await commit(page, s);
  console.log('---', name, JSON.stringify(inputs));
  console.log(JSON.stringify(await state(page), null, 1));
  await ctx.close();
};

await run('normal', '今日は晴れです。明日は雨です。', ['今日は']);
await run('before-any-input', '今日は晴れです。明日は雨です。', []);
await run('trailing-extra', '今日は晴れです。明日は雨です。', ['今日はは']);
await run('del+sub', '今日は晴れです。明日は雨です。', ['今日晴れでつ。']);
await run('beyond-end', 'あいう', ['あいうえお']);
await run('surrogate-input', 'あいうえお', ['あ𠮷う']);
await run('surrogate-both', 'あ𠮷うえお', ['あ𠮷う']);
await run('newline', 'あいう\nえおか', ['あいうえ']);
await run('newline-extra-at-eol', 'あいう\nえおか', ['あいうxえ']);
const long = 'あ'.repeat(200);
await run('right-edge-many-extra', long, ['あ'.repeat(30) + 'ABCDEFGHIJ']);
// 行末の字の下に余計な字を詰めたときの横はみ出し
const s = await (async () => {
  const { ctx, page } = await freshPage(browser, long);
  const n = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('#text-display .char')];
    const top0 = cs[0].offsetTop;
    return cs.findIndex((c) => c.offsetTop !== top0); // 2 行目の頭
  });
  await commit(page, 'あ'.repeat(n - 1) + 'ABCDEFGHIJKLMNOP');
  const st = await state(page);
  await ctx.close();
  return { n, scrollW: st.scrollW, clientW: st.clientW, under: st.under.slice(-2) };
})();
console.log('--- extra under first char of 2nd line', JSON.stringify(s));
// 行の頭の字の下に余計な字を詰めたとき（左にはみ出す）
await run('narrow-375', '今日は晴れです。明日は雨です。'.repeat(5), ['今日は'], 375);
// 済んだ字の下の入力した字の見た目の不透明度
{
  const { ctx, page } = await freshPage(browser, '今日は晴れです。');
  await commit(page, '今日');
  console.log('--- opacity', JSON.stringify(await page.evaluate(() => {
    const c = document.querySelector('.char.done');
    return { charOpacity: getComputedStyle(c).opacity, okColor: getComputedStyle(c.querySelector('.ok')).color };
  })));
  // リセットで消えるか
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  console.log('--- after Esc restart typed spans:', await page.evaluate(() => document.querySelectorAll('.typed > *').length));
  await ctx.close();
}
console.log('errors', JSON.stringify(errors));
await browser.close();
