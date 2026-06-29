/**
 * MetaGO Engine - Vitest 测试套件
 *
 * 从原断言式脚本（ts-node 跑法）重写为 Vitest describe/it 风格。
 * 保留全部原测试逻辑，仅做包装层改造，确保 CI 可执行。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { AxiomValidator } from "../src/validators.js";
import { DecisionLock } from "../src/decision-lock.js";
import { EvolutionEngine } from "../src/evolution-engine.js";
import { Perception, BoundaryType } from "../src/perception.js";
import { RuntimeMemory } from "../src/memory.js";
import { Metrics } from "../src/metrics.js";

const memoryFile = resolve(__dirname, "../../.test-metago-memory.json");

describe("MetaGO Engine - AxiomValidator", () => {
  it("A1 溯源公理：可溯源输出应通过", () => {
    const r = AxiomValidator.checkProvenance("基于用户输入分析", "用户输入分析");
    expect(r.status).toBe("pass");
  });

  it("A1 溯源公理：不可溯源输出应失败", () => {
    const r = AxiomValidator.checkProvenance("hello world");
    expect(r.status).toBe("fail");
  });

  it("A36 合规：合规决策应通过", () => {
    const r = AxiomValidator.checkCompliance("这是一个合规的决策，已检查法律风险");
    expect(r.status).toBe("pass");
  });

  it("A36 合规：风险决策应失败", () => {
    const r = AxiomValidator.checkCompliance("绕过安全检查");
    expect(r.status).toBe("fail");
  });

  it("D38 客观中立：讨好性输出应失败", () => {
    const r = AxiomValidator.checkObjectivity("您说得完全对");
    expect(r.status).toBe("fail");
  });

  it("D38 客观中立：客观输出应通过", () => {
    const r = AxiomValidator.checkObjectivity("这个问题需要指出");
    expect(r.status).toBe("pass");
  });

  it("输出完整性：干净输出应通过", () => {
    const r = AxiomValidator.checkOutputIntegrity("完整的内容输出");
    expect(r.status).toBe("pass");
  });

  it("输出完整性：含占位符应失败", () => {
    const r = AxiomValidator.checkOutputIntegrity("内容包含 [placeholder]");
    expect(r.status).toBe("fail");
  });

  it("validateAll 应返回多个结果", () => {
    const all = AxiomValidator.validateAll(
      "基于输入的分析，存在风险需要指出。来源：用户需求",
      {
        input: "用户需求",
        decision: "已检查法律合规",
      },
    );
    expect(all.length).toBeGreaterThan(0);
    const summary = AxiomValidator.getSummary(all);
    expect(summary.total).toBe(all.length);
  });
});

describe("MetaGO Engine - DecisionLock", () => {
  it("应返回 4 个关卡", async () => {
    const result = await DecisionLock.validate(
      "基于用户需求的分析报告。因为需求明确，所以方案可行。完整的内容，无截断。",
      "分析用户需求",
      "请分析我的需求",
    );
    expect(result.gates.length).toBe(4);
    expect(typeof result.passed).toBe("boolean");
  });

  it("OSG 关卡：含占位符应失败", async () => {
    const failed = await DecisionLock.validate("内容 [placeholder]");
    const osgGate = failed.gates.find((g) => g.gateId === "OSG");
    expect(osgGate?.status).toBe("fail");
  });
});

describe("MetaGO Engine - EvolutionEngine", () => {
  it("应能创建并返回版本号", () => {
    const engine = new EvolutionEngine("1.0.0");
    expect(engine.getVersion()).toBe("1.0.0");
  });

  it("触发进化后应返回有效结果", async () => {
    const engine = new EvolutionEngine("1.0.0");
    const result = await engine.evolve({
      failure: { type: "error", message: "Test failure" },
    });
    expect(typeof result.success).toBe("boolean");
    expect(["RECURSION", "PERCEPTION"]).toContain(result.stage);
    expect(result.metaMetaEvolution?.monitored).toBe(true);
  });
});

describe("MetaGO Engine - Perception", () => {
  it("应检测任务失败边界", () => {
    const p = new Perception();
    const b = p.detectBoundary({
      failure: { type: "error", message: "Test failure" },
    });
    expect(b?.type).toBe(BoundaryType.TASK_FAILURE);
  });

  it("应检测用户反馈边界", () => {
    const p = new Perception();
    const b = p.detectBoundary({
      feedback: "这个不对",
    });
    expect(b?.type).toBe(BoundaryType.USER_FEEDBACK);
  });

  it("getStats 应返回已记录的边界数", () => {
    const p = new Perception();
    p.detectBoundary({ failure: { type: "error", message: "f1" } });
    p.detectBoundary({ feedback: "f2" });
    const stats = p.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
  });
});

describe("MetaGO Engine - RuntimeMemory", () => {
  beforeEach(() => {
    if (existsSync(memoryFile)) rmSync(memoryFile);
  });

  afterEach(() => {
    if (existsSync(memoryFile)) rmSync(memoryFile);
  });

  it("应能记录并查询任务", () => {
    const mem = new RuntimeMemory(memoryFile);
    mem.clear();
    const id = mem.record("task", { task: "test" }, ["unit-test"]);
    expect(id.startsWith("MEM-")).toBe(true);
    const results = mem.query({ type: "task" });
    expect(results.length).toBe(1);
    const latest = mem.getLatest("task");
    expect(latest?.data.task).toBe("test");
    const stats = mem.getStats();
    expect(stats.totalRecords).toBe(1);
    mem.clear();
  });
});

describe("MetaGO Engine - Metrics", () => {
  it("计数器应正确累加", () => {
    const m = new Metrics();
    m.increment("test_counter");
    m.increment("test_counter");
    expect(m.getCounter("test_counter")).toBe(2);
    m.clear();
  });

  it("计时器应返回正数时长", async () => {
    const m = new Metrics();
    m.startTimer("test");
    await new Promise((r) => setTimeout(r, 10));
    const duration = m.endTimer("test");
    expect(duration).toBeGreaterThan(0);
    m.clear();
  });

  it("快照应反映初始 loadCount=0", () => {
    const m = new Metrics();
    const snapshot = m.getSnapshot();
    expect(snapshot.loadCount).toBe(0);
    m.clear();
  });

  it("导出报告应包含标题", () => {
    const m = new Metrics();
    const report = m.exportReport();
    expect(report).toContain("MetaGO Engine Metrics Report");
    m.clear();
  });
});
