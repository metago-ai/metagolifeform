#!/usr/bin/env node
/**
 * completeness-guard — 元构完整性治理套件 CLI
 *
 * 用法:
 *   completeness-guard verify [--doc <路径>] [--config <路径>]   验证目标文档（全绿=0，缺口=1）
 *   completeness-guard init [--target <目录>]                    初始化治理环境（配置+登记册+基线）
 *   completeness-guard baseline list                             列出全部基线条目数
 *   completeness-guard baseline add <组> <条目> <关键词...>       新增基线条目（基线是活的）
 *   completeness-guard gaps list [--status open]                 列出缺口登记册
 *   completeness-guard gaps add <描述> [--source <来源>] [--plan <计划>]  登记缺口
 *   completeness-guard gaps close <id>                           关闭缺口
 *   completeness-guard radar check [--interval <天>]             雷达检查（是否该扫描）
 *   completeness-guard radar scan                                标记已扫描
 *   completeness-guard radar findings                            查看雷达发现
 *   completeness-guard declaration [--doc <路径>]                生成标准声明（声明纪律）
 *   completeness-guard check-text <文本>                         检测禁用声明词（hooks 用）
 */
const path = require('path');
const fs = require('fs');
const { verifyDoc, renderReport } = require('../lib/engine');
const { loadBaselines, countItems } = require('../lib/baseline');
const gaps = require('../lib/gaps');
const radar = require('../lib/radar');
const { generateDeclaration, detectForbidden } = require('../lib/declaration');

const KIT_ROOT = path.resolve(__dirname, '..');
const CWD = process.cwd();

function loadConfig(configPath) {
  const p = configPath || path.join(CWD, 'completeness.config.json');
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  }
  return null;
}

function argValue(args, name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';

  switch (cmd) {
    case 'verify': {
      const config = loadConfig(argValue(args, '--config'));
      const doc = argValue(args, '--doc') || (config && config.target && config.target.doc) || 'docs/架构方案.md';
      const baselineDirs = config && config.baselines && config.baselines.dirs;
      const result = verifyDoc(path.resolve(CWD, doc), { baselineDirs });
      console.log(renderReport(result));
      process.exit(result.ok ? 0 : 1);
      break;
    }
    case 'init': {
      const target = argValue(args, '--target') || CWD;
      fs.mkdirSync(target, { recursive: true });
      const cfgFile = path.join(target, 'completeness.config.json');
      const gapsFile = path.join(target, 'completeness-gaps.json');
      const radarFile = path.join(target, 'completeness-radar.json');
      if (!fs.existsSync(cfgFile)) {
        fs.copyFileSync(path.join(KIT_ROOT, 'config', 'completeness.config.json'), cfgFile);
        console.log(`✓ 配置已生成: ${cfgFile}`);
      }
      if (!fs.existsSync(gapsFile)) {
        gaps.saveGaps(gapsFile, { version: '1.0', gaps: [] });
        console.log(`✓ 缺口登记册已生成: ${gapsFile}`);
      }
      if (!fs.existsSync(radarFile)) {
        radar.saveRadar(radarFile, radar.loadRadar(radarFile));
        console.log(`✓ 雷达档案已生成: ${radarFile}`);
      }
      const bs = loadBaselines();
      console.log(`✓ 内置基线就绪: ${bs.length} 组 / ${countItems(bs)} 项`);
      console.log('下一步: completeness-guard verify --doc <你的文档>');
      break;
    }
    case 'baseline': {
      const sub = args[1];
      if (sub === 'list') {
        const bs = loadBaselines();
        for (const b of bs) console.log(`  ${b.id}（${b.name}）: ${Object.keys(b.items).length} 项`);
        console.log(`  合计: ${bs.length} 组 / ${countItems(bs)} 项`);
      } else if (sub === 'add') {
        // baseline add <组> <条目> <关键词...>
        const group = args[2], item = args[3], kws = args.slice(4);
        if (!group || !item || kws.length === 0) {
          console.error('用法: completeness-guard baseline add <组> <条目> <关键词...>');
          process.exit(1);
        }
        const file = path.join(KIT_ROOT, 'baselines', 'user-custom.json');
        let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { id: 'B7-user-custom', name: '用户自定义基线', version: '1.0', items: {} };
        data.items[item] = kws;
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ 基线条目已新增: ${group}/${item} ← ${kws.join(', ')}（基线是活的，已写入 ${file}）`);
      } else {
        console.log('用法: completeness-guard baseline list | baseline add <组> <条目> <关键词...>');
      }
      break;
    }
    case 'gaps': {
      const config = loadConfig(argValue(args, '--config'));
      const gapsFile = argValue(args, '--gaps') || (config && config.gaps && config.gaps.file) || path.join(CWD, 'completeness-gaps.json');
      const sub = args[1];
      if (sub === 'list') {
        const status = argValue(args, '--status');
        const list = gaps.listGaps(gapsFile, status);
        if (!list.length) console.log('  （无缺口登记）');
        for (const g of list) console.log(`  [${g.id}] ${g.status} | ${g.desc} | 来源: ${g.source}${g.plan ? ' | 计划: ' + g.plan : ''}`);
        console.log(`  合计: ${list.length} 项`);
      } else if (sub === 'add') {
        const desc = args[2];
        if (!desc) { console.error('用法: completeness-guard gaps add <描述> [--source <来源>] [--plan <计划>]'); process.exit(1); }
        const g = gaps.addGap(gapsFile, desc, { source: argValue(args, '--source'), plan: argValue(args, '--plan') });
        console.log(`✓ 缺口已登记: ${g.id}（可见的缺口优于隐藏的完美）`);
      } else if (sub === 'close') {
        const id = args[2];
        if (!id) { console.error('用法: completeness-guard gaps close <id>'); process.exit(1); }
        const g = gaps.closeGap(gapsFile, id);
        console.log(g ? `✓ 缺口已关闭: ${id}` : `✗ 未找到缺口: ${id}`);
      } else {
        console.log('用法: completeness-guard gaps list [--status open] | gaps add <描述> | gaps close <id>');
      }
      break;
    }
    case 'radar': {
      const config = loadConfig(argValue(args, '--config'));
      const radarFile = argValue(args, '--radar') || path.join(CWD, 'completeness-radar.json');
      const sub = args[1];
      if (sub === 'check') {
        const r = radar.check(radarFile, { intervalDays: config && config.radar && config.radar.scanIntervalDays });
        console.log(r.overdue
          ? `⚠️ 完整性雷达已过期（上次: ${r.lastScan || '从未'}，应于 ${r.nextScan} 前扫描）——按雷达清单扫描行业/竞品/元构升级`
          : `✅ 雷达在窗口内（上次: ${r.lastScan}，下次: ${r.nextScan}）`);
        console.log('  观察清单:');
        for (const [cat, items] of Object.entries(r.radar.watch)) {
          console.log(`  [${cat}]`);
          for (const it of items) console.log(`    - ${it}`);
        }
      } else if (sub === 'scan') {
        console.log(`✓ 已标记扫描完成: ${radar.markScanned(radarFile)}`);
      } else if (sub === 'findings') {
        const r = radar.loadRadar(radarFile);
        if (!r.findings.length) console.log('  （暂无雷达发现）');
        for (const f of r.findings) console.log(`  [${f.id}] ${f.status} | ${f.desc} | 来源: ${f.source}`);
      } else {
        console.log('用法: completeness-guard radar check | radar scan | radar findings');
      }
      break;
    }
    case 'declaration': {
      const config = loadConfig(argValue(args, '--config'));
      const doc = argValue(args, '--doc') || (config && config.target && config.target.doc);
      const gapsFile = (config && config.gaps && config.gaps.file) || path.join(CWD, 'completeness-gaps.json');
      let report = null;
      if (doc && fs.existsSync(path.resolve(CWD, doc))) {
        report = verifyDoc(path.resolve(CWD, doc), { baselineDirs: config && config.baselines && config.baselines.dirs });
      }
      console.log(generateDeclaration({ report, gapsFile, docVersion: config && config.target && config.target.version }));
      if (report && !report.ok) process.exit(1);
      break;
    }
    case 'check-text': {
      const text = args.slice(1).join(' ');
      const found = detectForbidden(text);
      console.log(found.length
        ? `❌ 检测到禁用声明词: ${found.join('、')} —— 按声明纪律禁止使用（见 completeness-guard declaration）`
        : '✅ 文本合规（无禁用声明词）');
      process.exit(found.length ? 1 : 0);
      break;
    }
    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`元构完整性治理套件 v${require(path.join(KIT_ROOT, 'package.json')).version}
用法见文件头注释。核心命令: verify / init / baseline / gaps / radar / declaration / check-text`);
      break;
  }
}

main();
