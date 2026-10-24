# -*- coding: utf-8 -*-
"""find_all_nondet.py — R142 · 找出全部非确定性算法（含被错误掩盖的）

════ 问题 ════
`ALG_T1_E_003 selfGenerate` 之前报 `rng is not a function`（用 executeAlgorithmSync 时的假失败），
改用 bind.run 后能跑了，但结果随机 —— 它从未被登记。
第一次跑碰巧两次相同所以通过，第二次跑就红了 —— **偶发红灯的根源是登记不全**。

════ 做法 ════
对 927 条各跑 3 次，找出「两次结果不同」的全部算法，逐个查随机来源，
一次性补进 NON_DETERMINISTIC 清单。这样清单才是完整的。
"""
import json
import pathlib
import re

MB = pathlib.Path(r"D:\metago-build")
P = MB / "verify_algorithms_semantic.mjs"

SCAN = MB / "_scan_nondet.mjs"
SCAN.write_text(r'''import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const A = 'C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/algorithms'
const req = createRequire(A + '/')
const reg = req(A + '/engine/algorithms/registry.js')
const R = reg.registry || reg.default || reg
const all = R.getRegistry ? R.getRegistry() : []
const { bind } = req(A + '/engine/algorithms/t3impl/bind.cjs')
const B = bind(reg)
let shapes = {}
try { shapes = JSON.parse(readFileSync(A + '/engine/algorithms/t3impl/shapes.json', 'utf8')) } catch (e) { }

function core(o) {
  if (o === null || o === undefined) return null
  if (typeof o !== 'object') return o
  const out = Array.isArray(o) ? [] : {}
  for (const k of Object.keys(o)) {
    if (k === 'provenance' || k === 'durationMs') continue
    out[k] = core(o[k])
  }
  return out
}
const det = []
for (const e of all) {
  const id = e.id, shape = shapes[id]
  if (shape === undefined) continue
  let a, b, c
  try { const r = B.run(id, shape); a = JSON.stringify(core(r.output !== undefined ? r.output : r)) } catch (e2) { continue }
  try { const r = B.run(id, shape); b = JSON.stringify(core(r.output !== undefined ? r.output : r)) } catch (e2) { continue }
  try { const r = B.run(id, shape); c = JSON.stringify(core(r.output !== undefined ? r.output : r)) } catch (e2) { continue }
  if (a !== b || b !== c) {
    const src = String(e.handler)
    det.push({
      id, name: e.name || id, family: e.family,
      random: /Math\.random/.test(src),
      now: /Date\.now/.test(src),
    })
  }
}
console.log(JSON.stringify(det, null, 1))
writeFileSync('D:/metago-build/_nondet_scan.json', JSON.stringify(det, null, 1), 'utf8')
''', encoding="utf-8")

import subprocess
r = subprocess.run(["node", str(SCAN)], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
print("扫描完成")
found = json.loads((MB / "_nondet_scan.json").read_text(encoding="utf-8"))
print(f"实测非确定性算法：{len(found)} 条")
for x in found:
    src = []
    if x["random"]: src.append("Math.random")
    if x["now"]: src.append("Date.now")
    if not src: src.append("间接（调用带随机的子函数）")
    print(f"  {x['id']:<18} {x['name'][:26]:<28} [{x['family']}]  {'+'.join(src)}")

# 读现有清单
t = P.read_text(encoding="utf-8")
existing = set(re.findall(r"'(ALG_[A-Z0-9_]+)':", t.split("const NON_DETERMINISTIC")[1].split("}")[0] if "const NON_DETERMINISTIC" in t else ""))
print(f"\n现有清单：{len(existing)} 条")
newOnes = [x for x in found if x["id"] not in existing]
print(f"需补登记：{len(newOnes)} 条")
for x in newOnes:
    print(f"  + {x['id']} {x['name']}")

if newOnes:
    # 构造新条目
    lines = []
    for x in newOnes:
        if x["random"] and x["now"]:
            why = "Math.random + Date.now"
        elif x["random"]:
            why = "Math.random"
        elif x["now"]:
            why = "Date.now"
        else:
            why = "间接调用带 Math.random 的子函数"
        lines.append(f"  '{x['id']}': '{why}',")
    ADD = "\n".join(lines)
    # 插到清单结尾（在最后的 } 之前）
    m = re.search(r"(const NON_DETERMINISTIC = \{[\s\S]*?)(\n\})", t)
    if m:
        t = t[:m.end(1)] + "\n" + ADD + t[m.end(1):]
        P.write_text(t, encoding="utf-8")
        print(f"\n  ✓ 已补登记 {len(newOnes)} 条")
    else:
        print("\n  ✗ 清单锚点未找到")

# 清理临时文件
for f in [MB / "_scan_nondet.mjs"]:
    f.unlink(missing_ok=True)
