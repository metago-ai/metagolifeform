# -*- coding: utf-8 -*-
"""clean_env_verify2.py — 修正后的干净环境验证
上一版的错：用 python.exe 去执行 .cjs 文件 → SyntaxError: invalid character '—'
正确：.cjs 用 node 跑，.py 用 python 跑。
"""
import os
import pathlib
import subprocess
import sys

PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"
H = pathlib.Path(r"D:\DSH-Official\home")
SC = H / "scripts"
MB = pathlib.Path(r"D:\metago-build")

# 只删自定义的元构变量，其余环境原样保留
# （上一版把环境剥到只剩 Windows 必需项，导致 harness 沙箱无法启动，rc=134）
CLEAN = dict(os.environ)
for dropped in ["METAGO_PYTHON", "METAGO_VERIFY_DIR", "METAGO_MEMORY_HOME"]:
    CLEAN.pop(dropped, None)

NPM = r"C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai"

TASKS = [
    ("包验收 34 项",        [NODE, str(MB / "verify-package.cjs")],                        "通过 34"),
    ("T1/T2 全量",          [NODE, str(SC / "t12-full-scan.cjs")],                         "700 / 700"),
    ("输出洁净度",          [NODE, str(SC / "null-nan-scan.cjs")],                         "0 条"),
    ("K6 schema",           [NODE, str(SC / "schema-vs-shape.cjs")],                       "总判定：PASS"),
    ("K7 元素字段",         [NODE, str(SC / "element-field-scan.cjs")],                    "总判定：PASS"),
    ("算子语义 86",         [NODE, str(SC / "ops-semantic-full.cjs")],                     "通过 86"),
    ("算法不变量 34",       [NODE, str(SC / "algo-semantic-invariants.cjs")],              "通过 34"),
    ("MCP 6 组健康",        [NODE, str(SC / "mcp-all-health.cjs")],                        "失败 0"),
    ("MCP 112 工具可调用",  [NODE, str(SC / "mcp-tools-callable.cjs")],                    "可调用 112"),
    ("补丁自愈全在位",      [NODE, str(SC / "reapply-patches.cjs"), "--check"],            "需处理 0"),
    ("原子工厂",            [NODE, NPM + "/engine/atoms/atom-factory.cjs"],                "总判定：PASS"),
    ("契约校验",            [NODE, NPM + "/engine/atoms/contract-validator.cjs"],          "失败  0"),
    ("蓝本五项声明",        [PY, str(SC / "verify_blueprint_claims3.py")],                 "不一致 0"),
    ("脚本期望 vs 实测",    [NODE, str(SC / "audit-expectations.cjs")],                    "总判定：PASS"),
    ("技能审计 112",        [PY, str(SC / "audit_skills.py")],                             "问题总数： 0"),
    ("安装一致性 33",       [PY, str(SC / "audit_install.py")],                            "一致 33"),
    ("全局安装",            [PY, str(SC / "audit_global.py")],                             "非 scoped 4 / 4"),
    ("技能注册审计",        [PY, str(SC / "audit_skill_registration.py")],                 ""),
    ("蓝本完整性",          [PY, str(SC / "scan_blueprint_integrity2.py")],                ""),
]

print("=" * 92)
print("干净环境全套验证 v2（.cjs 用 node，.py 用 python）")
print("=" * 92)
print()

ok = bad = 0
fails = []
for name, cmd, expect in TASKS:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=600, env=CLEAN, cwd=str(MB))
        out = (r.stdout or "") + (r.stderr or "")
        if expect:
            hit = expect in out
        else:
            hit = r.returncode == 0 and "Traceback" not in out
        if hit:
            ok += 1
            print(f"  ✓ {name:<22} rc={r.returncode}" + (f"  {expect}" if expect else ""))
        else:
            bad += 1
            frag = ""
            for line in out.split("\n"):
                if any(k in line for k in ["FAIL", "失败", "Traceback", "Error", "总判定", "需修复"]):
                    frag = line.strip()[:66]
                    break
            fails.append((name, frag or out.strip()[:66]))
            print(f"  ✗ {name:<22} rc={r.returncode} ｜ {frag}")
    except subprocess.TimeoutExpired:
        bad += 1
        fails.append((name, "超时"))
        print(f"  ✗ {name:<22} 超时")
    except Exception as e:
        bad += 1
        fails.append((name, str(e)[:60]))
        print(f"  ✗ {name:<22} 异常 {str(e)[:50]}")

print()
print("-" * 92)
print(f"通过 {ok} ｜ 失败 {bad}")
if fails:
    print()
    print("失败明细：")
    for n, f in fails:
        print(f"  · {n}：{f}")
else:
    print("判定：PASS（干净环境下全部成立，不依赖任何自定义环境变量）")
sys.exit(0 if bad == 0 else 1)
