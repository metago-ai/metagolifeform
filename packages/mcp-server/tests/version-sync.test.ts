import { describe, it, expect } from "vitest";
import { VERSION } from "../src/logger.js";

/**
 * T9 - 版本同步验证
 *
 * 验证 logger.ts 的 VERSION 常量从 package.json 动态读取，
 * 避免硬编码导致版本不同步（曾发生 1.1.4 vs 1.1.5 事件）。
 */
describe("T9 - 版本同步验证", () => {
  it("VERSION 应从 package.json 动态读取（非 unknown）", () => {
    expect(VERSION).not.toBe("unknown");
  });

  it("VERSION 应与 package.json 完全一致（=1.2.0）", () => {
    expect(VERSION).toBe("1.2.0");
  });

  it("VERSION 应符合 semver 格式", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
