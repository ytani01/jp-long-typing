// README に載せるプレー動画を撮る（TODO-023）。
// 先に `python3 -m http.server 8080` で配信しておき、プロジェクトのトップで
//   node tools/record-demo.mjs
// を実行すると tools/out/demo.mp4 ができる。
// 録画では、DevTools Protocol の Input.imeSetComposition で変換中の字を出し、
// 読みを打つ → 変換 → 確定、の流れを見せる。見本の履歴は確定後の字を流し込んで作る。
import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:8080/';
const OUT = 'tools/out';
const SIZE = { width: 1280, height: 800 };

// 句読点の後で切り、2〜6 字ずつ確定していく
function chunks(text) {
  const out = [];
  let buf = '';
  for (const c of text) {
    buf += c;
    if (/[、。！？」\n]/.test(c) || buf.length >= 2 + Math.floor(Math.random() * 5)) {
      out.push(buf);
      buf = '';
    }
  }
  if (buf) out.push(buf);
  return out;
}

// 残りの練習文を、cpm の速さで打つ。advance は待ち方（実時間か早送り）。
// missAt 番目の確定で 1 回誤り、Backspace で消して打ち直す
async function type(page, { cpm, maxMs, missAt = -1, advance }) {
  const text = await page.evaluate(() => app.cleanText.slice(app.currentIndex));
  let spent = 0;
  for (const [i, chunk] of chunks(text).entries()) {
    const ms = chunk.length * 60000 / cpm * (0.6 + Math.random() * 0.8);
    spent += ms;
    if (spent > maxMs) return;
    await advance(ms);
    if (i === missAt && chunk.length >= 2) {
      const wrong = chunk[1] === 'の' ? 'を' : 'の';
      await page.keyboard.insertText(chunk[0] + wrong);
      await advance(700);
      await page.keyboard.press('Backspace');
      await advance(300);
      await page.keyboard.insertText(chunk.slice(1));
    } else {
      await page.keyboard.insertText(chunk);
    }
    if (await page.evaluate(() => app.isFinished)) return;
  }
}

// 録画で打つ『走れメロス』の冒頭。[確定する字, 読み]。読みと同じなら変換しない
const MELOS = [
  ['メロスは', 'めろすは'], ['激怒した。', 'げきどした。'], ['必ず、', 'かならず、'], ['かの', 'かの'],
  ['邪智暴虐の', 'じゃちぼうぎゃくの'], ['王を', 'おうを'], ['除かなければ', 'のぞかなければ'],
  ['ならぬと', 'ならぬと'], ['決意した。', 'けついした。'], ['メロスには', 'めろすには'],
  ['政治が', 'せいじが', '政事が', 'じが'], ['わからぬ。', 'わからぬ。'], ['メロスは、', 'めろすは、'],
  ['村の', 'むらの'], ['牧人である。', 'ぼくじんである。'], ['笛を', 'ふえを'], ['吹き、', 'ふき、'],
  ['羊と', 'ひつじと'], ['遊んで', 'あそんで'], ['暮して', 'くらして'], ['来た。', 'きた。'],
  ['けれども', 'けれども'], ['邪悪に', 'じゃあくに'], ['対しては、', 'たいしては、'],
  ['人一倍に', 'ひといちばいに'], ['敏感であった。', 'びんかんであった。'], ['きょう', 'きょう'],
  ['未明', 'みめい'], ['メロスは', 'めろすは'], ['村を', 'むらを'], ['出発し、', 'しゅっぱつし、'],
];

// 読みを 1 字ずつ打ち、変換して確定する。3 つ目の要素があれば、まずそれに変換し間違え、
// 確定して残った誤りを選んで一度に消し、4 つ目の読みから打ち直す
// （1 字ずつ消すと、消すたびに誤りとして数えられる）
async function typeIme(page, cdp, wait) {
  const compose = text => cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
  const write = async (text, reading) => {
    for (let i = 1; i <= reading.length; i++) {
      await compose(reading.slice(0, i));
      await wait(110 + Math.random() * 90);
    }
    if (text !== reading) {
      await wait(250);
      await compose(text); // 変換
      await wait(450);
    }
    await cdp.send('Input.insertText', { text }); // 確定
    await wait(250);
  };
  for (const [text, reading, wrong, retry] of MELOS) {
    if (await page.evaluate(() => app.isFinished)) return;
    if (wrong) {
      await write(wrong, reading);
      await wait(600);
      const left = await page.inputValue('#typing-input');
      await page.keyboard.press('Shift+Home');
      await wait(400);
      await page.keyboard.press('Backspace');
      await wait(300);
      await write(text.slice(wrong.length - left.length), retry);
    } else {
      await write(text, reading);
    }
  }
}

const browser = await chromium.launch();

// 1. 録画しないブラウザで数回プレーし、履歴と苦手の分析の材料を作る。
//    時計を早送りするので一瞬で終わる
const seed = await browser.newContext({ viewport: SIZE });
const sp = await seed.newPage();
await sp.clock.install({ time: Date.now() - 600000 }); // 録画した回より前の日時にする
await sp.goto(URL);
await sp.selectOption('#time-limit-select', '30');
for (const [preset, cpm] of [['1', 180], ['2', 210], ['3', 190], ['1', 240], ['2', 230]]) {
  await sp.selectOption('#preset-select', preset);
  await sp.focus('#typing-input');
  await type(sp, { cpm, maxMs: 32000, missAt: 3, advance: ms => sp.clock.runFor(Math.round(ms)) });
  await sp.clock.runFor(3000); // 時間切れで結果を出す
  await sp.click('#btn-close-result');
}
const state = await seed.storageState();
await seed.close();

// 2. 録画する
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const ctx = await browser.newContext({ viewport: SIZE, storageState: state, recordVideo: { dir: OUT, size: SIZE } });
const page = await ctx.newPage();
const wait = ms => page.waitForTimeout(ms);
await page.goto(URL);
await page.click('#btn-theme'); // ライトモード
await wait(2500);

// 練習文の切り替え
await page.selectOption('#preset-select', '1');
await wait(1500);
await page.selectOption('#time-limit-select', '30');
await wait(1000);

// 打ち進めて、時間切れで結果を出す
await page.focus('#typing-input');
await typeIme(page, await ctx.newCDPSession(page), wait);
await page.waitForSelector('#result-modal.active', { timeout: 40000 });
await wait(3500);
await page.click('#btn-close-result');
await wait(800);

// 履歴と苦手の分析
await page.click('#btn-history');
await wait(3500);
await page.evaluate(() => document.querySelector('.history-wrap').scrollTo({ top: 1e5, behavior: 'smooth' }));
await wait(3500);
await ctx.close();
await browser.close();

// webm を MP4（H.264）にする。GitHub の添付は 10 MB まで
const webm = readdirSync(OUT).find(f => f.endsWith('.webm'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${OUT}/${webm}`,
  '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  `${OUT}/demo.mp4`]);
rmSync(`${OUT}/${webm}`);
console.log(`${OUT}/demo.mp4`);
