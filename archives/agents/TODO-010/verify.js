const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const items = [
  { title: 'タイトルa', description: '一文目。二文目の途中…' },
  { title: 'タイトルb', description: '句点なしで切れる要約…' },
  { title: 'タイトルc', description: '一文目。途中...' },
  { title: 'タイトルd', description: '全文です。' },
];
const mock = (delay = 0) => p => p.route('**/api.rss2json.com/**', async r => {
  if (delay) await sleep(delay);
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok', items }) });
});
async function run(name, setup, fn) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.dismiss());
  const real = []; p.on('response', r => { if (r.url().includes('rss2json')) real.push(r.status()); });
  await setup(p);
  await p.goto('http://localhost:8080/');
  console.log('=== ' + name);
  await fn(p, real);
  console.log('pageerror:', JSON.stringify(errs));
  await b.close();
}
const opts = p => p.$$eval('#optgroup-news option', os => os.map(o => o.value + ' | ' + o.textContent));
const ft = p => p.evaluate(() => app.fullText);
(async () => {
  await run('1 real', async () => {}, async (p, real) => {
    await sleep(6000);
    console.log('rss2json responses:', real, 'options:', JSON.stringify(await opts(p)));
    await p.selectOption('#preset-select', 'news-summary'); await sleep(300);
    const t = await ft(p); console.log('has …:', t.includes('…'), 'has ...:', t.includes('...')); console.log(t);
    await p.screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo-010.png' });
  });
  await run('2 mock a-d', mock(), async p => {
    await sleep(2500);
    await p.selectOption('#preset-select', 'news-summary'); await sleep(300);
    console.log(JSON.stringify(await ft(p))); console.log(JSON.stringify(await opts(p)));
  });
  await run('3 abort', p => p.route('**/api.rss2json.com/**', r => r.abort()), async p => {
    await sleep(2500);
    console.log(JSON.stringify(await opts(p)));
    await p.selectOption('#preset-select', 'news-summary'); await sleep(300);
    console.log('fullText head:', JSON.stringify((await ft(p)).slice(0, 60)), 'len', (await ft(p)).length);
  });
  await run('4 switch back + delayed', mock(3000), async p => {
    await sleep(300);
    await p.selectOption('#preset-select', '1'); await sleep(200);
    await p.selectOption('#preset-select', 'news-summary'); await sleep(300);
    const before = await ft(p); console.log('before fetch head:', JSON.stringify(before.slice(0, 40)), 'opens:', before.includes('【ニュース1】'));
    await sleep(4000);
    const after = await ft(p); console.log('after fetch:', JSON.stringify(after));
    console.log('changed:', before !== after, 'select:', await p.$eval('#preset-select', e => e.value));
  });
})();
