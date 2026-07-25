/**
 * benchmark.js
 * 元构 927 算法 MCP 服务器性能基准测试
 *
 * 7 项性能测试：
 *   PT-001: 启动时间（< 2000ms）
 *   PT-002: ListTools 响应时间（< 100ms）
 *   PT-003: T1 同步平均（< 5ms/次，1000 次循环）
 *   PT-004: T1 异步平均（< 50ms/次，100 次循环）
 *   PT-005: L3 工具调用平均（< 5ms/次，1000 次循环）
 *   PT-006: L4 族级调用平均（< 10ms/次，100 次循环）
 *   PT-007: 内存占用 heapUsed（< 100MB）
 */

const path = require('path');
const { spawn } = require('child_process');

const ENGINE_DIST = process.env.ENGINE_DIST
  || path.resolve(__dirname, '../../packages/engine/RUNTIME/dist');
const registry = require(path.join(ENGINE_DIST, 'algorithms/registry.js'));
const toolRegistry = require('./tool-registry.js');
toolRegistry.initialize(registry);

const results = [];
let pass = 0, fail = 0;

function record(id, name, value, threshold, unit, ok) {
  results.push({ id, name, value, threshold, unit, ok });
  if (ok) {
    pass++;
    console.log(`✅ ${id} ${name}: ${value} ${unit} (阈值 < ${threshold} ${unit})`);
  } else {
    fail++;
    console.log(`❌ ${id} ${name}: ${value} ${unit} (阈值 < ${threshold} ${unit})`);
  }
}

// ============================================================================
// PT-001: 启动时间（< 2000ms）
// ============================================================================
function testStartupTime() {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn('node', ['index.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let resolved = false;
    const done = (ok, elapsed) => {
      if (resolved) return;
      resolved = true;
      try { child.kill(); } catch (e) {}
      record('PT-001', '启动时间', elapsed, 2000, 'ms', ok);
      resolve();
    };
    child.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Server started')) {
        const elapsed = Date.now() - start;
        done(elapsed < 2000, elapsed);
      }
    });
    setTimeout(() => done(false, Date.now() - start), 5000);
  });
}

// ============================================================================
// PT-002: ListTools 响应时间（< 100ms）
// ============================================================================
async function testListTools() {
  const schemas = toolRegistry.getAllSchemas();
  const start = Date.now();
  // 模拟 ListTools 序列化
  const json = JSON.stringify(schemas);
  const elapsed = Date.now() - start;
  record('PT-002', 'ListTools 响应时间', elapsed, 100, 'ms', elapsed < 100 && schemas.length === 57);
}

// ============================================================================
// PT-003: T1 同步平均（< 5ms/次，1000 次循环）
// ============================================================================
async function testT1Sync() {
  const h = toolRegistry.getHandler('execute_sync');
  const args = { id: 'ALG_T1_C_001', input: { a: [1, 2, 3], b: [2, 4, 6] } };
  const iterations = 1000;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await h(args, registry);
  }
  const total = Date.now() - start;
  const avg = total / iterations;
  record('PT-003', `T1 同步平均 (${iterations} 次)`, Number(avg.toFixed(3)), 5, 'ms/次', avg < 5);
}

// ============================================================================
// PT-004: T1 异步平均（< 50ms/次，100 次循环）
// ============================================================================
async function testT1Async() {
  const h = toolRegistry.getHandler('execute');
  const args = { id: 'ALG_T1_C_001', input: { a: [1, 2, 3], b: [2, 4, 6] } };
  const iterations = 100;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await h(args, registry);
  }
  const total = Date.now() - start;
  const avg = total / iterations;
  record('PT-004', `T1 异步平均 (${iterations} 次)`, Number(avg.toFixed(3)), 50, 'ms/次', avg < 50);
}

// ============================================================================
// PT-005: L3 工具调用平均（< 5ms/次，1000 次循环）
// ============================================================================
async function testL3Tool() {
  const h = toolRegistry.getHandler('cosine_similarity');
  const args = { a: [1, 2, 3], b: [2, 4, 6] };
  const iterations = 1000;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await h(args, registry);
  }
  const total = Date.now() - start;
  const avg = total / iterations;
  record('PT-005', `L3 cosine_similarity 平均 (${iterations} 次)`, Number(avg.toFixed(3)), 5, 'ms/次', avg < 5);
}

// ============================================================================
// PT-006: L4 族级调用平均（< 10ms/次，100 次循环）
// ============================================================================
async function testL4Tool() {
  const h = toolRegistry.getHandler('coupling_calculate');
  const args = { operation: 'cosine', input: { a: [1, 2, 3], b: [2, 4, 6] } };
  const iterations = 100;
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await h(args, registry);
  }
  const total = Date.now() - start;
  const avg = total / iterations;
  record('PT-006', `L4 coupling_calculate 平均 (${iterations} 次)`, Number(avg.toFixed(3)), 10, 'ms/次', avg < 10);
}

// ============================================================================
// PT-007: 内存占用 heapUsed（< 100MB）
// ============================================================================
function testMemory() {
  if (global.gc) global.gc();
  const mem = process.memoryUsage();
  const heapUsedMB = mem.heapUsed / 1024 / 1024;
  record('PT-007', '内存占用 heapUsed', Number(heapUsedMB.toFixed(2)), 100, 'MB', heapUsedMB < 100);
}

// ============================================================================
// 主流程
// ============================================================================
(async () => {
  console.log('=== mcp_metago-algorithms 性能基准测试开始 ===\n');

  // PT-001: 启动时间（需子进程）
  console.log('[PT-001] 测试启动时间...');
  await testStartupTime();

  // PT-002: ListTools 响应时间
  console.log('\n[PT-002] 测试 ListTools 响应时间...');
  await testListTools();

  // PT-003: T1 同步平均
  console.log('\n[PT-003] 测试 T1 同步执行...');
  await testT1Sync();

  // PT-004: T1 异步平均
  console.log('\n[PT-004] 测试 T1 异步执行...');
  await testT1Async();

  // PT-005: L3 工具调用平均
  console.log('\n[PT-005] 测试 L3 工具调用...');
  await testL3Tool();

  // PT-006: L4 族级调用平均
  console.log('\n[PT-006] 测试 L4 族级调用...');
  await testL4Tool();

  // PT-007: 内存占用
  console.log('\n[PT-007] 测试内存占用...');
  testMemory();

  // 总结
  console.log('\n=== 性能基准测试总结 ===');
  console.log(`通过: ${pass} / ${pass + fail}`);
  console.log(`失败: ${fail}`);
  if (fail > 0) {
    console.log('\n失败项:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ❌ ${r.id} ${r.name}: ${r.value} ${r.unit} (阈值 < ${r.threshold} ${r.unit})`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ 所有性能测试通过');
    process.exit(0);
  }
})();
