# -*- coding: utf-8 -*-
"""guard-chain-gate.py — 两道强制门实测（可被回归调用）

法则要求：
  §16.3  memory-guard  接收任务后、执行任何工作之前必须先跑 → 必须 0 硬失败
  veracity-guard       宣称完成前对账 → report 传入报告文本才做提取+对账

CORR-037：`veracity-guard claim` 只做预览、不入库；`report <文本>` 才提取+对账。
         此前误以为 claim 应被 report 读到，属用法理解错误，非缺陷。
"""
import pathlib
import subprocess
import sys

H = pathlib.Path(r"D:\DSH-Official\home")
MG = H / "scripts" / "memory-guard.cjs"
bad = 0

print("=" * 84)
print("两道强制门实测")
print("=" * 84)


def run(cmd, cwd=None, timeout=300):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", timeout=timeout, cwd=str(cwd or H), shell=True)


# ① memory-guard
print("\n【① memory-guard · 第零道硬门】")
if not MG.exists():
    print("  ✗ 脚本不存在")
    bad += 1
else:
    r = subprocess.run(["node", str(MG)], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=300, cwd=str(H))
    out = ((r.stdout or "") + (r.stderr or ""))
    hard = None
    import re
    m = re.search(r"硬失败\s*(\d+)", out)
    if m:
        hard = int(m.group(1))
    print(f"  硬失败 {hard} ｜ rc={r.returncode}")
    for l in out.split("\n"):
        if l.strip().startswith(("[PASS]", "[FAIL]", "[WARN]")):
            print("    " + l.strip()[:96])
    ok = (hard == 0) and r.returncode == 0
    if not ok:
        print("  ✗ 硬门未通过")
        bad += 1
    else:
        print("  ✓ 通过（0 硬失败）")

# ② veracity-guard report（带文本）
print("\n【② veracity-guard · 宣称对账】")
TEXT = "本任务已全部完成，全部 34 项回归通过，测试覆盖完整。"
r2 = run(f'veracity-guard report "{TEXT}"')
out2 = ((r2.stdout or "") + (r2.stderr or ""))
lines = [l.strip() for l in out2.split("\n") if l.strip()]
ok2 = r2.returncode in (0, 1) and any("事实断言" in l or "对账" in l or "证实率" in l for l in lines)
print(f"  rc={r2.returncode}")
for l in lines[-5:]:
    print("    " + l[:96])
if not ok2:
    print("  ✗ 未产生对账结论")
    bad += 1
else:
    print("  ✓ 可对账")

print()
print("-" * 84)
print("总判定：" + ("PASS（两道强制门均可用）" if bad == 0 else f"需关注（{bad} 项）"))
sys.exit(0 if bad == 0 else 1)
