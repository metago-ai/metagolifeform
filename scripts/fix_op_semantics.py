# -*- coding: utf-8 -*-
"""fix_op_semantics.py — 修正 3 个算子的语义歧义（DEF-026）

问题：
  distance(v)     实为「偏离均值」，但名字让调用方以为是「两向量距离」
  coverage(v)     实为「唯一率（uniq/total）」，但名字让调用方以为是「A 被 B 覆盖的比例」
  threshold(v)    实为「≥均值的个数」，且**第二个参数（阈值）被静默忽略**——传了也不报错，得错误答案

后果：输出非空、形状合规、所有既有检查都通过，但**语义不是调用方要的那个**。
      这与 DEF-006（标量参数给数组）同属「静默错答」。

修法（向后兼容，不改变单参调用的行为）：
  1. threshold 支持可选第二参 t：传了就用 t，没传就沿用「≥均值」
  2. 三者输出统一加 `__semantics` 字段，明确说明实际算了什么
  3. distance / coverage 保持单参行为，但用 __semantics 消除歧义
"""
import pathlib
import shutil
import subprocess
import time

P = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\atoms\specialized.cjs")
BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-ops-sem-" + time.strftime("%Y%m%d-%H%M%S"))
s = P.read_text(encoding="utf-8")

if "__semantics" in s:
    print("已修复，跳过")
    raise SystemExit(0)

FIXES = [
    # threshold：支持可选阈值参数
    (
        """  threshold(v) {
    const m = mean(v);
    const pass = v.filter(x => x >= m).length;
    return { pass, fail: v.length - pass, passRate: round(clamp01(pass / Math.max(1, v.length))), threshold: round(m) };
  },""",
        """  threshold(v, t) {
    /* 第二参 t 若给出，按其判定；否则沿用「≥均值」。
       __semantics 明确说明用的是哪一个，避免调用方误读。 */
    const useGiven = (typeof t === "number" && isFinite(t));
    const cut = useGiven ? t : mean(v);
    const pass = v.filter(x => x >= cut).length;
    return {
      pass, fail: v.length - pass,
      passRate: round(clamp01(pass / Math.max(1, v.length))),
      threshold: round(cut),
      __semantics: useGiven ? "count_ge_given_threshold" : "count_ge_mean",
    };
  },"""
    ),
    # coverage：标注语义
    (
        """  coverage(v) {
    const uniq = new Set(v.map(x => round(x, 3))).size;
    return { coverage: round(clamp01(uniq / Math.max(1, v.length))), unique: uniq, total: v.length };
  },""",
        """  coverage(v) {
    /* 注意：本算子是「唯一率 uniq/total」，不是「A 被 B 覆盖的比例」。 */
    const uniq = new Set(v.map(x => round(x, 3))).size;
    return {
      coverage: round(clamp01(uniq / Math.max(1, v.length))),
      unique: uniq, total: v.length,
      __semantics: "uniqueness_ratio_not_set_coverage",
    };
  },"""
    ),
    # distance：标注语义
    (
        """  distance(v) {
    const m = mean(v);
    return { deviation: v.map(x => round(x - m)), totalDeviation: round(sum(v.map(x => Math.abs(x - m)))), spread: round(std(v)), n: v.length };
  },""",
        """  distance(v) {
    /* 注意：本算子是「各元素偏离均值」，不是「两向量之间的距离」。 */
    const m = mean(v);
    return {
      deviation: v.map(x => round(x - m)),
      totalDeviation: round(sum(v.map(x => Math.abs(x - m)))),
      spread: round(std(v)), n: v.length,
      __semantics: "deviation_from_mean_not_pairwise_distance",
    };
  },"""
    ),
]

n = 0
for old, new in FIXES:
    if old in s:
        s = s.replace(old, new, 1)
        n += 1
    else:
        print("未匹配:", old.split("\n")[0][:50])

if n == 0:
    print("无改动")
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(P, BACKUP / P.name)
P.write_text(s, encoding="utf-8")
print("已修 %d 处，备份: %s" % (n, BACKUP / P.name))

r = subprocess.run(["node", "--check", str(P)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])
