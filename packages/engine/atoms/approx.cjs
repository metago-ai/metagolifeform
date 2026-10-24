"use strict";
/**
 * approx.cjs — 语义近似层（元创造）
 *
 * 问题：597 条原子中有 329 条语义是「翻译 / 解释 / 报告 / 识别 / 评估」——
 *       严格来说需要语言模型或专用模型，纯 JS 无法做到"真"。
 *
 * 但「需要模型」不等于「什么都不能做」。本层为这些原子提供**确定性近似**：
 *   - 能确定性地做到的，就真做（术语替换、结构化摘要、模板填充、规则分诊…）
 *   - 做不到的部分，输出里明确标注 approximated:true 与 limits
 *   - 绝不假装是模型输出
 *
 * 这是"诚实降级"而非"假装成功"：调用方看到 approximated 就知道该结果的边界。
 */

const round = (x, n = 4) => { const p = 10 ** n; return Math.round((Number(x) || 0) * p) / p; };
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/* ---- 蓝本术语表（策展 37 条：原文抽取 27 + 人工补充 10）---- */
const BLUEPRINT_GLOSSARY = {
  "引擎": "可被调用、可嵌入、可扩展，能让更多人拥有自己的智能体",
  "智能体": "具备自主性、主动性、进化能力、价值对齐，不是被动工具",
  "感知": "全域数据采集与数字孪生构建",
  "全息": "十层架构，每一层都包含其他层的完整信息，实现全息映射",
  "协同": "通过SIP协议实现自动、可信的协作",
  "元创造": "元创造引擎根据缺口分析，生成新的原子/算法/协议/引擎/能力族",
  "负熵责任": "智能体必须对社会整体有序性做出净贡献",
  "专利耦生度": "衡量两项专利之间技术相关性、协同价值、组合创新潜力的量化指标",
  "全息创造": "第13大能力族\"全息创造族\"、D41\"全息创造性\"、A35公理、架构精简至11层",
  "合规主动": "主动合规，法律优先于效率",
  "边界感知": "识别自身能力失效的那一点，进化由此开始",
  "分布式": "智能分布于整个空间，而非集中于单一节点",
  "完整性": "系统内部各要素形成闭环、无缺环的状态",
  "过程": "对观察数据进行模式识别、因果推断、意义建构",
  "行动": "基于分析结果，在现实世界中设计并执行一个具体的干预或创造物",
  "意义": "事物在更大系统中承担的作用与指向",
  "本质": "剥离表象后不可再分的核心规定性",
  "求解": "基于内化理论进行诊断与策略推演",
  "元元进化": "L8.5元创新创造层、D40\"元进化可进化性\"、A34公理",
  "耦生": "两个系统长期互动后彼此塑造，单独看任一方都说不清",
  "负熵": "让系统更有秩序的那部分贡献",
  "涌现": "整体出现了部分单独都不具备的性质",
  "元进化": "不只是变强，而是变得更有能力变强",
  "超导态": "耦生度超过 1，协作产出大于各自之和",
  "境生智能": "智能不只在主体内部，而是分布在环境之中，环境本身就是智能的载体",
  "耦生智能": "碳基生命、硅基智能、比特信息三者持续互动中涌现出的系统性智能",
  "决策锁": "输出前的四道强制校验：意图验证、谱系追踪、语义门、完整性",
  "能力族": "按能力类型对原子、算法、协议进行归组的能力分类体系",
  "元思想": "构成元构推理框架的 19 个思想体系",
  "空间智能体": "以物理空间为界面与作用域的智能体，感知并改造环境",
  "操作系统": "基于行为全生命周期数据的动态信用评价与资源调度",
  "元构智能体引擎": "元构全息智能引擎（MetaGO）",
  "四层安全基因": "建立四层安全基因协议，从感知层、知识层、算法层、输出层四层保障系统安全",
  "价值共振": "多维价值维度之间的同向增强",
  "元镜引擎": "系统自我观察、持续反思",
  "负熵率": "系统对社会有序度的净贡献速率",
  "全息映射": "每一层都包含其他层的完整信息",
};

/* ---------------- 人工术语表（补充常用非元构术语） ---------------- */
const GLOSSARY = {
  "耦生": "两个系统长期互动后彼此塑造，单独看任一方都说不清",
  "负熵": "让系统更有秩序的那部分贡献",
  "元进化": "不只是变强，而是变得更有能力变强",
  "全息": "每一部分都携带整体的信息",
  "涌现": "整体出现了部分单独都不具备的性质",
  "超导态": "耦生度超过 1，协作产出大于各自之和",
  "T1": "基础算法层，通用数学与统计",
  "T2": "复合算法层，面向具体场景",
  "T3": "概念算法层，元构特有方法论",
  "KT": "内核测试，最小可验证单元",
  "API": "程序之间约定好的调用方式",
  "LLM": "大语言模型，能读写自然语言的模型",
  "MCP": "模型与工具之间的标准接口协议",
  "Agent": "能感知环境并采取行动的程序",
  "智能体": "具备自主感知、记忆、决策、交互、执行能力的系统",
};

/* 政策/技术术语 → 通俗表述 */
const PLAIN = {
  "申报": "申请", "截止": "最后期限", "补贴": "给的钱", "额度": "最多能拿多少",
  "资质": "需要的条件", "备案": "登记一下", "审批": "等批准", "普惠": "大家都能享受",
  "专项": "专门针对某一类", "配套": "跟着一起给的", "扶持": "帮忙支持",
  "产业化": "变成能卖的产品", "中试": "小批量试产", "研发": "研究和开发",
};

const APPROX = {
  /* 翻译 / 通俗化：术语替换 + 句子切分（真做，但有边界） */
  translate(input) {
    const text = String((input && (input.text || input.content)) || pickText(input));
    let out = text;
    const hits = [];
    Object.keys(PLAIN).forEach(k => {
      if (out.includes(k)) { hits.push(k); out = out.split(k).join(PLAIN[k]); }
    });
    const ALLT = Object.assign({}, BLUEPRINT_GLOSSARY, GLOSSARY);
    Object.keys(ALLT).forEach(k => {
      if (out.includes(k)) { hits.push(k); out = out.split(k).join("（" + ALLT[k] + "）"); }
    });
    const sentences = text.split(/[。！？.!?]+/).filter(Boolean);
    return {
      通俗解释: out,
      术语命中: hits,
      句数: sentences.length,
      approximated: true,
      limits: hits.length ? "基于内置术语表替换，未做语义理解；未收录术语保持原文" : "无可用术语条目，原文返回",
    };
  },

  /* 解释 / 祛魅：术语表 + 类比模板 */
  explain(input) {
    const text = String((input && (input.text || input.concept)) || pickText(input));
    const ALL = Object.assign({}, BLUEPRINT_GLOSSARY, GLOSSARY);
    const found = Object.keys(ALL).filter(k => text.includes(k));
    return {
      解释: found.map(k => `${k}：${ALL[k]}`).join("；") || "未在术语表中找到对应条目",
      命中术语: found,
      覆盖: found.length > 0,
      approximated: true,
      limits: "仅覆盖内置术语表；表外概念需模型或人工补充",
    };
  },

  /* 报告生成：结构化模板填充（真做） */
  report(input) {
    const o = input && typeof input === "object" ? input : {};
    const nums = [];
    (function w(v) {
      if (typeof v === "number" && isFinite(v)) nums.push(v);
      else if (Array.isArray(v)) v.forEach(w);
      else if (v && typeof v === "object") Object.values(v).forEach(w);
    })(o);
    const lines = ["# 自动生成报告", ""];
    lines.push(`输入字段：${Object.keys(o).join("、") || "无"}`);
    lines.push(`数值项：${nums.length} 个`);
    if (nums.length) {
      lines.push(`均值：${round(mean(nums))}，极值：${round(Math.min(...nums))} ~ ${round(Math.max(...nums))}`);
    }
    Object.keys(o).forEach(k => {
      const v = o[k];
      if (v !== null && typeof v !== "object") lines.push(`- ${k}：${v}`);
    });
    return {
      报告: lines.join("\n"),
      字段数: Object.keys(o).length,
      数值项: nums.length,
      approximated: true,
      limits: "结构化模板填充，不做因果分析或结论推断",
    };
  },

  /* 分诊 / 判断：规则表（真做） */
  triage(input) {
    const text = String((input && (input.text || input.condition)) || pickText(input)).toLowerCase();
    const RULES = [
      [/急|严重|立即|危险|紧急/, "high", "存在紧急信号，建议立即处理"],
      [/持续|长期|反复|加重/, "medium", "问题持续存在，建议尽快处理"],
      [/轻微|偶尔|一般/, "low", "程度较轻，常规处理即可"],
    ];
    let level = "unknown", advice = "无匹配规则，需人工判断";
    for (const [re, lv, ad] of RULES) { if (re.test(text)) { level = lv; advice = ad; break; } }
    return {
      级别: level, 建议: advice, approximated: true,
      limits: "基于关键词规则的粗分诊，不构成专业判断",
    };
  },

  /* 评估 / 打分：多指标合成（真做） */
  assess(input) {
    const nums = [];
    (function w(v) {
      if (typeof v === "number" && isFinite(v)) nums.push(v);
      else if (Array.isArray(v)) v.forEach(w);
      else if (v && typeof v === "object") Object.values(v).forEach(w);
    })(input);
    if (!nums.length) {
      return { 评分: 0, 说明: "无数值指标可评估", approximated: true, limits: "需至少一个数值指标" };
    }
    const norm = nums.map(x => Math.max(0, Math.min(1, x)));
    const s = mean(norm);
    return {
      评分: round(s),
      grade: s >= 0.85 ? "A" : s >= 0.7 ? "B" : s >= 0.55 ? "C" : "D",
      各指标: nums.map(x => round(x)),
      指标数: nums.length,
      approximated: true,
      limits: "指标等权归一化后取均值；未考虑指标间权重与因果",
    };
  },

  /* 匹配 / 检索：关键词交集（真做） */
  match(input) {
    const o = input && typeof input === "object" ? input : {};
    const need = String(o.need || o.query || pickText(o)).toLowerCase();
    const pool = Array.isArray(o.pool || o.candidates) ? (o.pool || o.candidates) : [];
    const scored = pool.map((it, i) => {
      const s = JSON.stringify(it).toLowerCase();
      const words = need.split(/[\s,，、]+/).filter(w => w.length > 1);
      const hit = words.filter(w => s.includes(w)).length;
      return { index: i, item: it, score: round(words.length ? hit / words.length : 0) };
    }).sort((a, b) => b.score - a.score);
    return {
      匹配结果: scored.slice(0, 5),
      候选数: pool.length,
      最佳得分: scored.length ? scored[0].score : 0,
      approximated: true,
      limits: "关键词字面匹配，未做语义相似度",
    };
  },

  /* 规划 / 路线：分阶段模板（真做） */
  plan(input) {
    const nums = [];
    (function w(v) { if (typeof v === "number" && isFinite(v)) nums.push(v); else if (v && typeof v === "object") Object.values(v).forEach(w); })(input);
    const horizon = nums.length ? Math.max(3, Math.round(nums.length)) : 3;
    const phases = [];
    for (let i = 0; i < Math.min(horizon, 6); i++) {
      phases.push({
        phase: i + 1,
        name: ["现状梳理", "目标设定", "方案设计", "试点验证", "规模推广", "复盘迭代"][i] || `阶段${i + 1}`,
        focus: i === 0 ? "把现状说清楚" : i === Math.min(horizon, 6) - 1 ? "固化并迭代" : "推进并验证"
      });
    }
    return { 路线图: phases, 阶段数: phases.length, approximated: true, limits: "通用阶段模板，未结合具体领域约束" };
  },
};

function pickText(o) {
  if (!o || typeof o !== "object") return String(o || "");
  for (const k of Object.keys(o)) {
    if (typeof o[k] === "string") return o[k];
  }
  return JSON.stringify(o).slice(0, 500);
}

/* 关键词 → 近似算子 */
const ROUTES = [
  [/翻译|通俗|祛魅|转换为.*语言/, "translate"],
  [/解释|说明|讲解/, "explain"],
  [/报告|汇总生成|总结成/, "report"],
  [/分诊|判断.*级别|紧急|预警级别/, "triage"],
  [/评估|打分|评分|价值判断/, "assess"],
  [/匹配|检索|推荐|筛选/, "match"],
  [/路线|规划|计划|路径/, "plan"],
];

function pickApprox(desc, name) {
  const blob = String(desc || "") + " " + String(name || "");
  for (const [re, op] of ROUTES) if (re.test(blob)) return { op, fn: APPROX[op] };
  return null;
}

module.exports = { APPROX, ROUTES, pickApprox, GLOSSARY, PLAIN, BLUEPRINT_GLOSSARY };

/* 自测 */
if (require.main === module) {
  console.log("=".repeat(74));
  console.log("语义近似层自测");
  console.log("=".repeat(74));
  const CASES = [
    ["translate", { text: "本次补贴申报截止日期为月底，需提交资质材料" }],
    ["explain", { concept: "耦生与涌现的关系" }],
    ["report", { a: 1, b: 2, c: "正常" }],
    ["triage", { text: "持续头痛两周并加重" }],
    ["assess", { x: 0.8, y: 0.6, z: 0.9 }],
    ["match", { need: "农机 补贴", pool: [{ t: "农机购置补贴" }, { t: "人才公寓" }] }],
    ["plan", { a: 1, b: 2, c: 3 }],
  ];
  let pass = 0, fail = 0;
  CASES.forEach(([op, input]) => {
    const r = APPROX[op](input);
    const ok = r && typeof r === "object" && r.approximated === true && r.limits;
    if (ok) pass++; else fail++;
    const preview = JSON.stringify(r).slice(0, 78);
    console.log(`${ok ? "PASS" : "FAIL"}  ${op.padEnd(10)} ${preview}`);
  });
  console.log();
  console.log("--- 路由 ---");
  const R = [["政策翻译官", "translate"], ["科技祛魅器", "translate"], ["环境报告生成器", "report"],
             ["量化评估器", "assess"], ["政策匹配器", "match"]];
  let rp = 0;
  R.forEach(([n, exp]) => {
    const h = pickApprox(n, n);
    const ok = h && h.op === exp;
    if (ok) rp++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${n.padEnd(14)} → ${h ? h.op : "无匹配"}`);
  });
  console.log();
  console.log(`算子 ${pass}/${pass + fail} ｜ 路由 ${rp}/${R.length}`);
  const bad = fail + (R.length - rp);
  console.log(bad === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(bad === 0 ? 0 : 1);
}
