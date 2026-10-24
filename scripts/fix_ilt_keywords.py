# -*- coding: utf-8 -*-
"""fix_ilt_keywords.py — 补齐 ILT 推理链关键词（DEF-049）

现象：输入「根据耦生度大于1…依据：定理推导，来源：附录卷」被判
      「Output lacks reasoning trace」，尽管这句话有完整的依据与推导表述。

根因：关键词表只有 因为/由于/所以/原因 + 【闭环分析】 + based on/therefore/reason，
      缺「依据/根据/推导/推理/论证/理由/综上/可见」等常用中文推理词。

附带问题：details 提示写「No reasoning keywords found (because/therefore/reason)」
         —— 只列英文，与实际支持中文的事实不符，会误导使用者。
"""
import pathlib
import shutil
import subprocess
import time

TARGETS = [
    pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\RUNTIME\dist\decision-lock.js"),
]
BAK = pathlib.Path(r"D:\metago-build") / ("backup-ilt-" + time.strftime("%Y%m%d-%H%M%S"))

OLD = """        const hasReasoning = output.includes('【闭环分析】') ||
            output.includes('因为') ||
            output.includes('由于') ||
            output.includes('based on') ||
            output.includes('therefore') ||
            output.includes('所以') ||
            output.includes('原因') ||
            output.includes('reason');"""

NEW = """        /* DEF-049：补齐中文推理词。原表只有 因为/由于/所以/原因，
           把「依据/根据/推导/论证/综上」这类同样明确的推理表述漏掉了。 */
        const REASONING_WORDS = [
            '【闭环分析】',
            // 中文
            '因为', '由于', '所以', '原因', '依据', '根据', '推导', '推理', '论证',
            '理由', '综上', '可见', '由此可见', '故', '因此', '进而', '从而', '据此',
            // 英文
            'based on', 'therefore', 'reason', 'because', 'thus', 'hence', 'since',
        ];
        const lower = output.toLowerCase();
        const hasReasoning = REASONING_WORDS.some(w => {
            const ww = w.toLowerCase();
            return w === '【闭环分析】' ? output.includes(w) : lower.includes(ww);
        });"""

OLD_D = """                details: ['No reasoning keywords found (because/therefore/reason)'],"""
NEW_D = """                details: ['No reasoning keywords found. 支持中文（因为/由于/所以/原因/依据/根据/推导/推理/论证/理由/因此/综上）与英文（because/therefore/thus/hence/since/based on/reason）'],"""

for p in TARGETS:
    if not p.exists():
        print(f"  - 不存在 {p}")
        continue
    s = p.read_text(encoding="utf-8")
    if "REASONING_WORDS" in s:
        print(f"  · {p.name} 已补，跳过")
        continue
    if OLD not in s:
        print(f"  ✗ {p.name} 未匹配关键词段")
        continue
    s = s.replace(OLD, NEW, 1)
    if OLD_D in s:
        s = s.replace(OLD_D, NEW_D, 1)
        print(f"  ✓ {p.name} 关键词与提示均已更新")
    else:
        print(f"  ✓ {p.name} 关键词已更新（提示未匹配）")
    BAK.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, BAK / p.name)
    p.write_text(s, encoding="utf-8")
    print(f"    备份 {BAK / p.name}")

r = subprocess.run(["node", "--check", str(TARGETS[0])], capture_output=True, text=True,
                   encoding="utf-8", errors="replace")
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])

# 实跑验证
print()
print("实跑验证（ILT 门）：")
PROBE = r'''
const { DecisionLock } = require("C:/Users/MetaGO/AppData/Roaming/npm/node_modules/@metago-ai/engine");
const CASES = [
  ["依据推导（应 PASS）", "根据耦生度大于1，系统已进入超导态。依据：定理推导，来源：附录卷。"],
  ["因为所以（应 PASS）", "因为耦生度大于1，所以系统处于超导态。"],
  ["综上可见（应 PASS）", "综上可见，方案 A 更优。"],
  ["英文 because（应 PASS）", "because the coupling score exceeds 1, the system is superconductive."],
  ["无推理（应 WARNING）", "把配置改成 8080 端口。"],
];
for (const [name, txt] of CASES) {
  const r = DecisionLock.gateILT(txt, txt);
  console.log("  " + (r.status === "pass" ? "PASS   " : "WARNING") + "  " + name);
}
'''
tmp = BAK / "_probe.cjs"
tmp.write_text(PROBE, encoding="utf-8")
r2 = subprocess.run(["node", str(tmp)], capture_output=True, text=True,
                    encoding="utf-8", errors="replace", timeout=60)
print(r2.stdout or r2.stderr[:300])
tmp.unlink(missing_ok=True)
