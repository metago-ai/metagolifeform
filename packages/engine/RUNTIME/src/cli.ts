/**
 * MetaGO Engine - CLI 命令行接口
 * Command Line Interface
 *
 * 用法：
 *   metago-engine verify <file>   验证文件内容是否符合公理
 *   metago-engine status          查看引擎状态
 *   metago-engine metrics         查看指标报告
 *   metago-engine lock <file>     执行决策锁校验
 *   metago-engine evolve          手动触发元进化
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { MetaGOEngine } from './index';

const args = process.argv.slice(2);
const command = args[0];

function printHelp(): void {
  console.log(`
MetaGO Engine CLI v1.0.0
========================

Usage:
  metago-engine verify <file>   Verify file content against axioms
  metago-engine status          Show engine status
  metago-engine metrics         Show metrics report
  metago-engine lock <file>     Execute decision lock validation
  metago-engine evolve          Manually trigger meta-evolution

Options:
  -h, --help                    Show this help
  -v, --version                 Show version

Examples:
  metago-engine verify output.txt
  metago-engine lock decision.md
  metago-engine status
`);
}

async function main(): Promise<void> {
  if (!command || command === '-h' || command === '--help') {
    printHelp();
    return;
  }

  if (command === '-v' || command === '--version') {
    console.log('MetaGO Engine v1.0.0 (Metago V36.8.3)');
    return;
  }

  const enginePath = path.resolve(__dirname, '../../');
  const engine = new MetaGOEngine(enginePath, '1.0.0');
  await engine.init();

  switch (command) {
    case 'verify': {
      const file = args[1];
      if (!file) {
        console.error('Error: File path required');
        process.exit(1);
      }
      const content = fs.readFileSync(file, 'utf-8');
      const { results, summary } = engine.validate(content);
      console.log('\n=== Axiom Validation Results ===\n');
      for (const r of results) {
        const icon = r.status === 'pass' ? '✓' : r.status === 'warning' ? '!' : '✗';
        console.log(`${icon} [${r.axiomId}] ${r.axiomName}: ${r.message}`);
      }
      console.log(`\nTotal: ${summary.total} | Pass: ${summary.pass} | Fail: ${summary.fail} | Warning: ${summary.warning}`);
      console.log(`Critical Failures: ${summary.criticalFail}`);
      process.exit(summary.criticalFail > 0 ? 1 : 0);
      break;
    }

    case 'status': {
      console.log(engine.loader.getSummary());
      break;
    }

    case 'metrics': {
      console.log(engine.metrics.exportReport());
      break;
    }

    case 'lock': {
      const file = args[1];
      if (!file) {
        console.error('Error: File path required');
        process.exit(1);
      }
      const content = fs.readFileSync(file, 'utf-8');
      const result = await engine.lock(content);
      console.log('\n=== Decision Lock Results ===\n');
      console.log(`Overall: ${result.passed ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log('');
      for (const gate of result.gates) {
        const icon = gate.status === 'pass' ? '✓' : gate.status === 'warning' ? '!' : '✗';
        console.log(`${icon} [${gate.gateId}] ${gate.gateName}: ${gate.message}`);
        if (gate.details) {
          for (const d of gate.details) console.log(`    - ${d}`);
        }
      }
      console.log(`\nFailed Gates: ${result.failedGates.length === 0 ? 'None' : result.failedGates.join(', ')}`);
      process.exit(result.passed ? 0 : 1);
      break;
    }

    case 'evolve': {
      console.log('\nTriggering meta-evolution...\n');
      const result = await engine.evolve();
      console.log('=== Evolution Result ===\n');
      console.log(`Success: ${result.success ? 'YES ✓' : 'NO ✗'}`);
      console.log(`Stage: ${result.stage}`);
      if (result.newVersion) console.log(`New Version: ${result.newVersion}`);
      if (result.boundary) console.log(`Boundary: ${result.boundary.type} - ${result.boundary.message}`);
      if (result.gaps) {
        console.log(`\nGaps (${result.gaps.length}):`);
        for (const g of result.gaps) console.log(`  - [${g.severity}] ${g.description}`);
      }
      if (result.solutions) {
        console.log(`\nSolutions (${result.solutions.length}):`);
        for (const s of result.solutions) console.log(`  - [${s.type}] ${s.name}: ${s.validated ? 'validated' : 'not validated'}`);
      }
      if (result.metaMetaEvolution) {
        console.log(`\nMeta-Meta-Evolution:`);
        console.log(`  Monitored: ${result.metaMetaEvolution.monitored}`);
        console.log(`  Valid: ${result.metaMetaEvolution.evolutionValid}`);
        if (result.metaMetaEvolution.concerns.length > 0) {
          console.log(`  Concerns:`);
          for (const c of result.metaMetaEvolution.concerns) console.log(`    - ${c}`);
        }
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(e => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
