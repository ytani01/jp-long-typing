// TODO-028 確認用。1280x800 の 1 条件だけ。コードは変更しない。
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8080/';
const OUT = '/home/ytani/work/jp-long-typing/archives/agents/TODO-028/case4.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function fresh() {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('.char');
  await page.waitForTimeout(300);
}

async function type(s) {
  await page.focus('#typing-input');
  await page.keyboard.insertText(s);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
}

// 初め 6 字の class と .typed の innerHTML
const readSix = () => page.evaluate(() =>
  [...document.querySelectorAll('.char')].slice(0, 6).map((el, i) => ({
    i,
    ch: el.firstChild.textContent,
    cls: el.className,
    typed: el.lastChild.innerHTML,
  }))
);

const show = (label, rows) => {
  console.log(`== ${label}`);
  for (const r of rows) console.log(`  [${r.i}] ch=${JSON.stringify(r.ch)} class="${r.cls}" typed=${r.typed || '(空)'}`);
};

try {
  // s0..s4 を読む
  await fresh();
  const s = await page.evaluate(() =>
    [...document.querySelectorAll('.char')].slice(0, 5).map(el => el.firstChild.textContent)
  );
  console.log('s0..s4 =', JSON.stringify(s), s.join(''));
  const [s0, s1, s2, s3, s4] = s;

  // ケース 1
  await fresh();
  await type(s0 + s1 + s2);
  show('case1: s0 s1 s2 を 1 回で確定', await readSix());

  // ケース 2
  await fresh();
  await type(s0 + s1);
  await type(s3 + s4);
  show('case2: s0 s1 s3 s4', await readSix());
  console.log('  stat-mistakes =', await page.textContent('#stat-mistakes'));

  // ケース 3
  await fresh();
  await type(s0);
  await type('X' + s2);
  show('case3: s0 X s2', await readSix());

  // ケース 4
  await fresh();
  await type(s0 + s1);
  await type('Z' + s2);
  show('case4: s0 s1 → Z s2', await readSix());
  await page.screenshot({ path: OUT });
  console.log('  screenshot =', OUT);

  // ケース 5（ケース 4 の後）
  const colors = await page.evaluate(() => {
    const done = document.querySelector('.char.done');
    const ok = document.querySelector('.typed .ok');
    const ng = document.querySelector('.typed .ng');
    const act = document.querySelector('.char.active');
    const cs = el => getComputedStyle(el);
    return {
      doneClass: done && done.className,
      doneColor: done && cs(done).color,
      doneOpacity: done && cs(done).opacity,
      okText: ok && ok.textContent,
      okColor: ok && cs(ok).color,
      ngText: ng && ng.textContent,
      ngColor: ng && cs(ng).color,
      activeText: act && act.firstChild.textContent,
      activeBoxShadow: act && cs(act).boxShadow,
      successColorVar: getComputedStyle(document.documentElement).getPropertyValue('--success-color'),
      errorColorVar: getComputedStyle(document.documentElement).getPropertyValue('--error-color'),
      mutedColorVar: getComputedStyle(document.documentElement).getPropertyValue('--text-muted'),
    };
  });
  console.log('== case5 色');
  console.log(JSON.stringify(colors, null, 2));

  // ケース 6（ケース 4 の後）
  const geo = await page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
    const act = document.querySelector('.char.active');
    const typed = act.lastChild;
    const input = document.getElementById('typing-input');
    const ar = r(act);
    const next = [...document.querySelectorAll('.char')].find(el => r(el).top > ar.top + 5);
    return {
      active: r(act),
      typed: r(typed),
      typedText: typed.textContent,
      input: r(input),
      nextLineFirst: next ? { ch: next.firstChild.textContent, ...r(next) } : null,
    };
  });
  console.log('== case6 位置');
  console.log(JSON.stringify(geo, null, 2));
  const inputBelowTyped = geo.input.top >= geo.typed.bottom;
  const inputAboveNext = geo.nextLineFirst ? geo.input.bottom <= geo.nextLineFirst.top : null;
  console.log(`  input.top >= typed.bottom: ${inputBelowTyped}`);
  console.log(`  input.bottom <= nextLine.top: ${inputAboveNext}`);
  console.log(`  input.top >= nextLine.top 相当の食い違い（参考）: ${geo.nextLineFirst ? geo.input.top >= geo.nextLineFirst.top : null}`);
} catch (e) {
  console.log('ERROR', e && e.stack || e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
