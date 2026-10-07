const fs = require('fs');
const html = fs.readFileSync('/home/ytani/work/jp-long-typing/index.html', 'utf8');
const pick = (re) => { const m = html.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
const helpers = pick(/function isJapanese[\s\S]*?\n    }\n/) + pick(/const NO_LINE_START[^\n]*\n/) + pick(/function isWordSide[\s\S]*?\n    }\n/);
const body = pick(/renderText\(\) \{[\s\S]*?this\.updateCharClasses\(\);\n      \}/).replace(/^renderText\(\) \{/, '').replace(/\}$/, '');
class El {
  constructor(n) { this.nodeName = n.toUpperCase(); this.childNodes = []; this.className=''; this.style={}; this.dataset={}; this.textContent=''; this.parent=null;
    const self=this; this.classList={add:c=>{self.className+=' '+c}, contains:c=>self.className.split(' ').includes(c)}; }
  get lastChild() { return this.childNodes[this.childNodes.length-1] || null; }
  appendChild(c) { if (c.parent) c.parent.childNodes.splice(c.parent.childNodes.indexOf(c),1); c.parent=this; this.childNodes.push(c); return c; }
  replaceChild(n, o) { const i=this.childNodes.indexOf(o); this.childNodes[i]=n; n.parent=this; o.parent=null; return o; }
}
global.document = { createElement: n => new El(n), createDocumentFragment: () => new El('#frag') };
const render = new Function('isJapanese','isWordSide','NO_LINE_START', body);
eval(helpers.replace('const NO_LINE_START', 'var NO_LINE_START'));
function show(node) {
  if (node.nodeName === 'BR') return '<br>';
  if (node.classList.contains('word')) return '[' + node.childNodes.map(show).join('') + ']';
  return node.textContent === ' ' && node.classList.contains('linebreak') ? '⏎' : node.textContent;
}
function run(text) {
  const ctx = { cleanText: text, dom: { textDisplay: new El('div') }, updateCharClasses(){} };
  render.call(ctx, isJapanese, isWordSide, NO_LINE_START);
  const top = ctx.dom.textDisplay.childNodes[0].childNodes; // fragment appended
  const flat = []; (function walk(n){ for (const c of n.childNodes) { if (c.nodeName==='BR') continue; if (c.classList.contains('word')) walk(c); else flat.push(c);} })(ctx.dom.textDisplay.childNodes[0]);
  const ok = flat.length === text.length && flat.every((s,i)=>s===ctx.charElements[i] && +s.dataset.index===i) && ctx.charElements.length===text.length;
  console.log(JSON.stringify(text).padEnd(48), ok ? 'order-ok' : 'ORDER-NG', top.map(show).join(' | '));
}
for (const t of process.argv.slice(2)) run(JSON.parse('"' + t + '"'));
