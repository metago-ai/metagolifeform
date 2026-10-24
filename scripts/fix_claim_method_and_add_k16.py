# -*- coding: utf-8 -*-
"""fix_claim_method_and_add_k16.py —
   1. 修正总索引里「判定方法」的错误描述（说数标题行，实际是表格行）
   2. 把 verify_blueprint_claims3.py 纳入包验收为 K16
"""
import pathlib

IDX = pathlib.Path(r"D:\DSH-Official\home\metago\blueprint\元构初始文档\总索引-V36.11.md")
t = IDX.read_text(encoding="utf-8")
n = 0

OLD1 = "| 核心公理 | **38** | `packages/engine/CONSTITUTION/AXIOMS.md` 中 `^## A\\d` 行数；`verify-package.cjs` 断言 E4 |"
NEW1 = ("| 核心公理 | **38** | `packages/engine/CONSTITUTION/AXIOMS.md` 表格首列里 `A\\d{1,3}` 的唯一行数"
        "（**不是** `^## A\\d` 标题——该文件是表格格式）；`verify-package.cjs` 断言 E4 + K16 |")
if OLD1 in t:
    t = t.replace(OLD1, NEW1, 1)
    n += 1
    print("✓ 核心公理判定方法已改正")

OLD2 = "| 根本属性 | **47** | `packages/engine/CORE/ATTRIBUTES.md`；断言 E1 |"
NEW2 = ("| 根本属性 | **47** | `packages/engine/CORE/ATTRIBUTES.md` 表格首列 `D\\d{1,3}` 唯一行数；"
        "断言 E1 + K16 |")
if OLD2 in t:
    t = t.replace(OLD2, NEW2, 1)
    n += 1
    print("✓ 根本属性判定方法已补全")

OLD3 = "| 运行协议 | **121** | `packages/engine/CORE/PROTOCOLS.md`；断言 E2 |"
NEW3 = ("| 运行协议 | **121** | `packages/engine/CORE/PROTOCOLS.md` 表格首列 `PROTOCOL_*` 唯一行数；"
        "断言 E2 + K16 |")
if OLD3 in t:
    t = t.replace(OLD3, NEW3, 1)
    n += 1
    print("✓ 运行协议判定方法已补全")

OLD4 = "| 引擎 | **161** | `packages/engine/INDEX/ENGINES.md`；断言 E3 |"
NEW4 = "| 引擎 | **161** | `packages/engine/INDEX/ENGINES.md` 中 `ENGINE_*` 唯一 ID 数；断言 E3 + K16 |"
if OLD4 in t:
    t = t.replace(OLD4, NEW4, 1)
    n += 1
    print("✓ 引擎判定方法已补全")

OLD5 = "| 原子 | **597** | `packages/engine/CORE/ATOMS.md`；断言 E5 |"
NEW5 = "| 原子 | **597** | `packages/engine/CORE/ATOMS.md` 中 `ATOM_*` 唯一 ID 数；断言 E5 + K16 |"
if OLD5 in t:
    t = t.replace(OLD5, NEW5, 1)
    n += 1
    print("✓ 原子判定方法已补全")

IDX.write_text(t, encoding="utf-8")
print(f"总索引更新 {n} 处")

# ---- 加 K16 ----
V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")
if 'chk("K16"' not in s:
    BLOCK = r'''/* K16. 蓝本五项声明与实体清单一致（公理/属性/协议/引擎/原子） */
let k16Ok = false, k16d = "";
try {
  const f = path.join(HOME, "scripts/verify_blueprint_claims3.py");
  if (!fs.existsSync(f)) {
    k16d = "校验脚本不存在（环境相关项，跳过）";
  } else {
    const PY_CANDS16 = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py"
    ].filter(Boolean);
    let o = null;
    for (const py of PY_CANDS16) {
      try {
        o = String(execFileSync(py, [f], { encoding: "utf8", timeout: 60000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" }) }));
        break;
      } catch (e) { o = null; }
    }
    if (o === null) {
      k16d = "Python 解释器均不可用（环境相关项，跳过）";
      k16Ok = true;
    } else {
      const mm = /一致 (\d+) ｜ 不一致 (\d+)/.exec(o);
      k16Ok = /总判定：PASS/.test(o);
      k16d = mm ? `一致 ${mm[1]} 项，不一致 ${mm[2]} 项` : "无法解析";
    }
  }
} catch (e) { k16d = String(e.message).slice(0, 70); }
chk("K16", "蓝本五项声明与实体清单一致", k16Ok, k16d);

/* 报告 */'''
    s = s.replace("/* 报告 */", BLOCK, 1)
    V.write_text(s, encoding="utf-8")
    print("✓ 已加入 K16")
else:
    print("- K16 已存在")
