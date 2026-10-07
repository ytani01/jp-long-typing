import { chromium } from '/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const K='jp-long-typing-history';
const pe=[], ce=[];
async function mk(vp){ const ctx=await b.newContext({viewport:vp||{width:1280,height:900}}); const page=await ctx.newPage();
  page.on('pageerror',e=>pe.push(e.message)); page.on('console',m=>{if(m.type()==='error')ce.push(m.text());});
  await page.goto('http://localhost:8080/',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1500); return page; }
const hist = p => p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]'),K);
const rec = (o={}) => ({date:Date.now(),title:'t',timeLimit:0,rank:'C',time:'00:10',cpm:200,chars:100,accuracy:95,...o});

// 1
{ const page=await mk();
  await page.selectOption('#time-limit-select','0');
  await page.selectOption('#preset-select','custom'); 
  await page.fill('#custom-textarea','ひらがなカタカナ漢字ABC「」。');
  await page.click('#btn-apply-custom'); await page.waitForTimeout(300);
  console.log('1 cleanText', await page.evaluate(()=>JSON.stringify(app.cleanText)));
  await page.focus('#typing-input');
  await page.keyboard.insertText('ひらが'); await page.waitForTimeout(100);
  await page.keyboard.insertText('X'); await page.waitForTimeout(100);
  await page.fill('#typing-input',''); 
  await page.keyboard.insertText('な'); await page.waitForTimeout(2000);
  await page.keyboard.insertText('カタカナ'); await page.waitForTimeout(100);
  for (const s of ['漢字','ABC','「」。']) { await page.keyboard.insertText(s); await page.waitForTimeout(100); }
  await page.waitForTimeout(300);
  const h=await hist(page); const last=h[h.length-1];
  console.log('1 last', JSON.stringify(last));
  console.log('1 sum n', Object.values(last.kinds).reduce((t,k)=>t+k.n,0), 'keys', Object.keys(last.kinds).join(','));
  console.log('1 modal', await page.evaluate(()=>document.getElementById('res-modal-title').textContent));
  await page.context().close(); }

// 2
{ const page=await mk();
  await page.selectOption('#time-limit-select','30');
  await page.focus('#typing-input'); await page.keyboard.down('a'); await page.keyboard.up('a');
  await page.evaluate(()=>{ app.ensureTimerStarted(); });
  console.log('2 startTime set', await page.evaluate(()=>!!app.startTime));
  // advance clock: shift startTime back 31s, timer tick (250ms) triggers finish(true)
  await page.evaluate(()=>{ app.startTime -= 31000; });
  await page.waitForTimeout(800);
  console.log('2 title', await page.evaluate(()=>document.getElementById('res-modal-title').textContent));
  const h=await hist(page); console.log('2 saved', JSON.stringify(h));
  console.log('2 has NaN/null', /NaN|null/.test(JSON.stringify(h)));
  await page.evaluate(()=>app.closeResultModal());
  await page.click('#btn-history'); await page.waitForTimeout(300);
  console.log('2 analysis', JSON.stringify(await page.evaluate(()=>document.getElementById('history-analysis').innerText)));
  await page.context().close(); }

// 3
const mk12 = (over) => { const out=[]; for(let i=0;i<12;i++){
  const old=i<7; // first 7 old, last 5 recent; cpm: indexes 2..6 = prior 5, 7..11 = recent 5
  const prior = i>=2&&i<7;
  out.push(rec({cpm: i<7?200:240, chars:100, kinds:{
    'ひらがな':{n:200,ms:200*200,miss:2}, 'カタカナ':{n:50,ms:50*600,miss:1},'漢字':{n:50,ms:50*200,miss:15},'英数字':{n:20,ms:20*200,miss:0},'記号':{n:10,ms:10*200,miss:0}},
    miss:{'漢':[5,'この漢字を'],'あ':[1,'xあy']}, slow:[['カタカナ',600]], ...(over&&over(i))})); } return out; };
const scan = t => /Infinity|NaN|undefined|null/.test(t);
{ const page=await mk();
  await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,mk12()]);
  await page.click('#btn-history'); await page.waitForTimeout(300);
  const lis=await page.evaluate(()=>[...document.querySelectorAll('#history-analysis li')].map(l=>l.textContent));
  console.log('3 lis', JSON.stringify(lis,null,1)); console.log('3 bad text', scan(await page.evaluate(()=>document.getElementById('history-analysis').innerText)));
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'/home/ytani/work/jp-long-typing/archives/agents/TODO-021/history.png'});
  await page.close();
  const p2=await mk(); 
  await p2.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,mk12(i=>i>=2&&i<7?{cpm:0,chars:0}:{})]);
  await p2.click('#btn-history'); await p2.waitForTimeout(300);
  const t2=await p2.evaluate(()=>document.getElementById('history-analysis').innerText);
  console.log('3b bad', scan(t2), JSON.stringify(t2.split('\n').filter(l=>/CPM/.test(l))));
  // all zero chars
  await p2.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,mk12(i=>({cpm:0,chars:0}))]);
  for (const [nm,fn] of [['allzero',i=>({cpm:0,chars:0})],['prior cpm0 chars100',i=>i>=2&&i<7?{cpm:0}:{}]]) {
    await p2.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,mk12(fn)]);
    await p2.evaluate(()=>app.openHistoryModal());
    const t=await p2.evaluate(()=>document.getElementById('history-analysis').innerText);
    console.log('3c',nm,'bad',scan(t),JSON.stringify(t.split('\n').filter(l=>/CPM|苦手/.test(l))));
  }
  await p2.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,mk12(i=>({slow:[['カタカナ',400+i*50],['ほげ',300]]}))]);
  await p2.evaluate(()=>app.openHistoryModal());
  console.log('3d slow list', JSON.stringify(await p2.evaluate(()=>{const h=[...document.querySelectorAll('#history-analysis h4')].find(x=>x.textContent==='詰まった語'); return h.parentElement.innerText;})));
  await p2.context().close(); }

// 4
{ const page=await mk();
  const h25=[]; for(let i=0;i<25;i++) h25.push(rec({kinds:{'漢字':{n:5,ms:500,miss:0}},miss:{'漢':[1,'x']},slow:[['ab',500]]}));
  await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[K,h25]);
  await page.selectOption('#time-limit-select','0');
  await page.selectOption('#preset-select','custom'); await page.fill('#custom-textarea','あい'); await page.click('#btn-apply-custom'); await page.waitForTimeout(300);
  await page.focus('#typing-input'); await page.keyboard.insertText('あい'); await page.waitForTimeout(500);
  const h=await hist(page);
  console.log('4 len', h.length, 'withKinds idx', JSON.stringify(h.map((r,i)=>r.kinds?i:-1).filter(i=>i>=0)), 'withMiss/slow old', h.slice(0,6).some(r=>r.miss||r.slow));
  const kn = await page.evaluate(()=>{ const f='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめも'; app.stats={kinds:{'ひらがな':{n:1,ms:1,miss:0}},miss:{},chunks:[]}; [...f].slice(0,25).forEach((c,i)=>app.stats.miss[c]=[i+1,'ctx']); const s=app.statsForHistory(); return {n:Object.keys(s.miss).length, minCount:Math.min(...Object.values(s.miss).map(v=>v[0])), has1:!!s.miss['あ']}; });
  console.log('4 miss cap', JSON.stringify(kn));
  await page.context().close(); }

// 5
{ const page=await mk();
  console.log('5', JSON.stringify(await page.evaluate(()=>Object.fromEntries('あ ア ｱ ・ ー 漢 々 〇 A ａ 1 「 。'.split(' ').map(c=>[c,charKind(c)])))));
  await page.context().close(); }
console.log('6 pageerrors', pe.length, JSON.stringify(pe), 'console errors', ce.length, JSON.stringify(ce.map(s=>s.slice(0,100))));
await b.close();
