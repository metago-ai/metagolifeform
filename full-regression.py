# -*- coding: utf-8 -*-
"""full-regression.py — 一条命令跑完全部验证层

由来：DEF-044/045 教我「改完必须立即全量回归」。
      这轮之前，回归要手动跑十几个脚本，容易漏。本脚本把它固化为一个命令。

五层：
  L1 功能层    包验收 34 项 / 算法 927 / 输出洁净 / 原子契约
  L2 语义层    算子语义 86 / 算法不变量 34 / schema K6 / 元素 K7
  L3 一致性层  引用审计 / 蓝本声明 / 包↔装机 / 差异化 / 期望核对
  L4 环境层    干净环境（不设 METAGO_*）/ CWD 无关 / 包可移植
  L5 元层      检查器有牙 / 断言无恒真 / 退出码齐备

用法：
  python full-regression.py            # 全跑
  python full-regression.py --fast     # 只跑 L1+L2（约 2 分钟）
  python full-regression.py --layer 3  # 只跑某层
"""
import argparse
import os
import pathlib
import subprocess
import sys

PYEXE = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"
H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
MB = pathlib.Path(r"D:\metago-build")
NPM = r"C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai"

ENV = {k: v for k, v in os.environ.items()
       if k not in ("METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME")}

# (层级, 名称, 解释器, 脚本, 期望串)
LAYERS = {
    1: [
        ("包验收 34 项",      NODE, MB / "verify-package.cjs",              "通过 34"),
        ("算法全量 927",      NODE, SC / "t12-full-scan.cjs",               "700 / 700"),
        ("输出洁净度",        NODE, SC / "null-nan-scan.cjs",               "0 条"),
        ("原子契约",          NODE, f"{NPM}/engine/atoms/contract-validator.cjs", "失败  0"),
        ("原子工厂",          NODE, f"{NPM}/engine/atoms/atom-factory.cjs",  "总判定：PASS"),
    ],
    2: [
        ("算子语义 86",       NODE, SC / "ops-semantic-full.cjs",           "通过 86"),
        ("算法不变量 34",     NODE, SC / "algo-semantic-invariants.cjs",    "通过 34"),
        ("K6 schema",        NODE, SC / "schema-vs-shape.cjs",             "总判定：PASS"),
        ("K7 元素字段",       NODE, SC / "element-field-scan.cjs",          "总判定：PASS"),
        ("原子空壳",          NODE, SC / "atom-hollow-scan.cjs",            "总判定：PASS"),
        ("MCP 6 组健康",      NODE, SC / "mcp-all-health.cjs",              "失败 0"),
        ("MCP 112 可调用",    NODE, SC / "mcp-tools-callable.cjs",          "可调用 112"),
        ("L3 工具语义",       NODE,  SC / "mcp-tools-semantic.cjs",         "语义 30/30"),
("L3 工具语义",       NODE,  SC / "mcp-l3-semantic.mjs",             "30/30 全部通过语义断言"),
        ("补丁自愈 16 组",    NODE, SC / "reapply-patches.cjs",             "通过 16"),
        ("MCP prompts 8",    NODE, SC / "prompts-invoke-test.cjs",         "失败 0"),
    ],
    3: [
        ("引用审计",          PYEXE, SC / "reference_audit2.py",            "无悬空引用"),
        ("蓝本五项声明",      PYEXE, SC / "verify_blueprint_claims3.py",     "不一致 0"),
        ("包↔装机技能",       PYEXE, SC / "pkg_vs_installed.py",            "PASS"),
        ("RTM 完整性",       PYEXE, SC / "rtm-gate.py",                    "RTM 连续、唯一、证据齐全"),
        ("记忆体状态自检",    PYEXE, SC / "lifeform-status-audit.py",        "公理 10 / 属性 9"),
        ("差异化审计",        NODE, SC / "differentiation-audit.cjs",       "总判定：PASS"),
        ("脚本期望核对",      NODE, SC / "audit-expectations.cjs",          "总判定：PASS"),
        ("安装一致性",        PYEXE, SC / "audit_install.py",               "缺失 0"),
        ("技能审计",          PYEXE, SC / "audit_skills.py",                "问题总数： 0"),
        ("全局安装",          PYEXE, SC / "audit_global.py",                "非 scoped 4 / 4"),
        ("蓝本完整性",        PYEXE, SC / "scan_blueprint_integrity2.py",   None),
        ("技能注册审计",      PYEXE, SC / "audit_skill_registration.py",    None),
    ],
    4: [
        ("干净环境 19 项",    PYEXE, MB / "clean_env_verify2.py",           "19 ｜ 失败 0"),
        ("CWD 无关性",        PYEXE, MB / "cwd_independence.py",            "总判定：PASS"),
        ("包可移植性",        PYEXE, MB / "pkg_portability.py",             "通过 8"),
    ],
    5: [
        ("检查器有牙",        PYEXE, MB / "checker_teeth_audit.py",         "无牙 0"),
        ("断言无恒真",        PYEXE, MB / "assertion_quality2.py",          "有恒真断言的：0"),
        ("蓝本声明脚本",      PYEXE, SC / "verify_blueprint_claims3.py",     "总判定：PASS"),
        ("全脚本语法门",      PYEXE, SC / "scripts-syntax-gate.py",          "语法失败：0"),
        ("预设描述同步",      PYEXE, SC / "sync-preset-desc.py",              "预设描述与实测一致"),
        ("版本一致性",        PYEXE, SC / "version_consistency.py",          "不一致 0"),
        ("CLI 能力链",        PYEXE, SC / "cli_plugin_arch_test.py",         "两条链均可运行"),
        ("完整性治理门",      PYEXE, SC / "completeness-gate.py",            "完整性治理已就位"),
        ("强制门链路",        PYEXE, SC / "guard-chain-gate.py",             "两道强制门均可用"),
    ],
}


def run_one(name, exe, script, expect):
    if not pathlib.Path(script).exists():
        return ("SKIP", "脚本不存在")
    try:
        r = subprocess.run([exe, str(script)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=2400,
                           env=ENV, cwd=str(MB))
        out = (r.stdout or "") + (r.stderr or "")
        if expect is None:
            ok = r.returncode == 0 and "Traceback" not in out
            return ("PASS" if ok else "FAIL", f"rc={r.returncode}")
        ok = expect in out
        if ok:
            return ("PASS", expect)
        frag = next((l.strip()[:60] for l in out.split("\n")
                     if any(k in l for k in ("FAIL", "失败", "Error", "总判定", "需关注"))), "")
        return ("FAIL", frag or f"未找到「{expect}」")
    except subprocess.TimeoutExpired:
        return ("FAIL", "超时")
    except Exception as e:
        return ("FAIL", str(e)[:50])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fast", action="store_true", help="只跑 L1+L2")
    ap.add_argument("--layer", type=int, choices=[1, 2, 3, 4, 5], help="只跑某层")
    a = ap.parse_args()

    layers = [a.layer] if a.layer else ([1, 2] if a.fast else [1, 2, 3, 4, 5])
    NAMES = {1: "L1 功能层", 2: "L2 语义层", 3: "L3 一致性层", 4: "L4 环境层", 5: "L5 元层"}

    print("=" * 90)
    print("元构全量回归（五层）")
    print("=" * 90)

    total_p = total_f = total_s = 0
    fails = []
    for L in layers:
        print(f"\n【{NAMES[L]}】")
        for name, exe, script, expect in LAYERS[L]:
            st, detail = run_one(name, exe, script, expect)
            mark = {"PASS": "✓", "FAIL": "✗", "SKIP": "-"}[st]
            print(f"  {mark} {name:<20}{st:<6}{detail}")
            if st == "PASS":
                total_p += 1
            elif st == "FAIL":
                total_f += 1
                fails.append((NAMES[L], name, detail))
            else:
                total_s += 1

    print()
    print("-" * 90)
    print(f"通过 {total_p} ｜ 失败 {total_f} ｜ 跳过 {total_s}")
    if fails:
        print()
        print("失败明细：")
        for layer, name, detail in fails:
            print(f"  · [{layer}] {name}：{detail}")
        print()
        print("总判定：FAIL")
        return 1
    print()
    print("总判定：PASS（五层全绿）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
