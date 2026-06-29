/**
 * T3 - 包可构建测试
 *
 * 验证：
 * 1. `npm run build`（tsc）退出码 0
 * 2. dist/index.js 文件存在
 * 3. dist/index.js 是有效 JS（可被 Node 加载）
 *
 * 历史：曾因 ESM 配置错误导致 tsc 报错但仍发布到 NPM。
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const pkgDir = resolve(__dirname, "..");

describe("T3 - 包可构建", () => {
  it("`npm run build` 应成功（退出码 0）", () => {
    expect(() => {
      execSync("npm run build", {
        cwd: pkgDir,
        stdio: "pipe",
        timeout: 60000,
        env: { ...process.env, FORCE_COLOR: "0" },
      });
    }).not.toThrow();
  }, 90000);

  it("dist/index.js 应存在且非空", () => {
    const indexPath = resolve(pkgDir, "dist", "index.js");
    expect(existsSync(indexPath)).toBe(true);
    const stat = statSync(indexPath);
    expect(stat.size).toBeGreaterThan(1000); // 至少 1KB
  });

  it("dist/index.js 应可被 Node 加载（验证是有效 JS）", () => {
    // 通过 node --check 验证语法（不实际执行，避免启动 MCP server）
    const indexPath = resolve(pkgDir, "dist", "index.js");
    expect(() => {
      execSync(`node --check "${indexPath}"`, {
        cwd: pkgDir,
        stdio: "pipe",
        timeout: 10000,
      });
    }).not.toThrow();
  });

  it("dist/index.d.ts 应存在（类型声明）", () => {
    const dtsPath = resolve(pkgDir, "dist", "index.d.ts");
    expect(existsSync(dtsPath)).toBe(true);
  });
});
