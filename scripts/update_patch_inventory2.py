# -*- coding: utf-8 -*-
"""update_patch_inventory2.py — 把 emotion / negentropy / 词库补丁纳入自愈"""
import pathlib
import subprocess

R = pathlib.Path(r"D:\metago-build\reapply-patches.cjs")
s = R.read_text(encoding="utf-8")

if "P15" in s:
    print("已含 P15，跳过")
    raise SystemExit(0)

OLD = """  {
    id: "P13", what: "mcp-server: 4 工具接入 AxiomValidator（compliance/objectivity/data_provenance/critique）","""

NEW = '''  {
    id: "P15", what: "mcp-server: emotion 工具接真分类器（含 createRequire 修复）",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ["handleEmotion", "emotionMod", "createRequire", "__cjsRequire"];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "加载器+handler+分发均在位" };
      return { ok: false, why: CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_emotion_tool2.py + fix_emotion_esm.py" };
    },
  },
  {
    id: "P16", what: "mcp-server: negentropy 工具接熵算子",
    run: () => {
      const f = path.join(NPM, "mcp-server/dist/index.js");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      const need = ["handleNegentropy", "specMod", "pickNumbers"];
      const miss = need.filter(x => !t.includes(x));
      if (miss.length === 0) return { ok: true, why: "加载器+handler+分发均在位" };
      return { ok: false, why: CHECKLESS = CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_negentropy_tool.py" };
    },
  },
  {
    id: "P17", what: "engine: 情绪词库扩充（LEX_V2，每类 24-30 词）",
    run: () => {
      const f = path.join(NPM, "engine/atoms/atoms-crypto-emotion.cjs");
      if (!fs.existsSync(f)) return { ok: false, why: "文件不存在" };
      const t = fs.readFileSync(f, "utf8");
      if (t.includes("LEX_V2")) return { ok: true, why: "已扩充" };
      return { ok: false, why: CHECK_ONLY ? "缺失（--check 不修改）" : "缺失，需重放 expand_emotion_lexicon.py" };
    },
  },
  {
    id: "P13", what: "mcp-server: 4 工具接入 AxiomValidator（compliance/objectivity/data_provenance/critique）",'''

# 修掉我写错的一处表达式
NEW = NEW.replace('CHECKLESS = CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_negentropy_tool.py"',
                  'CHECK_ONLY ? "缺 " + miss.join(",") : "缺 " + miss.join(",") + "，需重放 wire_negentropy_tool.py"')

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    R.write_text(s, encoding="utf-8")
    print("已加 P15/P16/P17")
else:
    print("未匹配 P13 锚点")
    raise SystemExit(1)

r = subprocess.run(["node", "--check", str(R)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:250])
