/* ==== METAGO-R141-POSITIONAL ==== */
/*
 * R141 位置参数展开（P0-A01~A04 根因修复）
 *
 * 原实现 `entry.handler(input)` 只传一个参数，导致所有多形参算法
 * （identifyStrongPairs(matrix,threshold)、buildCouplingMatrix(labels,scoreFn)…）
 * 的第 2、3 个参数永远是 undefined 或默认值。
 *
 * 本函数按 handler.length 决定调用方式，单形参算法行为完全不变。
 */
/*
 * R141 函数型形参桥接（P1-B01）
 * 允许调用方用字符串表达式或 {__fn__} 传函数型形参。
 */
var METAGO_FN_SRC_RE = /^\s*(async\s+)?(\(|[A-Za-z_$][\w$]*\s*=>|function\b)/;
/* 安全边界：与 t3impl/fn-bridge.cjs 完全一致，避免两套标准 */
var METAGO_FN_MAX_LEN = 512;
var METAGO_FN_BANNED = /\b(require|process|global|globalThis|module|exports|eval|Function|import|__proto__|setTimeout|setInterval|Buffer|child_process)\b/;
var METAGO_FN_PRESETS = {
    'Math.random': function () { return Math.random; },
    'random': function () { return Math.random; },
    'identity': function () { return function (x) { return x; }; },
    'sum': function () { return function (a, b) { return (a || 0) + (b || 0); }; },
    'avg': function () { return function (a, b) { return ((a || 0) + (b || 0)) / 2; }; },
    'max': function () { return function (a, b) { return Math.max(a, b); }; },
    'min': function () { return function (a, b) { return Math.min(a, b); }; },
    'euclidean': function () { return function (a, b) { return Math.sqrt((a - b) * (a - b)); }; },
    'absdiff': function () { return function (a, b) { return Math.abs(a - b); }; },
    'length': function () { return function (x) { return (x && x.length) || 0; }; },
    'count': function () { return function (x) { return (x && x.length) || 0; }; },
    'first': function () { return function (x) { return Array.isArray(x) ? x[0] : x; }; }
};
function metagoCoerceFn(value, paramName) {
    if (typeof value === 'function') return value;
    /* R142-fix：preset 查找必须在 RE 判断**之前**。
       原顺序「先判 RE → 不匹配就原样返回」让 METAGO_FN_PRESETS 里的
       'Math.random' / 'random' / 'identity' 等名称永远走不到
       （它们含点号或纯标识符，不符合 METAGO_FN_SRC_RE 的 (… / x=> / function 形式）。
       实测后果：examples 写 "rng":"Math.random" 时 rng 仍是字符串 → 算法内 rng() 崩。 */
    if (typeof value === 'string') {
        var __k = value.trim();
        if (Object.prototype.hasOwnProperty.call(METAGO_FN_PRESETS, __k)) {
            return METAGO_FN_PRESETS[__k]();
        }
    }
    var src = null;
    if (value && typeof value === 'object' && typeof value.__fn__ === 'string') {
        src = value.__fn__;
    } else if (typeof value === 'string' && METAGO_FN_SRC_RE.test(value)) {
        src = value;
    }
    if (src === null) return value;
    /* 安全边界（防 RCE） */
    if (typeof src !== 'string') {
        throw new Error('[R141-FN-BRIDGE] 形参 ' + (paramName || '?') + ' 的函数表达式必须是字符串');
    }
    var s = src.trim();
    if (!s || s.length > METAGO_FN_MAX_LEN) {
        throw new Error('[R141-FN-BRIDGE] 形参 ' + (paramName || '?') + ' 的表达式为空或超长（上限 ' + METAGO_FN_MAX_LEN + '）');
    }
    if (METAGO_FN_BANNED.test(s)) {
        throw new Error('[R141-FN-BRIDGE] 形参 ' + (paramName || '?') + ' 的表达式含禁用构造（require/process/eval/Function/import 等）');
    }
    var preset = METAGO_FN_PRESETS[s];
    if (preset) return preset();
    try {
        var fn = (new Function('return (' + s + ')'))();
        if (typeof fn !== 'function') {
            throw new Error('表达式不是函数');
        }
        /* 异常不外泄 */
        return function () {
            try { return fn.apply(null, arguments); } catch (err) { return undefined; }
        };
    } catch (e) {
        throw new Error('[R141-FN-BRIDGE] 形参 ' + (paramName || '?') + ' 的函数表达式编译失败: ' + e.message);
    }
}

function metagoParamNames(fn) {
    var s = String(fn);
    var m = s.match(/^[^(]*\(([^)]*)\)/);
    if (!m) return [];
    return m[1].split(',').map(function (x) {
        return x.trim().split('=')[0].trim();
    }).filter(Boolean);
}
function metagoInvoke(handler, input) {
    /* 用形参名解析结果计数，不用 handler.length ——
       JS 的 fn.length 不计入有默认值的形参，
       如 simplifiedSVD(matrix, iterations = 100).length === 1。 */
    var names = metagoParamNames(handler);
    var n = names.length;
    if (n > 1) {
        var args;
        if (Array.isArray(input)) {
            args = input.slice();
        } else if (input && typeof input === 'object') {
            args = names.map(function (k) { return input[k]; });
        } else {
            return handler(input);
        }
        for (var i = 0; i < args.length; i++) {
            args[i] = metagoCoerceFn(args[i], names[i]);
        }
        return handler.apply(null, args);
    }
    if (n === 1) {
        return handler(metagoCoerceFn(input, names[0]));
    }
    return handler(input);
}
/* ==== R142-PRESET: metagoCoerceFn 的 preset 查找已提前（修 dead code） ==== */
/* ==== /METAGO-R141-POSITIONAL ==== */