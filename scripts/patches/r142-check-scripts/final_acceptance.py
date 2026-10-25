# -*- coding: utf-8 -*-
"""final_acceptance.py — R141 最终全量验收

把 R141 涉及的所有检查串成一次运行，输出可复现的验收报告。
每一项都记录：检查名 / 命令 / 判定 / 关键输出。
任何一个 FAIL，整体 FAIL。
"""
import json
import pathlib
import re
import subprocess
import time

H = pathlib.Path(r"D:\DSH-Official\home")
MB = pathlib.Path(r"D:\metago-build")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
PY = r"C:\Users\MetaGO\AppData\Local\Python\pythoncore-3.14-64\python.exe"
NODE = "node"

results = []


def run(name, cmd, expect_re=None, cwd=None, timeout=1800):
    t0 = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=timeout, cwd=str(cwd) if cwd else None)
        out = (r.stdout or "") + (r.stderr or "")
        rc = r.returncode
    except subprocess.TimeoutExpired:
        out, rc = "TIMEOUT", -1
    dt = round(time.time() - t0, 1)
    hit = None
    if expect_re:
        m = re.search(expect_re, out)
        hit = m.group(0) if m else None
    ok = (rc == 0) and (hit is not None if expect_re else True)
    results.append({"name": name, "cmd": " ".join(str(c) for c in cmd)[:120],
                    "rc": rc, "ok": ok, "hit": hit, "sec": dt})
    if not ok:
        tail = (out or '').strip().splitlines()[-6:]
        print(f"  ✗ {name:<34} {dt:>6}s  rc={rc}")
        for ln in tail:
            print(f"        {ln[:110]}")
    else:
        print(f"  ✓ {name:<34} {dt:>6}s  {hit}")
    return ok, out


print("=" * 96)
print("R141 最终全量验收")
print("=" * 96)

# ── L1 功能层 ────────────────────────────────────────────────
print("\n【L1 功能层】")
# ── R142 新增 13 项 ──
run("契约层 K-S1~S5", [NODE, str(MB / "contract_layer_gate.mjs")], r"总判定：PASS（契约层 57/57")
run("四方对账 J1~J7", [NODE, str(MB / "audit_schema_four_way.mjs")], r"判定：PASS（四方一致）")
run("MCP 协议合规 P1~P10", [NODE, str(MB / "verify_mcp_protocol.mjs")], r"总判定：PASS（协议合规")
run("L4 路由 60 项", [NODE, str(MB / "verify_l4_routing.mjs")], r"总判定：PASS（L4 路由 60/60")
run("按 examples 传参 30", [NODE, str(MB / "audit_by_examples.mjs")], r"按 examples 传参可跑通：30 / 30")
run("按 schema 传参 30", [NODE, str(MB / "audit_by_schema_call.mjs")], r"按 schema 传参可跑通：30 / 30")
run("变化性 30 项", [NODE, str(MB / "verify_variation.mjs")], r"变化性 30/30，无空转")
run("examples 实调 57 项", [NODE, str(MB / "verify_examples_exec.mjs")], r"K17：57/57 工具按 examples 实调通过")
run("算法性质 927 条", [NODE, str(MB / "verify_algorithms_semantic.mjs")], r"927/927 条全部通过")
run("原子值断言 597 条", [NODE, str(MB / "verify_atoms_semantic.mjs")], r"597 条：可调用 594")
run("技能实质 112 项", [NODE, str(MB / "verify_skills_substance.mjs")], r"技能 112/112")
run("横切边界/性能", [NODE, str(MB / "verify_crosscutting.mjs")], r"X-1~X-6 全绿")
run("文档包依赖 D1~D6", [NODE, str(MB / "verify_docs_and_packages.mjs")], r"文档与包 6/6")
run("契约有牙自检 11 项", [NODE, str(MB / "selftest_semantic_teeth.mjs")], r"有牙自检：11 / 11")
run("BCM 真实工具层 6 项", [NODE, str(MB / "verify_bcm_via_mcp.mjs")], r"通过 6 / 6")
run("对抗审查 A8/A9/A10", [NODE, str(MB / "adversarial_review_r142.mjs")], r"A8/A9/A10 三面全部守住")

run("全量回归 42 项", [PY, str(MB / "full-regression.py")], r"通过 \d+ ｜ 失败 0")
run("包验收 34 项", [NODE, str(H / "scripts/verify-package.cjs")], r"通过 34 ｜ 失败 0")
run("契约校验 597 条", [NODE, str(PKG / "packages/engine/atoms/contract-validator.cjs"),
                    ], r"总判定：PASS")
run("52 条蓝本原子 L1/L2/L3", [NODE, str(MB / "verify_blueprint_atoms2.mjs")], r"L-3 有语义：52 / 52")
run("三形式等价", [NODE, str(MB / "verify_three_forms2.mjs")], r"F2/F3 覆盖：30 / 30")
run("T3 绑定统计", [NODE, str(MB / "check_t3_binding.cjs")], r"bound 227 / total 227")

# ── L2 语义层 ────────────────────────────────────────────────
print("\n【L2 语义层】")
run("MCP L3 语义 30 项", [NODE, str(H / "scripts/mcp-tools-semantic.cjs")], r"语义 30/30")
run("MCP 112 工具可调用", [NODE, "scripts/mcp-tools-callable.cjs"], r"可调用 112 ｜ 不可调用 0", cwd=H)
run("记忆体状态自检", [PY, str(H / "scripts/lifeform-status-audit.py")], r"公理 10")

# ── L3 一致性层 ──────────────────────────────────────────────
print("\n【L3 一致性层】")
run("引用审计", [PY, "scripts/reference_audit2.py"], r"悬空引用 0 处", cwd=H)
run("预设描述同步", [PY, str(MB / "sync-preset-desc.py")], r"总判定：PASS")
run("法则版本表核对", [PY, str(H / "scripts/sync-law-versions.py"), "--check"], r"总判定：PASS")
run("补丁自愈 20 组", [NODE, "scripts/reapply-patches.cjs", "--check"], r"需处理 0", cwd=H)

# ── L4 环境层 ────────────────────────────────────────────────
print("\n【L4 环境层】")
run("全脚本语法门", [PY, "scripts/scripts-syntax-gate.py"], r"语法失败：0", cwd=H, timeout=900)
run("干净环境 19 项", [PY, str(MB / "clean_env_verify2.py")], r"总判定：PASS", timeout=1800)
run("CWD 无关性", [PY, str(MB / "cwd_independence.py")], r"总判定：PASS", timeout=1200)

# ── L5 元层 ──────────────────────────────────────────────────
print("\n【L5 元层】")
run("对抗式审查 7 面", [NODE, str(MB / "adversarial_review.mjs")], r"CRITICAL 0")
run("25 项总账对账", [NODE, str(MB / "reconcile_25.mjs")], r"对账完成：\d+ / \d+")
run("完整性治理门", [PY, str(H / "scripts" / "completeness-gate.py")], r"PASS", timeout=900)

# ── 汇总 ─────────────────────────────────────────────────────
print("\n" + "=" * 96)
okN = sum(1 for r in results if r["ok"])
failN = len(results) - okN
print(f"验收项：{len(results)} ｜ 通过 {okN} ｜ 失败 {failN}")
print("总判定：" + ("PASS（全量验收通过）" if failN == 0 else "FAIL"))
if failN:
    print("\n失败明细：")
    for r in results:
        if not r["ok"]:
            print(f"  ✗ {r['name']}  命令：{r['cmd']}")

print("\n明细：")
for r in results:
    print(f"  {'✓' if r['ok'] else '✗'} {r['name']:<34} {r['sec']:>6}s  {r['hit'] or ''}")

out = MB / "final_acceptance.json"
out.write_text(json.dumps({
    "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
    "total": len(results), "passed": okN, "failed": failN,
    "verdict": "PASS" if failN == 0 else "FAIL",
    "results": results,
}, ensure_ascii=False, indent=1), encoding="utf-8")

# ── R142：失败项自动留证（解决「偶发失败无法定位」）─────────────
import json as _json, datetime as _dt
_fails = [r for r in results if not r["ok"]]
if _fails:
    _log = pathlib.Path(str(OUT).replace(".json", "-fail-log.jsonl"))
    _rec = {"at": _dt.datetime.now().isoformat(timespec="seconds"),
            "fails": [{"name": r["name"], "rc": r.get("rc"), "hit": r.get("hit"), "sec": r.get("sec")} for r in _fails]}
    with _log.open("a", encoding="utf-8") as fh:
        fh.write(_json.dumps(_rec, ensure_ascii=False) + "\n")
    print(f"  ⚠ 失败留证已追加：{_log}")

print(f"\n已写出 {out}")
raise SystemExit(0 if failN == 0 else 1)
