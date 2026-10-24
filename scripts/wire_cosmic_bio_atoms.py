# -*- coding: utf-8 -*-
"""wire_cosmic_bio_atoms.py — 把 3 个新实现的原子接入工厂（DEF-027 正向修复）

改动：
  1. EXTERNAL_NEEDED 移除 3 个（引力波 / 分布式存在 / 跨物种）
  2. 新增 SPECIAL_IMPL 映射 + 对应的模块加载
"""
import pathlib
import shutil
import subprocess
import time

F = pathlib.Path(r"C:\Users\META~1\AppData\Roaming\npm\node_modules\@metago-ai\engine\atoms\atom-factory.cjs")
if not F.exists():
    # 用完整用户名路径
    F = pathlib.Path(r"C:\Users\MetaGO\AppData\Roaming\npm\node_modules\@metago-ai\engine\atoms\atom-factory.cjs")

BACKUP = pathlib.Path(r"D:\metago-build") / ("backup-factory-" + time.strftime("%Y%m%d-%H%M%S"))
s = F.read_text(encoding="utf-8")

if "cosmicBio" in s:
    print("已接入，跳过")
    raise SystemExit(0)

# 1) EXTERNAL_NEEDED 缩小到 2 个
OLD_EXT = """EXTERNAL_NEEDED = new Set([
  "ATOM_ACCESSIBLE_SIGN_507", "ATOM_BIO_NEURAL_021", "ATOM_BIO_SPECIES_025", "ATOM_COSMIC_GRAVITY_032", "ATOM_COSMIC_DISTRIBUTE_030",
]);"""
NEW_EXT = """EXTERNAL_NEEDED = new Set([
  /* 经逐条评估，以下 3 个已用确定性算法真实实现，移至 SPECIAL_IMPL：
       ATOM_COSMIC_GRAVITY_032   → 匹配滤波（真实信号处理）
       ATOM_COSMIC_DISTRIBUTE_030→ CRDT 式多实例状态融合
       ATOM_BIO_SPECIES_025      → 客观声学特征提取（明确不做语义翻译）
     仍保留外部依赖的 2 个，理由是纯 JS 无法从零实现：
       ATOM_ACCESSIBLE_SIGN_507  → 需手语视频理解模型
       ATOM_BIO_NEURAL_021       → 需脑电信号 + 训练好的意图解码器 */
  "ATOM_ACCESSIBLE_SIGN_507", "ATOM_BIO_NEURAL_021",
]);"""
if OLD_EXT in s:
    s = s.replace(OLD_EXT, NEW_EXT, 1)
    print("EXTERNAL_NEEDED 已从 5 缩到 2")
else:
    print("未匹配 EXTERNAL_NEEDED")
    raise SystemExit(1)

# 2) SPECIAL_IMPL 增加 3 个映射
OLD_SI = """SPECIAL_IMPL = {
  ATOM_SECURITY_ENCRYPT_603: "encryptAtom",
  ATOM_SECURITY_DECRYPT_604: "decryptAtom",
  ATOM_EMOTION_RECOG_502: "detectEmotion",
  ATOM_ACCESSIBLE_READ_506: "accessibleRead",
};"""
NEW_SI = """SPECIAL_IMPL = {
  ATOM_SECURITY_ENCRYPT_603: "encryptAtom",
  ATOM_SECURITY_DECRYPT_604: "decryptAtom",
  ATOM_EMOTION_RECOG_502: "detectEmotion",
  ATOM_ACCESSIBLE_READ_506: "accessibleRead",
  /* V36.11 补充：曾判「需外部」，实为可确定性计算 */
  ATOM_COSMIC_GRAVITY_032: "gravityWavePerceiver",
  ATOM_COSMIC_DISTRIBUTE_030: "distributedExistence",
  ATOM_BIO_SPECIES_025: "crossSpeciesPerceiver",
};"""
if OLD_SI in s:
    s = s.replace(OLD_SI, NEW_SI, 1)
    print("SPECIAL_IMPL 已加 3 个映射")
else:
    print("未匹配 SPECIAL_IMPL")
    raise SystemExit(1)

# 3) 增加 cosmicBio() 加载器（复用 cryptoEmotion 的写法）
OLD_CE = "let _CE = null;"
NEW_CE = """let _CB = null;
function cosmicBio() {
  if (_CB === null) {
    try { _CB = require("./atoms-cosmic-bio.cjs"); } catch (e) { _CB = false; }
  }
  return _CB || null;
}

let _CE = null;"""
if OLD_CE in s:
    s = s.replace(OLD_CE, NEW_CE, 1)
    print("已加 cosmicBio 加载器")
else:
    print("未匹配 _CE 锚点")
    raise SystemExit(1)

# 4) make() 里优先从 cosmicBio 取实现
OLD_MAKE = """  if (SPECIAL_IMPL[atomId]) {
    const ce = cryptoEmotion();"""
NEW_MAKE = """  if (SPECIAL_IMPL[atomId]) {
    const fname = SPECIAL_IMPL[atomId];
    // 先找 cosmicBio（引力波/分布式/跨物种），再找 cryptoEmotion
    const cb = cosmicBio();
    if (cb && typeof cb[fname] === "function") {
      return function cosmicBioAtom(input) {
        try {
          const out = cb[fname](input);
          if (out && typeof out === "object") return out;
          return { ok: false, success: false, reason: "NON_OBJECT_OUTPUT" };
        } catch (e) {
          return { ok: false, success: false, reason: "EXEC_ERROR", message: String(e.message || e).slice(0, 120) };
        }
      };
    }
    const ce = cryptoEmotion();"""
if OLD_MAKE in s:
    s = s.replace(OLD_MAKE, NEW_MAKE, 1)
    print("make() 已优先取 cosmicBio 实现")
else:
    print("未匹配 make() 锚点")
    raise SystemExit(1)

BACKUP.mkdir(parents=True, exist_ok=True)
shutil.copy2(F, BACKUP / F.name)
F.write_text(s, encoding="utf-8")
print("已备份并写回:", BACKUP / F.name)

r = subprocess.run(["node", "--check", str(F)], capture_output=True, text=True)
print("语法:", "OK" if r.returncode == 0 else "错 " + (r.stderr or "")[:300])
