/**
 * T8 - 元数据一致性测试
 *
 * 验证各 package.json 中的元数据描述与实际数据一致。
 * 历史：根 package.json 中 metago.mcpServer.tools=22（实际 35），
 *      metago.devKit.skills=4（实际 8）—— 元数据漂移导致用户困惑。
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { SKILLS } from "../src/skills-data.js";
import { TOOLKIT_TOOLS } from "../src/toolkit-data.js";
import { PROMPTS } from "../src/prompts.js";

const mcpServerDir = resolve(__dirname, "..");
const repoRoot = resolve(mcpServerDir, "../..");
const devKitDir = resolve(repoRoot, "packages/dev-kit");

function readJson(p: string): Record<string, unknown> {
  return JSON.parse(readFileSync(p, "utf-8"));
}

function listSkillDirs(): string[] {
  const skillsRoot = resolve(repoRoot, "skills");
  return readdirSync(skillsRoot).filter((name) => {
    const stat = statSync(resolve(skillsRoot, name));
    return stat.isDirectory();
  });
}

describe("T8 - 元数据一致性", () => {
  const rootPkg = readJson(resolve(repoRoot, "package.json")) as Record<string, unknown>;
  const mcpPkg = readJson(resolve(mcpServerDir, "package.json")) as Record<string, unknown>;
  const devKitPkg = readJson(resolve(devKitDir, "package.json")) as Record<string, unknown>;

  describe("实际数据基线", () => {
    it("skills/ 目录应有 37 个技能子目录", () => {
      const skills = listSkillDirs();
      expect(skills.length).toBe(37);
    });

    it("SKILLS 数组应有 22 项", () => {
      expect(SKILLS.length).toBe(22);
    });

    it("TOOLKIT_TOOLS 数组应有 20 项", () => {
      expect(TOOLKIT_TOOLS.length).toBe(20);
    });

    it("PROMPTS 数组应有 8 项", () => {
      expect(PROMPTS.length).toBe(8);
    });

    it("合并去重后总工具数应为 35", () => {
      const names = new Set<string>();
      TOOLKIT_TOOLS.forEach((t) => names.add(t.toolName));
      SKILLS.forEach((s) => names.add(s.toolName));
      expect(names.size).toBe(35);
    });
  });

  describe("根 package.json 元数据", () => {
    const metago = rootPkg.metago as Record<string, unknown>;

    it("metago.skills 应为 37（与 skills/ 目录一致）", () => {
      expect(metago.skills).toBe(37);
    });

    it("metago.mcpServer.tools 应为 35（与合并去重结果一致）", () => {
      const mcp = metago.mcpServer as Record<string, unknown>;
      expect(mcp.tools).toBe(35);
    });

    it("metago.mcpServer.prompts 应为 8（与 PROMPTS 一致）", () => {
      const mcp = metago.mcpServer as Record<string, unknown>;
      expect(mcp.prompts).toBe(8);
    });

    it("metago.devKit.skills 应为 8（与 dev-kit package.json 一致）", () => {
      const dev = metago.devKit as Record<string, unknown>;
      expect(dev.skills).toBe(8);
    });

    it("description 中应包含 '35 项'（而非过时的 '42 项'）", () => {
      expect(rootPkg.description as string).toContain("35");
      expect(rootPkg.description as string).not.toContain("42 项");
    });
  });

  describe("mcp-server package.json 元数据", () => {
    it("description 中应包含 '35 项'（而非过时的 '42 项'）", () => {
      expect(mcpPkg.description as string).toContain("35");
      expect(mcpPkg.description as string).not.toContain("42 项");
    });

    it("version 应为 1.x.y 格式", () => {
      expect(mcpPkg.version as string).toMatch(/^1\.\d+\.\d+$/);
    });
  });

  describe("dev-kit package.json 元数据", () => {
    const metago = devKitPkg.metago as Record<string, unknown>;

    it("metago.totalSkills 应为 8", () => {
      expect(metago.totalSkills).toBe(8);
    });

    it("metago.reusedSkills 应有 4 项", () => {
      const reused = metago.reusedSkills as string[];
      expect(reused.length).toBe(4);
    });

    it("metago.addedSkills 应有 4 项", () => {
      const added = metago.addedSkills as string[];
      expect(added.length).toBe(4);
    });

    it("复用的 4 个技能应在 skills/ 目录中存在", () => {
      const reused = metago.reusedSkills as string[];
      const skillDirs = listSkillDirs();
      for (const skill of reused) {
        expect(skillDirs, `复用技能 ${skill} 应在 skills/ 目录中存在`).toContain(skill);
      }
    });

    it("新增的 4 个技能应在 skills/ 目录中存在", () => {
      const added = metago.addedSkills as string[];
      const skillDirs = listSkillDirs();
      for (const skill of added) {
        expect(skillDirs, `新增技能 ${skill} 应在 skills/ 目录中存在`).toContain(skill);
      }
    });
  });

  describe("全仓库 MCP tools 数量漂移防护", () => {
    /**
     * 防止 "42" 作为 MCP tools 数量再次出现。
     * 合法例外：D42 属性编号、package-lock hash、行号引用等。
     * 仅匹配与 MCP tools 数量明确相关的模式。
     */
    const STALE_PATTERNS: RegExp[] = [
      /42\s*(个|项)\s*(tools|MCP|能力|工具)/i,
      /42\s*tools/i,
      /tools.*42/i,
      /数量\s*=\s*42/i,
    ];

    const EXCLUDE_FILES = new Set([
      "metadata-consistency.test.ts", // 测试自身
      "RELEASE-CHECKLIST.md",          // 记录"42已被35取代"的说明
    ]);

    function scanDir(dir: string, results: { file: string; line: number; text: string }[]) {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (EXCLUDE_FILES.has(entry)) continue;
        const fullPath = resolve(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          // 跳过 node_modules, .git, dist
          if (["node_modules", ".git", "dist", ".trae"].includes(entry)) continue;
          scanDir(fullPath, results);
        } else if (/\.(md|json)$/.test(entry)) {
          const content = readFileSync(fullPath, "utf-8").split("\n");
          content.forEach((line, idx) => {
            for (const pattern of STALE_PATTERNS) {
              if (pattern.test(line)) {
                results.push({ file: fullPath, line: idx + 1, text: line.trim() });
              }
            }
          });
        }
      }
    }

    it("全仓库不应出现 '42 tools' / '42 个能力' 等过时表述", () => {
      const stale: { file: string; line: number; text: string }[] = [];
      // 扫描仓库根目录的关键位置
      scanDir(repoRoot, stale);
      // 过滤掉测试文件自身和 RELEASE-CHECKLIST
      const filtered = stale.filter(
        (s) => !s.file.includes("metadata-consistency.test.ts") && !s.file.includes("RELEASE-CHECKLIST"),
      );
      if (filtered.length > 0) {
        const msg = filtered.map((s) => `  ${s.file}:${s.line} → ${s.text}`).join("\n");
        fail(`发现 ${filtered.length} 处过时的 "42" MCP tools 表述：\n${msg}`);
      }
    });
  });
});
