/**
 * tool-registry.js
 * 元构 927 算法 MCP 工具注册表
 *
 * 职责：
 *   1. 自动加载 tools/*.json schema
 *   2. 为每个工具创建 handler
 *   3. 提供 getAllSchemas() 和 getHandler(name) API
 *
 * 四层暴露架构：
 *   L1 通用入口（3）：execute / execute_sync / get_algorithm_info
 *   L2 检索发现（4）：list_algorithms / search_algorithms / list_families / get_statistics
 *   L3 高频专用（30）：cosine_similarity / euclidean_distance / ... （COUPLING 族 T1 30 个）
 *   L4 族级工具（20）：coupling_calculate / value_assess / ... （每族一个工具）
 */

const path = require('path');
const fs = require('fs');

const toolsDir = path.join(__dirname, 'tools');
const schemas = [];
const handlers = {};

// ============================================================================
// L1 通用入口 handler
// ============================================================================

function createExecuteHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] execute'],
        durationMs: Date.now() - startTime,
      };
    }
    const result = await registry.executeAlgorithm(args.id, args.input || {});
    return enrichResult(result, args.id, registry, 'execute', startTime);
  };
}

function createExecuteSyncHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] execute_sync'],
        durationMs: Date.now() - startTime,
      };
    }
    const result = registry.executeAlgorithmSync(args.id, args.input || {});
    return enrichResult(result, args.id, registry, 'execute_sync', startTime);
  };
}

function createGetAlgorithmInfoHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.id) {
      return {
        success: false,
        error: '缺少必填参数 id',
        provenance: ['[mcp_metago-algorithms] get_algorithm_info'],
        durationMs: Date.now() - startTime,
      };
    }
    const alg = registry.getAlgorithmById(args.id);
    if (!alg) {
      return {
        success: false,
        error: `算法 ${args.id} 不存在`,
        provenance: ['[mcp_metago-algorithms] get_algorithm_info', `[not_found] ${args.id}`],
        durationMs: Date.now() - startTime,
      };
    }
    // 移除 handler 函数，避免序列化
    const { handler, ...meta } = alg;
    return {
      success: true,
      output: meta,
      provenance: ['[mcp_metago-algorithms] get_algorithm_info', `[info] ${args.id}`],
      durationMs: Date.now() - startTime,
      algorithmId: alg.id,
      algorithmName: alg.name,
      algorithmFamily: alg.family,
      algorithmTier: alg.tier,
    };
  };
}

// ============================================================================
// L2 检索发现 handler
// ============================================================================

function createListAlgorithmsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    let list = registry.getRegistry();
    if (args.tier) list = list.filter((a) => a.tier === args.tier);
    if (args.family) list = list.filter((a) => a.family === args.family);
    const limit = args.limit || 50;
    const total = list.length;
    list = list.slice(0, limit);
    // 移除 handler
    const sanitized = list.map(({ handler, ...meta }) => meta);
    return {
      success: true,
      output: { total, limit, algorithms: sanitized },
      provenance: ['[mcp_metago-algorithms] list_algorithms'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createSearchAlgorithmsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    if (!args.query) {
      return {
        success: false,
        error: '缺少必填参数 query',
        provenance: ['[mcp_metago-algorithms] search_algorithms'],
        durationMs: Date.now() - startTime,
      };
    }
    // 自定义搜索：绕过引擎 searchAlgorithms 在某些算法 keywords 非 array 时的 bug
    const q = String(args.query).toLowerCase();
    const all = registry.getRegistry();
    const limit = args.limit || 20;
    const results = all.filter((a) => {
      if (!a) return false;
      const name = (a.name || '').toLowerCase();
      const id = (a.id || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const family = (a.family || '').toLowerCase();
      if (name.includes(q) || id.includes(q) || desc.includes(q) || family.includes(q)) return true;
      // 安全遍历 keywords（可能是 string / array / undefined）
      const kw = a.keywords;
      if (Array.isArray(kw)) {
        return kw.some((k) => String(k).toLowerCase().includes(q));
      } else if (typeof kw === 'string') {
        return kw.toLowerCase().includes(q);
      }
      return false;
    }).slice(0, limit);
    const sanitized = results.map(({ handler, ...meta }) => meta);
    return {
      success: true,
      output: { total: results.length, query: args.query, algorithms: sanitized },
      provenance: ['[mcp_metago-algorithms] search_algorithms', `[query] ${args.query}`, '[custom_search]'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createListFamiliesHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    const all = registry.getRegistry();
    const families = {};
    for (const a of all) {
      families[a.family] = (families[a.family] || 0) + 1;
    }
    return {
      success: true,
      output: {
        total: Object.keys(families).length,
        families: Object.entries(families)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
      provenance: ['[mcp_metago-algorithms] list_families'],
      durationMs: Date.now() - startTime,
    };
  };
}

function createGetStatisticsHandler() {
  return async (args, registry) => {
    const startTime = Date.now();
    const all = registry.getRegistry();
    const tiers = { T1: 0, T2: 0, T3: 0 };
    const families = {};
    for (const a of all) {
      tiers[a.tier] = (tiers[a.tier] || 0) + 1;
      families[a.family] = (families[a.family] || 0) + 1;
    }
    // getImplementedCount() 可能返回数字或对象 {t1,t2,t3,total}
    // implemented 字段语义：已实现算法数 = T1 已实现数（300）
    const impl = registry.getImplementedCount();
    const implemented = typeof impl === 'number' ? impl : (impl && impl.t1 != null ? impl.t1 : 0);
    return {
      success: true,
      output: {
        total: all.length,
        implemented,
        implementedBreakdown: typeof impl === 'object' && impl !== null ? impl : undefined,
        tiers,
        families,
        familiesCount: Object.keys(families).length,
      },
      provenance: ['[mcp_metago-algorithms] get_statistics'],
      durationMs: Date.now() - startTime,
    };
  };
}

// ============================================================================
// L3 高频专用工具 handler（COUPLING 族 T1 的 30 个数学算法）
// ============================================================================

const L3_ID_MAP = {
  cosine_similarity: 'ALG_T1_C_001',
  jaccard_coefficient: 'ALG_T1_C_002',
  dice_coefficient: 'ALG_T1_C_003',
  euclidean_distance: 'ALG_T1_C_004',
  manhattan_distance: 'ALG_T1_C_005',
  chebyshev_distance: 'ALG_T1_C_006',
  pearson_correlation: 'ALG_T1_C_007',
  spearman_correlation: 'ALG_T1_C_008',
  kendall_tau: 'ALG_T1_C_009',
  weighted_cosine: 'ALG_T1_C_010',
  fuzzy_string_match: 'ALG_T1_C_011',
  semantic_similarity: 'ALG_T1_C_012',
  cooccurrence_frequency: 'ALG_T1_C_013',
  time_decay_cooccurrence: 'ALG_T1_C_014',
  evaluate_bidirectional: 'ALG_T1_C_015',
  is_superconductive: 'ALG_T1_C_016',
  identify_weak_pairs: 'ALG_T1_C_017',
  identify_strong_pairs: 'ALG_T1_C_018',
  build_coupling_matrix: 'ALG_T1_C_019',
  normalize_coupling: 'ALG_T1_C_020',
  sort_coupling_scores: 'ALG_T1_C_021',
  record_symmetric: 'ALG_T1_C_022',
  detect_asymmetry: 'ALG_T1_C_023',
  coupling_trend: 'ALG_T1_C_024',
  coupling_clustering: 'ALG_T1_C_025',
  build_value_vector: 'ALG_T1_C_026',
  reduce_dimension: 'ALG_T1_C_027',
  extract_pca: 'ALG_T1_C_028',
  simplified_svd: 'ALG_T1_C_029',
  covariance: 'ALG_T1_C_030',
};

/* ==== METAGO-R141-L3-ADAPT ==== */
/*
 * R141 MCP L3 工具参数适配层
 *
 * 背景：30 个 L3 工具的 MCP schema 与算法真实形参大面积不匹配。
 *   3 项对齐 / 18 项需改名组装 / 9 项 schema 本身与算法语义冲突。
 *
 * 规则：每个工具一条适配函数，返回「算法期望的 input」。
 *   · 算法单形参 → 返回该参数的裸值
 *   · 算法多形参 → 返回位置参数数组（executor 侧由 metagoInvoke 展开）
 */
var L3_ADAPT = {
    // ── A 类：单形参，同名 ───────────────────────────────────────
    is_superconductive: function (a) { return a.couplingScore; },
    coupling_trend: function (a) {
        var ts = a.timeSeries;
        if (!Array.isArray(ts)) return ts;
        if (ts.length && ts[0] && typeof ts[0] === 'object' && ts[0].score !== undefined) return ts;
        return ts.map(function (v, i) {
            return (v && typeof v === 'object') ? { time: i, score: (v.score !== undefined ? v.score : v) } : { time: i, score: v };
        });
    },
    build_value_vector: function (a) {
        var d = a.dimensions;
        if (Array.isArray(d)) return d;
        if (d && typeof d === 'object') {
            return Object.keys(d).map(function (k) {
                var v = d[k];
                return (v && typeof v === 'object' && v.value !== undefined)
                    ? { name: v.name !== undefined ? v.name : k, value: v.value, weight: v.weight !== undefined ? v.weight : 1 }
                    : { name: k, value: v, weight: 1 };
            });
        }
        return d;
    },
    covariance: function (a) {
        if (Array.isArray(a.samples)) return a.samples;
        var xa = Array.isArray(a.a) ? a.a : [], yb = Array.isArray(a.b) ? a.b : [];
        var n = Math.min(xa.length, yb.length);
        var out = [];
        for (var i = 0; i < n; i++) out.push({ x: xa[i], y: yb[i] });
        return out;
    },

    // ── B 类：单形参 pair 对象，由 {a,b} 组装 ─────────────────────
    cosine_similarity: function (a) { return { a: a.a, b: a.b }; },
    jaccard_coefficient: function (a) { return { a: a.a, b: a.b }; },
    dice_coefficient: function (a) { return { a: a.a, b: a.b }; },
    euclidean_distance: function (a) { return { a: a.a, b: a.b }; },
    manhattan_distance: function (a) { return { a: a.a, b: a.b }; },
    chebyshev_distance: function (a) { return { a: a.a, b: a.b }; },
    pearson_correlation: function (a) { return { a: a.a, b: a.b }; },
    spearman_correlation: function (a) { return { a: a.a, b: a.b }; },
    kendall_tau: function (a) { return { a: a.a, b: a.b }; },

    // ── B 类：多形参，按位置组装 ─────────────────────────────────
    weighted_cosine: function (a) { return [{ a: a.a, b: a.b }, a.weights]; },
    fuzzy_string_match: function (a) { return [a.a, a.b]; },
    semantic_similarity: function (a) {
        /* R142 类型守卫：schema 声明 a/b 为 string。
           实测传数组不报错但静默返回 score:0 —— 那是假结果，必须明确拒绝。 */
        var x = a.a, y = a.b;
        function kind(v) { return Array.isArray(v) ? 'array' : (v === null ? 'null' : typeof v); }
        if (typeof x !== 'string') throw new Error('[R142-TYPE] semantic_similarity.a 必须是 string，收到 ' + kind(x));
        if (typeof y !== 'string') throw new Error('[R142-TYPE] semantic_similarity.b 必须是 string，收到 ' + kind(y));
        return [x, y];
    },
    evaluate_bidirectional: function (a) { return [a.forward, a.backward]; },
    identify_weak_pairs: function (a) { return [toCouplingMatrix(a.pairs !== undefined ? a.pairs : a.matrix), a.threshold !== undefined ? a.threshold : 0.3]; },
    identify_strong_pairs: function (a) { return [toCouplingMatrix(a.pairs !== undefined ? a.pairs : a.matrix), a.threshold]; },
    sort_coupling_scores: function (a) {
        var desc = (a.order === 'asc') ? false : (a.order === 'desc' ? true : (a.descending !== undefined ? a.descending : true));
        return [a.scores !== undefined ? a.scores : a.entries, desc];
    },
    coupling_clustering: function (a) {
        var th;
        if (typeof a.threshold === 'number') th = a.threshold;
        else if (typeof a.k === 'number') th = (a.k > 0 && a.k <= 1) ? a.k : 0.5;
        else th = 0.5;
        return [toCouplingMatrix(a.entities !== undefined ? a.entities : a.matrix), th];
    },
    reduce_dimension: function (a) { return [a.data !== undefined ? a.data : a.vector, a.targetDim]; },
    record_symmetric: function (a) {
        var store = (a.store && typeof a.store.set === 'function') ? a.store : new Map();
        var ea = a.entityA, eb = a.entityB;
        var ai = (ea && typeof ea === 'object') ? (ea.id !== undefined ? ea.id : ea) : ea;
        var bi = (eb && typeof eb === 'object') ? (eb.id !== undefined ? eb.id : eb) : eb;
        return [store, ai, bi, a.score];
    },
    simplified_svd: function (a) { return [a.matrix, a.iterations]; },
    /* R141-fix：算法 extractPrincipalComponent(vectors) 是**单参**，
       metagoInvoke 对单参是 handler(input) 原样传、不展开。
       原实现 return [a.data] 多包了一层 → handler 收到 [data]（三层嵌套）
       → vectors[0]=data、dim=4、col=[[1,2,3]] → 算出 {index:0, variance:-1}（错）。
       实测：去掉包装后 {index:2, variance:11.25} 才对。 */
    extract_pca: function (a) { return (a.data !== undefined) ? a.data : a.vectors; },
    build_coupling_matrix: function (a) {
        // schema: {entities:[{id,name}], relations:[{from,to,weight}] | [[from,to,weight]]}
        // 算法:  buildCouplingMatrix(labels, scoreFn)
        //       handler 的调用是 scoreFn(labels[i], labels[j]) —— 传的是 **label 值**，不是索引。
        //
        // R141-fix：原实现把 scoreFn 的形参当索引用（labels[i]），与 handler 的调用方式相反，
        // 导致 li = labels["A"] = undefined；再叠加 String(undefined)==="undefined" 的假匹配，
        // 数组形式的关系会把所有权重错加（非对角全 3），对象形式则全部丢失（非对角全 0）。
        // 现在：scoreFn 直接接收两个 label 值；关系支持 {from,to,weight} / [from,to,weight] / {source,target,weight}。
        var ents = a.entities || [];
        var rels = a.relations || [];
        var labels = ents.map(function (e) { return (e && e.id !== undefined) ? e.id : e; });
        var known = {};
        labels.forEach(function (l) { known[String(l)] = true; });

        var norm = rels.map(function (r) {
            if (!r) return null;
            var f, t, w;
            if (Array.isArray(r)) { f = r[0]; t = r[1]; w = r[2]; }
            else {
                f = (r.from !== undefined) ? r.from : r.source;
                t = (r.to !== undefined) ? r.to : r.target;
                w = r.weight;
            }
            return {
                f: String(f), t: String(t),
                w: (typeof w === 'number' && isFinite(w)) ? w : null,   // 缺失/非法权重记 null，不静默当 1
            };
        }).filter(Boolean);

        var dropped = norm.filter(function (r) { return r.w === null; }).length;

        var scoreFn = function (li, lj) {          // ← 参数是 label 值（与 handler 一致）
            var a1 = String(li), b1 = String(lj);
            // label 不合法就返回 0，绝不假匹配
            if (!known[a1] || !known[b1]) return 0;
            var wi = 0, wj = 0, hasI = false, hasJ = false;
            norm.forEach(function (r) {
                if (r.w === null) return;          // 没权重的关系不参与（不猜 1）
                if (r.f === a1 && r.t === b1) { wi += r.w; hasI = true; }
                if (r.f === b1 && r.t === a1) { wj += r.w; hasJ = true; }
            });
            /* 对称化规则（不能无条件 (wi+wj)/2）：
               双向都有 → 取平均；只有单向 → 直接用该方向的值；都没有 → 0。
               无条件除以 2 会把所有单向关系的权重减半——那是错的。 */
            if (hasI && hasJ) return (wi + wj) / 2;
            if (hasI) return wi;
            if (hasJ) return wj;
            return 0;
        };
        scoreFn.__r141Meta = { relationCount: norm.length, droppedNoWeight: dropped };
        return [labels, scoreFn];
    },
    detect_asymmetry: function (a) {
        return [toCouplingMatrix(a.pairs !== undefined ? a.pairs : a.matrix),
            a.tolerance !== undefined ? a.tolerance : 0.01];
    },
    normalize_coupling: function (a) {
        // schema 已改为 {scores: number[]}；兼容旧式 {score,min,max}
        if (Array.isArray(a.scores)) return a.scores;
        if (typeof a.score === 'number') return [a.score];
        return a.scores;
    },
    cooccurrence_frequency: function (a) {
        // 算法: cooccurrenceFrequency(sequences, item1, item2)
        if (Array.isArray(a.sequences) && a.item1 !== undefined) return [a.sequences, a.item1, a.item2];
        // 兼容 schema {items, window}：items 视为单序列，取前两项
        var seq = Array.isArray(a.items) ? a.items : [];
        var flat = seq.map(function (x) { return Array.isArray(x) ? x : [x]; });
        var uniq = [];
        flat.forEach(function (s) { s.forEach(function (t) { if (uniq.indexOf(t) < 0) uniq.push(t); }); });
        return [flat, uniq[0], uniq[1]];
    },
    time_decay_cooccurrence: function (a) {
        // 算法: timeDecayCooccurrence(events, item1, item2, halfLifeMs, now)
        // events 元素必须是 { items: [...], time: number }
        /* R142-fix：原实现有三个硬编码
           · 忽略 a.item1 / a.item2（恒用 items 里前两个不同项）
           · now 硬编码 Date.now() —— 与相对时间戳（0/100/200）相差半个世纪
             → weight = 0.5^(1.79e12/5000) ≈ 0 → score 恒 0，且 success:true
           现在：item1/item2 尊重调用方；now 缺省取「事件时间戳最大值」
                （对相对时间戳这才是符合直觉的「现在」，衰减才有意义）。 */
        function __cnvNow(evs, a2) {
            if (typeof a2.now === 'number') return a2.now;
            var mx = -Infinity;
            for (var i = 0; i < evs.length; i++) {
                var t = evs[i] && evs[i].time;
                if (typeof t === 'number' && isFinite(t) && t > mx) mx = t;
            }
            return (mx === -Infinity) ? Date.now() : mx;
        }
        if (Array.isArray(a.events) && a.events[0] && a.events[0].items) {
            return [a.events,
                a.item1 !== undefined ? a.item1 : undefined,
                a.item2 !== undefined ? a.item2 : undefined,
                a.halfLifeMs !== undefined ? a.halfLifeMs : a.halfLife,
                __cnvNow(a.events, a)];
        }
        var items = Array.isArray(a.items) ? a.items : [];
        var ts = Array.isArray(a.timestamps) ? a.timestamps : [];
        var evs = items.map(function (it, i) {
            return { items: Array.isArray(it) ? it : [it], time: ts[i] !== undefined ? ts[i] : i };
        });
        var at = [];
        evs.forEach(function (e) { e.items.forEach(function (k) { if (at.indexOf(k) < 0) at.push(k); }); });
        var hl = (typeof a.halfLife === 'number') ? a.halfLife : (typeof a.halfLifeMs === 'number' ? a.halfLifeMs : 3600000);
        return [evs,
            a.item1 !== undefined ? a.item1 : at[0],
            a.item2 !== undefined ? a.item2 : at[1],
            hl,
            __cnvNow(evs, a)];
    },
};

function toCouplingMatrix(input) {
    if (input && typeof input === 'object' && !Array.isArray(input) && typeof input.size === 'number' && Array.isArray(input.matrix)) {
        return input;
    }
    var m = input;
    if (m && typeof m === 'object' && !Array.isArray(m) && Array.isArray(m.matrix)) m = m.matrix;
    if (!Array.isArray(m)) m = [];
    var size = m.length;
    var labels = [];
    for (var i = 0; i < size; i++) labels.push(String(i));
    var fixed = [];
    for (var r = 0; r < size; r++) {
        var row = Array.isArray(m[r]) ? m[r] : [];
        var nr = [];
        for (var c = 0; c < size; c++) nr.push(typeof row[c] === 'number' ? row[c] : 0);
        fixed.push(nr);
    }
    return { size: size, matrix: fixed, labels: labels };
}


/* ════ R142 必填参数守卫 ════
   问题：缺必填参数时算法内部直接取 a.x.length 崩，
        报 "Cannot read properties of undefined (reading 'length')"——
        调用方看不出缺哪个字段、该给什么类型（实测 19/30 工具如此）。
   做法：在适配器入口按 schema 的 required + type 校验，抛可读错误。
   范围：只校验 required 中的字段，以及传了但类型明显不对的字段。
        可选字段不校验（缺失是合法的）。
   缓存的 schema 表在首次调用时构建，避免每次读盘。 */
var __R142_SCHEMAS = null;
function __r142Schemas() {
    if (__R142_SCHEMAS) return __R142_SCHEMAS;
    var fs = require('fs'), path = require('path');
    var dir = path.join(__dirname, 'tools');
    var out = {};
    try {
        fs.readdirSync(dir).forEach(function (f) {
            if (!/\.json$/.test(f)) return;
            try {
                var d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                var a = d.arguments || d.inputSchema || {};
                out[f.replace(/\.json$/, '')] = { props: a.properties || {}, required: a.required || [] };
            } catch (e) { /* 单个 schema 坏了不影响其他工具 */ }
        });
    } catch (e) { /* tools 目录不存在时不校验，退回原行为 */ }
    __R142_SCHEMAS = out;
    return out;
}
function __r142Kind(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
    return typeof v;
}
function __r142Guard(toolName, args) {
    var sch = __r142Schemas()[toolName];
    if (!sch) return;
    var a = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {};
    var missing = [];
    sch.required.forEach(function (k) {
        if (a[k] === undefined) missing.push(k);
    });
    if (missing.length) {
        var hints = missing.map(function (k) {
            var p = sch.props[k] || {};
            return k + (p.type ? '(' + JSON.stringify(p.type) + ')' : '');
        });
        throw new Error('[R142-ARGS] ' + toolName + ' 缺必填参数：' + hints.join('、')
            + '。完整参数形状见该工具的 schema examples。');
    }
    var wrong = [];
    Object.keys(sch.props).forEach(function (k) {
        if (a[k] === undefined) return;
        var t = sch.props[k].type;
        if (!t) return;
        var kinds = Array.isArray(t) ? t : [t];
        var actual = __r142Kind(a[k]);
        var normalized = kinds.map(function (x) {
            return (x === 'float' || x === 'int' || x === 'integer') ? 'number' : x;
        });
        if (actual === 'integer' && normalized.indexOf('number') >= 0) return;
        if (normalized.indexOf(actual) < 0) {
            wrong.push(k + ' 期望 ' + JSON.stringify(t) + ' 实际 ' + actual);
        }
    });
    if (wrong.length) {
        throw new Error('[R142-ARGS] ' + toolName + ' 参数类型不符：' + wrong.join('；'));
    }
}

function adaptL3Args(toolName, args) {
    __r142Guard(toolName, args);   // R142：必填 + 类型校验，让错误信息可读
    var fn = L3_ADAPT[toolName];
    if (!fn) return { ok: false, error: '无适配器: ' + toolName };
    try {
        return { ok: true, input: fn(args || {}) };
    } catch (e) {
        return { ok: false, error: '适配失败: ' + e.message };
    }
}

function isEmptyShell(out) {
    if (out === null || out === undefined) return true;
    if (Array.isArray(out)) return out.length === 0;
    if (typeof out !== 'object') return false;
    var keys = Object.keys(out).filter(function (k) { return k !== 'provenance'; });
    if (keys.length === 0) return true;
    return keys.every(function (k) {
        var v = out[k];
        if (v === null || v === undefined) return true;
        if (Array.isArray(v)) return v.length === 0;
        if (typeof v === 'object') return Object.keys(v).length === 0;
        if (typeof v === 'string') return v.trim() === '';
        return false;
    });
}
/* ==== /METAGO-R141-L3-ADAPT ==== */

function createL3Handler(toolName, algorithmId) {
  return async (args, registry) => {
    const startTime = Date.now();
    /* R141：先适配参数形状，再执行 */
    const ad = adaptL3Args(toolName, args);
    if (!ad.ok) {
      return {
        success: false,
        error: ad.error,
        provenance: ['[mcp_metago-algorithms] ' + toolName, '[R141-L3-ADAPT] ' + ad.error],
        durationMs: Date.now() - startTime,
      };
    }
    const result = registry.executeAlgorithmSync(algorithmId, ad.input);
    /* R141：输出守卫——空壳不得报成功 */
    if (result && result.success === true && isEmptyShell(result.output)) {
      return {
        success: false,
        error: 'invalid_output: 算法返回空结果（可能是入参形状不匹配）',
        provenance: (result.provenance || []).concat(['[R141-OUTPUT-GUARD] empty shell blocked']),
        durationMs: Date.now() - startTime,
        output: result.output,
      };
    }
    return enrichResult(result, algorithmId, registry, toolName, startTime);
  };
}

// ============================================================================
// L4 族级工具 handler（20 个算法族，每族一个工具）
// ============================================================================

const L4_FAMILY_MAP = {
  coupling_calculate: 'COUPLING',
  value_assess: 'VALUE',
  bias_detect: 'BIAS',
  logic_reason: 'LOGIC',
  evolution_evolve: 'EVOLUTION',
  creation_create: 'CREATION',
  negentropy_measure: 'NEGENTROPY',
  memory_operate: 'MEMORY',
  learning_learn: 'LEARNING',
  reasoning_chain: 'REASONING',
  intuition_gauge: 'INTUITION',
  conflict_resolve: 'CONFLICT',
  time_analyze: 'TIME',
  frequency_process: 'FREQUENCY',
  decision_decide: 'DECISION',
  security_assess: 'SECURITY',
  dialog_manage: 'DIALOG',
  proactive_suggest: 'PROACTIVE',
  idea_generate: 'IDEA',
  audit_check: 'AUDIT',
};

function createL4Handler(toolName, family) {
  return async (args, registry) => {
    const startTime = Date.now();
    const operation = args.operation || 'default';
    const input = args.input || {};

    // 在该族中查找匹配 operation 的算法
    const familyAlgs = registry.getAlgorithmsByFamily(family);
    if (!familyAlgs || familyAlgs.length === 0) {
      return {
        success: false,
        error: `族 ${family} 中没有算法`,
        provenance: ['[mcp_metago-algorithms] ' + toolName, '[empty_family] ' + family],
        durationMs: Date.now() - startTime,
        algorithmFamily: family,
      };
    }

    const opLower = operation.toLowerCase();
    const matched = familyAlgs.find(
      (a) =>
        a.name.toLowerCase().includes(opLower) ||
        a.id.toLowerCase().includes(opLower) ||
        (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(opLower)))
    );

    const targetAlg = matched || familyAlgs[0];
    const targetId = targetAlg.id;

    // 尝试同步执行
    let result = registry.executeAlgorithmSync(targetId, input);

    // 异步回退：如果同步执行失败且错误含"异步"字样，改用异步执行
    if (
      !result.success &&
      result.error &&
      (result.error.includes('异步') || result.error.includes('async'))
    ) {
      result = await registry.executeAlgorithm(targetId, input);
    }

    const enriched = enrichResult(result, targetId, registry, toolName, startTime);
    enriched.operation = operation;
    enriched.matched = !!matched;
    if (!matched) {
      enriched.warning = `未找到匹配 operation="${operation}" 的算法，使用族默认算法 ${targetId}。可用算法：${familyAlgs.slice(0, 5).map((a) => a.id).join(', ')}...`;
    }
    return enriched;
  };
}

// ============================================================================
// 结果富化函数（填充 algorithmId/Name/Family/Tier/provenance/durationMs）
// ============================================================================

function enrichResult(result, algorithmId, registry, toolName, startTime) {
  const alg = registry.getAlgorithmById(algorithmId);
  const durationMs = Date.now() - startTime;
  // 兼容 result 直接是算法返回值（无 success 字段）的情况
  const isSuccess = result && typeof result === 'object' && 'success' in result
    ? result.success
    : true;
  return {
    success: isSuccess,
    output: isSuccess && result && result.output !== undefined ? result.output : (isSuccess ? result : undefined),
    error: result && result.error ? result.error : undefined,
    provenance: [
      '[mcp_metago-algorithms] ' + toolName,
      '[engine] ' + (result && result.async ? 'executeAlgorithm' : 'executeAlgorithmSync'),
      algorithmId,
      ...((result && result.provenance) || []),
    ],
    durationMs,
    algorithmId,
    algorithmName: alg ? alg.name : 'unknown',
    algorithmFamily: alg ? alg.family : 'unknown',
    algorithmTier: alg ? alg.tier : 'unknown',
  };
}

// ============================================================================
// 初始化：加载所有 schema 并创建 handler
// ============================================================================

function initialize(registry) {
  schemas.length = 0;
  Object.keys(handlers).forEach((k) => delete handlers[k]);

  const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const schema = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));
    schemas.push(schema);

    const toolName = schema.name;
    let handler;

    // L1 通用入口
    if (toolName === 'execute') handler = createExecuteHandler();
    else if (toolName === 'execute_sync') handler = createExecuteSyncHandler();
    else if (toolName === 'get_algorithm_info') handler = createGetAlgorithmInfoHandler();
    // L2 检索发现
    else if (toolName === 'list_algorithms') handler = createListAlgorithmsHandler();
    else if (toolName === 'search_algorithms') handler = createSearchAlgorithmsHandler();
    else if (toolName === 'list_families') handler = createListFamiliesHandler();
    else if (toolName === 'get_statistics') handler = createGetStatisticsHandler();
    // L3 高频专用
    else if (L3_ID_MAP[toolName]) handler = createL3Handler(toolName, L3_ID_MAP[toolName]);
    // L4 族级工具
    else if (L4_FAMILY_MAP[toolName]) handler = createL4Handler(toolName, L4_FAMILY_MAP[toolName]);
    // 默认 handler
    else {
      handler = async () => ({
        success: false,
        error: `工具 ${toolName} 的 handler 未实现`,
        provenance: ['[mcp_metago-algorithms] ' + toolName, '[no_handler]'],
      });
    }

    handlers[toolName] = handler;
  }
}

// ============================================================================
// 模块导出
// ============================================================================

module.exports = {
  initialize,
  getAllSchemas: () => schemas,
  getHandler: (name) => handlers[name],
  getHandlerCount: () => Object.keys(handlers).length,
  L3_ID_MAP,
  L4_FAMILY_MAP,
};
