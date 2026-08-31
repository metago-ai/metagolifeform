/**
 * lib/gaps.js — 缺口登记册
 * "可见的缺口优于隐藏的完美"——所有未覆盖/分期项必须登记，可查询、可关闭。
 */
const fs = require('fs');
const path = require('path');

function loadGaps(file) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  }
  return { version: '1.0', gaps: [] };
}

function saveGaps(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function addGap(file, desc, opts = {}) {
  const data = loadGaps(file);
  const gap = {
    id: `G${String(data.gaps.length + 1).padStart(2, '0')}`,
    desc,
    status: opts.status || 'open',        // open | planned | resolved
    source: opts.source || 'manual',      // 发现来源（用户/雷达/自审）
    plan: opts.plan || '',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };
  data.gaps.push(gap);
  saveGaps(file, data);
  return gap;
}

function closeGap(file, id) {
  const data = loadGaps(file);
  const g = data.gaps.find(x => x.id === id);
  if (!g) return null;
  g.status = 'resolved';
  g.resolvedAt = new Date().toISOString();
  saveGaps(file, data);
  return g;
}

function listGaps(file, status = null) {
  const data = loadGaps(file);
  return status ? data.gaps.filter(g => g.status === status) : data.gaps;
}

module.exports = { loadGaps, saveGaps, addGap, closeGap, listGaps };
