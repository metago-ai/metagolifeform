# -*- coding: utf-8 -*-
"""recover_assertions.py — 恢复被自己覆盖的强断言 + 加防回退断言

════ 事故经过（必须记录）════
1. R141 第 3 轮，我用 fix_semantic_checker.py 把 4 条弱断言改成强断言：
   build_coupling_matrix / normalize_coupling / identify_strong_pairs / identify_weak_pairs
   → mcp-tools-semantic.cjs 变成 10,227 B
2. R142 期间，我在「批量同步脚本」时写了：
   shutil.copy2(MB/nm, H/nm)   # 从 metago-build 复制到 home
   而 metago-build 下的 mcp-tools-semantic.cjs 是**更旧的副本**（8,386 B）
   → 强断言被旧版覆盖回退，且三个副本全部变成弱断言
3. 有牙自检（selftest_semantic_teeth.mjs）当场抓到：11 个已知错误里 2 个漏过
   —— 这正是「元验证」存在的意义

════ 教训 ════
**同步脚本前必须比对内容，不能盲目 copy。** 方向应该是「新→旧」，
但「谁新谁旧」不能靠假设，要靠断言守。

════ 修法 ════
1. 恢复 4 条强断言
2. 加「断言强度守卫」：在 mcp-tools-semantic.cjs 里打标记，并在回归里断言标记存在
   这样任何人（包括我）把它覆盖回弱版，回归立刻红
"""
import hashlib
import pathlib
import shutil
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home\scripts")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\scripts")
MB = pathlib.Path(r"D:\metago-build")
BAK = MB / ("backup-r142-recover-" + time.strftime("%Y%m%d-%H%M%S"))
BAK.mkdir(parents=True, exist_ok=True)

print("=" * 94)
print("恢复被覆盖的强断言")
print("=" * 94)

REPLACEMENTS = [
    (
        "  build_coupling_matrix: { args: { entities: [{ id: 'a' }, { id: 'b' }], relations: [{ from: 'a', to: 'b', weight: 0.8 }] }, check: (o) => Array.isArray(o.matrix) && o.matrix.length === 2 },",
        """  /* R142-STRONG：查数值（对角=1 / 非对角=权重 / 对称 / 无关=0）。
     原弱版只查「matrix 是长度 2 的数组」——算出全 3 或全 0 也照样 PASS。 */
  build_coupling_matrix: {
    args: { entities: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], relations: [{ from: 'a', to: 'b', weight: 0.8 }, { from: 'b', to: 'c', weight: 0.6 }] },
    check: (o) => {
      const m = o && o.matrix
      if (!Array.isArray(m) || m.length !== 3) return false
      const diagOk = m.every((row, i) => row[i] === 1)
      const abOk = Math.abs(m[0][1] - 0.8) < 1e-9
      const bcOk = Math.abs(m[1][2] - 0.6) < 1e-9
      const acOk = m[0][2] === 0
      const symOk = m.every((row, i) => row.every((v, j) => v === m[j][i]))
      return diagOk && abOk && bcOk && acOk && symOk
    }
  },""",
    ),
    (
        "  normalize_coupling: { args: { scores: [0.5, 0.8, 0.2, 0.9] }, check: (o) => Array.isArray(o.normalized) && o.normalized.length === 4 },",
        """  /* R142-STRONG：查归一化后是否真的落在 [0,1] 且极值为 0/1。 */
  normalize_coupling: {
    args: { scores: [0.5, 0.8, 0.2, 0.9] },
    check: (o) => {
      const n = o && o.normalized
      if (!Array.isArray(n) || n.length !== 4) return false
      if (!n.every(x => typeof x === 'number' && isFinite(x) && x >= 0 && x <= 1)) return false
      return Math.abs(Math.min(...n) - 0) < 1e-9 && Math.abs(Math.max(...n) - 1) < 1e-9
    }
  },""",
    ),
    (
        "  identify_strong_pairs: { args: { pairs: [[0, 0.9], [0.9, 0]], threshold: 0.7 }, check: (o) => Array.isArray(o.pairs) && o.pairs.length === 1 },",
        """  /* R142-STRONG：查阈值真的生效——返回的对必须全部 >= threshold。 */
  identify_strong_pairs: {
    args: { pairs: [[0, 0.95, 0.2], [0.95, 0, 0.1], [0.2, 0.1, 0]], threshold: 0.7 },
    check: (o) => {
      const ps = o && o.pairs
      if (!Array.isArray(ps) || ps.length !== 1) return false
      const w = ps[0][2]
      return typeof w === 'number' && w >= 0.7 - 1e-9 && Math.abs(w - 0.95) < 1e-9
    }
  },""",
    ),
    (
        "  identify_weak_pairs: { args: { pairs: [[0, 0.2], [0.2, 0]], threshold: 0.5 }, check: (o) => Array.isArray(o.pairs) && o.pairs.length === 1 },",
        """  /* R142-STRONG：查 weak 的对必须 0 < w < threshold（实测 0.2 与 0.05 共 2 条）。 */
  identify_weak_pairs: {
    args: { pairs: [[0, 0.2, 0.05], [0.2, 0, 0.9], [0.05, 0.9, 0]], threshold: 0.3 },
    check: (o) => {
      const ps = o && o.pairs
      if (!Array.isArray(ps) || ps.length !== 2) return false
      const ws = ps.map(p => p[2]).sort((a, b) => a - b)
      if (!ws.every(w => typeof w === 'number' && w > 0 && w < 0.3)) return false
      return Math.abs(ws[0] - 0.05) < 1e-9 && Math.abs(ws[1] - 0.2) < 1e-9
    }
  },""",
    ),
]

# 以「内容最全的那份」为基准重建（H 版 8432B 与 PKG 版同 sha，MB 版更旧）
BASE = H / "mcp-tools-semantic.cjs"
t = BASE.read_text(encoding="utf-8")
shutil.copy2(BASE, BAK / "mcp-tools-semantic_before.cjs")

n = 0
for old, new in REPLACEMENTS:
    if old in t:
        t = t.replace(old, new, 1)
        n += 1
    elif new.split("\n")[1] in t or new.strip()[:60] in t:
        pass  # 已是新版

# 加守卫标记
if "R142-STRONG" not in t:
    t = t.replace("const CASES = [", "/* ════ 断言强度标记 R142-STRONG ════\n   本文件至少有 4 条断言是「查数值」而非「查结构」。\n   回归里有一条断言检查本标记存在——\n   谁把它覆盖回弱版（只查 length/typeof），回归立即红。\n   事故记录：R142 期间我从 D:\\metago-build 把旧副本同步过来，\n   把 R141 强化的 4 条断言覆盖回弱版，是有牙自检当场抓到的。 */\nconst CASES = [", 1)
    n += 1

BASE.write_text(t, encoding="utf-8")
print(f"  ✓ home 版已恢复：{n} 处（{len(t):,} B ｜ sha {hashlib.sha256(BASE.read_bytes()).hexdigest()[:12]}）")

# 同步到 PKG（同内容）
shutil.copy2(BASE, PKG / "mcp-tools-semantic.cjs")
print(f"  ✓ PKG 版已同步")

# MB 版也更新（避免下次同步又覆盖回去）
shutil.copy2(BASE, MB / "mcp-tools-semantic.cjs")
print(f"  ✓ metago-build 版已同步（防止下次同步再回退）")

# ── 加「断言强度守卫」到回归 ────────────────────────────
GUARD = MB / "assertion_strength_guard.mjs"
GUARD.write_text(r'''// assertion_strength_guard.mjs — R142 · 断言强度守卫
//
// ════ 为什么需要这个 ════
// R142 期间我犯过一个错：批量同步脚本时从旧目录 copy 到新目录，
// 把 R141 强化的 4 条断言（查数值）覆盖回弱版（只查结构）。
// 是有牙自检当场抓到的——但如果那天没跑有牙自检，这个回退会一直潜伏。
//
// 本守卫的作用：把「断言强度」变成一个可检查的事实。
// 谁把强断言改回弱版，回归立刻红。
import { readFileSync, existsSync } from 'node:fs'

const FILES = [
  'D:/DSH-Official/home/scripts/mcp-tools-semantic.cjs',
  'D:/metago-build/outbound/v36.10.0/metagolifeform-v36.12.0/scripts/mcp-tools-semantic.cjs',
]

// 每条强断言的特征串（改这些就说明被弱化了）
const MARKERS = [
  ['R142-STRONG 标记块', /R142-STRONG/],
  ['build_coupling_matrix 查对角', /diagOk\s*&&/],
  ['build_coupling_matrix 查对称', /symOk\s*&&/],
  ['normalize_coupling 查极值', /Math\.min\(\.\.\.n\)/],
  ['identify_strong_pairs 查阈值', /w\s*>=\s*0\.7/],
  ['identify_weak_pairs 查区间', /w\s*<\s*0\.3/],
]

console.log('='.repeat(88))
console.log('R142 · 断言强度守卫')
console.log('='.repeat(88))

let bad = 0
for (const f of FILES) {
  if (!existsSync(f)) { console.log(`  ✗ 文件不存在：${f}`); bad++; continue }
  const t = readFileSync(f, 'utf8')
  const miss = MARKERS.filter(([, re]) => !re.test(t)).map(([n]) => n)
  const tag = f.includes('DSH-Official') ? 'HOME' : 'PKG'
  if (miss.length) {
    bad++
    console.log(`  ✗ ${tag}：缺 ${miss.length} 个强度标记 → ${miss.join('、')}`)
  } else {
    console.log(`  ✓ ${tag}：${MARKERS.length} 个强度标记齐备`)
  }
  // 反向检查：确认弱版特征已消失
  const weak = []
  if (/build_coupling_matrix:\s*\{\s*args:\s*\{\s*entities:\s*\[\{\s*id:\s*'a'\s*\},\s*\{\s*id:\s*'b'\s*\}\]/.test(t)) weak.push('bcm 仍是 2 元素弱样例')
  if (/check:\s*\(o\)\s*=>\s*Array\.isArray\(o\.normalized\)\s*&&\s*o\.normalized\.length\s*===\s*4\s*\}/.test(t)) weak.push('norm 仍是只查 length')
  if (weak.length) { bad++; console.log(`      ⚠ 弱版特征仍在：${weak.join('、')}`) }
}

console.log('\n' + '-'.repeat(88))
console.log(bad === 0 ? `总判定：PASS（断言强度 ${FILES.length}/${FILES.length}）` : `总判定：FAIL（${bad} 处断言被弱化）`)
process.exit(bad === 0 ? 0 : 1)
''', encoding="utf-8")
print(f"  ✓ 已建断言强度守卫 assertion_strength_guard.mjs")

r = subprocess.run(["node", "--check", str(BASE)], capture_output=True, text=True)
print(f"  语法：{'✓' if r.returncode == 0 else '✗ ' + r.stderr[:120]}")

print("\n验证：")
r = subprocess.run(["node", str(GUARD)], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
for line in (r.stdout or "").split("\n"):
    if line.strip():
        print("  " + line.strip()[:100])
r = subprocess.run(["node", str(MB / "selftest_semantic_teeth.mjs")], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
for line in (r.stdout or "").split("\n"):
    if "有牙自检：" in line or "总判定" in line:
        print("  " + line.strip()[:100])
