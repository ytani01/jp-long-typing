#!/usr/bin/env python3
"""update-release-notes の取得・訳・埋め込み・確認（TODO-031、TODO-032）。

  notes.py run [--by claude|google] WORK.json        fetch → translate → apply → nhk → check を続けて行う
  notes.py fetch WORK.json                           新しい 3 日分・3 版・3 件を取得して WORK.json に書く
  notes.py translate [--by claude|google] WORK.json  changed / new の en を訳して ja に書く（既定は claude）
  notes.py apply WORK.json                           WORK.json の訳・英語版・配信日時を index.html に埋め込む
  notes.py nhk                                       NHK ニュースの最新 6 件を FALLBACK_NHK_NEWS に埋め込む（訳さない）
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
import xml.etree.ElementTree as ET
from datetime import timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INDEX = ROOT / 'index.html'
LAST = Path(__file__).resolve().with_name('last-source.json')
NOTES_URL = 'https://platform.claude.com/docs/en/release-notes/overview.md'
CODE_URL = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md'
# 版ごとの日付は CHANGELOG に無いので、GitHub のリリース日時を使う（TODO-041）
RELEASES_URL = 'https://api.github.com/repos/anthropics/claude-code/releases?per_page=10'
PLAYWRIGHT = '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs'
CACHY_RSS = 'https://cachyos.org/rss.xml'
CACHY_POST = 'https://raw.githubusercontent.com/CachyOS/website/master/src/content/post/%s.md'
NHK_RSS = 'https://www.nhk.or.jp/rss/news/cat0.xml'
JST = timezone(timedelta(hours=9))
NHK_CONST = 'FALLBACK_NHK_NEWS'  # 訳さないので CONSTS には入れない（TODO-039）
CONSTS = {'notes': 'CLAUDE_NOTES', 'code': 'CLAUDE_CODE_JA', 'cachy': 'CACHYOS_JA'}
# 英語版。訳す対象ではないので CONSTS に入れない（TODO-037、TODO-041）。code は最新の 1 版だけ
EN_CONSTS = {'cachy': 'CACHYOS_EN', 'code': 'FALLBACK_CLAUDE_CODE'}
# ログとコミットメッセージで使う、人向けの名前
NAMES = {'notes': 'リリースノート', 'code': 'CHANGELOG', 'cachy': 'CachyOS ブログ'}
AUTHORS = {'notes': 'Claude Platform リリースノート', 'code': 'Claude Code CHANGELOG', 'cachy': 'CachyOS ブログ'}
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


def now_jst():
    return datetime.datetime.now(JST).isoformat(timespec='seconds')


def iso_jst(raw):
    """RSS の pubDate（RFC 5322）を日本時間の ISO 8601 にする。読めなければ ''（TODO-040）。"""
    try:
        dt = parsedate_to_datetime(raw or '')
        # -0000 は RFC 5322 どおり UTC（ブラウザの Date.parse と同じ）。時差の無い日時だけ、機械の時刻に頼らず日本時間と読む
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc if raw.rstrip().endswith('-0000') else JST)
        return dt.astimezone(JST).isoformat()
    except (TypeError, ValueError):
        return ''


def get(url):
    # urllib の既定の User-Agent だと platform.claude.com が 403 を返す
    return subprocess.run(['curl', '-sfL', '--max-time', '30', url], capture_output=True, text=True, check=True).stdout


def parse_notes(md):
    """日付ごとにまとめた項目（同じ日付の見出しが続くことがある）。新しい順に 3 日分。"""
    days = {}
    dates = {}
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
            dates[title] = f'{m.group(3)}-{MONTHS.index(m.group(1)) + 1:02}-{int(m.group(2)):02}'  # 日付だけ（時刻は無い）
        elif cur is not None and (m := ITEM.match(line)):
            cur.append(m.group(1))
    return [{'title': t, 'en': items, 'pubDate': dates[t]} for t, items in days.items()]


def parse_code(md):
    """新しい 3 版。各版は先頭 8 項目まで。pubDate は GitHub のリリース日時（取れなければ ''）。"""
    vers = []
    try:
        rel = {r['tag_name']: r['published_at'] for r in json.loads(get(RELEASES_URL))}
    except (subprocess.CalledProcessError, ValueError, KeyError, TypeError) as x:
        print(f'GitHub のリリース日時が取れなかった。取得した日時にする: {x}')
        rel = {}
    for line in md.splitlines():
        if line.startswith('## '):
            if len(vers) == 3:
                break
            v = line[3:].strip()
            at = rel.get(f'v{v}', '').replace('Z', '+00:00')
            vers.append({'title': f'Claude Code {v}（日本語）', 'en': [],
                         'pubDate': datetime.datetime.fromisoformat(at).astimezone(JST).isoformat() if at else ''})
        elif vers and (m := ITEM.match(line)) and len(vers[-1]['en']) < 8:
            vers[-1]['en'].append(m.group(1))
    return vers


def parse_cachy():
    """RSS の新しい 3 件。本文は frontmatter・コードブロック・表を除き、段落とリストの項目を 1 行ずつにする。"""
    try:
        items = list(ET.fromstring(get(CACHY_RSS)).iter('item'))[:3]
    except ET.ParseError as x:
        sys.exit(f'RSS が XML として読めない: {x}')
    slugs = []
    dates = []
    for it in items:
        m = re.fullmatch(r'https://cachyos\.org/blog/([^/]+)/', (it.findtext('link') or '').strip())
        if not m:
            sys.exit(f"RSS の item の link が読めない: {it.findtext('link')!r}（書式が変わったかも）")
        slugs.append(m.group(1))
        dates.append(iso_jst(it.findtext('pubDate')))
    posts = []
    for slug, at in zip(slugs, dates):
        md = get(CACHY_POST % slug)
        m = re.match(r'---\n(.*?)\n---\n', md, re.S)
        t = m and re.search(r'^title: *(.+)$', m.group(1), re.M)
        if not t:
            sys.exit(f'{slug}: frontmatter に title が読めない（書式が変わったかも）')
        items = []
        fence = False
        for line in md[m.end():].splitlines():
            line = line.strip()
            if line.startswith('```'):
                fence = not fence
            elif fence or not line or line.startswith('|') or re.fullmatch(r'-{3,}', line):
                continue
            else:
                line = re.sub(r'^(?:[*-] |#+ )', '', line)
                line = re.sub(r'<(https?://[^>]+)>', r'\1', line)
                items.append(line.strip())
        if fence:
            sys.exit(f'{slug}: コードブロックが閉じていない（書式が変わったかも）')
        posts.append({'title': t.group(1).strip().strip('"\'') + '（日本語）', 'en': items, 'pubDate': at})
    return posts


def block(src, name):
    m = re.search(r'    const %s = (\[.*?\n    \]);' % name, src, re.S)
    if not m:
        sys.exit(f'index.html に const {name} が見つからない')
    return m


def existing(src, name):
    return {o['title']: o for o in json.loads(block(src, name).group(1))}


def current(src, kind):
    return {t: o['text'] for t, o in existing(src, CONSTS[kind]).items()}


def fetch(work):
    src = INDEX.read_text(encoding='utf-8')
    last = json.loads(LAST.read_text(encoding='utf-8')) if LAST.exists() else {}
    out = {}
    for kind, parse in {'notes': lambda: parse_notes(get(NOTES_URL)), 'code': lambda: parse_code(get(CODE_URL)),
                        'cachy': parse_cachy}.items():
        # 取れない・読めないものは更新せず、前の内容のまま残す（TODO-037）。黙って「変更なし」で終わらないよう理由を出す。
        # 「取得できず更新しなかった」の行を update-notes.sh が見て、コミットメッセージから外し、終了コードを 1 にする
        try:
            entries = parse()
            if len(entries) != 3 or not all(e['en'] for e in entries):
                sys.exit('3 つ読めない、または項目が 0 件のものがある（書式が変わったかも）: '
                         + ', '.join(f"{e['title']}（{len(e['en'])}）" for e in entries))
            out[kind] = entries
        except (subprocess.CalledProcessError, SystemExit) as x:
            why = f'取得に失敗 {x.cmd[-1]}' if isinstance(x, subprocess.CalledProcessError) else x.code
            print(f'{CONSTS[kind]}（{NAMES[kind]}）: 取得できず更新しなかった。前の内容のまま残す（理由: {why}）')
    if not out:
        sys.exit('全部取得できなかった')
    todo = 0
    for kind, entries in out.items():
        old = existing(src, CONSTS[kind])
        cur = current(src, kind)
        prev = {e['title']: e['en'] for e in last.get(kind, [])}
        for e in entries:
            # 配信日時が読めなければ、前に埋め込んだ日時、それも無ければ取得した日時（TODO-041）
            e['pubDate'] = e['pubDate'] or old.get(e['title'], {}).get('pubDate') or now_jst()
            if e['title'] in cur and prev.get(e['title']) == e['en']:
                e['status'] = 'same'
            else:
                e['status'] = 'changed' if e['title'] in cur else 'new'
                e['ja'] = []
                todo += 1
            print(f"{e['status']:8} {e['title']}（{len(e['en'])} 項目）")
        if [e['title'] for e in entries] == list(cur) and all(e['status'] == 'same' for e in entries) \
                and [e['pubDate'] for e in entries] == [o.get('pubDate') for o in old.values()]:
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
    entries = [e for k in CONSTS for e in data.get(k, []) if e['status'] != 'same']
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


def trim(s):
    """前後の空白（全角も）を外す。JS の正規表現の空白は U+FEFF も数えるので、揃える。"""
    return re.sub(r'^[\s\ufeff]+|[\s\ufeff]+$', '', s)


def parse_nhk():
    """RSS の新しい最大 6 件。整形は TODO-010 で決めたとおり（TODO-039）。読めなければ ValueError。"""
    try:
        items = list(ET.fromstring(get(NHK_RSS)).iter('item'))[:6]
    except ET.ParseError as x:
        raise ValueError(f'RSS が XML として読めない: {x}')
    if not items:  # 1〜5 件の日は、fetchNhkNews と同じく、ある分だけ受け入れる
        raise ValueError('item が 0 件（書式が変わったかも）')
    out = []
    for it in items:
        title = trim(it.findtext('title') or '')
        desc = trim(re.sub(r'<[^>]*>', '', it.findtext('description') or '').replace('&hellip;', '…').replace('...', '…'))
        if not title:
            raise ValueError('title が空の item がある（書式が変わったかも）')
        # 要約は 100 字前後で「…」と切れる。最後の「。」まで残し、「。」が無ければ見出しだけにする
        if desc.endswith('…'):
            desc = desc[:desc.rfind('。') + 1]
        # 配信日時は日本時間の ISO 8601。index.html が一番新しいものをまとめの行に出す（TODO-040）。読めなければ ''
        out.append({'title': title, 'author': 'NHKニュース', 'text': f'{title}。\n{desc}' if desc else f'{title}。',
                    'pubDate': iso_jst(it.findtext('pubDate'))})
    return out


def nhk():
    """FALLBACK_NHK_NEWS を最新 6 件にする。変わったら True。取れなければ更新せず False（TODO-039）。"""
    try:
        entries = parse_nhk()
    except (subprocess.CalledProcessError, ValueError) as x:
        why = f'取得に失敗 {x.cmd[-1]}' if isinstance(x, subprocess.CalledProcessError) else x
        print(f'{NHK_CONST}（NHK ニュース）: 取得できず更新しなかった。前の内容のまま残す（理由: {why}）')
        return False
    src = INDEX.read_text(encoding='utf-8')
    m = block(src, NHK_CONST)
    old = existing(src, NHK_CONST)
    for e in entries:  # 読めなければ、前の日時、それも無ければ取得した日時（TODO-041）
        e['pubDate'] = e['pubDate'] or old.get(e['title'], {}).get('pubDate') or now_jst()
    new = dump(entries)
    if m.group(1) == new:
        print(f'{NHK_CONST}: 変更なし')
        return False
    INDEX.write_text(src[:m.start(1)] + new + src[m.end(1):], encoding='utf-8')
    print(f'{NHK_CONST}: 最新 {len(entries)} 件に更新した')
    return True


def dump(entries):
    out = '[\n' + ',\n'.join(
        '      {\n' + ',\n'.join(f'        {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in o.items())
        + '\n      }' for o in entries) + '\n    ]'
    # 文字列に </script> があっても <script> が閉じないように（JSON では \/ は / と同じ）
    return out.replace('</', '<\\/')


def apply(work):
    data = json.loads(Path(work).read_text(encoding='utf-8'))
    src = orig = INDEX.read_text(encoding='utf-8')
    bad = []
    today = datetime.date.today().isoformat()
    for kind in CONSTS:
        if kind not in data:  # fetch が取得できなかったものは前のまま
            continue
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
            objs.append({'title': e['title'], 'author': AUTHORS[kind], 'text': text, 'pubDate': e['pubDate']})
        m = block(src, CONSTS[kind])
        src = src[:m.start(1)] + dump(objs) + src[m.end(1):]
        names = [CONSTS[kind]]
        if kind in EN_CONSTS:
            # 英語版は本文そのまま（題名は（日本語）なし）。取得のたびに書く。code は最新の 1 版だけ
            en = [{'title': e['title'].removesuffix('（日本語）'), 'author': AUTHORS[kind],
                   'text': '\n'.join(plain(s) for s in e['en']), 'pubDate': e['pubDate']}
                  for e in data[kind][:1 if kind == 'code' else None]]
            m = block(src, EN_CONSTS[kind])
            src = src[:m.start(1)] + dump(en) + src[m.end(1):]
            names.append(EN_CONSTS[kind])
        # 日付のコメントは、変わった側だけ直す
        if any(e['status'] != 'same' for e in data[kind]):
            for name in names:
                src = re.sub(r'(// update-release-notes skill が書き換える（)\d{4}-\d{2}-\d{2}(.*\n    const %s = )' % name,
                             rf'\g<1>{today}\g<2>', src)
    if bad:
        sys.exit('\n'.join(bad))
    INDEX.write_text(src, encoding='utf-8')
    last = json.loads(LAST.read_text(encoding='utf-8')) if LAST.exists() else {}
    last.update({k: [{'title': e['title'], 'en': e['en']} for e in data[k]] for k in CONSTS if k in data})
    LAST.write_text(json.dumps(last, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if src != orig:
        print(f'index.html と {LAST.name} を書き換えた（{today} 時点）')
    return src != orig


CHECK_JS = r"""
import { chromium } from '%s';
const [url, notes, code, codeEn, cachyJa, cachyEn, nhk] = [process.argv[1], ...process.argv.slice(2, 8).map(a => JSON.parse(a))];
const strip = s => s.replace(/\s/g, '');
const fails = [], errs = [], outside = [];
// 選択欄に出す日時（日本時間。日付だけの値は日付だけ）。index.html の formatAt と同じ決まりを、ここでも書いて突き合わせる
const fmt = s => {
  if (/^\d{4}-\d\d-\d\d$/.test(s || '')) return `${+s.slice(5, 7)}/${+s.slice(8)}`;
  const d = new Date(Date.parse(s) + 9 * 3600e3), z = n => String(n).padStart(2, '0');
  return Number.isNaN(+d) ? '' : `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}`;
};
const lab = (a, mid = '') => `・${a.title}${mid}${fmt(a.pubDate) ? ` (${fmt(a.pubDate)})` : ''}`;
const b = await chromium.launch(); const p = await b.newPage();
p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
// ブラウザでは何も取得しない（TODO-041）
p.on('request', r => { if (!/^(http:\/\/127\.0\.0\.1[:/]|data:|blob:)/.test(r.url())) outside.push(r.url()); });
await p.goto(url);
await p.waitForFunction(() => document.querySelector('#preset-select option[value="claude-code"]'));
const opts = await p.$$eval('#preset-select option', os => os.map(o => [o.value, o.textContent]));
const vals = opts.map(o => o[0]);
if (notes.length !== 3) fails.push(`CLAUDE_NOTES が ${notes.length} 件（3 件のはず）`);
if (code.length !== 3) fails.push(`CLAUDE_CODE_JA が ${code.length} 件（3 件のはず）`);
if (codeEn.length !== 1) fails.push(`FALLBACK_CLAUDE_CODE が ${codeEn.length} 件（1 件のはず）`);
const nDays = vals.filter(v => /^claude-\d+$/.test(v)).length, nJa = vals.filter(v => /^code-ja-/.test(v)).length;
if (nDays !== 3 || nJa !== 3) fails.push(`選択欄の日付が ${nDays} 個、（日本語）が ${nJa} 個（3 個ずつのはず）`);
notes.forEach((n, i) => { if (!opts.some(o => o[0] === `claude-${i}` && o[1] === lab(n))) fails.push(`選択欄に ${lab(n)} が無い`); });
const at = vals.indexOf('claude-code');
if (opts[at][1] !== lab(codeEn[0], '（英語）')) fails.push(`（英語）の行が ${lab(codeEn[0], '（英語）')} でない: ${opts[at][1]}`);
code.forEach((c, i) => { const o = opts[at + 1 + i]; if (!o || o[0] !== `code-ja-${i}` || o[1] !== lab(c)) fails.push(`（英語）の後の ${i + 1} 番目が ${lab(c)} でない`); });
if (cachyJa.length !== 3 || cachyEn.length !== 3) fails.push(`CACHYOS_JA が ${cachyJa.length} 件、CACHYOS_EN が ${cachyEn.length} 件（3 件ずつのはず）`);
const cg = await p.$$eval('#optgroup-cachyos option', os => os.map(o => [o.value, o.textContent]));
const want = [...cachyEn.map((c, i) => [`cachy-en-${i}`, lab(c, '（英語）')]), ...cachyJa.map((c, i) => [`cachy-ja-${i}`, lab(c)])];
if (JSON.stringify(cg) !== JSON.stringify(want)) fails.push(`CachyOS の選択欄が違う: ${JSON.stringify(cg)}`);
// NHK のまとめの行は、一番新しい配信日時を出す（TODO-040）
const ts = nhk.map(a => Date.parse(a.pubDate)).filter(Number.isFinite);
const nhkWant = `📰 NHK主要ニュースまとめ (${nhk.length}本${ts.length ? `・${fmt(new Date(Math.max(...ts)).toISOString())}` : ''})`;
const nhkGot = opts.find(o => o[0] === 'news-summary')[1];
if (nhkGot !== nhkWant) fails.push(`NHK のまとめの行が ${nhkWant} でない: ${nhkGot}`);
const shown = async v => { await p.selectOption('#preset-select', v); await p.waitForTimeout(500); return strip(await p.evaluate(() => document.body.innerText)); };
let t = await shown('code-ja-0');
if (!t.includes(strip(code[0].text.split('\n')[0]))) fails.push(`${code[0].title} を選んでも訳が出ない`);
for (const [v, a] of [['claude-code', codeEn[0]], ['cachy-en-0', cachyEn[0]], ['cachy-ja-0', cachyJa[0]]]) {
  t = await shown(v);
  if (!a || !t.includes(strip(a.text))) fails.push(`${v} を選んでも本文が出ない`);
}
t = await shown('claude-summary');
notes.forEach(n => { if (!t.includes(strip(`【${n.title}】${n.text.split('\n')[0]}`))) fails.push(`まとめに 【${n.title}】本文 が無い`); });
if (code.some(c => t.includes(strip(c.text.split('\n')[0])))) fails.push('まとめに CHANGELOG が入っている');
await b.close();
errs.forEach(e => fails.push(`コンソールのエラー: ${e}`));
outside.forEach(u => fails.push(`ブラウザが外へ取りに行った: ${u}`));
console.log(fails.length ? fails.join('\n') : 'OK: 選択欄・日時・訳の表示・まとめ・外への通信なし・コンソール');
process.exit(fails.length ? 1 : 0);
""" % PLAYWRIGHT


def check():
    src = INDEX.read_text(encoding='utf-8')
    data = [list(existing(src, n).values()) for n in
            (CONSTS['notes'], CONSTS['code'], EN_CONSTS['code'], CONSTS['cachy'], EN_CONSTS['cachy'], NHK_CONST)]
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
                            *(json.dumps(d, ensure_ascii=False) for d in data)], timeout=120)
    finally:
        server.terminate()
        server.wait()
    sys.exit(r.returncode)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(usage=__doc__)
    ap.add_argument('cmd', choices=['run', 'fetch', 'translate', 'apply', 'nhk', 'check'])
    ap.add_argument('--by', choices=['claude', 'google'], default='claude')
    ap.add_argument('work', nargs='?')
    a = ap.parse_args()
    if (a.work is None) != (a.cmd in ('check', 'nhk')):
        ap.error('check・nhk 以外は WORK.json を 1 つ渡す' if a.work is None else 'check・nhk は WORK.json を取らない')
    if a.cmd == 'run':
        todo = fetch(a.work)
        if todo:
            translate(a.work, a.by)
        # 訳が無くても、配信日時と英語版は apply が書く（TODO-041）
        if apply(a.work) | nhk():
            check()
    elif a.cmd == 'nhk':
        nhk()
    elif a.cmd == 'translate':
        translate(a.work, a.by)
    elif a.cmd == 'fetch':
        fetch(a.work)
    elif a.cmd == 'apply':
        apply(a.work)
    else:
        check()
