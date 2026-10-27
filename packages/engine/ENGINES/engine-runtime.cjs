#!/usr/bin/env node
/**
 * P6-B2 · 易理工程学引擎运行时（EngineRuntime · YILI 组）
 *
 * 覆盖 V37.0 新增的 10 个易数引擎（ENGINE_*_126..135）+ 择日 + 象数诊断 = 12 条执行体
 *
 * 实现来源：D:\DH工作区\易理工程学\lib\ 的确定性实现（寿星天文历公版公式 + 规则表 + 状态机），
 *           已搬运至 packages/engine/ENGINES/yili/（167 KB，13 lib + 1 vendor + 5 data）。
 *           MCP 服务器 mcp__yili__* 读同一份引擎，故本地实现与 MCP 输出可交叉校验。
 *
 * 设计：
 *   - CJS 桥接 ESM（ENGINES/yili/ 有局部 package.json type:module）
 *   - 首次调用时惰性加载并缓存 ESM 模块
 *   - 与协议运行时同构的 ExecResult：success/kind/output/provenance/traceId/durationMs
 *   - 一切断言带置信度与规则编号（引擎自身素养，直传不修饰）
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');

const LIB = pathToFileURL(path.join(__dirname, 'yili', 'lib')).href + '/';
const _cache = new Map();

async function mod(name) {
  if (_cache.has(name)) return _cache.get(name);
  const m = await import(LIB + name + '.js');
  _cache.set(name, m);
  return m;
}

let __seq = 0;
function newTraceId() {
  const d = new Date(), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-Y${p((++__seq) % 10000, 4)}`;
}

/* ══════════════════════════════════════════════════════════
 * 12 条引擎执行体
 * ══════════════════════════════════════════════════════════ */
const ENGINES = [
  /* ── 126 历法引擎 ── */
  {
    id: 'ENGINE_SHUSHU_ALMANAC_126', name: '历法引擎', kind: 'calendar', family: '历法',
    source: '易理工程学 lib/almanac.js（寿星天文历公版公式 Sxing）',
    api: ['jieqiOfYear', 'ganzhiDayOfDate', 'ganzhiYearOf', 'ganzhiMonthOf', 'ganzhiHourOf', 'nayin', 'changsheng', 'dayXunKong', 'jianchu'],
    async exec(input, tid) {
      const a = await mod('almanac');
      const { y = 2026, m = 10, d = 27, hour = 12 } = input || {};
      const gzYear = a.ganzhiYearOf(y, m, d, hour);   // 签名: (y,m,d,hour=12)
      const gzDay  = a.ganzhiDayOfDate(y, m, d);      // 签名: (y,m,d)
      const out = {
        ganzhiYear: gzYear,
        ganzhiMonth: a.ganzhiMonthOf(gzYear, y, m, d, hour),  // 签名: (yearGanZhi,y,m,d,hour)
        ganzhiDay: gzDay,
        ganzhiHour: a.ganzhiHourOf(gzDay, hour),              // 签名: (dayGanZhi,hour)
        jieqi: a.jieqiOfYear(y),
        xunKong: a.dayXunKong(y, m, d),
        jianchu: a.jianchu(y, m, d),
        nayin: a.nayin(gzDay),
        changsheng: a.changsheng(gzDay),
      };
      return { success: true, kind: 'calendar', output: out, provenance: [`[${tid}] almanac: 4 柱 + 24 节气 + 旬空 + 纳音 + 十二长生`] };
    },
  },
  /* ── 127 周易引擎 ── */
  {
    id: 'ENGINE_YIJING_127', name: '周易引擎', kind: 'stateful', family: '周易',
    source: '易理工程学 lib/yijing.js（64 卦状态机 + 384 爻辞）',
    api: ['divine', 'coinDivination', 'changeGua', 'huGua', 'zongGua', 'cuoGua', 'yaoCi'],
    async exec(input, tid) {
      const y = await mod('yijing');
      const seed = (input && input.seed) || 20261027;
      const r = y.divine(seed, (input && input.opts) || {});   // 签名: divine(seed, opts={})
      /* divine() 已内联算出 hu/zong/cuo，直接取用；
         注意 zongGua(lines)/cuoGua(lines)/huGua(lines) 收的是 lines 数组，不能传整个结果对象。 */
      const out = {
        ben: r.ben, bian: r.bian, hu: r.hu, zong: r.zong, cuo: r.cuo,
        moving: r.moving || [], movingTitles: r.movingTitles || [],
        seed: r.seed,
      };
      return { success: true, kind: 'stateful', output: out, provenance: [`[${tid}] yijing: 64 卦状态机 · 本卦/变卦/互卦/综卦/错卦`] };
    },
  },
  /* ── 128 五行引擎 ── */
  {
    id: 'ENGINE_WUXING_128', name: '五行引擎', kind: 'formula', family: '五行八卦',
    source: '易理工程学 lib/wuxing.js',
    api: ['wuxingMatrix', 'relation', 'wangxiangOfSeason', 'circuitAnalysis'],
    async exec(input, tid) {
      const w = await mod('wuxing');
      const els = (input && input.elements) || ['木', '火', '土', '金', '水'];
      const season = (input && input.season) || '秋';
      /* 季节 → 五行映射（wangxiangOfSeason 签名为 (seasonWuxing)） */
      const SEASON_WUXING = { '春': '木', '夏': '火', '长夏': '土', '秋': '金', '冬': '水' };
      const sw = SEASON_WUXING[season] || '金';
      const out = {
        elements: els, season, seasonWuxing: sw,
        wangxiang: w.wangxiangOfSeason(sw),
        matrix: w.wuxingMatrix(),
        circuit: w.circuitAnalysis(els),   /* 签名: circuitAnalysis(elements) */
        relations: els.slice(0, 3).map((a) => els.slice(0, 3).map((b) => ({ a, b, rel: w.relation(a, b) }))),
      };
      return { success: true, kind: 'formula', output: out, provenance: [`[${tid}] wuxing: 旺相休囚死 + 生克矩阵 + 回路`] };
    },
  },
  /* ── 129 河图洛书引擎 ── */
  {
    id: 'ENGINE_HETU_LUOSHU_129', name: '河图洛书引擎', kind: 'formula', family: '河图洛书',
    source: '易理工程学 lib/hetu-luoshu.js',
    api: ['magicSquare', 'luoshuWithGua', 'luoshuDirection', 'verifyMagicSquare'],
    async exec(input, tid) {
      const h = await mod('hetu-luoshu');
      const n = (input && input.n) || 3;
      const ms = h.magicSquare(n);
      return {
        success: true, kind: 'formula',
        output: {
          n, magicSquare: ms, verified: h.verifyMagicSquare(ms),
          luoshuWithGua: h.luoshuWithGua(), directions: h.luoshuDirection(),
          hetuPairs: h.HETU_PAIRS, grid: h.LUOSHU_GRID,
        },
        provenance: [`[${tid}] hetu-luoshu: ${n} 阶幻方 + 九宫配卦 + 河图生成数对`],
      };
    },
  },
  /* ── 130 六爻引擎 ── */
  {
    id: 'ENGINE_LIUYAO_130', name: '六爻引擎', kind: 'stateful', family: '六爻',
    source: '易理工程学 lib/liuyao.js（装卦/用神/旺衰/应期）',
    api: ['zhuanggua', 'liuyaoAnalysis', 'yongshenFor', 'yingqiHints', 'liuShen'],
    async exec(input, tid) {
      const l = await mod('liuyao');
      const a = await mod('almanac');
      const topic = (input && input.topic) || '事业';
      const y = (input && input.y) || 2026, m = (input && input.m) || 10, d = (input && input.d) || 27, hour = (input && input.hour) || 12;
      /* 签名: zhuanggua(fullName, dayGanZhi, monthZhi, dayGan) */
      const fullName = (input && input.fullName) || '乾为天';   // 须全卦名，'乾' 会让 NAJIA[lower] 为 undefined
      const gzDay = a.ganzhiDayOfDate(y, m, d);
      const gzMonth = a.ganzhiMonthOf(a.ganzhiYearOf(y, m, d, hour), y, m, d, hour);
      const dayGan = String(gzDay).charAt(0);
      const monthZhi = String(gzMonth).slice(-1);
      const g = l.zhuanggua(fullName, gzDay, monthZhi, dayGan);
      const safe = (fn, label) => { try { const v = fn(); return (v && typeof v === 'object' && v.rows && !Array.isArray(v.rows)) ? { _unavailable: label, reason: 'rows 非数组' } : v; } catch (e) { return { _unavailable: label, error: String(e.message).slice(0, 140) }; } };
      const out = {
        gua: g, topic, fullName, dayGanZhi: gzDay, monthZhi, dayGan,
        yongshen: safe(() => l.yongshenFor(topic), 'yongshen'),
        liuqin: safe(() => g.rows.map((r) => l.liuqin ? l.liuqin(String(gzDay).charAt(0), r.zhi || r.zhiWuxing) : null), 'liuqin'),
        analysis: safe(() => l.liuyaoAnalysis({ fullName, dayGanZhi: gzDay, monthZhi, dayGan, topic, hour }), 'analysis'),
        yingqi: safe(() => l.yingqiHints({ fullName, dayGanZhi: gzDay, monthZhi, dayGan, topic }), 'yingqi'),
      };
      return { success: true, kind: 'stateful', output: out, provenance: [`[${tid}] liuyao: 装卦 + 用神 + 旺衰 + 应期（${topic}）`] };
    },
  },
  /* ── 131 四柱引擎 ── */
  {
    id: 'ENGINE_BAZI_131', name: '四柱引擎', kind: 'compute', family: '四柱',
    source: '易理工程学 lib/bazi.js（排盘/十神/大运/流年）',
    api: ['baziCalc', 'shishen', 'dayunCalc', 'liunianCalc', 'balanceOf'],
    async exec(input, tid) {
      const b = await mod('bazi');
      const safe = (fn, label) => { try { return fn(); } catch (e) { return { _unavailable: label, error: String(e.message).slice(0, 120) }; } };
      const { y = 1990, m = 6, d = 15, hour = 10, gender = '男' } = input || {};
      const chart = b.baziCalc(y, m, d, hour);
      return {
        success: true, kind: 'compute',
        output: {
          chart,
          gender,
          shishen: (() => { const dg = chart.dayGan || (chart.pillars && chart.pillars.day && chart.pillars.day.gan) || chart.day && chart.day.gan; return dg ? Object.entries(b.CANG_GAN).slice(0, 10).map(([zhi, gans]) => ({ zhi, shishen: gans.map((g) => b.shishen(dg, g)) })) : null; })(),
          dayun: safe(() => b.dayunCalc(y, m, d, hour, gender), 'dayun'),
          liunian: safe(() => b.liunianCalc(y), 'liunian'),
          balance: safe(() => b.balanceOf(chart), 'balance'),
        },
        provenance: [`[${tid}] bazi: 四柱排盘 + 十神 + 大运 + 流年 + 五行平衡`],
      };
    },
  },
  /* ── 132 紫微引擎 ── */
  {
    id: 'ENGINE_ZIWEI_132', name: '紫微引擎', kind: 'stateful', family: '紫微',
    source: '易理工程学 lib/ziwei.js（安星全盘/四化/三方四正）',
    api: ['ziweiCalc', 'mainStars', 'sanfangSizheng', 'mingShenGong', 'wuxingJu'],
    async exec(input, tid) {
      const z = await mod('ziwei');
      const { lunarYear = 1990, month = 6, day = 15, hour = 10, yearGanZhi = '庚午', nayinYear = '路旁土' } = input || {};
      const pan = z.ziweiCalc({ lunarYear, birthMonth: month, birthDay: day, birthHour: hour, yearGanZhi, nayinYear });
      return {
        success: true, kind: 'stateful',
        output: { pan, mingShenGong: z.mingShenGong({ lunarYear, birthMonth: month, birthDay: day, birthHour: hour }), wuxingJu: z.wuxingJu({ lunarYear, yearGanZhi, nayinYear }), sanfang: pan && pan.board ? Object.fromEntries(Object.keys(pan.board).map((k) => [k, z.sanfangSizheng(k)])) : null },
        provenance: [`[${tid}] ziwei: 安星全盘 + 四化 + 三方四正 + 命身宫 + 五行局`],
      };
    },
  },
  /* ── 133 奇门引擎 ── */
  {
    id: 'ENGINE_QIMEN_133', name: '奇门引擎', kind: 'stateful', family: '奇门',
    source: '易理工程学 lib/qimen.js（时家奇门 1080 局/三奇六仪/值符值使/九星八门八神）',
    api: ['qimenCalc', 'dingJu', 'sanqiLiuyi', 'xunShou', 'yuanOfDay'],
    async exec(input, tid) {
      const q = await mod('qimen');
      const { y = 2026, m = 10, d = 27, hour = 12 } = input || {};
      const pan = q.qimenCalc(y, m, d, hour);   // 签名: (y,m,d,hour)
      return {
        success: true, kind: 'stateful',
        output: {
          pan,
          ju: q.dingJu ? q.dingJu(y, m, d) : (pan && pan.ju),   // 签名: (y,m,d)
          sanqiLiuyi: q.sanqiLiuyi ? q.sanqiLiuyi(y, m, d, hour) : null,
          xunShou: q.xunShou ? q.xunShou(y, m, d, hour) : null,
          yuan: q.yuanOfDay ? q.yuanOfDay(y, m, d) : null,
        },
        provenance: [`[${tid}] qimen: 时家奇门 · 定局(阴阳遁18局) + 三奇六仪 + 值符值使 + 九星八门八神`],
      };
    },
  },
  /* ── 134 太乙引擎 ── */
  {
    id: 'ENGINE_TAIYI_134', name: '太乙引擎', kind: 'compute', family: '太乙',
    source: '易理工程学 lib/taiyi.js（积年/十六神/分歧登记）',
    api: ['taiyiCalc', 'taiyiJinian', 'taiyiYearInCycle', 'shiliushenBoard', 'taiyiBaMen', 'taiyiPalace'],
    async exec(input, tid) {
      const t = await mod('taiyi');
      const year = (input && input.year) || 2026;
      const school = (input && input.school) || '金镜式经（主本）';
      return {
        success: true, kind: 'compute',
        output: {
          year, school,
          jinian: t.taiyiJinian(year, school),
          yearInCycle: t.taiyiYearInCycle(year, school),
          palace: t.taiyiPalace ? t.taiyiPalace(year, school) : null,
          baMen: t.taiyiBaMen ? t.taiyiBaMen(year, school) : null,
          shiliushen: t.shiliushenBoard ? t.shiliushenBoard(year, school) : null,
          schools: Object.keys(t.JINIAN_SCHOOLS),
        },
        provenance: [`[${tid}] taiyi: 积年(${school}) + 十六神 + 八门 + 分歧登记`],
      };
    },
  },
  /* ── 135 文言微积分引擎 ── */
  {
    id: 'ENGINE_SHUSHU_CALCULUS_135', name: '文言微积分引擎', kind: 'formula', family: '文言微积分',
    source: '易理工程学 lib/shushu-calculus.js（察机/应期/禾势）',
    api: ['shushuCalculus', 'potential', 'chaJi', 'yingqi', 'heShi'],
    async exec(input, tid) {
      const c = await mod('shushu-calculus');
      const state = (input && input.state) || { wood: 0.8, fire: 0.6, earth: 0.5, metal: 0.4, water: 0.7 };
      const season = (input && input.season) || '秋';
      const threshold = Number((input && input.threshold) ?? 0.75);
      return {
        success: true, kind: 'formula',
        output: {
          state, season, threshold,
          potential: c.potential(state, 0, 1),
          chaJi: c.chaJi ? c.chaJi(state, 1) : null,
          yingqi: c.yingqi ? c.yingqi(state, 1, threshold) : null,
          heShi: c.heShi ? c.heShi(state, 1) : null,
          full: c.shushuCalculus ? c.shushuCalculus({ state, season, threshold }) : null,
        },
        provenance: [`[${tid}] shushu-calculus: 势函数 + 察机(临界点) + 应期求解 + 禾势(累积势能)`],
      };
    },
  },
  /* ── 附加：择日（PROTOCOL/技能层引用） ── */
  {
    id: 'ENGINE_SHUSHU_ZERI_136', name: '择日引擎', kind: 'compute', family: '择日',
    source: '易理工程学 lib/zeri.js（约束满足搜索）',
    api: ['zeriPick', 'zeriReport', 'huangheiDao'],
    async exec(input, tid) {
      const z = await mod('zeri');
      const { y = 2026, m = 10, d = 27, days = 30, constraints = {} } = input || {};
      return {
        success: true, kind: 'compute',
        output: { from: { y, m, d }, days, constraints, picked: z.zeriPick(y, m, d, days, constraints), report: z.zeriReport ? z.zeriReport(y, m, d, days, constraints) : null },
        provenance: [`[${tid}] zeri: 约束满足搜索（建除/黄黑道/避冲）`],
      };
    },
  },
  /* ── 附加：象数诊断 ── */
  {
    id: 'ENGINE_SHUSHU_DIAGNOSE_137', name: '象数诊断引擎', kind: 'formula', family: '象数诊断',
    source: '易理工程学 lib/diagnose.js（五行透镜/杠杆点）',
    api: ['shushuDiagnose', 'detectWuxing'],
    async exec(input, tid) {
      const dg = await mod('diagnose');
      const elements = (input && input.elements) || [{ name: '战略', value: 0.8 }, { name: '执行', value: 0.4 }, { name: '技术', value: 0.7 }];
      const season = (input && input.season) || '秋';
      return {
        success: true, kind: 'formula',
        output: { elements: elements.map((e) => ({ ...e, wuxing: dg.detectWuxing(e.name) })), season, diagnose: dg.shushuDiagnose(elements, season) },
        provenance: [`[${tid}] diagnose: 五行透镜 + 生克回路 + 杠杆点(最小干预)`],
      };
    },
  },
];

/* ══════════════════════════════════════════════════════════
 * 运行时接口
 * ══════════════════════════════════════════════════════════ */
const INDEX = new Map(ENGINES.map((e) => [e.id, e]));

function kindOf(id) { const e = INDEX.get(id); return e ? e.kind : 'declared'; }
function getRegistry() { return ENGINES.map((e) => ({ id: e.id, name: e.name, kind: e.kind, family: e.family, source: e.source, api: e.api })); }

async function execute(id, input) {
  const t0 = Date.now();
  const tid = newTraceId();
  const e = INDEX.get(id);
  if (!e) return { success: false, kind: 'declared', reason: 'NOT_FOUND', error: `引擎 ${id} 未登记`, provenance: [], traceId: tid, durationMs: 0 };
  try {
    const r = await e.exec(input || {}, tid);
    return { ...r, engineId: id, engineName: e.name, traceId: tid, durationMs: Date.now() - t0 };
  } catch (err) {
    return { success: false, kind: e.kind, error: 'THROW: ' + err.message, provenance: [`[${tid}] THROW`], engineId: id, traceId: tid, durationMs: Date.now() - t0 };
  }
}

module.exports = { execute, kindOf, getRegistry, ENGINES, INDEX, newTraceId, mod };
