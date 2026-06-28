/**
 * MetaGO Engine - 测试套件
 * Test Suite
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import { AxiomValidator } from '../src/validators';
import { DecisionLock } from '../src/decision-lock';
import { EvolutionEngine } from '../src/evolution-engine';
import { Perception, BoundaryType } from '../src/perception';
import { RuntimeMemory } from '../src/memory';
import { Metrics } from '../src/metrics';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

async function testAxiomValidator(): Promise<void> {
  console.log('\n=== Test: AxiomValidator ===\n');

  // A1 溯源公理
  const r1 = AxiomValidator.checkProvenance('基于用户输入分析', '用户输入分析');
  assert(r1.status === 'pass', 'A1 traceable output should pass');

  const r2 = AxiomValidator.checkProvenance('hello world');
  assert(r2.status === 'fail', 'A1 non-traceable output should fail');

  // A36 合规
  const r3 = AxiomValidator.checkCompliance('这是一个合规的决策，已检查法律风险');
  assert(r3.status === 'pass', 'A36 compliant decision should pass');

  const r4 = AxiomValidator.checkCompliance('绕过安全检查');
  assert(r4.status === 'fail', 'A36 risky decision should fail');

  // D38 客观中立
  const r5 = AxiomValidator.checkObjectivity('您说得完全对');
  assert(r5.status === 'fail', 'D38 pleasing output should fail');

  const r6 = AxiomValidator.checkObjectivity('这个问题需要指出');
  assert(r6.status === 'pass', 'D38 objective output should pass');

  // 输出完整性
  const r7 = AxiomValidator.checkOutputIntegrity('完整的内容输出');
  assert(r7.status === 'pass', 'Output integrity should pass for clean output');

  const r8 = AxiomValidator.checkOutputIntegrity('内容包含 [placeholder]');
  assert(r8.status === 'fail', 'Output integrity should fail for placeholder');

  // 综合验证
  const all = AxiomValidator.validateAll('基于输入的分析，存在风险需要指出。来源：用户需求', {
    input: '用户需求',
    decision: '已检查法律合规',
  });
  assert(all.length > 0, 'validateAll should return multiple results');
  const summary = AxiomValidator.getSummary(all);
  assert(summary.total === all.length, 'Summary total should match');
}

async function testDecisionLock(): Promise<void> {
  console.log('\n=== Test: DecisionLock ===\n');

  const result = await DecisionLock.validate(
    '基于用户需求的分析报告。因为需求明确，所以方案可行。完整的内容，无截断。',
    '分析用户需求',
    '请分析我的需求'
  );
  assert(result.gates.length === 4, 'Should have 4 gates');
  assert(typeof result.passed === 'boolean', 'Should return pass/fail status');

  // 测试 OSG 关卡
  const failed = await DecisionLock.validate('内容 [placeholder]');
  const osgGate = failed.gates.find(g => g.gateId === 'OSG');
  assert(osgGate?.status === 'fail', 'OSG should fail for placeholder');
}

async function testEvolutionEngine(): Promise<void> {
  console.log('\n=== Test: EvolutionEngine ===\n');

  const engine = new EvolutionEngine('1.0.0');
  assert(engine.getVersion() === '1.0.0', 'Initial version should be 1.0.0');

  // 触发进化
  const result = await engine.evolve({
    failure: { type: 'error', message: 'Test failure' },
  });
  assert(typeof result.success === 'boolean', 'Should return success status');
  assert(result.stage === 'RECURSION' || result.stage === 'PERCEPTION', 'Should reach a valid stage');
  assert(result.metaMetaEvolution?.monitored === true, 'Meta-meta-evolution should be monitored');
}

async function testPerception(): Promise<void> {
  console.log('\n=== Test: Perception ===\n');

  const p = new Perception();
  const b1 = p.detectBoundary({
    failure: { type: 'error', message: 'Test failure' },
  });
  assert(b1?.type === BoundaryType.TASK_FAILURE, 'Should detect task failure boundary');

  const b2 = p.detectBoundary({
    feedback: '这个不对',
  });
  assert(b2?.type === BoundaryType.USER_FEEDBACK, 'Should detect feedback boundary');

  const stats = p.getStats();
  assert(stats.total >= 2, 'Should have recorded 2 boundaries');
}

async function testRuntimeMemory(): Promise<void> {
  console.log('\n=== Test: RuntimeMemory ===\n');

  const mem = new RuntimeMemory('./.test-metago-memory.json');
  mem.clear();

  const id = mem.record('task', { task: 'test' }, ['unit-test']);
  assert(id.startsWith('MEM-'), 'Should return MEM- prefixed id');

  const results = mem.query({ type: 'task' });
  assert(results.length === 1, 'Should find 1 task record');

  const latest = mem.getLatest('task');
  assert(latest?.data.task === 'test', 'Latest task should match');

  const stats = mem.getStats();
  assert(stats.totalRecords === 1, 'Stats should show 1 record');

  mem.clear();
}

async function testMetrics(): Promise<void> {
  console.log('\n=== Test: Metrics ===\n');

  const m = new Metrics();
  m.increment('test_counter');
  m.increment('test_counter');
  assert(m.getCounter('test_counter') === 2, 'Counter should be 2');

  m.startTimer('test');
  await new Promise(r => setTimeout(r, 10));
  const duration = m.endTimer('test');
  assert(duration > 0, 'Timer should return positive duration');

  const snapshot = m.getSnapshot();
  assert(snapshot.loadCount === 0, 'Snapshot should show 0 loads initially');

  const report = m.exportReport();
  assert(report.includes('MetaGO Engine Metrics Report'), 'Report should have title');

  m.clear();
}

async function main(): Promise<void> {
  console.log('MetaGO Engine Test Suite v1.0.0');
  console.log('===============================');

  await testAxiomValidator();
  await testDecisionLock();
  await testEvolutionEngine();
  await testPerception();
  await testRuntimeMemory();
  await testMetrics();

  console.log('\n===============================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('===============================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`Test error: ${e.message}`);
  process.exit(1);
});
