# -*- coding: utf-8 -*-
"""fix_shapes_2.py — 按算法真实契约修最后 2 条样例（DEF-057 续）

读源码得到的真实契约：
  ALG_B_005 deviationTrend(samples):
      const times = samples.map(s => s.timestamp)   ← 必须有 timestamp，否则 meanT=NaN → slope=NaN
  ALG_T2_D_009 decisionRollback(decision):
      for (const effect of decision.sideEffects) if (!effect.reversible) push(effect.target)
      ← sideEffects 必须是「对象数组」，含 reversible 与 target

修法：给 B_005 的样例补 timestamp；把 D_009 的 sideEffects 改为对象数组。
"""
import hashlib
import json
import pathlib
import shutil
import time

TARGETS = [
    pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\algorithms\engine\algorithms\t3impl\shapes.json"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0\packages\algorithms\engine\algorithms\t3impl\shapes.json"),
    pathlib.Path(r"D:\metago-build\outbound\v36.10.0\packages\algorithms\engine\algorithms\t3impl\shapes.json"),
]
BAK = pathlib.Path(r"D:\metago-build") / ("backup-shapes2-" + time.strftime("%Y%m%d-%H%M%S"))
BAK.mkdir(parents=True, exist_ok=True)

src = TARGETS[0]
shutil.copy2(src, BAK / "shapes.json")
d = json.loads(src.read_bytes().decode("utf-8-sig"))

# ① B_005：每个 sample 加 timestamp（单调递增，保证 den != 0）
d["ALG_T1_B_005"] = [
    {"timestamp": 1, "actual": [1, 2], "expected": [1.5, 2.4]},
    {"timestamp": 2, "actual": [2, 3], "expected": [2.0, 3.0]},
    {"timestamp": 3, "actual": [3, 4], "expected": [2.5, 3.6]},
    {"timestamp": 4, "actual": [4, 5], "expected": [3.0, 4.2]},
]
print("✓ ALG_T1_B_005 每例补 timestamp（1..4）")

# ② D_009：sideEffects 改为对象数组
d["ALG_T2_D_009"] = {
    "id": "d1",
    "sideEffects": [
        {"target": "影响A", "reversible": True, "type": "reversible"},
        {"target": "影响B", "reversible": False, "type": "irreversible"},
    ],
    "chosen": "a",
    "confidence": 0.8,
}
print("✓ ALG_T2_D_009 sideEffects 改为对象数组（含 target/reversible/type）")

payload = json.dumps(d, ensure_ascii=False, indent=1).encode("utf-8")
for t in TARGETS:
    for _ in range(5):
        try:
            t.write_bytes(payload)
            break
        except PermissionError:
            time.sleep(0.8)
print(f"\n已写回 {len(TARGETS)} 处，{len(payload)} B")
for t in TARGETS:
    print("  sha=%s" % hashlib.sha256(t.read_bytes()).hexdigest()[:10])

# 实跑验证
import subprocess
print()
print("实跑验证：")
PROBE = pathlib.Path(r"D:\metago-build\_probe_shapes.cjs")
r = subprocess.run(["node", str(PROBE)], capture_output=True, text=True,
                   encoding="utf-8", errors="replace", timeout=120)
print(r.stdout or (r.stderr or "")[:300])
