const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(name, setup, fn) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  const reqs = []; p.on('response', r => { if (r.url().includes('ja.wikipedia.org')) reqs.push(r.status() + ' ' + decodeURIComponent(r.url()).match(/titles=([^&]*)/)[1]); });
  await setup(p);
  await p.goto('http://localhost:8080/'); await sleep(6000);
  console.log('=== ' + name);
  await fn(p, { errs, dialogs, reqs });
  console.log('pageerror:', JSON.stringify(errs));
  await b.close();
}
const opts = p => p.$$eval('#preset-select optgroup#optgroup-news option', os => os.map(o => o.value + ' | ' + o.textContent));
const label = p => p.$eval('#optgroup-news', e => e.label);
(async () => {
  await run('1 normal', async () => {}, async (p, c) => {
    console.log('label:', await label(p)); console.log((await opts(p)).join('\n')); console.log('resp:', c.reqs);
    await p.selectOption('#preset-select', 'news-summary'); await sleep(300);
    const t = await p.evaluate(() => app.fullText);
    console.log('starts:', t.slice(0, 40), '| startsOK', t.startsWith('【2026年10月6日の出来事】'));
    console.log('source-like lines /-\\S+$/m:', JSON.stringify(t.match(/-\S+$/mg)), ' NHK?', /NHK/.test(t));
    console.log('line ends sample:', t.split('\n').filter(Boolean).map(l => l.slice(-12)).join(' / '));
    await p.screenshot({ path: process.env.HOME + '/tmp/playwright-mcp/todo-010.png' });
    await p.selectOption('#preset-select', 'news-2'); await sleep(300);
    console.log('news-2:', (await p.evaluate(() => app.fullText)).slice(0, 80));
    console.log('btn title:', await p.getAttribute('#btn-fetch-news', 'title'));
  });
  await run('2 all abort', p => p.route('**/ja.wikipedia.org/**', r => r.abort()), async p => {
    console.log((await opts(p)).join('\n'));
  });
  await run('3 prev month abort', p => p.route('**/ja.wikipedia.org/**', r => decodeURIComponent(r.request().url()).includes('2026年9月') ? r.abort() : r.continue()), async (p, c) => {
    console.log((await opts(p)).join('\n')); console.log('resp:', c.reqs);
  });
  await run('4 refresh button', p => p.route('**/ja.wikipedia.org/**', r => r.abort()), async (p, c) => {
    await p.click('#btn-fetch-news'); await sleep(25000);
    console.log('dialogs:', JSON.stringify(c.dialogs));
  });
})();
