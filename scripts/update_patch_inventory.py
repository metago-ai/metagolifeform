# -*- coding: utf-8 -*-
"""update_patch_inventory.py — 把新增的 2 组 mcp-server 补丁纳入自愈清单"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
# 先更新独立的 reapply-patches.cjs
R = pathlib.Path(r"D:\metago-build\reapply-patches.cjs")
s = R.read_text(encoding="utf-8")

if "P13" in s:
    print("已含 P13，跳过")
else:
    OLD = """  {
    id: "P2", what: "KMWI 四层写入归一化（DEF-020）","""
    NEW = """  {
    id: "P13", what: "mcp-server: 4 工具接入 AxiomValidator（compliance/objectivity/data_provenance/critique）",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ['handleAxiomCheck(args.input, "checkCompliance"',
                    'handleAxiomCheck(args.input, "checkObjectivity"',
                    'handleAxiomCheck(args.input, "checkDataTraceability"',
                    'handleAxiomCheck(args.input, "checkCriticality"'];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "4 个分支均在位" };
      if (CHECK_ONLY) return { ok: false, why: "缺 " + miss.length + " 个分支（--check 不修改）" };
      return { ok: false, why: "缺 " + miss.length + " 个分支，需运行 wire_more_axiom_tools.py 重放" };
    },
  },
  {
    id: "P14", what: "mcp-server: TOOLKIT_TOOLS 同名工具也走硬驱动",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      if (t.includes("handleAxiomCheck(tkInput")) return { ok: true, why: "已在位" };
      return { ok: false, why: CHECK_ONLY ? "缺失（--check 不修改）" : "缺失，需运行 wire_toolkit_harddriven.py 重放" };
    },
  },
  {
    id: "P2", what: "KMWI 四层写入归一化（DEF-020）","""
    if OLD in s:
        s = s.replace(OLD, NEW, 1)
        R.write_text(s, encoding="utf-8")
        print("已给自愈器加 P13/P14")
    else:
        print("未匹配 P2 锚点")
        raise SystemExit(1)

import subprocess
r = subprocess.run(["node", "--check", str(R)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
