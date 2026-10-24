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
    semantic_similarity: function (a) { return [a.a, a.b]; },
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
    extract_pca: function (a) { return [a.data !== undefined ? a.data : a.vectors]; },
    build_coupling_matrix: function (a) {
        // schema: {entities:[{id,name}], relations:[{from,to,weight}]}
        // 算法:  buildCouplingMatrix(labels, scoreFn)
        var ents = a.entities || [];
        var rels = a.relations || [];
        var labels = ents.map(function (e) { return (e && e.id !== undefined) ? e.id : e; });
        var idx = {};
        labels.forEach(function (l, i) { idx[String(l)] = i; });
        var scoreFn = function (i, j) {
            var wi = 0, wj = 0;
            var li = labels[i], lj = labels[j];
            rels.forEach(function (r) {
                if (!r) return;
                var f = String(r.from !== undefined ? r.from : r.source);
                var t = String(r.to !== undefined ? r.to : r.target);
                var w = (typeof r.weight === 'number') ? r.weight : 1;
                if (f === String(li) && t === String(lj)) wi += w;
                if (f === String(lj) && t === String(li)) wj += w;
            });
            return (wi + wj) / 2;
        };
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
        if (Array.isArray(a.events) && a.events[0] && a.events[0].items) {
            return [a.events, a.item1, a.item2,
                a.halfLifeMs !== undefined ? a.halfLifeMs : a.halfLife,
                a.now !== undefined ? a.now : Date.now()];
        }
        var items = Array.isArray(a.items) ? a.items : [];
        var ts = Array.isArray(a.timestamps) ? a.timestamps : [];
        var evs = items.map(function (it, i) {
            return { items: Array.isArray(it) ? it : [it], time: ts[i] !== undefined ? ts[i] : i };
        });
        var at = [];
        evs.forEach(function (e) { e.items.forEach(function (k) { if (at.indexOf(k) < 0) at.push(k); }); });
        var hl = (typeof a.halfLife === 'number') ? a.halfLife : (typeof a.halfLifeMs === 'number' ? a.halfLifeMs : 3600000);
        return [evs, at[0], at[1], hl, Date.now()];
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

function adaptL3Args(toolName, args) {
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