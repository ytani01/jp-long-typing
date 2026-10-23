#!/usr/bin/env python3
"""update-release-notes の取得・訳・埋め込み・確認（TODO-031、TODO-032）。

  notes.py run [--by claude|google] WORK.json        fetch → translate → apply → check を続けて行う
  notes.py fetch WORK.json                           新しい 3 日分・3 版を取得して WORK.json に書く
  notes.py translate [--by claude|google] WORK.json  changed / new の en を訳して ja に書く（既定は claude）
  notes.py apply WORK.json                           WORK.json の訳を index.html に埋め込む
  notes.py check                                     index.html を配信して Playwright で確かめる
"""
import argparse
import datetime
import json
import re
import socket
import subprocess
import tempfile
import time
import urllib.parse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INDEX = ROOT / 'index.html'
LAST = Path(__file__).resolve().with_name('last-source.json')
NOTES_URL = 'https://platform.claude.com/docs/en/release-notes/overview.md'
CODE_URL = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md'
PLAYWRIGHT = '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs'
CONSTS = {'notes': 'CLAUDE_NOTES', 'code': 'CLAUDE_CODE_JA'}
AUTHORS = {'notes': 'Claude Platform リリースノート', 'code': 'Claude Code CHANGELOG'}
ITEM = re.compile(r'^[*-] (.*)')
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
# 非公式の口。translate.googleapis.com（client=gtx）は 429 で止められた（TODO-032）
GOOGLE_URL = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=ja&'
RULES = """\
- en の 1 項目を ja の 1 要素にし、数と並びを揃える
- 項目の中では改行しない
- Markdown の記法は残さない。リンクは表示の文字だけにし、** やバッククォートは外す（claude-haiku-5-5 のような識別子そのものは残す）
- 自然な日本語の「です・ます」調にする。モデル名、API・パラメーター名、エラーコード、製品名（Claude Managed Agents など）は訳さない
- 価格の $0.10 USD のような書き方は原文のまま残す
- 練習文として打つので、< > { } のような打ちにくい記号は、原文にあるときだけ残す（足さない）
"""
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
    print(f'訳すもの: {todo} 件 → {work}' if todo else '変更なし')
    return todo


def unmd(s):
    """Markdown のリンクを表示の文字だけにし、** を外す。"""
    return re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s).replace('**', '')


def plain(s):
    return unmd(s).replace('`', '')


def by_google(entries):
    out = []
    for e in entries:
        # バッククォートは残して送る（中の識別子が訳されない）
        q = '&'.join('q=' + urllib.parse.quote(unmd(s)) for s in e['en'])
        try:
            ja = json.loads(get(GOOGLE_URL + q))
        except (subprocess.CalledProcessError, json.JSONDecodeError) as x:
            sys.exit(f"Google 翻訳に失敗した（{e['title']}）: {x}")
        out.append(ja)
    return out


def by_claude(entries):
    prompt = ('次の JSON の各要素の en（英語の項目の並び）を日本語に訳してください。'
              'タイピング練習の文として使います。訳し方の決まり:\n' + RULES +
              '\n要素ごとに訳の文字列の配列を作り、その配列の配列（JSON）だけを出力してください。'
              '前置きやコードブロックは付けないでください。ツールは使わないでください。\n\n'
              + json.dumps([{'title': e['title'], 'en': e['en']} for e in entries], ensure_ascii=False, indent=1))
    # プロジェクトの CLAUDE.md やフックを読み込ませないよう、空のディレクトリで起動する
    with tempfile.TemporaryDirectory() as d:
        r = subprocess.run(['claude', '-p', prompt], capture_output=True, text=True, cwd=d, timeout=900)
    if r.returncode:
        sys.exit(f'claude -p に失敗した: {r.stderr.strip() or r.stdout.strip()}')
    out = r.stdout.strip()
    try:
        return json.loads(out[out.index('['):out.rindex(']') + 1])
    except ValueError:
        sys.exit(f'claude -p の応答が JSON として読めない: {out[:300]}')


def translate(work, by):
    data = json.loads(Path(work).read_text(encoding='utf-8'))
    entries = [e for k in CONSTS for e in data[k] if e['status'] != 'same']
    if not entries:
        print('訳すものは無い')
        return
    print(f'{len(entries)} 件を {by} で訳す')
    res = by_google(entries) if by == 'google' else by_claude(entries)
    # 1 つでも数が合わなければ、何も書かずに止める
    ok = isinstance(res, list) and len(res) == len(entries) and all(
        isinstance(ja, list) and len(ja) == len(e['en']) and all(isinstance(s, str) and s.strip() for s in ja)
        for e, ja in zip(entries, res))
    if not ok:
        sys.exit(f'訳の形が違う（数が英語と合わない、空や文字列でないものがある）: {str(res)[:300]}')
    for e, ja in zip(entries, res):
        e['ja'] = [' '.join(plain(s).split()) for s in ja]
    Path(work).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{work} に訳を書いた')


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
// NHK ニュースの取得（api.rss2json.com）の失敗は、内蔵のニュースで動くので数えない（TODO-034）
const nhk = m => [m.text(), m.location().url].some(s => s.includes('api.rss2json.com'));
p.on('console', m => m.type() === 'error' && !nhk(m) && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
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
    ap = argparse.ArgumentParser(usage=__doc__)
    ap.add_argument('cmd', choices=['run', 'fetch', 'translate', 'apply', 'check'])
    ap.add_argument('--by', choices=['claude', 'google'], default='claude')
    ap.add_argument('work', nargs='?')
    a = ap.parse_args()
    if (a.work is None) != (a.cmd == 'check'):
        ap.error('check 以外は WORK.json を 1 つ渡す' if a.work is None else 'check は WORK.json を取らない')
    if a.cmd == 'run':
        if fetch(a.work):
            translate(a.work, a.by)
            apply(a.work)
            check()
    elif a.cmd == 'translate':
        translate(a.work, a.by)
    elif a.cmd == 'fetch':
        fetch(a.work)
    elif a.cmd == 'apply':
        apply(a.work)
    else:
        check()
