#!/usr/bin/env node
/**
 * lib/verification-gate.cjs — 独立验证门
 * 铁律：验证清单由用户/独立方定义（--list 参数），本模块只执行并报告，绝不参与编写。
 * 清单格式：每行一条验证命令（shell 命令，exit 0=通过）
 */
const { execSync } = require('child_process');
const fs = require('fs');

function run(listFile, opts = {}) {
  if (!fs.existsSync(listFile)) {
    return { ok: false, error: `验证清单不存在: ${listFile}` };
  }
  const lines = fs.readFileSync(listFile, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (lines.length === 0) return { ok: false, error: '清单为空——验证清单必须由外部定义' };

  const results = lines.map((cmd) => {
    const start = Date.now();
    try {
      const out = execSync(cmd, { encoding: 'utf8', timeout: (opts.timeoutMs || 120000), stdio: 'pipe' });
      return { cmd: cmd.slice(0, 100), passed: true, durationMs: Date.now() - start, output: out.slice(-200) };
    } catch (e) {
      return { cmd: cmd.slice(0, 100), passed: false, durationMs: Date.now() - start, output: String(e.stdout || e.message).slice(-200) };
    }
  });

  const passed = results.filter((r) => r.passed).length;
  return {
    ok: passed === results.length,
    total: results.length,
    passed,
    results,
    verdict: passed === results.length ? 'PASS' : 'FAIL',
    note: '清单来源: ' + listFile + '（独立于 Agent 定义）'
  };
}

module.exports = { run };
