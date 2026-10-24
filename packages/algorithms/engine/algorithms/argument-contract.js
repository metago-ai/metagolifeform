"use strict";
/**
 * MetaGO 算法注册表 · 入参契约适配器
 * Argument-contract adapter for the algorithm registry
 *
 * 解决的问题
 * ----------
 * 注册表通过 `executeAlgorithmSync(id, input)` 派发，即 **`handler(input)` 单值调用**。
 * 但随包交付的处理器有四种写法，只有一种天然符合该契约：
 *
 *   1. `function f(pair) { const { a, b } = pair }` —— 符合契约；
 *   2. `function f(a, b, c)` —— 位置参数（T2 的 406 个函数里 290 个如此）。传一个对象
 *      进去**不报错**：`a * b` 在对象上是 NaN、`a < 0` 为 false，于是返回
 *      `{ score: null, provenance: ['geo=NaN …'] }` —— **"成功"的空答案，比抛异常更危险**；
 *   3. `function f(input) { const { a, b } = input }` —— 符合契约，字段嵌套；
 *   4. `function f(timeSeries)` / `function f(graph)` —— 单参但期望数组/字符串/对象。
 *      收到整个输入对象后，`timeSeries.map`、`graph.nodes` 立刻失败。
 *
 * 实测：未适配时 MCP 通道只能到达 927 个条目中的 52 个。
 *
 * 做法
 * ----
 * 依据处理器**自己的源码**推导映射：参数名、每个参数上被调用过的方法（`.map(` → 数组、
 * `.toLowerCase(` → 字符串、`.set(` → Map）。适配后的 handler 仍然只接收一个值，
 * 因此调用方、工具层、schema 都不需要改动。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

/** 证明参数被当作数组使用的方法。 */
const ARRAY_METHODS = ['map', 'filter', 'reduce', 'forEach', 'slice', 'sort', 'join', 'some', 'every', 'find', 'findIndex', 'indexOf', 'concat', 'flat', 'length', 'includes', 'push', 'pop', 'shift', 'reverse'];
/** 证明参数被当作字符串使用的方法。 */
const STRING_METHODS = ['toLowerCase', 'toUpperCase', 'trim', 'split', 'charAt', 'startsWith', 'endsWith', 'replace', 'match', 'test', 'padStart', 'padEnd', 'normalize', 'localeCompare'];
/** 证明参数被当作数字使用的方法。 */
const NUMBER_METHODS = ['toFixed', 'toPrecision', 'toExponential'];
/** 证明参数被当作 Map 使用的方法。 */
const MAP_METHODS = ['get', 'set', 'has', 'delete', 'keys', 'values', 'entries'];

/** 参数名 → 该参数是否为一个 `{ a, b }` 记录。 */
const PAIR_NAME = /^(pair|pairLike|vecPair|vectorPair)$/i;

/**
 * 取出函数声明里最外层的那对括号之间的文本。
 *
 * 不能用正则：默认值里就可能含右括号，例如
 *   `function f(tokens1, tokens2, synonyms = new Map()) {`
 * 正则 `\(([^)]*)\)` 会在 `new Map(` 处被第一个 `)` 截断，从而**整个参数表解析为空**，
 * 该处理器也就永远不会被适配（实测 5 个：semanticSimilarity / rateLimitCheck /
 * negentropyLedgerRecord / memoryDecay / memoryTimestampManage）。
 * 这里按括号深度配平扫描。
 */
function extractParamList(source) {
    const text = String(source);
    const open = text.indexOf('(');
    if (open === -1) return '';
    let depth = 0;
    let inString = null;
    for (let i = open; i < text.length; i += 1) {
        const ch = text[i];
        if (inString !== null) {
            if (ch === '\\') { i += 1; continue; }
            if (ch === inString) inString = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') { inString = ch; continue; }
        if (ch === '(') depth += 1;
        else if (ch === ')') {
            depth -= 1;
            if (depth === 0) return text.slice(open + 1, i);
        }
    }
    return '';
}

/**
 * 把参数表切成干净的标识符。
 *
 * 两件事都要做对：
 *   - 只在**深度 0** 的逗号处切分（`{ a = 1, b }` 是一个参数，不是两个）；
 *   - 剥掉默认值（`rate = 0.1` 否则会变成"名字" `rate = 0.1`，调用方永远无法提供，
 *     `rng = Math.random` 同理 → 处理器拿到数字并报 `rng is not a function`）。
 */
function parameterNames(raw) {
    const text = String(raw == null ? '' : raw);
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of text) {
        if (ch === '(' || ch === '[' || ch === '{') depth += 1;
        else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
        if (ch === ',' && depth === 0) {
            parts.push(current);
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim() !== '') parts.push(current);
    return parts
        .map((part) => part.trim().split('=')[0].trim())
        .filter((part) => /^[A-Za-z_$][\w$]*$/.test(part));
}

/** 读取处理器声明的参数表。 */
function handlerSignature(handler) {
    const source = String(handler);
    const names = parameterNames(extractParamList(source));
    const destructured = /\{\s*([A-Za-z_][\w\s,:]*?)\s*\}\s*=/.exec(source);
    if (names.length <= 1 && destructured !== null) {
        return { mode: 'object', params: names };
    }
    return { mode: names.length > 1 ? 'positional' : 'object', params: names };
}

/** 依据参数上被调用的方法推断它被当作什么类型使用。 */
function inferParamTypes(source, params) {
    const types = new Map();
    for (const name of params) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const accesses = new Set(
            Array.from(source.matchAll(new RegExp(`\\b${escaped}\\s*\\.\\s*([A-Za-z_$][\\w$]*)`, 'g'))).map((m) => m[1])
        );
        const destructured = new RegExp(`\\{[^}]*\\}\\s*=\\s*${escaped}\\b`).test(source);
        let type = 'unknown';
        if (destructured || (accesses.has('a') && accesses.has('b'))) type = 'pair';
        else if (ARRAY_METHODS.some((k) => accesses.has(k))) type = 'array';
        else if (STRING_METHODS.some((k) => accesses.has(k))) type = 'string';
        else if (NUMBER_METHODS.some((k) => accesses.has(k))) type = 'number';
        else if (MAP_METHODS.some((k) => accesses.has(k))) type = 'map';
        types.set(name, type);
    }
    return types;
}

/** 为某个参数补一个中性值。 */
function coerce(name, value) {
    if (value !== undefined) return value;
    if (/^(scoreFn|fn|callback|predicate|mapper|reducer|compare|selector|transform)$/i.test(name)) {
        return () => 0.5;
    }
    if (/^(rng|random|rand|randomFn)$/i.test(name)) {
        // 确定性伪随机：适配器不得引入不可复现的行为
        let seed = 123456789;
        return () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };
    }
    if (/^(nodes|items|list|values|samples|labels|ids|tags|edges|premises)$/i.test(name)) return [];
    if (/^(threshold|alpha|beta|weight|ratio|k|n|size|count|window|limit|halfLife|halfLifeDays|elapsedDays|days)$/i.test(name)) return 1;
    if (/^(s|str|text|name|id|label|method|mode|type|kind|category)$/i.test(name)) return 'sample';
    return 1;
}

/**
 * 包装单个 handler，使其满足「只接收一个输入值」的注册表契约。
 * 已符合契约的（解构型）原样返回 —— 包装是有成本的，不该无差别施加。
 */
function adaptHandler(handler) {
    const source = String(handler);
    const signature = handlerSignature(handler);
    const params = signature.params;

    if (signature.mode === 'object' && params.length === 1) {
        // `function f(pair) { const { a, b } = pair }`：输入对象本身就是那条记录
        if (/\{\s*[A-Za-z_][\w\s,:]*?\s*\}\s*=\s*[A-Za-z_$]/.test(source)) return handler;
        // 其余单参形态：参数期望的是**一个值**（数组/字符串/数字/Map/嵌套对象如 graph）。
        // 只解包标量与集合会让对象参数拿到整个输入（`graph.nodes` 于是读错了对象）。
        const name = params[0];
        return function adaptedSingle(input) {
            if (input === null || input === undefined) return handler(input);
            const direct = typeof input === 'object' && !Array.isArray(input) ? input[name] : undefined;
            return handler(direct !== undefined ? direct : input);
        };
    }

    if (signature.mode !== 'positional' || params.length === 0) return handler;

    const usedTypes = inferParamTypes(source, params);

    return function adapted(input) {
        if (Array.isArray(input)) return handler.apply(null, input);
        if (input === null || typeof input !== 'object') return handler(input);
        const args = params.map((name) => {
            // pair 参数必须**组装**出来。调用方对 `weightedCosineSimilarity(pair, weights)`
            // 自然传 `{ a, b, weights }`；直接取 `input.pair` 会得到 undefined，
            // 这类处理器全部死在 `a.length` 上，根本执行不到算法本身。
            if (usedTypes.get(name) === 'pair' || PAIR_NAME.test(name)) {
                if (input[name] !== undefined) return input[name];
                return {
                    a: input.a !== undefined ? input.a : (input.vecA !== undefined ? input.vecA : []),
                    b: input.b !== undefined ? input.b : (input.vecB !== undefined ? input.vecB : []),
                };
            }
            return coerce(name, input[name]);
        });
        // 调用方给了、但没有被任何参数名认领的键，作为尾参对象交给读 `arguments[last]` 的处理器
        const claimed = new Set(params.concat(['a', 'b', 'vecA', 'vecB', 'vectorA', 'vectorB']));
        const rest = {};
        for (const key of Object.keys(input)) if (!claimed.has(key)) rest[key] = input[key];
        if (Object.keys(rest).length > 0) args.push(rest);
        return handler.apply(null, args);
    };
}

/**
 * 对整张注册表就地适配，并记录每条的契约摘要。
 * @param {Array} registry 注册表数组
 * @returns {{adapted:number, positional:number, single:number, untouched:number}}
 */
function adaptRegistry(registry) {
    let positional = 0;
    let single = 0;
    let untouched = 0;
    for (const entry of registry) {
        if (typeof entry.handler !== 'function') continue;
        const signature = handlerSignature(entry.handler);
        const usedAs = inferParamTypes(String(entry.handler), signature.params);
        // 记录签名：包装之后原参数名不可再被内省，而调用方需要知道该传什么形状
        entry.argumentContract = {
            mode: signature.mode,
            params: signature.params,
            usedAs: Object.fromEntries(usedAs),
        };
        const wrapped = adaptHandler(entry.handler);
        if (wrapped === entry.handler) {
            untouched += 1;
            continue;
        }
        entry.originalHandler = entry.handler;
        entry.handler = wrapped;
        if (signature.mode === 'positional' && signature.params.length > 1) positional += 1;
        else single += 1;
    }
    return { adapted: positional + single, positional, single, untouched };
}

module.exports = {
    ARRAY_METHODS,
    STRING_METHODS,
    NUMBER_METHODS,
    MAP_METHODS,
    extractParamList,
    parameterNames,
    handlerSignature,
    inferParamTypes,
    coerce,
    adaptHandler,
    adaptRegistry,
};
