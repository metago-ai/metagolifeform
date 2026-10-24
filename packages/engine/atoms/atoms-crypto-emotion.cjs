"use strict";
/**
 * atoms-crypto-emotion.cjs — 4 个曾被误判为「需外部」的原子的真实实现
 *
 * 为什么写这个文件：
 *   此前把 ATOM_SECURITY_ENCRYPT_603 / ATOM_SECURITY_DECRYPT_604 / ATOM_EMOTION_RECOG_502 /
 *   ATOM_ACCESSIBLE_READ_506 标为 EXTERNAL_NEEDED（需模型/外部服务），
 *   复核后确认这是**误判**：
 *     - 加解密：Node 内置 crypto 即可，AES-256-GCM 是真实现，不需要外部服务
 *     - 情绪识别：基于词库 + 标点 + 程度的规则算法（与 metago-emotion 技能同源），纯 JS 可实现
 *     - 无障碍阅读：结构化文本抽取（标题/段落/列表分块），TTS 部分才需要外部
 */

const crypto = require("crypto");

const r4 = x => { const p = 1e4; return Math.round((Number(x) || 0) * p) / p; };
const clamp01 = x => Math.max(0, Math.min(1, x));

/* ---------------- 情绪词库（与 metago-emotion 技能同源） ---------------- */
const LEX = {
  /* LEX_V2：每类扩到 24-30 个常用词，覆盖口语化表达 */
  joy: ["开心", "高兴", "快乐", "满意", "喜欢", "兴奋", "太好了", "棒", "赞", "优秀", "完美",
    "不错", "很好", "挺好", "真好", "愉快", "舒服", "顺利", "成功", "惊喜", "期待",
    "感激", "感谢", "幸福", "美好", "精彩", "给力", "牛", "爱了", "心动"],
  anger: ["生气", "愤怒", "气愤", "恼火", "烦", "讨厌", "滚", "废物", "垃圾", "气死",
    "火大", "离谱", "无语", "荒唐", "过分", "恶劣", "愚蠢", "坑", "耍我", "不可接受",
    "忍不了", "受够", "胡闹", "岂有此理", "暴怒", "抓狂"],
  sadness: ["难过", "伤心", "失望", "沮丧", "遗憾", "可惜", "哭", "委屈", "低落",
    "郁闷", "心痛", "无奈", "绝望", "悲伤", "失落", "孤单", "想哭", "难捱",
    "提不起劲", "没意思", "心累", "崩溃"],
  anxiety: ["担心", "焦虑", "紧张", "害怕", "恐惧", "不安", "着急", "慌", "压力",
    "忐忑", "忧心", "发愁", "不敢", "怕", "悬着", "没底", "慌神", "心慌",
    "坐立不安", "惴惴", "折磨", "煎熬"],
  surprise: ["惊讶", "意外", "没想到", "居然", "竟然", "吃惊", "震惊", "出乎意料",
    "不可思议", "意外之喜", "万万没想到", "稀奇", "罕见", "反转", "神奇"],
  fatigue: ["累", "疲惫", "困", "撑不住", "干不动", "疲乏", "乏累", "倦", "没力气",
    "熬不住", "精疲力尽", "身心俱疲", "打不动", "眼冒金星", "想睡", "耗尽了"],
};
const NEGATORS = ["不", "没", "别", "无", "非", "未"];
const INTENSIFIERS = { "非常": 1.6, "特别": 1.5, "极其": 1.8, "很": 1.3, "太": 1.4, "超": 1.5, "有点": 0.7, "稍微": 0.6 };

function detectEmotion(input) {
  // 兼容：字符串直接传 / 对象从常见字段取
  const s = typeof input === "string"
    ? input
    : String((input && (input.text ?? input.content ?? input.message ?? input.utterance)) ?? "");
  const scores = {};
  Object.keys(LEX).forEach(k => { scores[k] = 0; });
  const hits = [];

  Object.keys(LEX).forEach(k => {
    LEX[k].forEach(w => {
      let idx = s.indexOf(w);
      while (idx >= 0) {
        // 词前 4 字符窗口
        let pre = s.slice(Math.max(0, idx - 4), idx);
        // 程度词先剥离，避免「非常」里的「非」被误判为否定词
        let mult = 1;
        Object.keys(INTENSIFIERS).forEach(f => {
          if (pre.includes(f)) { mult = INTENSIFIERS[f]; pre = pre.split(f).join(""); }
        });
        // 否定词判定（在剥离程度词之后的残余上判断）
        const negated = NEGATORS.some(n => pre.endsWith(n) || pre.includes(n + "是") || pre.includes(n + "太"));
        const w2 = negated ? 0 : mult;
        if (w2 > 0) scores[k] += w2;
        hits.push({ word: w, emotion: k, negated, weight: r4(w2) });
        idx = s.indexOf(w, idx + w.length);
      }
    });
  });

  // 标点特征
  const exclam = (s.match(/[!！]/g) || []).length;
  const quest = (s.match(/[?？]/g) || []).length;
  const ellipsis = (s.match(/…|\.\.\./g) || []).length;
  if (exclam) { scores.anger += exclam * 0.3; scores.joy += exclam * 0.2; }
  if (quest) scores.anxiety += quest * 0.3;
  if (ellipsis) scores.sadness += ellipsis * 0.2;

  const entries = Object.keys(scores).map(k => ({ emotion: k, score: r4(scores[k]) }))
    .sort((a, b) => b.score - a.score);
  const top = entries[0];
  const total = entries.reduce((a, x) => a + x.score, 0);
  const confidence = total === 0 ? 0 : clamp01(top.score / total);

  return {
    情绪: top.score === 0 ? "neutral" : top.emotion,
    emotion_state: top.score === 0 ? "neutral" : top.emotion,
    confidence: r4(confidence),
    intensity: r4(clamp01(total / 5)),
    scores: entries,
    命中词: hits.slice(0, 8),
    标点特征: { 感叹号: exclam, 问号: quest, 省略号: ellipsis },
    n: s.length,
  };
}

/* ---------------- 加解密（AES-256-GCM 真实现） ---------------- */
const DEFAULT_KEY = crypto.createHash("sha256").update("metago-default-key").digest();

function encryptAtom(input) {
  const o = input && typeof input === "object" ? input : {};
  const plain = String(o.text ?? o.data ?? o.content ?? (typeof input === "string" ? input : ""));
  const keySrc = String(o.key ?? o.password ?? "");
  const key = keySrc ? crypto.createHash("sha256").update(keySrc).digest() : DEFAULT_KEY;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    algorithm: "aes-256-gcm",
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    payload: [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join("."),
    keySource: keySrc ? "user-provided" : "built-in-default",
    bytes: enc.length,
    plainBytes: Buffer.byteLength(plain, "utf8"),
  };
}

function decryptAtom(input) {
  const o = input && typeof input === "object" ? input : {};
  const keySrc = String(o.key ?? o.password ?? "");
  const key = keySrc ? crypto.createHash("sha256").update(keySrc).digest() : DEFAULT_KEY;
  try {
    let iv, tag, data;
    if (o.payload && typeof o.payload === "string" && o.payload.split(".").length === 3) {
      [iv, tag, data] = o.payload.split(".");
    } else {
      iv = o.iv; tag = o.tag; data = o.ciphertext;
    }
    if (!iv || !tag || !data) {
      return { success: false, error: "缺少 iv / tag / ciphertext", reason: "MISSING_FIELDS" };
    }
    const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    const out = Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
    return { 明文: out, text: out, verified: true, algorithm: "aes-256-gcm", bytes: Buffer.byteLength(out, "utf8") };
  } catch (e) {
    return { success: false, error: "解密失败（密钥错误或数据被篡改）: " + e.message.slice(0, 60), reason: "DECRYPT_FAILED" };
  }
}

/* ---------------- 无障碍阅读：结构化分块（TTS 才需外部） ---------------- */
function accessibleRead(input) {
  const o = input && typeof input === "object" ? input : {};
  const text = String(o.text ?? o.content ?? (typeof input === "string" ? input : ""));
  const blocks = [];
  const lines = text.split(/\r?\n/);
  let idx = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    idx++;
    let type = "paragraph";
    if (/^#{1,6}\s/.test(line)) type = "heading";
    else if (/^[-*+]\s/.test(line)) type = "list-item";
    else if (/^\d+[.)]\s/.test(line)) type = "ordered-item";
    else if (/^>/.test(line)) type = "quote";
    else if (line.length <= 20) type = "short-line";
    blocks.push({ seq: idx, type, text: line.replace(/^#{1,6}\s|^[-*+]\s|^\d+[.)]\s|^>\s?/, ""), chars: line.length });
  }
  const totalChars = blocks.reduce((a, b) => a + b.chars, 0);
  return {
    阅读块: blocks,
    blocks,
    块数: blocks.length,
    总字数: totalChars,
    预计朗读秒数: r4(totalChars / 4.5),
    ssml: blocks.map(b => `<p>${b.text.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</p>`).join(""),
    ttsRequired: true,
    note: "结构化分块与 SSML 为纯 JS 产出；实际语音合成需接入 TTS 服务",
  };
}

module.exports = { detectEmotion, encryptAtom, decryptAtom, accessibleRead, LEX };

/* 自测 */
if (require.main === module) {
  console.log("=".repeat(74));
  console.log("曾被误判为「需外部」的 4 个原子 · 真实实现自测");
  console.log("=".repeat(74));
  let pass = 0, fail = 0;
  const ok = (n, c, d) => { if (c) { pass++; console.log("PASS  " + n.padEnd(18) + d); } else { fail++; console.log("FAIL  " + n.padEnd(18) + d); } };

  // 情绪
  const e1 = detectEmotion("太生气了！这个功能怎么又坏了！！");
  ok("情绪识别·愤怒", e1.emotion_state === "anger", JSON.stringify({ 情绪: e1.emotion_state, 置信: e1.confidence, 强度: e1.intensity }));
  const e2 = detectEmotion("今天心情很好，非常满意");
  ok("情绪识别·喜悦", e2.emotion_state === "joy", JSON.stringify({ 情绪: e2.emotion_state, 置信: e2.confidence }));
  const e3 = detectEmotion("嗯，知道了");
  ok("情绪识别·中性", e3.emotion_state === "neutral", JSON.stringify({ 情绪: e3.emotion_state }));
  const e4 = detectEmotion("我不开心");
  ok("情绪识别·否定处理", e4.scores.find(s => s.emotion === "joy").score === 0, "「不开心」不应计为喜悦");

  // 加解密
  const enc = encryptAtom({ text: "元构机密数据 2026", key: "my-secret" });
  ok("加密", enc.algorithm === "aes-256-gcm" && enc.ciphertext.length > 0, "算法=" + enc.algorithm + " 密文长度=" + enc.ciphertext.length);
  const dec = decryptAtom({ payload: enc.payload, key: "my-secret" });
  ok("解密·正确密钥", dec.明文 === "元构机密数据 2026", JSON.stringify({ 明文: dec.明文, 校验: dec.verified }));
  const dec2 = decryptAtom({ payload: enc.payload, key: "wrong-key" });
  ok("解密·错误密钥应失败", dec2.success === false, dec2.error.slice(0, 40));
  const enc2 = encryptAtom({ text: "same text", key: "k" });
  ok("加密·随机 IV", enc2.payload !== encryptAtom({ text: "same text", key: "k" }).payload, "两次加密结果不同（IV 随机）");

  // 无障碍阅读
  const ar = accessibleRead({ text: "# 标题\n这是一段正文内容。\n- 列表项一\n- 列表项二\n> 引用内容" });
  ok("无障碍阅读", ar.块数 === 5 && ar.阅读块[0].type === "heading", JSON.stringify({ 块数: ar.块数, 类型: ar.阅读块.map(b => b.type) }));

  console.log();
  console.log(`合计 ${pass + fail} 项 ｜ 通过 ${pass} ｜ 失败 ${fail}`);
  console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(fail === 0 ? 0 : 1);
}
