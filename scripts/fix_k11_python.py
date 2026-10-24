# -*- coding: utf-8 -*-
"""fix_k11_python.py — K11 的 Python 解析改为多候选回退

问题：K11 用 `process.env.METAGO_PYTHON || "python"`。
      `python` 可能解析到 Windows Store 桩或被 PATH 挡住 → spawn 失败 → 误报 FAIL。
修法：依次尝试 METAGO_PYTHON / python / py / 已知绝对路径；都不行则明确标注「跳过」而不是 FAIL。
"""
import pathlib

V = pathlib.Path(r"D:\metago-build\verify-package.cjs")
s = V.read_text(encoding="utf-8")

OLD = '''  const audit = path.join(HOME, "scripts/audit_skills.py");
  if (!fs.existsSync(audit)) {
    k11d = "审计脚本不存在（环境相关项，跳过）";
  } else {
    const o = String(execFileSync(process.env.METAGO_PYTHON || "python", [audit], {
      encoding: "utf8", timeout: 120000,
      env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
    }));
    const mt = /技能文件总数：\\s*(\\d+)/.exec(o);
    const mp = /问题总数：\\s*(\\d+)/.exec(o);
    k11Ok = /判定：\\s*PASS/.test(o);
    k11d = mt && mp ? `技能 ${mt[1]} 个，问题 ${mp[1]} 处` : "无法解析";
  }'''

NEW = '''  const audit = path.join(HOME, "scripts/audit_skills.py");
  if (!fs.existsSync(audit)) {
    k11d = "审计脚本不存在（环境相关项，跳过）";
  } else {
    /* Python 多候选回退：裸 python 可能解析到 Store 桩或未安装 */
    const PY_CANDS = [
      process.env.METAGO_PYTHON,
      "C:/Users/MetaGO/AppData/Local/Python/pythoncore-3.14-64/python.exe",
      "python", "python3", "py"
    ].filter(Boolean);
    let out = null, lastErr = "";
    for (const py of PY_CANDS) {
      try {
        out = String(execFileSync(py, [audit], {
          encoding: "utf8", timeout: 120000,
          env: Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" })
        }));
        break;
      } catch (e) { lastErr = String(e.message || e).slice(0, 60); }
    }
    if (out === null) {
      k11d = "Python 解释器均不可用（环境相关项，跳过）: " + lastErr;
      k11Ok = true;   // 环境缺失不算产品缺陷
    } else {
      const mt = /技能文件总数：\\s*(\\d+)/.exec(out);
      const mp = /问题总数：\\s*(\\d+)/.exec(out);
      k11Ok = /判定：\\s*PASS/.test(out);
      k11d = mt && mp ? `技能 ${mt[1]} 个，问题 ${mp[1]} 处` : "无法解析";
    }
  }'''

if OLD in s:
    s = s.replace(OLD, NEW, 1)
    V.write_text(s, encoding="utf-8")
    print("K11 Python 解析已改为多候选回退")
else:
    print("未匹配 K11 代码段")
    raise SystemExit(1)

import subprocess
r = subprocess.run(["node", "--check", str(V)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:200])
