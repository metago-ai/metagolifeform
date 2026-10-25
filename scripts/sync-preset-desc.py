# -*- coding: utf-8 -*-
"""sync-preset-desc.py — Agent 预设描述自动同步（方案 B）

问题：preset.patch.yml 的 description 与顶部注释里写死了数字
      （法则体积 / 章数 / 技能数 / 版本 / 截断量），
      AGENTS.md 或技能一变它们就过期——已经出现过一次（V36.9.4 / 89,282 B / 100 技能）。

做法：从**实测**重新生成这两段文字，其余内容一字不动。

安全设计（六道闸）：
  ① 只替换两个用 marker 精确定位的段落，不做全文替换
  ② 行尾保持：原文是 CRLF，读时归一到 LF 处理，写时按原样还原为 CRLF；
     写完校验「CRLF 数 == LF 总数」且无 BOM——行尾被改会被当场抓住
  ③ 改前备份到 D:\\metago-build\\backup-preset-sync-<时间戳>\\
  ④ 改后做 7 项结构校验：顶层是数组 / 含 insert 段 / plugin 行数不变 /
     persona.prefix sha 不变 / !!js 标签数不变 / order:2 / maxBytes 不变
  ⑤ 任一项不通过 → 不写入（宁可不动，不可改错）
  ⑥ 两处（源码 + 装机）SHA256 必须一致

用法：
  python sync-preset-desc.py --check           只检查，不改（回归用这个）
  python sync-preset-desc.py --fix             检查并回填
  python sync-preset-desc.py --fix --dry-run   打印将写入的内容，不落盘
"""
import argparse
import hashlib
import json
import pathlib
import re
import shutil
import sys
import time

H = pathlib.Path(r"D:\DSH-Official\home")
SRC = pathlib.Path(r"D:\Documents\deepseek-harness\default-workspace\metago-dsh-lifeform"
                   r"\packages\metago-lifeform-dsh\patch\preset.patch.yml")
INST = H / "profiles" / "desktop" / "node_modules" / "metago-lifeform-dsh" / "patch" / "preset.patch.yml"
AGENTS = H / "AGENTS.md"
SKILLS = H / "skills"
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.12.0")
BAKROOT = pathlib.Path(r"D:\metago-build")

BIG_BUDGET = 262144      # 现 maxBytes
SMALL_BUDGET = 65536     # 出厂默认 maxBytes


# ─────────────────────────── 实测 ───────────────────────────
def measure():
    if not AGENTS.exists():
        raise SystemExit(f"AGENTS.md 不存在：{AGENTS}")
    raw = AGENTS.read_bytes()
    text = raw.decode("utf-8")
    ag_bytes = len(raw)
    ag_lines = text.count("\n") + 1

    h2 = [h.strip() for h in re.findall(r"^## (.+)$", text, re.M)]
    chapters = len([h for h in h2 if re.match(r"^第.+?章", h)])

    # 若按 SMALL_BUDGET 截断（UTF-8 边界安全）
    trunc = raw[:SMALL_BUDGET]
    while trunc:
        try:
            tt = trunc.decode("utf-8")
            break
        except UnicodeDecodeError:
            trunc = trunc[:-1]
    kept = {h.strip() for h in re.findall(r"^## (.+)$", tt, re.M)} if trunc else set()
    lost = [h for h in h2 if h not in kept]
    trunc_bytes = ag_bytes - len(trunc) if trunc else ag_bytes

    n_skills = len([d for d in SKILLS.iterdir()
                    if d.is_dir() and (d / "SKILL.md").exists()]) if SKILLS.exists() else 0

    ver = None
    for cand in [PKG / "VERSION", H / "VERSION"]:
        if cand.exists():
            v = cand.read_text(encoding="utf-8").strip()
            if v:
                ver = v if v.upper().startswith("V") else "V" + v
                break
    if not ver:
        m = re.search(r"V36\.\d+\.\d+", text)
        ver = m.group(0) if m else "V?"
    ver = ver.upper().replace("VV", "V")

    n_axioms = len(re.findall(r"^\|\s*A\d{1,3}\b", text, re.M))
    n_attrs = len(re.findall(r"^\|\s*D\d{1,3}\b", text, re.M))

    mcp_tools = metago_tools = algorithms_tools = n_algorithms = None
    pj = PKG / "package.json"
    if pj.exists():
        try:
            d = json.loads(pj.read_bytes().decode("utf-8-sig"))
            mm = d.get("metago", {})
            if isinstance(mm, dict):
                mcp_tools = int(mm["mcpTools"]) if mm.get("mcpTools") else None
                n_algorithms = int(mm["algorithms"]) if mm.get("algorithms") else None
        except Exception:
            pass
    m = re.search(r"`metago`\s*\|\s*(\d{2,3})", text)
    if m:
        metago_tools = int(m.group(1))
    m = re.search(r"`metago-algorithms`\s*\|\s*(\d{2,3})", text)
    if m:
        algorithms_tools = int(m.group(1))
    if n_algorithms is None:
        m = re.search(r"\*\*(\d{3})\*\*\s*\|\s*\*\*6 个 MCP 服务器\*\*", text)
        if m:
            n_algorithms = int(m.group(1))

    return {
        "ver": ver, "ag_bytes": ag_bytes, "ag_lines": ag_lines,
        "chapters": chapters, "h2": len(h2),
        "trunc_bytes": trunc_bytes, "lost": lost,
        "n_skills": n_skills, "n_axioms": n_axioms, "n_attrs": n_attrs,
        "mcp_tools": mcp_tools, "metago_tools": metago_tools,
        "algorithms_tools": algorithms_tools, "n_algorithms": n_algorithms,
        "remain": BIG_BUDGET - ag_bytes,
    }


# ───────────────── 生成两段文本（唯一写死的是版式） ─────────────────
def gen_comment(m):
    parts = []
    for h in m["lost"]:
        parts.append(h)
    if parts:
        lost_block = "\n".join("#   - " + p for p in parts)
    else:
        lost_block = "#   （无）"
    return (
        "# WHY 262144 AND NOT THE SHIPPED 65536:\n"
        f"#   `$DSH_HOME/AGENTS.md` is the MetaGO law, {m['ag_bytes']:,} B / "
        f"{m['chapters']} chapters ({m['h2']} level-2 headings).\n"
        f"#   At {SMALL_BUDGET} the composer truncates {m['trunc_bytes']:,} B and "
        f"{len(m['lost'])} headings:\n"
        f"{lost_block}\n"
        f"#   Current budget {BIG_BUDGET:,} leaves {m['remain']:,} B of headroom.\n"
        "#   This row is the ONLY place that budget takes effect: `dsh-web-app` disables the\n"
        "#   host-plane `agent-instructions` row, so an override for that row id in\n"
        "#   `$DSH_HOME/cordis.patch.yml` is inert."
    )


def gen_desc(m):
    tool = ""
    if m["mcp_tools"] and m["metago_tools"] and m["algorithms_tools"] and m["n_algorithms"]:
        tool = (f"{m['mcp_tools']} 个元构 MCP 工具"
                f"（{m['metago_tools']} + {m['algorithms_tools']} · {m['n_algorithms']} 算法）、")
    elif m["mcp_tools"]:
        tool = f"{m['mcp_tools']} 个元构 MCP 工具、"
    first = (f"元构·智能生命体（MetaGO Intelligent Lifeform）{m['ver']} 全量模式：")
    second = (f"完整 {m['ag_bytes']:,} B 法则（第零节 UDGK + {m['chapters']} 章 + "
              f"架构治理 + 完整性治理，{m['n_axioms']} 公理 / {m['n_attrs']} 属性）、")
    third = f"{m['n_skills']} 个 metago-* 技能、{tool}"
    return ("        description: >-\n"
            f"          {first}\n"
            f"          {second}\n"
            f"          {third}\n"
            "          四层 KMWI 记忆，以及元构控制台原生界面。")


# ─────────────────────── 定位与替换 ───────────────────────
RE_COMMENT = re.compile(
    r"# WHY 262144 AND NOT THE SHIPPED 65536:\n(?:#[^\n]*\n)*?#[ ]{3}[^\n]*is inert\.")
RE_DESC = re.compile(
    r"        description: >-\n(?:          [^\n]*\n)+?          四层 KMWI 记忆，以及元构控制台原生界面。")


def structure_of(t):
    m = re.search(r"prefix: \|-\n((?:                [^\n]*\n|                \n)*)", t)
    prefix = m.group(1) if m else ""
    return {
        "top_is_array": t.lstrip("\ufeff").lstrip().startswith("- insert:"),
        "has_insert": "- insert:" in t,
        "has_preset_id": "- id: preset-metago" in t,
        "plugins": len(re.findall(r"^\s{6}- id: ", t, re.M)),
        "js_tags": t.count("!!js"),
        "prefix_sha": hashlib.sha256(prefix.encode()).hexdigest()[:12],
        "order2": "order: 2" in t,
        "maxbytes": f"maxBytes: {BIG_BUDGET}" in t,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--fix", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not a.check and not a.fix:
        a.check = True

    m = measure()
    print("=" * 94)
    print("Agent 预设描述同步")
    print("=" * 94)
    print("实测基准：")
    print(f"  版本         {m['ver']}")
    print(f"  AGENTS.md    {m['ag_bytes']:,} B ｜ {m['ag_lines']:,} 行 ｜ "
          f"{m['chapters']} 章 ｜ {m['h2']} 个二级标题")
    print(f"  技能         {m['n_skills']} 个")
    print(f"  公理/属性    {m['n_axioms']} / {m['n_attrs']}（法则第二/三章表格行数）")
    print(f"  MCP 工具     {m['mcp_tools']}（metago {m['metago_tools']} + "
          f"algorithms {m['algorithms_tools']} · {m['n_algorithms']} 算法）")
    print(f"  {SMALL_BUDGET:,} 截断  丢 {m['trunc_bytes']:,} B / {len(m['lost'])} 个二级标题")
    print(f"  {BIG_BUDGET:,} 余量  {m['remain']:,} B")

    targets = [p for p in [SRC, INST] if p.exists()]
    if not targets:
        print("\n✗ 源码与装机位置都不存在")
        return 1

    new_comment = gen_comment(m)
    new_desc = gen_desc(m)
    bad = 0

    for p in targets:
        raw = p.read_bytes()
        has_crlf = b"\r\n" in raw
        has_bom = raw[:3] == b"\xef\xbb\xbf"
        t = raw.decode("utf-8-sig" if has_bom else "utf-8").replace("\r\n", "\n")

        before = structure_of(t)
        mc = RE_COMMENT.search(t)
        md = RE_DESC.search(t)
        print()
        print(f"■ {p.name}  （{'CRLF' if has_crlf else 'LF'} 行尾 ｜ BOM {'有' if has_bom else '无'}）")
        print(f"    定位：注释 {'✓' if mc else '✗'} ｜ description {'✓' if md else '✗'}")
        if not mc or not md:
            print("    ✗ 段落定位失败 —— 拒绝改动（防止误伤）")
            bad += 1
            continue

        cur_c = mc.group(0).strip()
        cur_d = md.group(0).strip()
        same = (cur_c == new_comment.strip()) and (cur_d == new_desc.strip())
        print(f"    比对：注释 {'一致' if cur_c == new_comment.strip() else '需更新'} ｜ "
              f"description {'一致' if cur_d == new_desc.strip() else '需更新'}")
        if same:
            print("    ✓ 已是最新，无需改动")
            continue
        if a.check:
            bad += 1
            print("    ✗ 与实测不一致（运行 --fix 回填）")
            continue

        t2 = RE_COMMENT.sub(lambda _: new_comment, t, count=1)
        t2 = RE_DESC.sub(lambda _: new_desc, t2, count=1)
        after = structure_of(t2)

        checks = [
            ("顶层是数组", before["top_is_array"], after["top_is_array"]),
            ("含 insert 段", before["has_insert"], after["has_insert"]),
            ("含 preset-metago", before["has_preset_id"], after["has_preset_id"]),
            ("plugin 行数", before["plugins"], after["plugins"]),
            ("!!js 标签数", before["js_tags"], after["js_tags"]),
            ("persona.prefix sha", before["prefix_sha"], after["prefix_sha"]),
            ("order: 2", before["order2"], after["order2"]),
            (f"maxBytes {BIG_BUDGET}", before["maxbytes"], after["maxbytes"]),
        ]
        fail = [(n, b, af) for n, b, af in checks if b != af]
        print("    结构校验：" + ("全部通过 ✓" if not fail else f"✗ {fail}"))
        if fail:
            print("    ✗ 结构发生变化 —— 放弃写入")
            bad += 1
            continue

        if a.dry_run:
            print("    [dry-run] 将写入：")
            for l in new_desc.split("\n"):
                print("      " + l)
            continue

        # 备份 → 写入（按原文行尾还原）
        BAKROOT.mkdir(parents=True, exist_ok=True)
        bk = BAKROOT / ("backup-preset-sync-" + time.strftime("%Y%m%d-%H%M%S"))
        bk.mkdir(exist_ok=True)
        shutil.copy2(p, bk / p.name)

        payload = t2.replace("\n", "\r\n") if has_crlf else t2
        data = payload.encode("utf-8")
        if has_bom:
            data = b"\xef\xbb\xbf" + data
        for _ in range(5):
            try:
                p.write_bytes(data)
                break
            except PermissionError:
                time.sleep(0.8)

        # 写后校验行尾 / BOM / 字节数
        raw2 = p.read_bytes()
        crlf2 = raw2.count(b"\r\n")
        lf2 = raw2.count(b"\n")
        eol_ok = (crlf2 == lf2) if has_crlf else (crlf2 == 0)
        bom_ok = (raw2[:3] == b"\xef\xbb\xbf") == has_bom
        print(f"    ✓ 已写回 {len(raw):,} → {len(raw2):,} B ｜ 备份 {bk.name}")
        print(f"    行尾校验：CRLF {crlf2} / LF {lf2} → {'✓ 保持' if eol_ok else '✗ 被改'}"
              f" ｜ BOM {'✓ 保持' if bom_ok else '✗ 被改'}")
        if not eol_ok or not bom_ok:
            p.write_bytes(raw)
            print("    ✗ 行尾/BOM 异常 —— 已回滚")
            bad += 1

    if len(targets) == 2:
        h1 = hashlib.sha256(SRC.read_bytes()).hexdigest()[:12]
        h2 = hashlib.sha256(INST.read_bytes()).hexdigest()[:12]
        print()
        print(f"两处一致性：源码 {h1} ｜ 装机 {h2} ｜ {'✓ 一致' if h1 == h2 else '✗ 不一致'}")
        if h1 != h2:
            bad += 1

    print()
    print("-" * 94)
    if a.check:
        print("总判定：" + ("PASS（预设描述与实测一致）" if bad == 0
                         else f"FAIL（{bad} 处与实测不一致）"))
    else:
        print("总判定：" + ("PASS（同步完成，结构未变）" if bad == 0 else f"需关注（{bad} 处）"))
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
