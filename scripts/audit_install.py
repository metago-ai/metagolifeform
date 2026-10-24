# -*- coding: utf-8 -*-
"""audit_install.py — 核对「发行包内容」是否已全部装入活系统

对应目标 3：「给当前 DSH 系统全部安装配置好，确保系统全局用户级生效」
判定：包内每一类产物，在活系统里必须有对应且内容一致的文件。
"""
import hashlib
import pathlib
import sys

PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
NPM = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai")
H = pathlib.Path(r"D:\DSH-Official\home")


def h(p):
    try:
        return hashlib.sha256(p.read_bytes()).hexdigest()
    except Exception:
        return None


# 包内路径 → 活系统路径（逐类映射）
PAIRS = [
    # 算法层
    ("packages/algorithms/engine/algorithms/registry.js",
     NPM / "algorithms/engine/algorithms/registry.js"),
    ("packages/algorithms/engine/algorithms/t3impl/bind.cjs",
     NPM / "algorithms/engine/algorithms/t3impl/bind.cjs"),
    ("packages/algorithms/engine/algorithms/t3impl/fn-bridge.cjs",
     NPM / "algorithms/engine/algorithms/t3impl/fn-bridge.cjs"),
    ("packages/algorithms/engine/algorithms/t3impl/shapes.json",
     NPM / "algorithms/engine/algorithms/t3impl/shapes.json"),
    ("packages/algorithms/engine/algorithms/t3impl/t3test.cjs",
     NPM / "algorithms/engine/algorithms/t3impl/t3test.cjs"),
    ("packages/algorithms/engine/algorithms/t3impl/wire-shapes.cjs",
     NPM / "algorithms/engine/algorithms/t3impl/wire-shapes.cjs"),
    ("packages/algorithms/engine/algorithms/t3impl/fn-params-test.cjs",
     NPM / "algorithms/engine/algorithms/t3impl/fn-params-test.cjs"),
    # 原子层
    ("packages/engine/atoms/engine.cjs", NPM / "engine/atoms/engine.cjs"),
    ("packages/engine/atoms/atom-factory.cjs", NPM / "engine/atoms/atom-factory.cjs"),
    ("packages/engine/atoms/specialized.cjs", NPM / "engine/atoms/specialized.cjs"),
    ("packages/engine/atoms/approx.cjs", NPM / "engine/atoms/approx.cjs"),
    ("packages/engine/atoms/constraints.cjs", NPM / "engine/atoms/constraints.cjs"),
    ("packages/engine/atoms/contract-validator.cjs", NPM / "engine/atoms/contract-validator.cjs"),
    ("packages/engine/atoms/atoms-crypto-emotion.cjs", NPM / "engine/atoms/atoms-crypto-emotion.cjs"),
    ("packages/engine/atoms/verify.cjs", NPM / "engine/atoms/verify.cjs"),
    # 法则层
    ("packages/engine/CONSTITUTION/AXIOMS.md", NPM / "engine/CONSTITUTION/AXIOMS.md"),
    ("packages/engine/CORE/ATTRIBUTES.md", NPM / "engine/CORE/ATTRIBUTES.md"),
    ("packages/engine/CORE/PROTOCOLS.md", NPM / "engine/CORE/PROTOCOLS.md"),
    ("packages/engine/CORE/ATOMS.md", NPM / "engine/CORE/ATOMS.md"),
    ("packages/engine/INDEX/ENGINES.md", NPM / "engine/INDEX/ENGINES.md"),
    # 运行期治理
    ("AGENTS.md", H / "AGENTS.md"),
    # 蓝本
    ("docs/附录卷-原子契约补全-V36.11.md", H / "metago/blueprint/元构初始文档/附录卷-原子契约补全-V36.11.md"),
    ("docs/总索引-V36.11.md", H / "metago/blueprint/元构初始文档/总索引-V36.11.md"),
    # 脚本
    ("scripts/mcp-e2e.cjs", H / "scripts/mcp-e2e.cjs"),
    ("scripts/nan-scanner.cjs", H / "scripts/nan-scanner.cjs"),
    ("scripts/mcp-all-health.cjs", H / "scripts/mcp-all-health.cjs"),
    ("scripts/mutation-test.cjs", H / "scripts/mutation-test.cjs"),
    ("scripts/t12-full-scan.cjs", H / "scripts/t12-full-scan.cjs"),
    ("scripts/schema-vs-shape.cjs", H / "scripts/schema-vs-shape.cjs"),
    ("scripts/element-field-scan.cjs", H / "scripts/element-field-scan.cjs"),
    ("scripts/empty-output-scan.cjs", H / "scripts/empty-output-scan.cjs"),
    ("scripts/atom-hollow-scan.cjs", H / "scripts/atom-hollow-scan.cjs"),
    ("scripts/atom-responsive-scan.cjs", H / "scripts/atom-responsive-scan.cjs"),
]

print("=" * 92)
print("包 → 活系统 安装一致性核对")
print("=" * 92)
print("%-52s %-10s %s" % ("包内路径", "状态", "差异"))
print("-" * 92)

ok = 0
missing = []
diff = []
for rel, live in PAIRS:
    src = PKG / rel
    if not src.exists():
        missing.append((rel, "包内缺失"))
        print("%-52s %-10s %s" % (rel[:52], "包内缺失", "-"))
        continue
    if not live.exists():
        missing.append((rel, "活系统缺失"))
        print("%-52s %-10s %s" % (rel[:52], "活系统缺失", str(live)[:40]))
        continue
    hs, hl = h(src), h(live)
    if hs == hl:
        ok += 1
        print("%-52s %-10s %s" % (rel[:52], "一致", ""))
    else:
        diff.append((rel, str(live)))
        print("%-52s %-10s %s" % (rel[:52], "内容不同", str(live)[:40]))

print()
print("-" * 92)
print("合计 %d 项 ｜ 一致 %d ｜ 内容不同 %d ｜ 缺失 %d" % (len(PAIRS), ok, len(diff), len(missing)))
if diff:
    print()
    print("内容不同的项：")
    for rel, live in diff:
        print("  %s  ←→  %s" % (rel, live))
if missing:
    print()
    print("缺失的项：")
    for rel, why in missing:
        print("  %s  (%s)" % (rel, why))

# ---- 退出码（DEF-042/043：有判定行必须有退出码）----
sys.exit(0 if (len(diff) + len(missing)) == 0 else 1)
