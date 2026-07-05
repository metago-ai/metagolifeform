/**
 * T6 - guide 文本质量扫描
 *
 * 硬性检查（fail 测试）：
 * - guide 长度 ≥ 100 字符（基础内容底线）
 * - description 长度 ≥ 15 字符
 * - guide 含三段："触发条件"、"执行流程"、"输出格式"
 * - guide 不含 TODO/FIXME/XXX 待办标记
 * - guide 不含 [占位符] 形式的未填充内容
 *
 * 软性提示（console.warn，不 fail）：
 * - guide 长度 ≥ 200 字符（目标值，作为持续优化方向）
 * - description 长度 ≥ 20 字符（目标值）
 *
 * 历史：曾因 guide 过短导致用户感知能力薄弱。
 */

import { describe, it, expect } from "vitest";
import { SKILLS } from "../src/skills-data.js";
import { TOOLKIT_TOOLS } from "../src/toolkit-data.js";

const ALL_TOOLS = [
  ...TOOLKIT_TOOLS.map((t) => ({
    toolName: t.toolName,
    description: t.description,
    guide: t.guide,
    source: "toolkit" as const,
  })),
  ...SKILLS.map((s) => ({
    toolName: s.toolName,
    description: s.description,
    guide: s.guide,
    source: "skill" as const,
  })),
];

// 去重（同名工具只测一次，优先 toolkit 版本）
const UNIQUE_TOOLS = ALL_TOOLS.filter(
  (tool, idx, arr) => arr.findIndex((t) => t.toolName === tool.toolName) === idx,
);

describe("T6 - guide 文本质量扫描", () => {
  it("去重后总工具数应为 52", () => {
    expect(UNIQUE_TOOLS.length).toBe(52);
  });

  for (const tool of UNIQUE_TOOLS) {
    describe(`${tool.toolName} (${tool.source})`, () => {
      // ========== 硬性检查（必须通过） ==========
      it("guide 长度应 ≥ 100 字符（基础内容底线）", () => {
        expect(
          tool.guide.length,
          `guide 长度仅 ${tool.guide.length} 字符，低于 100 字符底线`,
        ).toBeGreaterThanOrEqual(100);
      });

      it("guide 应包含 '触发条件' 段", () => {
        expect(tool.guide).toContain("触发条件");
      });

      it("guide 应包含 '执行流程' 段", () => {
        expect(tool.guide).toContain("执行流程");
      });

      it("guide 应包含 '输出格式' 段", () => {
        expect(tool.guide).toContain("输出格式");
      });

      it("description 长度应 ≥ 15 字符", () => {
        expect(
          tool.description.length,
          `description 长度仅 ${tool.description.length} 字符`,
        ).toBeGreaterThanOrEqual(15);
      });

      it("guide 不应包含 TODO / FIXME / XXX 待办标记", () => {
        expect(tool.guide).not.toMatch(/\b(TODO|FIXME|XXX)\b/);
      });

      it("guide 不应包含 [占位符] 形式的未填充内容", () => {
        expect(tool.guide).not.toMatch(/\[[^\]]{2,30}\]/);
      });

      // ========== 软性提示（不 fail，仅 warn） ==========
      if (tool.guide.length < 200) {
        it.todo(`guide 长度目标值 ≥ 200 字符（当前 ${tool.guide.length}）`);
      }
      if (tool.description.length < 20) {
        it.todo(`description 长度目标值 ≥ 20 字符（当前 ${tool.description.length}）`);
      }
    });
  }
});
