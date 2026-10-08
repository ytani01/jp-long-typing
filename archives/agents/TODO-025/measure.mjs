import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
import os from 'node:os';
import path from 'node:path';

// TODO-025 の実測。入力欄の位置を、今の文字（.char.active）・次の行の字・お手本の字と比べる。
// 2 回目（r2）: activeIndex() の移動、line-height 変更、枠からの 3px、miss の付き方を追加で測る。
const OUT = path.join(os.homedir(), 'tmp/playwright-mcp');
const URL = 'http://localhost:8080/';
const VIEWS = process.env.ONLY375 ? [[375, 700]] : [[1280, 800], [375, 700]];
const PRESETS = ['2', 'claude-code'];

// 1 回の読み出し。placeInput と同じ基準で測る。
const SNAP = () => {
  const R = (b) => ({ l: +b.left.toFixed(1), t: +b.top.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1) });
  const td = document.getElementById('text-display');
  const inp = document.getElementById('typing-input');
  const chars = [...td.querySelectorAll('.char')];
  const cl = app.cleanText;
  const fpx = parseFloat(getComputedStyle(chars[0]).fontSize);
  const cur = app.currentIndex;
  const act = td.querySelector('.char.active');
  const ai = act ? +act.dataset.index : -1;
  const ab = act.getBoundingClientRect();
  const ac = (ab.top + ab.bottom) / 2;
  // 次の行の最初の字（改行でない字）。枠の帯で判定
  let next = null;
  for (let i = ai + 1; i < chars.length; i++) {
    if (cl[i] === '\n') continue;
    const b = chars[i].getBoundingClientRect();
    if ((b.top + b.bottom) / 2 > ac + fpx / 2) { next = { idx: i, rect: b }; break; }
  }
  const ib = inp.getBoundingClientRect();
  // 矩形どうしの重なりと隙間（px）。重なれば正、離れれば負の ov は隙間の反対にする
  const gap = (a, b) => {
    const x = Math.max(a.left, b.left) - Math.min(a.right, b.right);
    const y = Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom);
    return Math.max(x, y); // 負なら重なり、正なら隙間
  };
  const hit = [];
  chars.forEach((el, i) => {
    if (cl[i] === '\n') return;
    const g = gap(ib, el.getBoundingClientRect());
    if (g < 0) hit.push(i);
  });
  const actGapPx = +(ib.top - ab.bottom).toFixed(1); // 枠の下端から欄の上端まで
  const nextGapPx = next ? +(next.rect.top - ib.bottom).toFixed(1) : null; // 欄の下端から次の行の字の上端まで（字の矩形）
  const cs = getComputedStyle(inp);
  const tcs = getComputedStyle(td);
  const tdb = td.getBoundingClientRect();
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const phW = cv.measureText(inp.placeholder).width;
  const avail = inp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return {
    cur,
    activeIdx: ai,
    activeIsNewlineText: cl[cur] === '\n',
    activeRect: R(ab),
    activeMiss: act.classList.contains('miss'),
    nextIdx: next ? next.idx : null,
    nextRect: next ? R(next.rect) : null,
    inp: R(ib),
    gapFromActiveBottomPx: actGapPx,
    gapInputToNextCharPx: nextGapPx,
    inputLeftMinusActiveLeft: +(ib.left - ab.left).toFixed(1),
    overlapCharsRect: hit,
    tdRect: R(tdb),
    insideTd: ib.left >= tdb.left + parseFloat(tcs.paddingLeft) - 0.5 && ib.right <= tdb.right - parseFloat(tcs.paddingRight) + 0.5,
    scrollW: inp.scrollWidth,
    clientW: inp.clientWidth,
    placeholderW: +phW.toFixed(1),
    placeholderAvailW: +avail.toFixed(1),
    inputFont: `${cs.fontSize} lh=${cs.lineHeight}`,
    errorClass: inp.classList.contains('error'),
  };
};

const browser = await chromium.launch();
const emit = (o) => console.log(JSON.stringify(o));

for (const [w, h] of VIEWS) {
  for (const preset of PRESETS) {
    const run = `${w}x${h} p=${preset}`;
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(URL);
    await page.waitForTimeout(800);
    const hasOpt = await page.evaluate((p) => !!document.querySelector(`#preset-select option[value="${p}"]`), preset);
    if (!hasOpt) { emit({ run, skipped: 'preset option missing' }); await page.close(); continue; }
    await page.selectOption('#preset-select', preset);
    await page.waitForTimeout(400);
    emit({ run, info: await page.evaluate(() => ({ len: app.cleanText.length, newlines: [...app.cleanText].filter((c) => c === '\n').length })) });
    await page.focus('#typing-input');

    const shot = async (stage) => {
      await page.waitForTimeout(600);
      const s = await page.evaluate(SNAP);
      await page.screenshot({ path: path.join(OUT, `todo025-r2-${w}x${h}-p${preset}-${stage}.png`) });
      emit({ run, stage, ...s });
      return s;
    };
    // 今の位置から target の手前まで、改行を除いた練習文を打つ
    const typeTo = async (target) => {
      const cur = await page.evaluate(() => app.currentIndex);
      const s = await page.evaluate(([a, b]) => app.cleanText.slice(a, b).replace(/\n/g, ''), [cur, target]);
      if (s) await page.keyboard.insertText(s);
      await page.waitForTimeout(150);
      return page.evaluate(() => app.currentIndex);
    };
    // 誤った字を 1 字入れ、miss の付き方を測ってから消す
    const missTest = async (label) => {
      const expected = await page.evaluate(() => app.cleanText[app.activeIndex()]);
      const wrong = expected === 'x' ? 'q' : 'x';
      const before = await page.evaluate(SNAP);
      await page.keyboard.insertText(wrong);
      const during = await page.evaluate(SNAP);
      await page.screenshot({ path: path.join(OUT, `todo025-r2-${w}x${h}-p${preset}-miss-${label}.png`) });
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
      const after = await page.evaluate(SNAP);
      emit({ run, stage: `miss-${label}`, wrongChar: wrong, expected, activeIdxSame: before.activeIdx === during.activeIdx,
        missDuring: during.activeMiss, errorClassDuring: during.errorClass, missAfterBackspace: after.activeMiss,
        inpBefore: before.inp, inpDuring: during.inp, inpAfter: after.inp,
        positionSame: JSON.stringify(before.inp) === JSON.stringify(during.inp) && JSON.stringify(before.inp) === JSON.stringify(after.inp) });
    };

    await shot('0-start');
    await typeTo(30);
    await shot('1-after30');
    if (w === 1280 && preset === '2') await missTest('1-after30');

    const s2 = await shot('2-before-rowchange');
    await typeTo(s2.nextIdx);
    await shot('3-rowchanged');

    const nl = await page.evaluate(() => app.cleanText.indexOf('\n', app.currentIndex));
    if (nl > 0) {
      await typeTo(nl - 1);
      await shot('4-lineend-last-char');
      await typeTo(nl);
      await shot('5-after-newline');
      if (w === 1280 && preset === 'claude-code') await missTest('5-after-newline');
    } else {
      emit({ run, note: 'no newline after current index' });
    }

    if (w === 1280 && preset === '2') {
      await page.setViewportSize({ width: 800, height: 800 });
      await shot('6-resized-800');
    }

    // 文の最後の 1 字を残した状態
    const last = await page.evaluate(() => app.cleanText.length - 1);
    await typeTo(last);
    await shot('7-last-char-left');

    await page.close();
  }
}
await browser.close();
