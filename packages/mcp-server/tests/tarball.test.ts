/**
 * T4 - NPM tarball 校验
 *
 * 验证 `npm pack --dry-run` 输出符合发布要求：
 * 1. 包含必要文件：dist/, README.md, LICENSE
 * 2. 不包含不应发布的文件：src/, tests/, node_modules/, vitest.config.ts
 * 3. README.md 含必要章节标题
 * 4. LICENSE 存在且非空
 *
 * 历史：曾因 files 字段缺失导致发布到 NPM 的包缺少必要文件。
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const pkgDir = resolve(__dirname, "..");

interface NpmPackFile {
  path: string;
  size: number;
}

interface NpmPackOutput {
  name: string;
  version: string;
  filename: string;
  files: NpmPackFile[];
}

function runNpmPackDryRun(): NpmPackOutput {
  const output = execSync("npm pack --dry-run --json", {
    cwd: pkgDir,
    stdio: "pipe",
    timeout: 30000,
    encoding: "utf-8",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return JSON.parse(output)[0];
}

describe("T4 - NPM tarball 校验", () => {
  const packed = runNpmPackDryRun();
  const filePaths = packed.files.map((f) => f.path.replace(/\\/g, "/"));

  it("包名应为 @metago-ai/mcp-server", () => {
    expect(packed.name).toBe("@metago-ai/mcp-server");
  });

  it("应包含 dist/index.js（运行时入口）", () => {
    expect(filePaths).toContain("dist/index.js");
  });

  it("应包含 README.md", () => {
    expect(filePaths).toContain("README.md");
  });

  it("应包含 LICENSE", () => {
    expect(filePaths).toContain("LICENSE");
  });

  it("不应包含 src/（源码不发布）", () => {
    const srcFiles = filePaths.filter((p) => p.startsWith("src/"));
    expect(srcFiles, `不应包含源码：${srcFiles.join(", ")}`).toEqual([]);
  });

  it("不应包含 tests/（测试不发布）", () => {
    const testFiles = filePaths.filter((p) => p.startsWith("tests/"));
    expect(testFiles, `不应包含测试：${testFiles.join(", ")}`).toEqual([]);
  });

  it("不应包含 vitest.config.ts（配置不发布）", () => {
    expect(filePaths).not.toContain("vitest.config.ts");
  });

  it("不应包含 tsconfig.json（配置不发布）", () => {
    expect(filePaths).not.toContain("tsconfig.json");
  });

  it("不应包含 .git/ 或 node_modules/", () => {
    const forbidden = filePaths.filter(
      (p) => p.startsWith(".git/") || p.startsWith("node_modules/"),
    );
    expect(forbidden, `包含禁止文件：${forbidden.join(", ")}`).toEqual([]);
  });

  it("README.md 应含必要章节标题", () => {
    const readmePath = resolve(pkgDir, "README.md");
    expect(existsSync(readmePath)).toBe(true);
    const readme = readFileSync(readmePath, "utf-8");
    // 至少应包含 "安装" 或 "Install" 关键词
    expect(
      /安装|Install/i.test(readme),
      "README 应包含安装说明",
    ).toBe(true);
  });

  it("LICENSE 应存在且非空（≥100 字节）", () => {
    const licensePath = resolve(pkgDir, "LICENSE");
    expect(existsSync(licensePath)).toBe(true);
    const stat = statSync(licensePath);
    expect(stat.size, "LICENSE 文件过小").toBeGreaterThan(100);
  });

  it("tarball 总大小应在合理范围（10KB ~ 5MB）", () => {
    const totalSize = packed.files.reduce((sum, f) => sum + f.size, 0);
    expect(totalSize).toBeGreaterThan(10 * 1024); // > 10KB
    expect(totalSize).toBeLessThan(5 * 1024 * 1024); // < 5MB
  });
});
