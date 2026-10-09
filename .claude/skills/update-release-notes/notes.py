#!/usr/bin/env python3
"""update-release-notes の取得・埋め込み・確認（TODO-031）。訳は Claude が書く。

  notes.py fetch WORK.json   新しい 3 日分・3 版を取得して WORK.json に書く
  notes.py apply WORK.json   WORK.json の訳を index.html に埋め込む
  notes.py check             index.html を配信して Playwright で確かめる
"""
import datetime
import json
import re
import socket
import subprocess
import time
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INDEX = ROOT / 'index.html'
LAST = Path(__file__).with_name('last-source.json')
NOTES_URL = 'https://platform.claude.com/docs/en/release-notes/overview.md'
CODE_URL = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md'
PLAYWRIGHT = '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs'
CONSTS = {'notes': 'CLAUDE_NOTES', 'code': 'CLAUDE_CODE_JA'}
AUTHORS = {'notes': 'Claude Platform リリースノート', 'code': 'Claude Code CHANGELOG'}
ITEM = re.compile(r'^[*-] (.*)')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
DATE = re.compile(r'(%s) (\d{1,2})(?:st|nd|rd|th)?, (\d{4})$' % '|'.join(MONTHS))


def get(url):
    # urllib の既定の User-Agent だと platform.claude.com が 403 を返す
    return subprocess.run(['curl', '-sfL', '--max-time', '30', url], capture_output=True, text=True, check=True).stdout


def parse_notes(md):
    """日付ごとにまとめた項目（同じ日付の見出しが続くことがある）。新しい順に 3 日分。"""
    days = {}
    cur = None
    for line in md.splitlines():
        if line.startswith('### '):
            m = DATE.match(line[4:].strip())
            if not m:
                sys.exit(f'日付の見出しとして読めない: {line}')
            title = f'{m.group(3)}年{MONTHS.index(m.group(1)) + 1}月{int(m.group(2))}日の更新'
            if title not in days and len(days) == 3:
                break
            cur = days.setdefault(title, [])
        elif cur is not None and (m := ITEM.match(line)):
            cur.append(m.group(1))
    return [{'title': t, 'en': items} for t, items in days.items()]


def parse_code(md):
    """新しい 3 版。各版は先頭 8 項目まで。"""
    vers = []
    for line in md.splitlines():
        if line.startswith('## '):
            if len(vers) == 3:
                break
            vers.append({'title': f'Claude Code {line[3:].strip()}（日本語）', 'en': []})
        elif vers and (m := ITEM.match(line)) and len(vers[-1]['en']) < 8:
            vers[-1]['en'].append(m.group(1))
    return vers


def block(src, kind):
    m = re.search(r'    const %s = (\[.*?\n    \]);' % CONSTS[kind], src, re.S)
    if not m:
        sys.exit(f'index.html に const {CONSTS[kind]} が見つからない')
    return m


def current(src, kind):
    return {o['title']: o['text'] for o in json.loads(block(src, kind).group(1))}


def fetch(work):
    src = INDEX.read_text(encoding='utf-8')
    last = json.loads(LAST.read_text(encoding='utf-8')) if LAST.exists() else {}
    out = {'notes': parse_notes(get(NOTES_URL)), 'code': parse_code(get(CODE_URL))}
    # 元の Markdown の書式が変わって読めなくなったとき、「変更なし」で黙って終わらないように
    for kind, entries in out.items():
        if len(entries) != 3 or not all(e['en'] for e in entries):
            sys.exit(f'{CONSTS[kind]}: 3 つ読めない、または項目が 0 件のものがある（書式が変わったかも）: '
                     + ', '.join(f"{e['title']}（{len(e['en'])}）" for e in entries))
    todo = 0
    for kind, entries in out.items():
        cur = current(src, kind)
        prev = {e['title']: e['en'] for e in last.get(kind, [])}
        for e in entries:
            if e['title'] in cur and prev.get(e['title']) == e['en']:
                e['status'] = 'same'
            else:
                e['status'] = 'changed' if e['title'] in cur else 'new'
                e['ja'] = []
                todo += 1
            print(f"{e['status']:8} {e['title']}（{len(e['en'])} 項目）")
        if [e['title'] for e in entries] == list(cur) and all(e['status'] == 'same' for e in entries):
            print(f'{CONSTS[kind]}: 変更なし')
    Path(work).write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'訳すもの: {todo} 件 → {work} の "ja" に 1 項目 1 要素で書く' if todo else '変更なし')


def dump(entries):
    return '[\n' + ',\n'.join(
        '      {\n' + ',\n'.join(f'        {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in o.items())
        + '\n      }' for o in entries) + '\n    ]'


def apply(work):
    data = json.loads(Path(work).read_text(encoding='utf-8'))
    src = INDEX.read_text(encoding='utf-8')
    bad = []
    today = datetime.date.today().isoformat()
    for kind in CONSTS:
        cur = current(src, kind)
        objs = []
        for e in data[kind]:
            if e['status'] == 'same':
                text = cur[e['title']]
            else:
                ja = [s.strip() for s in e.get('ja', [])]
                if len(ja) != len(e['en']) or not all(ja) or any('\n' in s for s in ja):
                    bad.append(f"{e['title']}: 英語 {len(e['en'])} 項目に対し訳 {len(ja)} 項目（空や改行も不可）")
                text = '\n'.join(ja)
            objs.append({'title': e['title'], 'author': AUTHORS[kind], 'text': text})
        m = block(src, kind)
        src = src[:m.start(1)] + dump(objs) + src[m.end(1):]
        # 日付のコメントは、変わった側だけ直す
        if any(e['status'] != 'same' for e in data[kind]):
            src = re.sub(r'(// update-release-notes skill が書き換える（)\d{4}-\d{2}-\d{2}(.*\n    const %s = )' % CONSTS[kind],
                         rf'\g<1>{today}\g<2>', src)
    if bad:
        sys.exit('\n'.join(bad))
    INDEX.write_text(src, encoding='utf-8')
    last = {k: [{'title': e['title'], 'en': e['en']} for e in data[k]] for k in CONSTS}
    LAST.write_text(json.dumps(last, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'index.html と {LAST.name} を書き換えた（{today} 時点）')


CHECK_JS = r"""
import { chromium } from '%s';
const [url, notes, code] = [process.argv[1], JSON.parse(process.argv[2]), JSON.parse(process.argv[3])];
const strip = s => s.replace(/\s/g, '');
const fails = [], errs = [];
const b = await chromium.launch(); const p = await b.newPage();
p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
await p.goto(url);
await p.waitForFunction(() => document.querySelector('#preset-select option[value="claude-code"]'));
const opts = await p.$$eval('#preset-select option', os => os.map(o => [o.value, o.textContent]));
const vals = opts.map(o => o[0]);
if (notes.length !== 3) fails.push(`CLAUDE_NOTES が ${notes.length} 件（3 件のはず）`);
if (code.length !== 3) fails.push(`CLAUDE_CODE_JA が ${code.length} 件（3 件のはず）`);
const nDays = vals.filter(v => /^claude-\d+$/.test(v)).length, nJa = vals.filter(v => /^code-ja-/.test(v)).length;
if (nDays !== 3 || nJa !== 3) fails.push(`選択欄の日付が ${nDays} 個、（日本語）が ${nJa} 個（3 個ずつのはず）`);
notes.forEach((n, i) => { if (!opts.some(o => o[0] === `claude-${i}` && o[1] === `・${n.title}`)) fails.push(`選択欄に ・${n.title} が無い`); });
const at = vals.indexOf('claude-code');
code.forEach((c, i) => { const o = opts[at + 1 + i]; if (!o || o[0] !== `code-ja-${i}` || o[1] !== `・${c.title}`) fails.push(`（英語）の後の ${i + 1} 番目が ・${c.title} でない`); });
const shown = async v => { await p.selectOption('#preset-select', v); await p.waitForTimeout(500); return strip(await p.evaluate(() => document.body.innerText)); };
let t = await shown('code-ja-0');
if (!t.includes(strip(code[0].text.split('\n')[0]))) fails.push(`${code[0].title} を選んでも訳が出ない`);
t = await shown('claude-summary');
notes.forEach(n => { if (!t.includes(strip(`【${n.title}】${n.text.split('\n')[0]}`))) fails.push(`まとめに 【${n.title}】本文 が無い`); });
if (code.some(c => t.includes(strip(c.text.split('\n')[0])))) fails.push('まとめに CHANGELOG が入っている');
await b.close();
errs.forEach(e => fails.push(`コンソールのエラー: ${e}`));
console.log(fails.length ? fails.join('\n') : 'OK: 選択欄・訳の表示・まとめ・コンソール');
process.exit(fails.length ? 1 : 0);
""" % PLAYWRIGHT


def check():
    src = INDEX.read_text(encoding='utf-8')
    notes = [{'title': t, 'text': x} for t, x in current(src, 'notes').items()]
    code = [{'title': t, 'text': x} for t, x in current(src, 'code').items()]
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '-b', '127.0.0.1', '-d', str(ROOT)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                socket.create_connection(('127.0.0.1', port), timeout=0.1).close()
                break
            except OSError:
                time.sleep(0.1)
        r = subprocess.run(['node', '--input-type=module', '-e', CHECK_JS, f'http://127.0.0.1:{port}/',
                            json.dumps(notes, ensure_ascii=False), json.dumps(code, ensure_ascii=False)], timeout=120)
    finally:
        server.terminate()
        server.wait()
    sys.exit(r.returncode)


if __name__ == '__main__':
    cmd = sys.argv[1:2]
    if cmd == ['fetch'] and len(sys.argv) == 3:
        fetch(sys.argv[2])
    elif cmd == ['apply'] and len(sys.argv) == 3:
        apply(sys.argv[2])
    elif cmd == ['check'] and len(sys.argv) == 2:
        check()
    else:
        sys.exit(__doc__)
