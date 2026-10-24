/* ==== METAGO-R141-CONSTRAINT-IMPL ==== */
/*
 * 5 个哲学族原子（constraint 形态）的真实实现（R141 / DEF-083）
 *
 * 原先只在 CONSTRAINT_IDS 里声明「是 constraint 形态」，但没有实现，
 * make() 返回 null —— 等于 597 条契约里这 5 条无实现。
 * 本表按契约原文给出的判据逐条实现，输入为任意对象/字符串，输出统一为：
 *   { ok: boolean, violated: boolean, reasons: string[] }
 * ok === true 表示「未违背契约」。
 */
function toStrings(input) {
  if (input === null || input === undefined) return [];
  if (typeof input === 'string') return [input];
  if (Array.isArray(input)) return input.map(x => String(x));
  if (typeof input === 'object') {
    const out = [];
    for (const k of Object.keys(input)) {
      const v = input[k];
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach(x => { if (typeof x === 'string') out.push(x); });
    }
    return out;
  }
  return [String(input)];
}

const ABSOLUTE_WORDS = ['绝对完整', '100%完美', '100%完整', '不会再缺', '不可能有遗漏',
  '绝对', '完美', '必然', '一定不会', '永不出错', '零缺陷', '毫无遗漏'];
const PREACH_WORDS = ['你必须', '你应该', '务必', '切记', '一定要', '必须知道', '应当明白', '不要忘记'];

const CONSTRAINT_IMPL = {
  /* 归无见证器：无效条目 > 有效条目 → 未完成归无；标记废弃却仍被引用 → 残留 */
  ATOM_VOID_WITNESS_150: function (input) {
    const o = input || {};
    const invalid = Number(o.invalid !== undefined ? o.invalid : o.invalidCount) || 0;
    const valid = Number(o.valid !== undefined ? o.valid : o.validCount) || 0;
    const deprecated = Array.isArray(o.deprecated) ? o.deprecated : [];
    const referenced = Array.isArray(o.referenced) ? o.referenced : [];
    const reasons = [];
    if (invalid > valid) reasons.push(`无效条目(${invalid}) > 有效条目(${valid})：应归无`);
    const residue = deprecated.filter(x => referenced.indexOf(x) >= 0);
    if (residue.length) reasons.push(`已标记废弃却仍被引用：${residue.slice(0, 5).join(',')}`);
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 如是存在器：含绝对化表述 → 违背；声称已验证但无输入依据 → 违背 */
  ATOM_WORD_BEING_153: function (input) {
    const texts = toStrings(input);
    const reasons = [];
    for (const t of texts) {
      const hit = ABSOLUTE_WORDS.filter(w => t.indexOf(w) >= 0);
      if (hit.length) reasons.push(`含绝对化表述：${hit.slice(0, 3).join('/')}`);
      if (/已验证|已核实|已复现/.test(t) && !/\d+\s*(次|条|项|个|项)|命令|输出/.test(t)) {
        reasons.push('声称已验证但无输入依据（无次数/条目/命令/输出）');
      }
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons: [...new Set(reasons)] };
  },

  /* 沉默决策器：置信度 < 阈值却给出决策 → 违背；无置信度却给结论 → 违背 */
  ATOM_WORD_DECIDE_151: function (input) {
    const o = input || {};
    const conf = (typeof o.confidence === 'number') ? o.confidence : null;
    const th = (typeof o.threshold === 'number') ? o.threshold : 0.6;
    const decided = (o.decision !== undefined && o.decision !== null && o.decision !== '')
      || o.conclusion !== undefined || o.verdict !== undefined;
    const reasons = [];
    if (decided && conf === null) reasons.push('无置信度却给出结论');
    if (decided && conf !== null && conf < th) reasons.push(`置信度 ${conf} < 阈值 ${th} 却给出决策`);
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 概念消融器：同一对象同时属 category 与 antiCategory → 违背 */
  ATOM_WORD_DISSOLVE_152: function (input) {
    const o = input || {};
    const cat = o.category, anti = o.antiCategory;
    const objs = Array.isArray(o.objects) ? o.objects : [];
    const reasons = [];
    if (cat !== undefined && anti !== undefined) {
      const both = objs.filter(x => {
        const cs = (x && (x.categories || x.c)) || x;
        if (Array.isArray(cs)) return cs.indexOf(cat) >= 0 && cs.indexOf(anti) >= 0;
        return String(cs) === String(cat) && String(cs) === String(anti);
      });
      if (both.length) reasons.push(`同一对象同时属「${cat}」与「${anti}」：${both.length} 个`);
      if (objs.length && objs.every(x => {
        const cs = (x && (x.categories || x.c)) || x;
        const a = Array.isArray(cs) ? cs : [cs];
        return a.indexOf(cat) < 0 && a.indexOf(anti) < 0;
      })) reasons.push('声明二元分类却无对象落入');
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons };
  },

  /* 无言之教器：说教用语 ≥2 处且无示例无结构 → 违背；纯文字说明 >40 字无结构 → 违背 */
  ATOM_WORD_TEACH_154: function (input) {
    const texts = toStrings(input);
    const reasons = [];
    for (const t of texts) {
      const preach = PREACH_WORDS.filter(w => t.indexOf(w) >= 0);
      const hasStructure = /(^|\n)\s*(#{1,6}\s|\d+\.\s|[-*]\s)|\|.*\|/.test(t);
      const hasExample = /示例|例如|比如|如：|```|code/i.test(t);
      if (preach.length >= 2 && !hasStructure && !hasExample) {
        reasons.push(`说教用语 ${preach.length} 处且无示例无结构：${preach.slice(0, 3).join('/')}`);
      }
      if (!hasStructure && !hasExample && t.replace(/\s/g, '').length > 40) {
        reasons.push(`纯文字说明 ${t.replace(/\s/g, '').length} 字且无结构无示例`);
      }
    }
    return { ok: reasons.length === 0, violated: reasons.length > 0, reasons: [...new Set(reasons)] };
  },
};

function makeConstraintAtom(atomId) {
  const check = CONSTRAINT_IMPL[atomId];
  if (!check) return null;
  /* 必须返回「可调用函数」——contract-validator 的工厂自测直接 fn(SAMPLE) 调用。
     函数上挂 check / run / compute / kind / id，保留按名调用能力。 */
  const fn = function (input) {
    const r = check(input);
    return {
      ok: r.ok,
      success: r.ok,
      reason: r.ok ? 'CONSTRAINT_SATISFIED' : 'CONSTRAINT_VIOLATED',
      violated: r.violated,
      reasons: r.reasons,
      provenance: ['[R141-CONSTRAINT] ' + atomId + ' ok=' + r.ok],
    };
  };
  fn.id = atomId;
  fn.kind = 'constraint';
  fn.check = check;
  fn.run = check;
  fn.compute = fn;
  return fn;
}
/* ==== /METAGO-R141-CONSTRAINT-IMPL ==== */