import { describe, it, expect } from "vitest";
import { computeStats } from "../server.mjs";

/**
 * 仪表盘核心统计逻辑单元测试
 *
 * 验证 computeStats 函数对 calls.jsonl 记录的处理：
 * - summary 汇总（总数/调用/错误/启动/崩溃/工具数）
 * - toolStats 工具统计（调用次数/错误率/平均时长/P50/P95）
 * - dailyStats 按天分组
 * - versionStats 版本分布
 * - recentRecords 最近记录
 */
describe("Dashboard - computeStats 统计逻辑", () => {
  // 测试数据：3 种工具 × 不同时长 × 含错误 × 跨 2 天
  const mockRecords = [
    { ts: "2026-06-30T10:00:00.000Z", type: "lifecycle", result: "ok", version: "1.1.5" },
    { ts: "2026-06-30T10:01:00.000Z", type: "call", toolName: "metago_critique", result: "ok", durationMs: 150, version: "1.1.5" },
    { ts: "2026-06-30T10:02:00.000Z", type: "call", toolName: "metago_critique", result: "ok", durationMs: 200, version: "1.1.5" },
    { ts: "2026-06-30T10:03:00.000Z", type: "call", toolName: "metago_objectivity", result: "ok", durationMs: 80, version: "1.1.5" },
    { ts: "2026-06-30T10:04:00.000Z", type: "call", toolName: "metago_decision_lock", result: "error", durationMs: 300, error: "validation failed", version: "1.1.5" },
    { ts: "2026-07-01T11:05:00.000Z", type: "call", toolName: "metago_critique", result: "ok", durationMs: 120, version: "1.1.5" },
    { ts: "2026-07-01T11:06:00.000Z", type: "lifecycle", result: "error", error: "crash test", version: "1.1.5" },
  ];

  const stats = computeStats(mockRecords);

  describe("summary 汇总", () => {
    it("totalRecords 应为 7", () => {
      expect(stats.summary.totalRecords).toBe(7);
    });

    it("totalCalls 应为 5（仅 type=call）", () => {
      expect(stats.summary.totalCalls).toBe(5);
    });

    it("totalErrors 应为 2（1 个 call error + 1 个 lifecycle error）", () => {
      expect(stats.summary.totalErrors).toBe(2);
    });

    it("errorRate 应为 40%（2/5）", () => {
      expect(stats.summary.errorRate).toBe(40);
    });

    it("startupCount 应为 1（lifecycle ok 且无 error）", () => {
      expect(stats.summary.startupCount).toBe(1);
    });

    it("crashCount 应为 1（lifecycle error）", () => {
      expect(stats.summary.crashCount).toBe(1);
    });

    it("uniqueTools 应为 3", () => {
      expect(stats.summary.uniqueTools).toBe(3);
    });
  });

  describe("toolStats 工具统计", () => {
    it("应有 3 个工具", () => {
      expect(stats.toolStats).toHaveLength(3);
    });

    it("应按 calls 降序排列", () => {
      const callsList = stats.toolStats.map((t) => t.calls);
      const sorted = [...callsList].sort((a, b) => b - a);
      expect(callsList).toEqual(sorted);
    });

    it("metago_critique: 3 calls, 0 errors, avg 156.67ms", () => {
      const critique = stats.toolStats.find((t) => t.name === "metago_critique");
      expect(critique).toBeDefined();
      expect(critique.calls).toBe(3);
      expect(critique.errors).toBe(0);
      expect(critique.errorRate).toBe(0);
      expect(critique.avgDurationMs).toBe(156.67);
    });

    it("metago_critique: P50=150, P95=200", () => {
      const critique = stats.toolStats.find((t) => t.name === "metago_critique");
      // durations = [150, 200, 120], sorted = [120, 150, 200]
      // p50 = sorted[floor(3 * 0.5)] = sorted[1] = 150
      // p95 = sorted[floor(3 * 0.95)] = sorted[2] = 200
      expect(critique.p50Ms).toBe(150);
      expect(critique.p95Ms).toBe(200);
    });

    it("metago_decision_lock: errorRate=100%", () => {
      const lock = stats.toolStats.find((t) => t.name === "metago_decision_lock");
      expect(lock).toBeDefined();
      expect(lock.calls).toBe(1);
      expect(lock.errors).toBe(1);
      expect(lock.errorRate).toBe(100);
    });
  });

  describe("dailyStats 按天分组", () => {
    it("应跨 2 天", () => {
      expect(stats.dailyStats).toHaveLength(2);
    });

    it("2026-06-30: 4 calls, 1 error", () => {
      const day1 = stats.dailyStats.find((d) => d.day === "2026-06-30");
      expect(day1).toBeDefined();
      expect(day1.calls).toBe(4);
      expect(day1.errors).toBe(1);
    });

    it("2026-07-01: 1 call, 0 errors（lifecycle 不算 call）", () => {
      const day2 = stats.dailyStats.find((d) => d.day === "2026-07-01");
      expect(day2).toBeDefined();
      expect(day2.calls).toBe(1);
      expect(day2.errors).toBe(0);
    });
  });

  describe("versionStats 版本分布", () => {
    it("1.1.5 应有 7 条记录", () => {
      expect(stats.versionStats["1.1.5"]).toBe(7);
    });
  });

  describe("recentRecords 最近记录", () => {
    it("应返回最多 20 条", () => {
      expect(stats.recentRecords.length).toBeLessThanOrEqual(20);
    });

    it("应按时间倒序（最新在前）", () => {
      expect(stats.recentRecords[0].ts).toBe("2026-07-01T11:06:00.000Z");
    });
  });
});

describe("Dashboard - computeStats 边界场景", () => {
  it("空记录数组应返回零值 summary", () => {
    const stats = computeStats([]);
    expect(stats.summary.totalRecords).toBe(0);
    expect(stats.summary.totalCalls).toBe(0);
    expect(stats.summary.totalErrors).toBe(0);
    expect(stats.summary.errorRate).toBe(0);
    expect(stats.toolStats).toEqual([]);
    expect(stats.dailyStats).toEqual([]);
    expect(stats.recentRecords).toEqual([]);
  });

  it("单条记录应正确计算", () => {
    const single = [
      { ts: "2026-06-30T10:00:00.000Z", type: "call", toolName: "test_tool", result: "ok", durationMs: 100, version: "1.0.0" },
    ];
    const stats = computeStats(single);
    expect(stats.summary.totalRecords).toBe(1);
    expect(stats.summary.totalCalls).toBe(1);
    expect(stats.toolStats[0].p50Ms).toBe(100);
    expect(stats.toolStats[0].p95Ms).toBe(100);
  });

  it("非 call 类型的记录不计入 totalCalls", () => {
    const records = [
      { ts: "2026-06-30T10:00:00.000Z", type: "call", toolName: "a", result: "ok", durationMs: 50, version: "1.0.0" },
      { ts: "2026-06-30T10:01:00.000Z", type: "invalid", result: "ok", version: "1.0.0" },
    ];
    const stats = computeStats(records);
    // totalRecords 统计所有记录
    expect(stats.summary.totalRecords).toBe(2);
    // totalCalls 仅统计 type === "call"
    expect(stats.summary.totalCalls).toBe(1);
  });
});
