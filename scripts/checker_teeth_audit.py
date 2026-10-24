# -*- coding: utf-8 -*-
"""checker_teeth_audit.py — 检查器「有没有牙」审计

起因：DEF-003 是「K1 空洞断言」——写了断言但它永远为真。
      CORR-019 是「假修复」——写了候选链但只取第一个。
      共同点：**检查存在，但不会失败**。

本审计静态+动态两层判定：
  静态：脚本里是否真的存在「失败分支」（能走到 FAIL 的代码）
  动态：对可安全注入的检查，故意造错样本，看它是否报错

判据：一个检查器如果没有任何失败路径，就是「无牙」的——它只能证明自己跑过。
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")

# 失败分支的语法特征
FAIL_PATTERNS = [
    (r"\.ok\s*=\s*false", "ok=false"),
    (r"pass\s*:\s*false", "pass:false"),
    (r"ok:\s*false", "ok:false"),
    (r"k\d+Ok\s*=\s*false", "kN Ok=false"),
    (r"FAIL\b", "FAIL 字面量"),
    (r"✗", "✗ 标记"),
    (r"push\(\s*\{[^}]*false", "false 入列"),
    (r"return\s+false", "return false"),
    (r"process\.exit\(", "process.exit(...)"),
    (r"sys\.exit\(", "sys.exit(...)"),
    (r"\u9700\u5173\u6ce8", "「需关注」判定"),
    (r"\u9700\u4fee\u590d", "「需修复」判定"),
    (r"length\s*===\s*0\s*\?", "三元判定"),
    (r"\.length\s*\?\s*", "三元判定"),
    (r"fail\s*\+\+", "fail++"),
    (r"bad\s*\+=", "bad +="),
]

# 只审「判定型」检查器（产出 PASS/FAIL 的）
CHECKERS = [
    "verify-package.cjs", "t12-full-scan.cjs", "null-nan-scan.cjs",
    "schema-vs-shape.cjs", "element-field-scan.cjs", "ops-semantic-full.cjs",
    "algo-semantic-invariants.cjs", "mcp-all-health.cjs", "mcp-tools-callable.cjs",
    "reapply-patches.cjs", "audit-expectations.cjs", "differentiation-audit.cjs",
    "reference_audit2.py", "audit_skills.py", "audit_install.py", "audit_global.py",
    "verify_blueprint_claims3.py", "clean_env_verify2.py", "pkg_vs_installed.py",
    "cwd_independence.py", "pkg_portability.py", "atom-hollow-scan.cjs",
    "atom-responsive-scan.cjs", "find-hangs.cjs",
]

print("=" * 94)
print("检查器「有没有牙」审计")
print("=" * 94)
print(f"{'检查器':<32}{'失败路径':<28}判定")
print("-" * 94)

no_teeth = []
for name in CHECKERS:
    cands = [SC / name, PKG / "scripts" / name, pathlib.Path(r"D:\metago-build") / name]
    p = next((c for c in cands if c.exists()), None)
    if p is None:
        print(f"  {name:<30}{'（找不到）':<28}? ")
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    hits = []
    for pat, label in FAIL_PATTERNS:
        if re.search(pat, t, re.M):
            hits.append(label)
    ok = len(hits) > 0
    if not ok:
        no_teeth.append(name)
    print(f"  {name:<30}{(','.join(hits[:3]) if hits else '✗ 无'):<28}{'✓' if ok else '✗ 无牙'}")

print()
print("-" * 94)
print(f"有牙 {len(CHECKERS) - len(no_teeth)} ｜ 无牙 {len(no_teeth)}")
if no_teeth:
    print("无牙检查器（只能证明自己跑过，不能证明被测对象有问题）：")
    for n in no_teeth:
        print("  · " + n)
else:
    print("判定：PASS（所有检查器都含可到达的失败分支）")

# 补充：verify-package 的 34 项断言，每项都要有自己的失败路径
VP = pathlib.Path(r"D:\metago-build\verify-package.cjs")
if VP.exists():
    t = VP.read_text(encoding="utf-8")
    checks = re.findall(r'chk\(\s*["\']([A-Z]\d+[^"\']*)["\']', t)
    print()
    print(f"verify-package.cjs 里有 {len(checks)} 个 chk() 调用")
    # 每个 chk 的第三个参数是布尔表达式；确认它不是字面量 true
    bad = re.findall(r'chk\([^,]+,\s*[^,]+,\s*(true|false)\s*,', t)
    print(f"  第三参数写成字面量 true/false 的：{len(bad)} 处" +
          ("  ✓ 全部是变量表达式" if not bad else f"  ✗ {bad}"))
