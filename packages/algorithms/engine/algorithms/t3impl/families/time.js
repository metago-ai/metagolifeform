"use strict";
/**
 * time.js — ALG_T3_T_001..014 真实实现（时间衰减 / 序列 / 窗口 / 同步 / 关键路径 / Allen 区间）
 */
const L = require("../t3lib.js");
const { mean, std, variance, round, clamp01, safeDiv, ols, r2, ema, seasonalStrength } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);

/* T_001 时间衰减模型 */
function t001(input) {
  const v0 = num(input.initialValue);
  const half = Math.max(1e-9, num(input.halfLife, 1));
  const elapsed = Math.max(0, num(input.elapsed));
  const events = arr(input.maintenanceEvents).map(e => ({ time: num(obj(e).time), boost: clamp01(num(obj(e).boost)) })).sort((a, b) => a.time - b.time);
  let v = v0, last = 0;
  events.forEach(e => {
    if (e.time > elapsed) return;
    v = v * Math.pow(0.5, (e.time - last) / half);
    v = v + (v0 - v) * e.boost;
    last = e.time;
  });
  v = v * Math.pow(0.5, Math.max(0, elapsed - last) / half);
  const currentValue = round(Math.max(0, v), 6);
  const decayRate = round(-Math.LN2 / half, 6);
  const remainingHalfLives = round(Math.log2(Math.max(1e-12, v0) / Math.max(1e-12, currentValue)), 4);
  const nextMaintenanceDue = round(elapsed + half * 0.5, 4);
  // 判断衰减形态：有维护事件→分段（近似线性），无→指数
  const decayPattern = events.length >= 2 ? "linear" : events.length === 1 ? "logarithmic" : "exponential";
  return { currentValue, decayRate, remainingHalfLives, nextMaintenanceDue, decayPattern };
}

/* T_002 时间序列分析 */
function t002(input) {
  const s = arr(input.series).map(p => ({ time: num(obj(p).time), value: num(obj(p).value) })).sort((a, b) => a.time - b.time);
  const horizon = Math.max(1, num(input.forecastHorizon, 3));
  if (s.length < 2) {
    return {
      trend: { direction: "stable", slope: 0, confidence: 0 },
      seasonality: { period: 0, amplitude: 0 },
      anomalies: [], forecast: [], modelAccuracy: 0
    };
  }
  const y = s.map(p => p.value), x = s.map(p => p.time);
  const { slope, intercept } = ols(y, x);
  const fit = r2(y, x);
  const mu = mean(y), sd = Math.max(1e-9, std(y));
  const anomalies = [];
  y.forEach((v, i) => {
    const z = (v - mu) / sd;
    if (Math.abs(z) > 2) anomalies.push({ time: s[i].time, value: v, severity: Math.abs(z) > 3 ? "high" : "medium" });
  });
  // 周期：搜索使自相关最大的滞后
  let bestLag = 0, bestAc = 0;
  for (let lag = 2; lag <= Math.floor(s.length / 2); lag++) {
    let acc = 0, cnt = 0;
    for (let i = 0; i + lag < y.length; i++) { acc += (y[i] - mu) * (y[i + lag] - mu); cnt++; }
    const ac = cnt ? acc / cnt / (sd * sd) : 0;
    if (ac > bestAc) { bestAc = ac; bestLag = lag; }
  }
  const seasonality = bestLag
    ? { period: bestLag, amplitude: round(std(y.filter((_, i) => i % bestLag === 0)) || 0, 4) }
    : { period: 0, amplitude: 0 };
  const step = (x[x.length - 1] - x[0]) / Math.max(1, x.length - 1);
  const forecast = [];
  for (let h = 1; h <= horizon; h++) {
    const t = x[x.length - 1] + step * h;
    forecast.push({
      time: round(t, 4),
      value: round(slope * t + intercept, 4),
      confidence: round(clamp01(fit * (1 - h / (horizon + 2))), 4)
    });
  }
  const direction = slope > 0.01 ? "rising" : slope < -0.01 ? "falling" : "stable";
  return {
    trend: { direction, slope: round(slope, 6), confidence: round(clamp01(fit), 4) },
    seasonality,
    anomalies, forecast,
    modelAccuracy: round(clamp01(fit), 4)
  };
}

/* T_003 时间窗口机制 */
function t003(input) {
  const st = arr(input.stream).map(e => ({ time: num(obj(e).time), data: obj(e).data })).sort((a, b) => a.time - b.time);
  const type = String(input.windowType || "tumbling");
  const size = Math.max(1e-9, num(input.size, 5));
  const slide = Math.max(1e-9, num(input.slide, type === "sliding" ? size / 2 : size));
  const windows = [];
  if (!st.length) return { windows: [], windowCount: 0, coverage: 0, lateness: 0 };
  const t0 = st[0].time, t1 = st[st.length - 1].time;
  const agg = list => {
    const vs = list.map(x => Number(x.data)).filter(v => isFinite(v));
    return vs.length ? { count: vs.length, sum: round(vs.reduce((a, b) => a + b, 0), 4), mean: round(mean(vs), 4) } : { raw: list.map(x => x.data) };
  };
  if (type === "global") {
    windows.push({ start: t0, end: t1, count: st.length, aggregated: agg(st) });
  } else if (type === "session") {
    const gap = size;
    let cur = [st[0]];
    for (let i = 1; i < st.length; i++) {
      if (st[i].time - st[i - 1].time > gap) { windows.push(cur); cur = []; }
      cur.push(st[i]);
    }
    if (cur.length) windows.push(cur);
    const w = windows.splice(0, windows.length);
    w.forEach(list => windows.push({
      start: list[0].time, end: list[list.length - 1].time, count: list.length, aggregated: agg(list)
    }));
  } else {
    for (let start = t0; start <= t1; start += slide) {
      const end = start + size;
      const list = st.filter(e => e.time >= start && e.time < end);
      if (!list.length && type === "tumbling") continue;
      windows.push({ start: round(start, 4), end: round(end, 4), count: list.length, aggregated: agg(list) });
      if (type === "tumbling") continue;
      if (windows.length > 500) break;
    }
  }
  const covered = new Set();
  windows.forEach(w => st.forEach((e, i) => { if (e.time >= w.start && e.time <= w.end) covered.add(i); }));
  const coverage = round(clamp01(covered.size / st.length), 4);
  // 迟到：乱序流入的时间差
  let late = 0;
  for (let i = 1; i < st.length; i++) late = Math.max(late, st[i - 1].time - st[i].time);
  return { windows, windowCount: windows.length, coverage, lateness: round(Math.max(0, late), 4) };
}

/* T_004 时间戳管理 */
function t004(input) {
  const evs = arr(input.events).map(e => ({
    id: String(obj(e).id ?? "?"), data: obj(e).data, timestamp: obj(e).timestamp
  }));
  const clockType = String(input.clockType || "physical");
  let lamport = 0;
  const timestamped = evs.map((e, i) => {
    if (clockType === "physical" && e.timestamp != null) {
      return { id: e.id, data: e.data, createdAt: num(e.timestamp), version: i + 1 };
    }
    lamport++;
    return { id: e.id, data: e.data, createdAt: lamport, version: i + 1 };
  });
  const ordering = [...timestamped].sort((a, b) => a.createdAt - b.createdAt || a.version - b.version).map(e => e.id);
  const conflicts = [];
  const byTs = new Map();
  timestamped.forEach(e => {
    if (!byTs.has(e.createdAt)) byTs.set(e.createdAt, []);
    byTs.get(e.createdAt).push(e.id);
  });
  byTs.forEach((ids, ts) => {
    if (ids.length > 1) conflicts.push({ events: ids, reason: `同一时间戳 ${ts} 上有 ${ids.length} 个事件，物理时钟无法定序` });
  });
  return { timestamped, ordering, conflicts };
}

/* T_005 时间同步方法 */
function t005(input) {
  const nodes = arr(input.nodes).map(n => ({
    id: String(obj(n).id ?? "?"), localTime: num(obj(n).localTime), driftRate: num(obj(n).driftRate)
  }));
  const protocol = String(input.protocol || "ntp");
  const precision = num(input.precision, 0.001);
  if (!nodes.length) {
    return { synchronized: false, referenceTime: 0, offsets: [], precision, driftCompensation: 0 };
  }
  const referenceTime = round(mean(nodes.map(n => n.localTime)), 6);
  const offsets = nodes.map(n => {
    const offset = round(referenceTime - n.localTime, 6);
    const residual = round(Math.abs(n.driftRate) * 0.1, 8);
    return { node: n.id, offset, residual };
  });
  const maxRes = Math.max(...offsets.map(o => Math.abs(o.residual)));
  const synchronized = maxRes <= precision;
  const driftCompensation = round(mean(nodes.map(n => n.driftRate)) , 8);
  void protocol;
  return { synchronized, referenceTime, offsets, precision, driftCompensation };
}

/* T_006 时间漂移检测 */
function t006(input) {
  const local = num(input.localTime);
  const ref = num(input.referenceTime);
  const drift = round(local - ref, 6);
  const hist = arr(input.history).map(h => ({
    local: num(obj(h).local), reference: num(obj(h).reference), time: num(obj(h).time)
  })).sort((a, b) => a.time - b.time);
  let driftRate = 0, driftType = "linear", confidence = 0.3;
  if (hist.length >= 2) {
    const ds = hist.map(h => h.local - h.reference);
    const xs = hist.map(h => h.time);
    const { slope } = ols(ds, xs);
    driftRate = round(slope, 8);
    const fit = r2(ds, xs);
    driftType = fit >= 0.8 ? "linear" : "nonlinear";
    confidence = round(clamp01(fit), 4);
  } else if (hist.length === 1) {
    driftRate = round((local - ref) - (hist[0].local - hist[0].reference), 8);
    confidence = 0.5;
  }
  const correctionNeeded = Math.abs(drift) > 0.001;
  return {
    drift, driftRate, driftType, correctionNeeded,
    correctionAmount: round(-drift, 6), confidence
  };
}

/* T_007 时间预算管理 */
function t007(input) {
  const t = obj(input.task);
  const phases = arr(t.phases).map(p => ({
    name: String(obj(p).name ?? "?"), budget: num(obj(p).budget), buffer: clamp01(num(obj(p).buffer))
  }));
  const tracking = arr(input.tracking).map(x => ({ phase: String(obj(x).phase ?? ""), used: num(obj(x).used) }));
  const totalBudget = num(t.totalBudget, phases.reduce((s, p) => s + p.budget, 0) || 1);
  const sumBudget = phases.reduce((s, p) => s + p.budget, 0) || 1;
  const allocation = phases.map(p => ({
    phase: p.name,
    budget: p.budget,
    buffer: round(p.budget * p.buffer, 4),
    allocated: round(p.budget * totalBudget / sumBudget, 4)
  }));
  const usage = allocation.map(a => {
    const tr = tracking.find(x => x.phase === a.phase);
    const used = tr ? tr.used : 0;
    const remaining = round(a.allocated - used, 4);
    const utilization = round(clamp01(safeDiv(used, Math.max(1e-9, a.allocated))), 4);
    const status = utilization > 1 ? "over" : utilization > 0.85 ? "warning" : "on-track";
    return { phase: a.phase, used, remaining, utilization, status };
  });
  const totalUsed = round(usage.reduce((s, u) => s + u.used, 0), 4);
  const totalRemaining = round(totalBudget - totalUsed, 4);
  const alerts = usage.filter(u => u.status !== "on-track").map(u =>
    `「${u.phase}」已用 ${round(u.utilization * 100, 1)}%，${u.status === "over" ? "超支" : "接近上限"}`);
  return { allocation, usage, totalUsed, totalRemaining, alerts };
}

/* T_008 时间优化策略（关键路径法 CPM） */
function t008(input) {
  const steps = arr(obj(input.process).steps).map((s, i) => ({
    index: i, name: String(obj(s).name ?? `步骤${i}`),
    duration: Math.max(0, num(obj(s).duration)),
    deps: arr(obj(s).dependencies).map(Number)
  }));
  const cons = Object.assign({ totalTime: Infinity, parallelism: 1 }, obj(input.constraints));
  if (!steps.length) {
    return { optimizations: [], criticalPath: [], optimizedDuration: 0, speedup: 1 };
  }
  // 前向计算 ES/EF
  const ES = new Array(steps.length).fill(0), EF = new Array(steps.length).fill(0);
  const order = [];
  const indeg = steps.map(s => s.deps.filter(d => d >= 0 && d < steps.length).length);
  const q = steps.filter((s, i) => indeg[i] === 0).map(s => s.index);
  while (q.length) {
    const i = q.shift();
    order.push(i);
    const s = steps[i];
    ES[i] = s.deps.length ? Math.max(...s.deps.filter(d => d >= 0 && d < steps.length).map(d => EF[d] || 0)) : 0;
    EF[i] = ES[i] + s.duration;
    steps.forEach(t => {
      if (t.deps.includes(i)) {
        indeg[t.index]--;
        if (indeg[t.index] === 0) q.push(t.index);
      }
    });
  }
  const projectTime = Math.max(...EF, 0);
  // 反向计算 LF/LS 找关键路径
  const LF = new Array(steps.length).fill(projectTime), LS = new Array(steps.length).fill(projectTime);
  for (let k = order.length - 1; k >= 0; k--) {
    const i = order[k];
    const succ = steps.filter(t => t.deps.includes(i));
    LF[i] = succ.length ? Math.min(...succ.map(t => LS[t.index])) : projectTime;
    LS[i] = LF[i] - steps[i].duration;
  }
  const criticalPath = steps.filter((s, i) => Math.abs(LS[i] - ES[i]) < 1e-9).map(s => s.name);
  const optimizations = steps.map((s, i) => {
    const slack = round(LS[i] - ES[i], 4);
    return {
      type: slack === 0 ? "压缩关键路径" : "并行化",
      target: s.name,
      expectedSaving: slack === 0 ? round(s.duration * 0.2, 4) : 0,
      cost: slack === 0 ? 3 : 1,
      roi: slack === 0 ? round(s.duration * 0.2 / 3, 4) : 0
    };
  }).filter(o => o.expectedSaving > 0 || o.type === "并行化").sort((a, b) => b.roi - a.roi);
  const totalSaving = optimizations.reduce((s, o) => s + o.expectedSaving, 0);
  const optimizedDuration = round(Math.max(0, projectTime - totalSaving), 4);
  const speedup = round(safeDiv(projectTime, Math.max(1e-9, optimizedDuration)), 4);
  void cons;
  return { optimizations, criticalPath, optimizedDuration, speedup };
}

/* T_009 时间感知机制 */
function t009(input) {
  const evs = arr(input.events).map(e => ({ time: num(obj(e).time), type: String(obj(e).type ?? "") })).sort((a, b) => a.time - b.time);
  const ctx = obj(input.context);
  if (!evs.length) {
    return { perception: { currentTime: 0, elapsed: 0, sequence: [], periodicity: [], tempo: "normal" }, timeAwareDecisions: [] };
  }
  const currentTime = evs[evs.length - 1].time;
  const elapsed = round(currentTime - evs[0].time, 4);
  const sequence = evs.map(e => e.type);
  // 周期性：按类型出现间隔的规律性
  const byType = new Map();
  evs.forEach(e => {
    if (!byType.has(e.type)) byType.set(e.type, []);
    byType.get(e.type).push(e.time);
  });
  const periodicity = [];
  byType.forEach((ts, type) => {
    if (ts.length < 2) return;
    const gaps = [];
    for (let i = 1; i < ts.length; i++) gaps.push(ts[i] - ts[i - 1]);
    const m = mean(gaps), sd = std(gaps) || 1e-9;
    periodicity.push({ period: round(m, 4), confidence: round(clamp01(1 - sd / Math.max(1e-9, m)), 4), type });
  });
  const speed = evs.length / Math.max(1e-9, elapsed);
  const tempo = speed > 1 ? "fast" : speed > 0.2 ? "normal" : "slow";
  const decisions = [];
  if (tempo === "fast") decisions.push("事件密度高，优先做批量合并而非逐个响应");
  if (tempo === "slow") decisions.push("节奏偏慢，可承担更深的单次处理");
  if (ctx.businessHours) decisions.push("处于工作时段，实时响应优先");
  if (!decisions.length) decisions.push("节奏正常，按既定策略执行");
  return {
    perception: { currentTime, elapsed, sequence, periodicity: periodicity.map(({ type, ...r }) => r), tempo },
    timeAwareDecisions: decisions
  };
}

/* T_010 时间记忆机制 */
function t010(input) {
  const mems = arr(input.memories).map((m, i) => ({
    id: `m${i}`, content: obj(m).content, timestamp: num(obj(m).timestamp),
    frequency: Math.max(1, num(obj(m).frequency, 1))
  }));
  const q = obj(input.query);
  const now = mems.length ? Math.max(...mems.map(m => m.timestamp)) : 0;
  const temporalIndex = mems.map(m => ({
    timestamp: m.timestamp,
    memoryId: m.id,
    // 强度：越新越强 + 复现次数加成
    strength: round(clamp01(1 / (1 + Math.max(0, now - m.timestamp)) + Math.log1p(m.frequency) * 0.1), 4)
  })).sort((a, b) => b.timestamp - a.timestamp);
  const inRange = (q.startTime != null || q.endTime != null)
    ? mems.filter(m => m.timestamp >= num(q.startTime, -Infinity) && m.timestamp <= num(q.endTime, Infinity))
    : mems;
  const retrieved = inRange.map(m => {
    const age = round(Math.max(0, now - m.timestamp), 4);
    const retention = round(clamp01(Math.exp(-age / 10) * (1 + Math.log1p(m.frequency) * 0.1)), 4);
    return { memory: m.content, timestamp: m.timestamp, age, retention };
  }).sort((a, b) => b.retention - a.retention);
  return { stored: mems.length > 0, temporalIndex, retrieved, decayApplied: true };
}

/* T_011 时间推理方法（Allen 区间关系） */
function t011(input) {
  const evs = arr(input.events).map(e => {
    const s = num(obj(e).startTime);
    const en = obj(e).endTime != null ? num(obj(e).endTime) : s + num(obj(e).duration, 0);
    return { id: String(obj(e).id ?? "?"), start: s, end: en };
  });
  const relations = [];
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      const a = evs[i], b = evs[j];
      let rel;
      if (a.end < b.start) rel = "before";
      else if (a.start > b.end) rel = "after";
      else if (a.start === b.start && a.end === b.end) rel = "equals";
      else if (a.end === b.start) rel = "meets";
      else if (a.start <= b.start && a.end >= b.end) rel = "during";
      else rel = "overlaps";
      relations.push({ a: a.id, b: b.id, relation: rel, confidence: 1 });
    }
  }
  // 因果链：按开始时间排序，前者的结束不晚于后者开始即视为可能致因
  const sorted = [...evs].sort((x, y) => x.start - y.start);
  const causalChain = sorted.map((e, i) => ({
    event: e.id, time: e.start,
    causes: sorted.slice(0, i).filter(p => p.end <= e.start).map(p => p.id)
  }));
  return {
    relations, causalChain,
    answer: relations.length ? `共 ${relations.length} 组区间关系，其中 before ${relations.filter(r => r.relation === "before").length} 组、overlaps ${relations.filter(r => r.relation === "overlaps").length} 组` : "无可比较区间"
  };
}

/* T_012 时间冲突管理 */
function t012(input) {
  const evs = arr(input.events).map(e => ({
    id: String(obj(e).id ?? "?"), start: num(obj(e).startTime), end: num(obj(e).endTime),
    priority: num(obj(e).priority, 5), flexible: !!obj(e).flexible
  })).sort((a, b) => a.start - b.start);
  const conflicts = [];
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      const a = evs[i], b = evs[j];
      if (a.start < b.end && b.start < a.end) {
        conflicts.push({
          events: [a.id, b.id], type: "overlap",
          severity: a.priority === b.priority ? "high" : "medium"
        });
      }
    }
  }
  const resolution = conflicts.map(c => {
    const [ia, ib] = c.events.map(id => evs.find(e => e.id === id));
    if (ia.flexible || ib.flexible) {
      const flex = ia.flexible ? ia : ib;
      return { method: "reschedule", details: `移动可伸缩事件「${flex.id}」到不冲突时段` };
    }
    if (ia.priority !== ib.priority) {
      const low = ia.priority > ib.priority ? ia : ib;
      return { method: "prioritize", details: `保留高优事件，推迟「${low.id}」` };
    }
    return { method: "parallelize", details: `「${ia.id}」与「${ib.id}」优先级相同，尝试并行或拆分` };
  });
  // 排程：按优先级 + 可伸缩性贪心安排
  const schedule = [];
  [...evs].sort((a, b) => a.priority - b.priority).forEach(e => {
    let st = e.start;
    while (schedule.some(s => st < s.endTime && s.startTime < e.end)) st += 1;
    schedule.push({ event: e.id, startTime: round(st, 4), endTime: round(st + (e.end - e.start), 4) });
  });
  return { conflicts, resolution, schedule: schedule.sort((a, b) => a.startTime - b.startTime) };
}

/* T_013 时间平衡策略 */
function t013(input) {
  const demands = arr(input.demands).map(d => ({
    category: String(obj(d).category ?? "?"), required: Math.max(0, num(obj(d).required)),
    importance: Math.max(0, num(obj(d).importance, 1)), flexibility: clamp01(num(obj(d).flexibility, 0.5))
  }));
  const avail = Math.max(0, num(input.available, 1));
  const strategy = String(input.strategy || "budget");
  const totalReq = demands.reduce((s, d) => s + d.required, 0) || 1;
  let allocation;
  if (strategy === "block") {
    // 刚性块：按需求等比压缩
    allocation = demands.map(d => ({ ...d, allocated: round(d.required * Math.min(1, avail / totalReq), 4) }));
  } else if (strategy === "audit") {
    // 审计式：只保高重要性
    const sorted = [...demands].sort((a, b) => b.importance - a.importance);
    let left = avail;
    const map = new Map();
    sorted.forEach(d => { const a = Math.min(d.required, left); map.set(d.category, a); left -= a; });
    allocation = demands.map(d => ({ ...d, allocated: round(map.get(d.category) || 0, 4) }));
  } else {
    // 弹性/预算式：按 重要性×(1+弹性) 加权分配
    const w = demands.map(d => Math.max(1e-9, d.importance * (1 + d.flexibility)));
    const tw = w.reduce((a, b) => a + b, 0);
    allocation = demands.map((d, i) => ({ ...d, allocated: round(avail * w[i] / tw, 4) }));
  }
  const withPct = allocation.map(d => ({
    category: d.category,
    allocated: d.allocated,
    percentage: round(safeDiv(d.allocated, avail) * 100, 2),
    satisfaction: round(clamp01(safeDiv(d.allocated, Math.max(1e-9, d.required))), 4)
  }));
  const balance = round(clamp01(1 - std(withPct.map(x => x.satisfaction)) / Math.max(1e-9, mean(withPct.map(x => x.satisfaction)))), 4);
  const overspent = withPct.filter(x => x.satisfaction > 1.2).map(x => x.category);
  const underspent = withPct.filter(x => x.satisfaction < 0.5).map(x => x.category);
  const recommendations = [];
  if (underspent.length) recommendations.push(`以下需求严重不足，需削减或延后：${underspent.join("、")}`);
  if (overspent.length) recommendations.push(`以下需求被超额分配，可回收：${overspent.join("、")}`);
  if (!recommendations.length) recommendations.push("分配较均衡，保持当前节奏");
  return { allocation: withPct, balance, overspent, underspent, recommendations };
}

/* T_014 时间进化机制 */
function t014(input) {
  const h = arr(input.history).map(x => ({
    stage: String(obj(x).stage ?? ""), capability: clamp01(num(obj(x).capability)), time: num(obj(x).time)
  })).sort((a, b) => a.time - b.time);
  const cur = String(input.currentStage || (h.length ? h[h.length - 1].stage : "reactive"));
  const cap = h.length ? clamp01(h[h.length - 1].capability) : 0.3;
  const evolutionStage = cap >= 0.85 ? "transcendent" : cap >= 0.55 ? "proactive" : "reactive";
  const lower = evolutionStage === "reactive" ? 0 : evolutionStage === "proactive" ? 0.55 : 0.85;
  const upper = evolutionStage === "reactive" ? 0.55 : evolutionStage === "proactive" ? 0.85 : 1;
  const stageProgress = round(clamp01((cap - lower) / Math.max(1e-9, upper - lower)), 4);
  const nextStageRequirements = evolutionStage === "transcendent"
    ? ["已在最高层，转为守住时间冗余与反脆弱"]
    : [
        `能力值需从 ${cap} 提到 ${upper}`,
        `${evolutionStage === "reactive" ? "从事后响应转为事前预判" : "从预判转为主动塑造时间结构"}`,
        "至少一次在无外部提醒下自主优化的记录"
      ];
  const rate = h.length >= 2 ? (h[h.length - 1].capability - h[0].capability) / Math.max(1, h.length - 1) : 0;
  const multiTimelineCapability = round(clamp01(input.multiTimeline ? cap * 1.1 : cap * 0.6), 4);
  void cur;
  return {
    evolutionStage, stageProgress, nextStageRequirements,
    multiTimelineCapability,
    timeUtilizationEfficiency: round(clamp01(mean(h.map(x => x.capability)) ), 4)
  };
}

module.exports = {
  handlers: {
    ALG_T3_T_001: t001, ALG_T3_T_002: t002, ALG_T3_T_003: t003, ALG_T3_T_004: t004,
    ALG_T3_T_005: t005, ALG_T3_T_006: t006, ALG_T3_T_007: t007, ALG_T3_T_008: t008,
    ALG_T3_T_009: t009, ALG_T3_T_010: t010, ALG_T3_T_011: t011, ALG_T3_T_012: t012,
    ALG_T3_T_013: t013, ALG_T3_T_014: t014
  },
  samples: {
    ALG_T3_T_001: () => ({ initialValue: 100, halfLife: 10, elapsed: 25, maintenanceEvents: [{ time: 12, boost: 0.3 }] }),
    ALG_T3_T_002: () => ({
      series: [{ time: 1, value: 10 }, { time: 2, value: 12 }, { time: 3, value: 11 },
        { time: 4, value: 40 }, { time: 5, value: 13 }, { time: 6, value: 14 }],
      methods: ["trend", "seasonality"], forecastHorizon: 3
    }),
    ALG_T3_T_003: () => ({
      stream: [{ time: 1, data: 5 }, { time: 3, data: 7 }, { time: 6, data: 2 }, { time: 9, data: 9 }],
      windowType: "tumbling", size: 4
    }),
    ALG_T3_T_004: () => ({
      events: [{ id: "e1", data: 1, timestamp: 100 }, { id: "e2", data: 2, timestamp: 100 }, { id: "e3", data: 3 }],
      clockType: "physical"
    }),
    ALG_T3_T_005: () => ({
      nodes: [{ id: "n1", localTime: 100.5, driftRate: 0.001 }, { id: "n2", localTime: 99.4, driftRate: -0.002 }],
      protocol: "ntp", precision: 0.001
    }),
    ALG_T3_T_006: () => ({
      localTime: 102.4, referenceTime: 100,
      history: [{ local: 100.1, reference: 100, time: 1 }, { local: 101.2, reference: 100, time: 2 }]
    }),
    ALG_T3_T_007: () => ({
      task: { name: "交付", totalBudget: 10,
        phases: [{ name: "设计", budget: 3, buffer: 0.2 }, { name: "实现", budget: 5, buffer: 0.1 }, { name: "验收", budget: 2 }] },
      tracking: [{ phase: "设计", used: 2.5 }, { phase: "实现", used: 4 }]
    }),
    ALG_T3_T_008: () => ({
      process: { steps: [{ name: "A", duration: 3, dependencies: [] }, { name: "B", duration: 4, dependencies: [0] },
        { name: "C", duration: 2, dependencies: [0] }, { name: "D", duration: 5, dependencies: [1, 2] }] },
      constraints: { totalTime: 20, parallelism: 2 }
    }),
    ALG_T3_T_009: () => ({
      events: [{ time: 1, type: "评审" }, { time: 2, type: "开发" }, { time: 3, type: "评审" }, { time: 5, type: "评审" }],
      context: { timezone: "Asia/Shanghai", businessHours: true, season: "Q4" }
    }),
    ALG_T3_T_010: () => ({
      memories: [{ content: "第一条记忆", timestamp: 1, frequency: 3 }, { content: "第二条记忆", timestamp: 8, frequency: 1 }],
      query: { startTime: 0, endTime: 10 }
    }),
    ALG_T3_T_011: () => ({
      events: [{ id: "A", startTime: 0, endTime: 5 }, { id: "B", startTime: 3, endTime: 8 }, { id: "C", startTime: 10, endTime: 12 }],
      query: "A 与 B 的关系"
    }),
    ALG_T3_T_012: () => ({
      events: [{ id: "X", startTime: 0, endTime: 3, priority: 1, flexible: false },
        { id: "Y", startTime: 2, endTime: 5, priority: 2, flexible: true }],
      resources: [{ id: "room", capacity: 1 }]
    }),
    ALG_T3_T_013: () => ({
      demands: [{ category: "核心", required: 6, importance: 3, flexibility: 0.2 },
        { category: "探索", required: 4, importance: 1, flexibility: 0.8 }],
      available: 8, strategy: "budget"
    }),
    ALG_T3_T_014: () => ({
      history: [{ stage: "reactive", capability: 0.3, time: 1 }, { stage: "proactive", capability: 0.6, time: 2 }],
      currentStage: "proactive", multiTimeline: false
    })
  }
};
