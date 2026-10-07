(async()=>{
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:8091/');
await p.evaluate(() => localStorage.clear());
await p.reload();
// 1) 最後の文字の確定と時間切れが同じ handleInputCommit で起きる場合
const r1 = await p.evaluate(() => {
  app.timeLimit = 30; app.restart();
  app.ensureTimerStarted();
  clearInterval(app.timerInterval); // 250ms タイマーより先に確定が来た状況を作る
  app.startTime = Date.now() - 31000;
  app.dom.typingInput.value = app.cleanText.replace(/\n/g, '');
  app.handleInputCommit();
  const h = JSON.parse(localStorage.getItem('jp-long-typing-history'));
  return { n: h.length, titles: h.map(x => x.time), modalTitle: app.dom.resModalTitle.textContent };
});
console.log('double finish:', JSON.stringify(r1));
// 2) 壊れた値: 配列に null
const r2 = await p.evaluate(() => {
  localStorage.setItem('jp-long-typing-history', '[null]');
  let err = null;
  try { app.openHistoryModal(); } catch (e) { err = String(e); }
  return { err, active: app.dom.historyModal.classList.contains('active') };
});
console.log('null entry:', JSON.stringify(r2));
// 3) 壊れた値: JSON でない / オブジェクト
for (const v of ['{bad', '{"a":1}']) {
  const r = await p.evaluate((v) => { localStorage.setItem('jp-long-typing-history', v); app.openHistoryModal(); const n = app.dom.historyBody.children.length; app.closeHistoryModal(); return n; }, v);
  console.log('value', v, 'rows', r);
}
await b.close();
})();
