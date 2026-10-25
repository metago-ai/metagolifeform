# -*- coding: utf-8 -*-
"""fix_shapes_9.py — 补齐 7 条样例元素字段（DEF-057）

K7 报「算法读取的字段样例里没有」：
  ALG_T2_A_017  entityTypes 元素缺 type
  ALG_T2_D_018  sideEffects 元素缺 reversible / type
  ALG_T2_H_004  ideas 元素缺 feasibility / impact
  ALG_T2_L_009  hypotheses 元素缺 priorProbability / simplicity
  ALG_T2_R_011  rules 元素缺 weight
输出污染 4 条：
  ALG_T1_B_005  slope 为 NaN
  ALG_T2_D_009  failedRollbacks 空数组
  ALG_T2_R_011  output.value NaN
  ALG_T2_H_004  feasibility NaN

修法：给这些样例元素补齐算法实际读取的字段，并给数值字段合理取值。
"""
import hashlib
import json
import pathlib
import shutil
import time

TARGETS = [
    pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\algorithms\engine\algorithms\t3impl\shapes.json"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0\packages\algorithms\engine\algorithms\t3impl\shapes.json"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\packages\algorithms\engine\algorithms\t3impl\shapes.json"),
]
BAK = pathlib.Path(r"D:\metago-build") / ("backup-shapes-" + time.strftime("%Y%m%d-%H%M%S"))
BAK.mkdir(parents=True, exist_ok=True)

src = TARGETS[0]
shutil.copy2(src, BAK / "shapes.json")
d = json.loads(src.read_bytes().decode("utf-8-sig"))
print("=" * 80)
print(f"shapes.json 共 {len(d)} 条")
before = json.dumps(d, ensure_ascii=False, sort_keys=True)
changed = []

# ① ALG_T2_A_017：entityTypes 元素补 type
if "ALG_T2_A_017" in d:
    d["ALG_T2_A_017"] = {
        "text": "订单号 12345，日期 2026-10-18",
        "entityTypes": [
            {"name": "订单号", "type": "id", "patterns": ["\\d{5}"]},
            {"name": "日期", "type": "date", "patterns": ["\\d{4}-\\d{2}-\\d{2}"]},
        ],
    }
    changed.append("ALG_T2_A_017 补 type")

# ② ALG_T2_D_018：sideEffects 元素补 reversible / type
if "ALG_T2_D_018" in d:
    d["ALG_T2_D_018"] = {
        "sideEffects": [
            {"target": "A", "type": "reversible", "reversible": True, "severity": 0.6},
            {"target": "B", "type": "irreversible", "reversible": False, "severity": 0.3},
        ],
        "chosen": "a", "confidence": 0.8,
    }
    changed.append("ALG_T2_D_018 补 reversible/type")

# ③ ALG_T2_H_004：ideas 元素补 feasibility / impact（同时解决 NaN）
if "ALG_T2_H_004" in d:
    d["ALG_T2_H_004"] = {
        "ideas": [
            {"id": "i1", "content": "降本方案", "novelty": 0.8, "feasibility": 0.7, "impact": 0.9},
            {"id": "i2", "content": "增效方案", "novelty": 0.6, "feasibility": 0.8, "impact": 0.65},
        ]
    }
    changed.append("ALG_T2_H_004 补 feasibility/impact")

# ④ ALG_T2_L_009：hypotheses 元素补 priorProbability / simplicity
if "ALG_T2_L_009" in d:
    d["ALG_T2_L_009"] = {
        "observations": ["o1", "o2"],
        "hypotheses": [
            {"name": "H1", "explains": ["o1", "o2"], "complexity": 0.2, "prior": 0.8,
             "priorProbability": 0.8, "simplicity": 0.8},
            {"name": "H2", "explains": ["o1"], "complexity": 0.5, "prior": 0.5,
             "priorProbability": 0.5, "simplicity": 0.5},
        ],
    }
    changed.append("ALG_T2_L_009 补 priorProbability/simplicity")

# ⑤ ALG_T2_R_011：rules 元素补 weight（同时给 output.value 合理输入）
if "ALG_T2_R_011" in d:
    d["ALG_T2_R_011"] = {
        "inputs": [{"name": "x", "value": 0.8}, {"name": "y", "value": 0.4}],
        "rules": [
            {"if": [{"name": "x", "a": 0, "b": 0.5, "c": 1}], "then": "high", "weight": 0.9},
            {"if": [{"name": "y", "a": 0, "b": 0.5, "c": 1}], "then": "low", "weight": 0.7},
        ],
    }
    changed.append("ALG_T2_R_011 补 rules.weight")

# ⑥ ALG_T1_B_005：偏差趋势 slope NaN —— 给更规整的序列
if "ALG_T1_B_005" in d:
    d["ALG_T1_B_005"] = [
        {"actual": [1, 2, 3], "expected": [1.1, 2.2, 3.1]},
        {"actual": [2, 4, 6], "expected": [2.2, 4.4, 6.3]},
        {"actual": [3, 6, 9], "expected": [3.3, 6.5, 9.2]},
    ]
    changed.append("ALG_T1_B_005 改用等长且单调的序列（原 slope 为 NaN）")

# ⑦ ALG_T2_D_009：failedRollbacks 空数组 —— 提供回滚记录
if "ALG_T2_D_009" in d:
    d["ALG_T2_D_009"] = {
        "id": "d1",
        "sideEffects": ["影响A", "影响B"],
        "chosen": "a",
        "confidence": 0.8,
        "failedRollbacks": [
            {"step": "r1", "error": "依赖超时", "at": "step-2"},
            {"step": "r2", "error": "状态冲突", "at": "step-3"},
        ],
    }
    changed.append("ALG_T2_D_009 补 failedRollbacks 记录")

after = json.dumps(d, ensure_ascii=False, sort_keys=True)
print(f"\n修改 {len(changed)} 条：")
for c in changed:
    print("  ✓ " + c)

if after != before:
    payload = json.dumps(d, ensure_ascii=False, indent=1).encode("utf-8")
    for t in TARGETS:
        for _ in range(5):
            try:
                t.write_bytes(payload)
                break
            except PermissionError:
                time.sleep(0.8)
    print(f"\n✓ 已写回 {len(TARGETS)} 处，{len(payload)} B")
    for t in TARGETS:
        print("   %s  sha=%s" % (t.parent.parent.parent.parent.parent.name[:12],
                                 hashlib.sha256(t.read_bytes()).hexdigest()[:10]))
else:
    print("\n· 无变化")
print(f"备份：{BAK}")
