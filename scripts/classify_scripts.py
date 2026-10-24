# -*- coding: utf-8 -*-
"""classify_scripts.py — 把装机脚本分成「产品级」与「开发期」

发现：$DSH_HOME/scripts 下有 100+ 个脚本，其中大量是开发过程中的一次性工具
      （fix-*.cjs / debug-*.cjs / check-*.cjs / peek-*.cjs / hollow-*.cjs / dump-*.cjs …）。
      它们不属于产品能力，装进系统只会造成：
        · 装机包臃肿
        · 「装机一致性」审计被噪声淹没
        · 用户看到一堆 fix-*.cjs 无法理解

判定标准（产品级 = 同时满足）：
  1. 有明确的产品用途（验收 / 审计 / 安装 / 运维 / 回滚 / 自愈）
  2. 会被文档或其它脚本引用
  3. 不是「修某一条具体缺陷」的一次性动作
"""
import pathlib
import re

H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"

# 明确的产品级脚本（白名单：宁可少列，不可多留）
PRODUCT = {
    # 验收 / 回归
    "verify-package.cjs", "t12-full-scan.cjs", "ops-semantic-full.cjs",
    "algo-semantic-invariants.cjs", "schema-vs-shape.cjs", "element-field-scan.cjs",
    "mutation-test.cjs", "null-nan-scan.cjs", "atom-hollow-scan.cjs",
    "atom-responsive-scan.cjs", "find-hangs.cjs", "nan-scanner.cjs",
    "validator-robustness.cjs", "probe-type-crashes.cjs", "scan-type-assumptions.cjs",
    # MCP
    "mcp-all-health.cjs", "mcp-tools-callable.cjs", "mcp-tool-nature.cjs", "mcp-e2e.cjs",
    # 安装 / 一致性
    "audit_install.py", "audit_global.py", "audit_skills.py", "audit_skill_registration.py",
    "audit_law_references2.py", "compare_plugin_copies.py",
    "reapply-patches.cjs", "patch-inventory.cjs", "build-package.cjs",
    # 记忆 / 持久化
    "test-kmwi-persistence.cjs", "memory-guard.cjs",
    # 蓝本校验
    "scan_blueprint_integrity2.py", "scan_code_fences.py",
    # 语义核查
    "guide-quality.cjs", "ops-semantic-correctness.cjs",
    # 形态/口径
    "scan_fragile_invocation.py", "scan_stale_numbers.py",
    # 交付
    "make_delivery.py",
    # 平台适配
    "build-adapters.cjs",
}

def is_product(name: str) -> bool:
    if name in PRODUCT:
        return True
    # 未被白名单覆盖的，按前缀判定
    return False

rows = []
for p in sorted(SC.iterdir()):
    if not p.is_file():
        continue
    if p.suffix not in (".cjs", ".py", ".mjs", ".js"):
        continue
    rows.append((p.name, p.stat().st_size, is_product(p.name)))

prod = [r for r in rows if r[2]]
dev = [r for r in rows if not r[2]]

print("=" * 92)
print("装机脚本分类")
print("=" * 92)
print(f"总计 {len(rows)} 个脚本 ｜ 产品级 {len(prod)} ｜ 开发期 {len(dev)}")
print()
print("■ 产品级（保留在 $DSH_HOME/scripts）")
for n, s, _ in prod:
    print(f"    {n:<44} {s:>9,} B")
print()
print("■ 开发期（建议从装机包剔除，仅留在 D:\\metago-build）")
DEV_PREFIX = ("fix-", "fix_", "debug-", "check-", "peek-", "hollow-", "dump-",
              "solve-", "analyze-", "probe-", "print-", "show-", "list-", "get-",
              "test-", "add_k", "finalize", "add_", "backport", "apply_", "patch_")
for n, s, _ in dev:
    tag = "一次性" if n.startswith(DEV_PREFIX) else "未归类"
    print(f"    {n:<44} {s:>9,} B   [{tag}]")
print()
print("-" * 92)
total_dev = sum(x[1] for x in dev)
print(f"剔除后可为装机包减重 {total_dev:,} B（{total_dev/1024:.1f} KB）")
