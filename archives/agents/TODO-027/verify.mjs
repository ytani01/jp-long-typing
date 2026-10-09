import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';

const log = (k, v) => console.log(k + ': ' + JSON.stringify(v));
const browser = await chromium.launch();
const errs = [];

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror ' + e.message));
  page.on('dialog', d => { log('dialog', d.message().slice(0, 60)); d.dismiss(); });
  await page.goto('http://localhost:8080/');
  await page.waitForTimeout(800);
  return page;
}

const state = page => page.evaluate(() => ({
  progress: document.getElementById('stat-progress').textContent,
  value: document.getElementById('typing-input').value,
  focus: document.activeElement.id,
  active: ['result-modal', 'custom-modal', 'history-modal']
    .filter(id => document.getElementById(id).classList.contains('active')),
}));

const firstChars = page => page.evaluate(() => document.getElementById('text-display').textContent.trim().slice(0, 3));

// 1. 3 つのモーダルをそれぞれ Esc で閉じる（開き方は app のメソッド）
{
  const page = await newPage();
  await page.evaluate(() => app.openCustomModal());
  log('1 custom open', await state(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('1 custom after Esc', await state(page));

  await page.evaluate(() => app.openHistoryModal());
  log('1 history open', await state(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('1 history after Esc', await state(page));

  // 結果モーダルは finish() で開く（先に数字入れる）
  const f = await firstChars(page);
  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  await page.evaluate(() => app.finish());
  log("finish focus", await state(page));
  await page.focus("#typing-input");
  await page.waitForTimeout(300);
  log('1 result open', await state(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('1 result after Esc', await state(page));
  await page.close();
}

// 2. 入力後に結果を開き、フォーカスは入力欄のまま Esc → 閉じ、入力はリセットされない
{
  const page = await newPage();
  const f = await firstChars(page);
  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  await page.evaluate(() => app.finish());
  log("finish focus", await state(page));
  await page.focus("#typing-input");
  await page.waitForTimeout(300);
  log('2 before Esc (result open)', await state(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  log('2 after Esc', await state(page));
  await page.close();
}

// 3. 自作テキスト・履歴を Esc で閉じたあとフォーカスが #typing-input に戻るか
// （1 で既に取った値も含めて、ここでは別ページで再確認）
{
  const page = await newPage();
  await page.evaluate(() => app.openCustomModal());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('3 custom focus after Esc', await state(page));
  await page.evaluate(() => app.openHistoryModal());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('3 history focus after Esc', await state(page));
  await page.close();
}

// 4. 変換中の Esc（isComposing / keyCode 229）では自作テキストは閉じない
{
  const page = await newPage();
  const f = await firstChars(page);
  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  await page.evaluate(() => app.openCustomModal());
  await page.waitForTimeout(100);
  log('4 before composing Esc', await state(page));
  await page.evaluate(() => {
    const ta = document.getElementById('custom-textarea') || document.querySelector('#custom-modal textarea');
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(200);
  log('4 after isComposing Esc', await state(page));
  await page.evaluate(() => {
    const ta = document.querySelector('#custom-modal textarea');
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { value: 229 });
    ta.dispatchEvent(ev);
  });
  await page.waitForTimeout(200);
  log('4 after keyCode229 Esc', await state(page));
  // 比較: 変換中でない Esc は閉じる
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('4 after normal Esc', await state(page));
  await page.close();
}

// 5. モーダルが無いときの入力欄の Esc はリセット。repeat: true の Esc はリセットしない
{
  const page = await newPage();
  const f = await firstChars(page);
  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  log('5 typed', await state(page));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  log('5 after normal Esc (expect reset)', await state(page));

  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  log('5 typed again', await state(page));
  await page.evaluate(() => {
    const ev = new KeyboardEvent('keydown', { key: 'Escape', repeat: true, bubbles: true, cancelable: true });
    document.getElementById('typing-input').dispatchEvent(ev);
  });
  await page.waitForTimeout(300);
  log('5 after repeat Esc (expect not reset)', await state(page));
  await page.close();
}

// 6. 結果は閉じるだけで、もう一度（再スタート）にならない
{
  const page = await newPage();
  const f = await firstChars(page);
  await page.click('#typing-input');
  await page.keyboard.insertText(f);
  await page.waitForTimeout(200);
  await page.evaluate(() => app.finish());
  log("finish focus", await state(page));
  await page.focus("#typing-input");
  await page.waitForTimeout(300);
  const before = await state(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const after = await state(page);
  log('6 before', before);
  log('6 after', after);
  log('6 unchanged except active', { progressSame: before.progress === after.progress, valueSame: before.value === after.value, resultClosed: !after.active.includes('result-modal') });
  await page.close();
}

log('9 console/page errors', errs);
await browser.close();
