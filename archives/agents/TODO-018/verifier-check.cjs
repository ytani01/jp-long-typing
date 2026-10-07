const { chromium } = require('playwright');
const OUT = __dirname;
const KEY = 'jp-long-typing-history';
(async()=>{
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
p.on('pageerror', e=>console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/');
const hist = () => p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'), KEY);
const custom = (title, text) => p.evaluate(([t,x])=>{ app.dom.customTitleInput.value=t; app.dom.customTextarea.value=x; app.applyCustomText(); }, [title,text]);
const type = async s => { await p.focus('#typing-input').catch(()=>{}); await p.evaluate(()=>app.dom.typingInput.focus()); await p.keyboard.insertText(s); };
const modal = () => p.evaluate(()=>({title:app.dom.resModalTitle.textContent, rank:app.dom.resRank.textContent,time:app.dom.resTime.textContent,cpm:app.dom.resCpm.textContent,chars:app.dom.resChars.textContent,acc:app.dom.resAccuracy.textContent,active:app.dom.resultModal.classList.contains('active')}));
await p.evaluate(k=>localStorage.removeItem(k), KEY); await p.reload();

// 1
await p.evaluate(()=>{app.timeLimit=60;});
await custom('テストA','あいうえお');
await type('あいうえお');
await p.waitForTimeout(300);
console.log('1 modal', JSON.stringify(await modal()));
console.log('1 hist', JSON.stringify(await hist()));
await p.evaluate(()=>app.closeResultModal());
await p.evaluate(()=>app.openHistoryModal());
console.log('1 rows', JSON.stringify(await p.$$eval('#history-body tr', trs=>trs.map(t=>[...t.children].map(c=>c.textContent)))));
await p.evaluate(()=>app.closeHistoryModal());

// 2 time up (real timer, limit 1s)
await p.evaluate(()=>{app.timeLimit=1; app.restart();});
await type('あ'); await p.waitForTimeout(1700);
console.log('2 timeup modal', JSON.stringify(await modal()), 'n=', (await hist()).length);
await p.evaluate(()=>app.closeResultModal());
const n2 = (await hist()).length;
// reset midway
await p.evaluate(()=>{app.timeLimit=60; app.restart();});
await type('あ'); await p.evaluate(()=>app.restart()); await p.waitForTimeout(300);
console.log('2 reset n before/after', n2, (await hist()).length);

// 3 double finish
await p.evaluate(()=>{app.timeLimit=30; app.restart(); app.ensureTimerStarted(); clearInterval(app.timerInterval); app.startTime=Date.now()-31000; app.dom.typingInput.value=app.cleanText.replace(/\n/g,''); });
const before=(await hist()).length;
await p.evaluate(()=>app.handleInputCommit());
const h3=await hist();
console.log('3 added', h3.length-before, 'last', JSON.stringify(h3[h3.length-1]), 'title', (await modal()).title);
await p.evaluate(()=>app.closeResultModal());

// 4 delete middle
await p.evaluate(k=>{localStorage.setItem(k, JSON.stringify([1,2,3].map(i=>({date:Date.now()+i*1000,title:'T'+i,timeLimit:60,rank:'C',time:'00:0'+i,cpm:i,chars:i,accuracy:100}))))}, KEY);
await p.evaluate(()=>app.openHistoryModal());
console.log('4 before', JSON.stringify(await p.$$eval('#history-body tr', t=>t.map(r=>r.children[1].textContent))));
await p.click('#history-body tr:nth-child(2) button');
console.log('4 after table', JSON.stringify(await p.$$eval('#history-body tr', t=>t.map(r=>r.children[1].textContent))), 'ls', JSON.stringify((await hist()).map(x=>x.title)));
await p.evaluate(()=>app.closeHistoryModal());

// 5 history open at timeup
await p.evaluate(()=>{app.timeLimit=1; app.restart();});
await type('あ');
await p.click('#btn-history');
console.log('5 hist active before', await p.evaluate(()=>app.dom.historyModal.classList.contains('active')));
await p.waitForTimeout(1700);
console.log('5 after', JSON.stringify(await p.evaluate(()=>({hist:app.dom.historyModal.classList.contains('active'),res:app.dom.resultModal.classList.contains('active')}))));
await p.evaluate(()=>app.closeResultModal());

// 6 broken
for (const v of ['{bad','[null]','[1,null,"x",{"title":"ok","date":1}]','{"a":1}']) {
  const r = await p.evaluate(([k,v])=>{localStorage.setItem(k,v); let e=null; try{app.openHistoryModal()}catch(x){e=String(x)} const o={e,active:app.dom.historyModal.classList.contains('active'),rows:app.dom.historyBody.children.length}; app.closeHistoryModal(); return o;},[KEY,v]);
  console.log('6', v, JSON.stringify(r));
}

// 7 XSS
await p.evaluate(k=>localStorage.removeItem(k), KEY);
window_dialog = 0; p.on('dialog', d=>{console.log('DIALOG', d.message()); d.dismiss();});
await p.evaluate(()=>{app.timeLimit=60;});
await custom('<img src=x onerror=alert(1)>','あ');
await type('あ'); await p.waitForTimeout(300);
await p.evaluate(()=>{app.closeResultModal(); app.openHistoryModal();});
console.log('7 cell', JSON.stringify(await p.$eval('#history-body tr td.history-title', e=>({text:e.textContent, imgs:e.querySelectorAll('img').length}))), 'imgs in table', await p.$$eval('#history-body img', e=>e.length));
await p.evaluate(()=>app.closeHistoryModal());

// 8 screenshots
const rows = Array.from({length:30},(_,i)=>({date:Date.now()-i*3600e3,title:'吾輩は猫である '+i,timeLimit:[0,30,60,300][i%4],rank:['SS','S','A','B','C'][i%5],time:'01:2'+(i%10),cpm:100+i,chars:200+i,accuracy:90+(i%10)}));
for (const [w,h] of [[1280,800],[390,800]]) for (const th of ['dark','light']) {
  await p.setViewportSize({width:w,height:h});
  await p.evaluate(([k,rows,th])=>{localStorage.setItem(k,JSON.stringify(rows)); document.body.setAttribute('data-theme',th); app.openHistoryModal();},[KEY,rows,th]);
  await p.waitForTimeout(200);
  await p.evaluate(()=>{document.querySelector('.history-wrap').scrollTop=150;});
  await p.screenshot({path:`${OUT}/verifier-history-${w}-${th}.png`});
  console.log('8',w,th, JSON.stringify(await p.evaluate(()=>{const w=document.querySelector('.history-wrap'),c=document.querySelector('.history-card').getBoundingClientRect();return{theme:document.body.dataset.theme,scrollW:w.scrollWidth,clientW:w.clientWidth,card:[c.left,c.right],vw:innerWidth,docScrollW:document.documentElement.scrollWidth}})));
  await p.evaluate(()=>app.closeHistoryModal());
}
await b.close();
})();
