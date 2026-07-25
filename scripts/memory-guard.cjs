#!/usr/bin/env node
/**
 * MetaGO 记忆守护脚本（AGENTS.md 第十六章 · 第零道硬门 / L4 冻记忆层）
 *
 * 设计目标：不依赖 AI 主动读取记忆文件——脚本本身可独立运行、可被任何
 * 自动化（git hook / 计划任务 / CI）触发，把"失忆"变成可检测、可报警、
 * 可自动恢复的工程问题。
 *
 * 检查项（与 16.3 表格一一对应）：
 *   M-L4-1  Git remote URL 中的访问凭据（https token 或 SSH 配置可用）
 *   M-L4-2  凭证文件 .secrets/credentials.json（不入库，gitignore 必须覆盖）
 *   M-L4-3  项目记忆文件中的凭证区（默认 project_memory.md，可用 --memory= 指定）
 *   M-L3-1  项目记忆关键章节完整性
 *   M-L3-2  AGENTS.md 存在性
 *   M-L2-1  最近会话活动（.git 最近提交 / 会话目录 mtime，48h 内为新鲜）
 *
 * 用法：
 *   node scripts/memory-guard.cjs [--memory=project_memory.md] [--json]
 *
 * 退出码：0 全部通过或有自动恢复；1 存在需人工处理的缺失。
 * 安全原则：脚本只检查"凭证是否存在/可用"，永不打印凭证内容本身。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const memoryFile = (args.find((a) => a.startsWith('--memory=')) || '').split('=')[1] || 'project_memory.md';
const asJson = args.includes('--json');

const ROOT = path.resolve(__dirname, '..');
const report = [];
let hardFails = 0;

function check(id, desc, status, detail, recoverable = false) {
  // status: pass | warn | fail
  report.push({ id, desc, status, detail, recoverable });
  if (status === 'fail' && !recoverable) hardFails++;
}

function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim(); }
  catch { return null; }
}

// ---------- M-L4-1 git remote 凭据 ----------
const remotes = git('remote -v');
if (remotes === null) {
  check('M-L4-1', 'Git remote URL 凭据', 'fail', '当前目录不是 git 仓库或 git 不可用');
} else {
  const urls = [...new Set(remotes.split('\n').map((l) => l.split(/\s+/)[1]).filter(Boolean))];
  if (urls.length === 0) {
    check('M-L4-1', 'Git remote URL 凭据', 'fail', '未配置任何 git remote', true);
  } else {
    const withCred = urls.filter((u) => /@/.test(u) || u.startsWith('git@'));
    if (withCred.length === urls.length) {
      check('M-L4-1', 'Git remote URL 凭据', 'pass', `${urls.length} 个 remote 均含内嵌凭据或使用 SSH`);
    } else {
      check('M-L4-1', 'Git remote URL 凭据', 'warn', `${urls.length - withCred.length}/${urls.length} 个 remote 未内嵌凭据（依赖系统凭据管理器）`, true);
    }
  }
}

// ---------- M-L4-2 凭证文件 ----------
const secretsPath = path.join(ROOT, '.secrets', 'credentials.json');
const gitignore = fs.existsSync(path.join(ROOT, '.gitignore')) ? fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8') : '';
if (fs.existsSync(secretsPath)) {
  try {
    const cred = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    const keys = Object.keys(cred);
    check('M-L4-2', '凭证文件 .secrets/credentials.json', keys.length > 0 ? 'pass' : 'warn',
      `存在，含 ${keys.length} 个条目（内容不外显）`);
  } catch {
    check('M-L4-2', '凭证文件 .secrets/credentials.json', 'fail', '文件存在但 JSON 解析失败');
  }
  if (!/^\.secrets\/?$/m.test(gitignore)) {
    check('M-L4-2a', '.secrets 已被 .gitignore 覆盖', 'fail', '.gitignore 缺少 .secrets/ 条目——凭证有入库泄露风险');
  } else {
    check('M-L4-2a', '.secrets 已被 .gitignore 覆盖', 'pass', '.gitignore 已豁免');
  }
} else {
  check('M-L4-2', '凭证文件 .secrets/credentials.json', 'warn', '不存在（可从未内嵌凭据的 remote 或系统凭据管理器恢复）', true);
}

// ---------- M-L4-3 记忆文件凭证区 ----------
const memPath = path.join(ROOT, memoryFile);
if (fs.existsSync(memPath)) {
  const mem = fs.readFileSync(memPath, 'utf8');
  const hasCredSection = /凭证|凭据|credential|token/i.test(mem);
  check('M-L4-3', `${memoryFile} 凭证区`, hasCredSection ? 'pass' : 'warn',
    hasCredSection ? '存在凭证相关章节' : '未发现凭证区（如凭证仅存于凭据管理器可忽略）', true);
} else {
  check('M-L4-3', `${memoryFile} 凭证区`, 'warn', `${memoryFile} 不存在（公开仓库本就不应含凭证文件）`, true);
}

// ---------- M-L3-1 记忆关键章节 ----------
if (fs.existsSync(memPath)) {
  const mem = fs.readFileSync(memPath, 'utf8');
  const requiredSections = ['项目', '决策', '术语', '交付', '待办'];
  const missing = requiredSections.filter((s) => !mem.includes(s));
  check('M-L3-1', '记忆关键章节完整性', missing.length === 0 ? 'pass' : 'fail',
    missing.length === 0 ? `${requiredSections.length} 类关键章节齐全` : `缺失章节关键词：${missing.join(', ')}`);
} else {
  check('M-L3-1', '记忆关键章节完整性', 'warn', `${memoryFile} 不存在，跳过章节校验`, true);
}

// ---------- M-L3-2 AGENTS.md ----------
check('M-L3-2', 'AGENTS.md 存在性', fs.existsSync(path.join(ROOT, 'AGENTS.md')) ? 'pass' : 'fail',
  fs.existsSync(path.join(ROOT, 'AGENTS.md')) ? '存在' : '缺失——法则母本丢失是最高级失忆');

// ---------- M-L2-1 最近会话活动 ----------
let fresh = false; let detail = '无 git 历史';
const lastTs = git('log -1 --format=%ct');
if (lastTs) {
  const ageH = (Date.now() / 1000 - parseInt(lastTs, 10)) / 3600;
  fresh = ageH <= 48;
  detail = `最近一次提交 ${ageH.toFixed(1)} 小时前`;
}
check('M-L2-1', '最近会话活动（48h）', fresh ? 'pass' : 'warn', detail, true);

// ---------- 输出 ----------
const counts = { pass: 0, warn: 0, fail: 0 };
report.forEach((r) => counts[r.status]++);

if (asJson) {
  console.log(JSON.stringify({ summary: counts, hardFails, checks: report }, null, 2));
} else {
  console.log('==========================================');
  console.log('  MetaGO 记忆守护（memory-guard）· 第零道硬门');
  console.log('==========================================');
  for (const r of report) {
    const mark = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' }[r.status];
    console.log(`  [${mark}] ${r.id} ${r.desc} — ${r.detail}${r.status === 'fail' && r.recoverable ? '（可自动恢复）' : ''}`);
  }
  console.log('------------------------------------------');
  console.log(`  ${counts.pass} 通过 / ${counts.warn} 警告 / ${counts.fail} 失败（硬失败 ${hardFails}）`);
  console.log(hardFails === 0 ? '  ✅ L4 冻记忆层可用' : '  ❌ 存在需人工修复的记忆缺失');
}

process.exit(hardFails === 0 ? 0 : 1);
