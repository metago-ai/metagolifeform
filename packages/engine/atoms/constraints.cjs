"use strict";
/**
 * constraints.cjs — 哲学族原子的正确存在形态：约束器，不是计算函数
 *
 * 蓝本中这 5 条原子属「归无-日常-永恒」体系：
 *   ATOM_VOID_WITNESS_150   归无见证器
 *   ATOM_WORD_BEING_153     如是存在器
 *   ATOM_WORD_DECIDE_151    沉默决策器
 *   ATOM_WORD_DISSOLVE_152  概念消融器
 *   ATOM_WORD_TEACH_154     无言之教器
 *
 * 设计判断（写下来备查）：
 *   「见证归无」「以沉默决策」「不说而教」本质是**立场与约束**，不是「输入→输出」的计算。
 *   强行给它们 number[] → number 的契约，等于把它降格成它反对的东西。
 *   因此本模块把它们实现为 **constraint**：接收一个候选输出/决策，判定它是否违背该原则，
 *   返回 { allowed, violations, guidance }。
 *
 * 这是元创造：契约形态由我按语义判定，而非套用计算模板。
 */
const round = (x, n = 4) => { const p = 10 ** n; return Math.round((Number(x) || 0) * p) / p; };

const CONSTRAINTS = {
  /* 归无见证器：见证「放下」是否真的发生——检测残留 */
  ATOM_VOID_WITNESS_150: {
    kind: "constraint",
    purpose: "检测系统是否真正放下了应先放下之物（残留依赖 / 过度保留 / 该删未删）",
    check(candidate) {
      const c = candidate || {};
      const violations = [];
      const residuals = [];

      // 1. 已标记废弃却仍在使用的引用
      const s = JSON.stringify(c);
      const deprecated = (s.match(/deprecated|已废止|废弃|obsolete/gi) || []).length;
      const usages = (s.match(/usedBy|引用|dependsOn/gi) || []).length;
      if (deprecated > 0 && usages > 0) {
        violations.push("含" + deprecated + "处已废弃标记，同时仍有" + usages + "处引用");
      }
      // 2. 只增不减的累积（条目数远大于有效条目）
      if (Array.isArray(c.items) && c.items.length > 0) {
        const live = c.items.filter(x => x && x.active !== false && x.deprecated !== true).length;
        const dead = c.items.length - live;
        if (dead > 0) residuals.push({ dead, total: c.items.length });
        if (dead > live) violations.push("无效条目 " + dead + " > 有效条目 " + live + "，未完成归无");
      }
      // 3. 显式的残留声明
      if (c.residual != null && Number(c.residual) > 0) {
        residuals.push({ residual: Number(c.residual) });
      }

      return {
        allowed: violations.length === 0,
        violations,
        residuals,
        guidance: violations.length
          ? "先完成放下再前进：把标记废弃的条目真正移除，或说明保留理由"
          : "未见残留，归无成立"
      };
    }
  },

  /* 如是存在器：如其所是——输出是否忠实于输入，未加修饰 */
  ATOM_WORD_BEING_153: {
    kind: "constraint",
    purpose: "检测输出是否忠实反映输入（无夸大、无美化、无添加未给出的结论）",
    check(candidate, input) {
      const c = candidate || {};
      const s = JSON.stringify(c);
      const violations = [];

      // 1. 绝对化用语（不可能是"如是"）
      const absolutes = s.match(/绝对|100%|完美|完全|彻底|必然|一定|毫无疑问|不可能/g) || [];
      if (absolutes.length) violations.push("含绝对化表述 " + absolutes.length + " 处：" + [...new Set(absolutes)].slice(0, 4).join("、"));

      // 2. 声称有输入未提供的证据
      const claims = s.match(/已验证|已测试|已确认|实测|经核验/g) || [];
      if (claims.length && !input) violations.push("声称已验证但未提供输入依据");

      // 3. 结论超出输入维度（若给了 input 的键，检查输出是否凭空多出定论）
      if (input && typeof input === "object") {
        const inKeys = Object.keys(input);
        const outKeys = Object.keys(c);
        const extra = outKeys.filter(k => !inKeys.includes(k) && /结论|结果|判定|决定/.test(k));
        if (extra.length) violations.push("输出含输入未支撑的结论字段：" + extra.join("、"));
      }

      return {
        allowed: violations.length === 0,
        violations,
        guidance: violations.length
          ? "如其所是：只陈述输入支持的内容，不确定就写不确定"
          : "表述忠实于输入"
      };
    }
  },

  /* 沉默决策器：置信不足时，正确的决策是「不决策」 */
  ATOM_WORD_DECIDE_151: {
    kind: "constraint",
    purpose: "在置信度不足时强制返回「不决策」，阻止系统硬给结论",
    check(candidate) {
      const c = candidate || {};
      const violations = [];

      const conf = Number(c.confidence != null ? c.confidence : (c.置信度 != null ? c.置信度 : NaN));
      const hasDecision = c.decision != null || c.结论 != null || c.result != null;
      const threshold = Number(c.threshold != null ? c.threshold : 0.6);

      if (hasDecision && isFinite(conf) && conf < threshold) {
        violations.push("置信度 " + round(conf, 2) + " < 阈值 " + threshold + " 却给出了决策");
      }
      if (hasDecision && !isFinite(conf)) {
        violations.push("给出了决策但未提供置信度");
      }
      if (String(c.decision || c.结论 || "") === "" && !hasDecision && !isFinite(conf)) {
        // 沉默且无置信度声明 → 合法，但需显式说明
        return {
          allowed: true,
          violations: [],
          action: "SILENCE",
          guidance: "沉默决策成立；建议显式给出 abstainReason 以便追溯"
        };
      }

      return {
        allowed: violations.length === 0,
        violations,
        action: violations.length ? "SHOULD_ABSTAIN" : (hasDecision ? "DECIDE" : "SILENCE"),
        guidance: violations.length
          ? "置信不足时应返回不决策（abstain），而不是掷硬币式给结论"
          : "决策条件成立"
      };
    }
  },

  /* 概念消融器：消解二元对立——检测自相矛盾的分类 */
  ATOM_WORD_DISSOLVE_152: {
    kind: "constraint",
    purpose: "检测输出中人为制造的对立分类是否自相矛盾或不可证伪",
    check(candidate) {
      const c = candidate || {};
      const violations = [];
      const s = JSON.stringify(c);

      // 1. 同一对象被同时归入互斥类
      if (c.category != null && c.antiCategory != null && c.category === c.antiCategory) {
        violations.push("同一对象同时属于 category 与 antiCategory");
      }
      // 2. 二分标签存在但对象为空（制造了对立却没对象）
      const hasBinary = /二元|二分|非黑即白|对立面/.test(s);
      if (hasBinary && (!c.items || !c.items.length)) {
        violations.push("声明了二元对立分类但无任何对象落入");
      }
      // 3. 标签互斥性检查
      if (Array.isArray(c.items)) {
        const labels = new Set();
        c.items.forEach((x, i) => {
          const l = x && (x.category || x.label);
          if (l != null) {
            if (labels.has(l) && x.contradictsAll) violations.push("第 " + i + " 项标签重复且声明全斥");
            labels.add(l);
          }
        });
        if (labels.size === 1 && c.items.length > 1) {
          // 单一类别 → 对立已被消融，这是好事
        }
      }
      return {
        allowed: violations.length === 0,
        violations,
        guidance: violations.length
          ? "回到现象本身：先描述，再分类；能消融的对立不要强行保留"
          : "未发现人为对立"
      };
    }
  },

  /* 无言之教器：不说而教——以结构/示范传达，而非说教文本 */
  ATOM_WORD_TEACH_154: {
    kind: "constraint",
    purpose: "检测输出是否以说教文本代替可仿效的结构示范",
    check(candidate) {
      const c = candidate || {};
      const violations = [];
      const s = JSON.stringify(c);

      const preaching = (s.match(/你应该|必须|务必|切记|一定要|不得/g) || []);
      const hasExample = !!c.example || !!c.demo || !!c.sample || !!c.steps;
      const hasStructure = !!c.schema || !!c.template || !!c.pattern || !!c.contract;

      if (preaching.length >= 2 && !hasExample && !hasStructure) {
        violations.push("说教用语 " + preaching.length + " 处，但无可仿效的示例或结构");
      }
      if (!hasExample && !hasStructure && s.length > 40) {
        violations.push("无示例、无结构，仅有文字说明");
      }

      return {
        allowed: violations.length === 0,
        violations,
        guidance: violations.length
          ? "无言之教：给出可照做的结构或示例，让别人从做法中学会，而不是从要求中记住"
          : "以结构或示例传达，符合无言之教"
      };
    }
  }
};

function check(atomId, candidate, input) {
  const c = CONSTRAINTS[atomId];
  if (!c) return { error: "非约束器原子", atomId };
  const r = c.check(candidate, input);
  return Object.assign({ atom: atomId, kind: "constraint", purpose: c.purpose }, r);
}

module.exports = { CONSTRAINTS, check };

/* ---------------- 自测 ---------------- */
if (require.main === module) {
  const CASES = [
    // 归无见证：应失败（残留 > 有效）
    ["ATOM_VOID_WITNESS_150", { items: [{ active: true }, { deprecated: true }, { deprecated: true }, { deprecated: true }] }, false],
    // 归无见证：应通过
    ["ATOM_VOID_WITNESS_150", { items: [{ active: true }, { active: true }] }, true],
    // 如是存在：应失败（绝对化）
    ["ATOM_WORD_BEING_153", { 结论: "本方案绝对完美，100% 已验证" }, false],
    // 如是存在：应通过
    ["ATOM_WORD_BEING_153", { 结论: "在样本量 30 下观察到相关性 0.42" }, true],
    // 沉默决策：应失败（低置信仍给决策）
    ["ATOM_WORD_DECIDE_151", { decision: "上线", confidence: 0.3 }, false],
    // 沉默决策：应通过（低置信返回不决策）
    ["ATOM_WORD_DECIDE_151", { confidence: 0.3, abstainReason: "样本不足" }, true],
    // 概念消融：应失败（同一对象双属）
    ["ATOM_WORD_DISSOLVE_152", { category: "内部", antiCategory: "内部" }, false],
    // 概念消融：应通过
    ["ATOM_WORD_DISSOLVE_152", { items: [{ category: "甲" }, { category: "乙" }] }, true],
    // 无言之教：应失败（纯说教）
    ["ATOM_WORD_TEACH_154", { text: "你必须这样做，务必注意，切记不要那样做，这是很重要的说明文字" }, false],
    // 无言之教：应通过（有结构）
    ["ATOM_WORD_TEACH_154", { steps: ["先读契约", "再跑自测", "最后看证据"] }, true],
  ];

  console.log("=".repeat(78));
  console.log("哲学族约束器自测（5 条原子 × 正反用例）");
  console.log("=".repeat(78));
  let pass = 0, fail = 0;
  CASES.forEach(([id, cand, expectAllowed]) => {
    const r = check(id, cand);
    const ok = r.allowed === expectAllowed;
    if (ok) pass++; else fail++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(26)} 期望allowed=${String(expectAllowed).padEnd(5)} 实际=${String(r.allowed).padEnd(5)} ${(r.violations || []).join("；").slice(0, 54)}`);
  });
  console.log("-".repeat(78));
  console.log(`约束器 ${Object.keys(CONSTRAINTS).length} 个 ｜ 用例 ${CASES.length} ｜ 通过 ${pass} ｜ 失败 ${fail}`);
  console.log(fail === 0 ? "总判定：PASS" : "总判定：FAIL");
  process.exit(fail === 0 ? 0 : 1);
}
