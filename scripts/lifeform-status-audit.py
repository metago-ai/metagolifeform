# -*- coding: utf-8 -*-
"""lifeform-status-audit.py — P0-A05 的回归守卫

判据（三条，缺一不可）：
  ① status.js 的 parseLaw 能从 AGENTS.md 解析出 10 条公理 / 9 条属性
  ② 每条的正文列非空（≥4 字符）
  ③ 反向验证：抽掉一条正文 → 计数必须减 1（证明判据非恒真）
  ④ 兼容验证：带注写法（A1（蓝本 A9））与纯编号写法（A34）都能识别

为什么要这个脚本：
  metago_lifeform_status 是 DSH 宿主进程内的工具，ESM 模块已缓存，
  改了 status.js 后宿主不重载就看不到效果。本脚本在独立进程里直接
  import parseLaw()，因此可以随时验证解析逻辑而无需重启宿主。
"""
import json
import pathlib
import subprocess
import sys

H = pathlib.Path(r"D:\DSH-Official\home")
STATUS = H / "profiles" / "desktop" / "node_modules" / "metago-lifeform-dsh" / "lib" / "status.js"
LAW = H / "AGENTS.md"
NODE = "node"

JS = r"""
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const STATUS = process.argv[2]
const LAW = process.argv[3]
const { parseLaw } = await import(pathToFileURL(STATUS).href)
const law = readFileSync(LAW, 'utf8')
const out = {}
const r = parseLaw(law)
out.axioms = (r.axioms || []).map(a => ({ id: a.id, body: (a.constraint || '').trim() }))
out.properties = (r.properties || []).map(p => ({ id: p.id, body: (p.behaviour || '').trim() }))
out.bytes = r.bytes
out.chapterCount = r.chapterCount
// 反向：抽掉 A2 正文
const lines = law.split('\n')
const lineA2 = lines.find(l => /^\|\s*A2\b/.test(l))
if (lineA2) {
  const cells = lineA2.split('|')
  cells[3] = ' '
  const mutated = law.replace(lineA2, cells.join('|'))
  const r2 = parseLaw(mutated)
  out.mutatedAxiomsWithBody = (r2.axioms || []).filter(a => (a.constraint || '').trim().length >= 4).length
}
// 兼容：两种写法
const two = ['| A1（蓝本 A9） | 溯源公理 | 一切输出必须可溯源 |', '| A34 | 元进化需元进化 | 元进化本身需更高阶元进化监控 |', ''].join('\n')
out.twoForms = (parseLaw(two).axioms || []).map(a => a.id)
console.log(JSON.stringify(out))
"""

print("=" * 88)
print("A05 回归守卫：lifeform-status-audit")
print("=" * 88)

if not STATUS.exists():
    print(f"  ✗ status.js 不存在：{STATUS}")
    sys.exit(1)
if not LAW.exists():
    print(f"  ✗ AGENTS.md 不存在：{LAW}")
    sys.exit(1)

tmp = pathlib.Path(r"D:\metago-build") / "_status_probe.mjs"
tmp.write_text(JS, encoding="utf-8")
r = subprocess.run([NODE, str(tmp), str(STATUS), str(LAW)],
                   capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
if r.returncode != 0:
    print("  ✗ 探测失败：", (r.stderr or "")[:300])
    sys.exit(1)

d = json.loads(r.stdout)
ax = d["axioms"]
pr = d["properties"]
bad = 0

print(f"\n① 解析结果")
print(f"   公理 {len(ax)} 条：{[a['id'] for a in ax]}")
print(f"   属性 {len(pr)} 条：{[p['id'] for p in pr]}")
ok1 = len(ax) == 10 and len(pr) == 9
print(f"   {'✓' if ok1 else '✗'} 期望 10 / 9")
if not ok1:
    bad += 1

axBody = [a for a in ax if len(a["body"]) >= 4]
prBody = [p for p in pr if len(p["body"]) >= 4]
print(f"\n② 正文非空（≥4 字符）")
print(f"   公理 {len(axBody)}/{len(ax)} ｜ 属性 {len(prBody)}/{len(pr)}")
ok2 = len(axBody) == len(ax) and len(prBody) == len(pr)
print(f"   {'✓' if ok2 else '✗'} 全部有正文")
if not ok2:
    bad += 1

print(f"\n③ 反向验证（抽掉 A2 正文）")
m = d.get("mutatedAxiomsWithBody")
ok3 = m == len(axBody) - 1
print(f"   有正文公理 {m}（原 {len(axBody)}）")
print(f"   {'✓' if ok3 else '✗'} 判据非恒真")
if not ok3:
    bad += 1

print(f"\n④ 兼容验证")
tf = d.get("twoForms") or []
ok4 = "A1" in tf and "A34" in tf
print(f"   识别到 {tf}")
print(f"   {'✓' if ok4 else '✗'} 两种写法都能识别")
if not ok4:
    bad += 1

print(f"\n附：法则 {d.get('bytes')} B ｜ {d.get('chapterCount')} 章")
print()
print("-" * 88)
print("总判定：" + ("PASS（公理 10 / 属性 9，判据有牙）" if bad == 0 else f"FAIL（{bad} 项不满足）"))
sys.exit(0 if bad == 0 else 1)
