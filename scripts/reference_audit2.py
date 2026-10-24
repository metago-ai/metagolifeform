# -*- coding: utf-8 -*-
"""reference_audit2.py — 修正判据后的引用审计

上一版两个错：
  CORR-022  把 MCP prompts 当 tools（那 8 个 prompt 名字全对）
  CORR-023  正则 \bmetago-build\b 会命中 metago-build-engineer 的前缀；
            且把包名/仓库名/目录名/文件名/特性名都当成技能名
本版：
  · 工具检查同时拉 tools/list 与 prompts/list
  · 技能检查用「整词 + 后面不接 -」的精确匹配，并排除已知非技能名
"""
import json
import pathlib
import sys
import re
import subprocess

H = pathlib.Path(r"D:\DSH-Official\home")
PKG = pathlib.Path(r"D:\metago-build\outbound\v36.10.0\metagolifeform-v36.11.0")
NODE = "node"

DOCS = [H / "AGENTS.md"]
for d in [H / "docs", H / "metago" / "blueprint" / "元构初始文档"]:
    if d.exists():
        DOCS += [p for p in d.rglob("*.md") if "backup" not in str(p)]

# ---------- 取 MCP tools + prompts 真实清单 ----------
PROBE = r'''
const {spawn}=require('child_process');
const S=process.argv[2];
const c=spawn(process.execPath,[S],{stdio:['pipe','pipe','pipe']});
let buf='',id=0;const pend=new Map();
const send=o=>{try{c.stdin.write(JSON.stringify(o)+'\n')}catch(e){}};
const call=(m,p)=>new Promise(r=>{const i=++id;pend.set(i,r);send({jsonrpc:'2.0',id:i,method:m,params:p})});
c.stdout.on('data',d=>{buf+=d.toString();let i;while((i=buf.indexOf('\n'))>=0){const l=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!l)continue;let m;try{m=JSON.parse(l)}catch(e){continue}if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}}});
c.stderr.on('data',()=>{});
(async()=>{
  await call('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'a',version:'1'}});
  const tl=await call('tools/list',{});
  const pl=await call('prompts/list',{});
  process.stdout.write(JSON.stringify({
    tools: ((tl.result&&tl.result.tools)||[]).map(t=>t.name),
    prompts: ((pl.result&&pl.result.prompts)||[]).map(p=>p.name)
  }));
  c.kill();
})();
'''

print("=" * 90)
print("引用审计 v2（修正判据）")
print("=" * 90)

real_tools, real_prompts = set(), set()
p = H / "scripts" / "_probe_mcp_names.cjs"
p.write_text(PROBE, encoding="utf-8")
try:
    r = subprocess.run([NODE, str(p), r"C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/mcp-server/dist/index.js"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    data = json.loads(r.stdout)
    real_tools = set(data["tools"])
    real_prompts = set(data["prompts"])
except Exception as e:
    print("  探测失败:", e)
finally:
    p.unlink(missing_ok=True)
print(f"\n实测：tools {len(real_tools)} 个 ｜ prompts {len(real_prompts)} 个")

# ---------- 1) scripts ----------
script_refs = set()
for f in DOCS:
    t = f.read_text(encoding="utf-8", errors="replace")
    script_refs |= set(re.findall(r"scripts/([A-Za-z0-9_\-]+\.(?:cjs|py|mjs|js))", t))
miss_s = sorted(s for s in script_refs
                if not (H / "scripts" / s).exists() and not (PKG / "scripts" / s).exists())
print(f"\n① scripts 引用 {len(script_refs)} ｜ 缺失 {len(miss_s)}" + ("  ✓" if not miss_s else ""))
for s in miss_s[:10]:
    print("    ✗ " + s)

# ---------- 2) MCP 工具 + prompt ----------
tool_refs = set()
for f in DOCS:
    t = f.read_text(encoding="utf-8", errors="replace")
    tool_refs |= set(re.findall(r"\bmetago_[a-z][a-z0-9_]{2,40}\b", t))
# DSH 插件宿主工具（不属于 MCP 服务器，按 MCP 列表查不到）
DSH_BUILTIN_TOOLS = {'metago_lifeform_status'}
known = real_tools | real_prompts | DSH_BUILTIN_TOOLS
miss_t = sorted(t for t in tool_refs if t not in known)
print(f"\n② MCP 工具/prompt 引用 {len(tool_refs)} ｜ 找不到 {len(miss_t)}" + ("  ✓" if not miss_t else ""))
for s in miss_t[:10]:
    print("    ✗ " + s)

# ---------- 3) 技能（精确匹配）----------
installed = {d.name for d in (H / "skills").iterdir() if d.is_dir() and (d / "SKILL.md").exists()}
NOT_SKILL = {
    # 包名 / 仓库名
    "metago-ai", "metago-lifeform", "metago-lifeform-dsh", "metago-cli",
    "metago-completeness-kit", "metago-veracity-kit", "metago-arch-gov",
    "metago-algorithms", "metago-dev-kit", "metago-dsh-lifeform",
    "metago-skills", "metago-skills-hub", "metago-skills-sdk",
    "metago-studio", "metago-certify", "metago-website",
    # 目录名 / 文件名 / 特性名
    "metago-backup", "metago-logo", "metago-voice",
    "metago-build",              # 路径片段 D:\\\\metago-build\\\\ 与 generated_by
    "metago-d6gfw1e4rf2a5bcad",  # 腾讯云 CloudBase 环境 ID
}
skill_refs = set()
for f in DOCS:
    t = f.read_text(encoding="utf-8", errors="replace")
    # 整词：前面非字母数字，后面不接 - 或字母数字
    for m in re.findall(r"(?<![A-Za-z0-9_\-])metago-[a-z][a-z0-9\-]*[a-z0-9](?![A-Za-z0-9\-])", t):
        skill_refs.add(m)
skill_refs -= NOT_SKILL
miss_k = sorted(s for s in skill_refs if s not in installed)
print(f"\n③ 技能引用 {len(skill_refs)} ｜ 未安装 {len(miss_k)}" + ("  ✓" if not miss_k else ""))
for s in miss_k[:12]:
    print("    ✗ " + s)

# ---------- 4) packages 路径 ----------
pkg_refs = set()
for f in DOCS:
    t = f.read_text(encoding="utf-8", errors="replace")
    pkg_refs |= set(re.findall(r"packages/([A-Za-z0-9_\-/]+\.(?:md|js|cjs|json|ts))", t))
miss_p = []
for rel in sorted(pkg_refs):
    if not (PKG / "packages" / rel).exists():
        miss_p.append(rel)
print(f"\n④ packages/ 路径引用 {len(pkg_refs)} ｜ 找不到 {len(miss_p)}" + ("  ✓" if not miss_p else ""))
for s in miss_p[:8]:
    print("    ✗ packages/" + s)

print()
print("-" * 90)
total = len(miss_s) + len(miss_t) + len(miss_k) + len(miss_p)
print(f"悬空引用 {total} 处（脚本 {len(miss_s)} / 工具 {len(miss_t)} / 技能 {len(miss_k)} / 路径 {len(miss_p)}）")
print("总判定：" + ("PASS（无悬空引用）" if total == 0 else "需关注"))

# ---- 退出码（门禁语义）：必须基于四类缺失之和，不能只判其中一类（CORR-027）----
TOTAL_MISSING = len(miss_s) + len(miss_t) + len(miss_k) + len(miss_p)
sys.exit(0 if TOTAL_MISSING == 0 else 1)