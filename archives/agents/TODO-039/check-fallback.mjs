import fs from 'fs';
const html = fs.readFileSync('/home/ytani/work/jp-long-typing/index.html', 'utf8');
const m = html.match(/const FALLBACK_NHK_NEWS = (\[[\s\S]*?\n\s*\]);/);
const arr = eval(m[1]);
console.log('count =', arr.length);
let ok = true;
arr.forEach((it, i) => {
  const parts = it.text.split('\n');
  const head = parts[0];
  const shapeOk = (parts.length === 1 && head.endsWith('。')) || (parts.length === 2 && head.endsWith('。') && parts[1].length > 0);
  const titleOk = head === it.title + '。';
  if (!shapeOk || !titleOk) ok = false;
  console.log(i, JSON.stringify({title: it.title, shape: parts.length === 1 ? 'title只' : 'title+要約', shapeOk, titleOk, headLen: head.length, bodyLen: parts.slice(1).join('').length}));
});
console.log('ALL OK =', ok && arr.length === 6);
