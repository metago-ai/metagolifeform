/**
 * T2 - SKILLS × TOOLKIT_TOOLS 一致性测试
 *
 * 验证 7 个同名工具在两个数据源中的内容一致性：
 * - description 都有内容
 * - guide 都包含三段（触发条件/执行流程/输出格式）
 *
 * 这避免"一处改了另一处漏改"的隐性 bug。
 */

import { describe, it, expect } from "vitest";
import { SKILLS } from "../src/skills-data.js";
import { TOOLKIT_TOOLS } from "../src/toolkit-data.js";

const OVERLAP_TOOL_NAMES = [
  "metago_critique",
  "metago_objectivity",
  "metago_action_plan",
  "metago_whatif",
  "metago_problem_trace",
  "metago_decision_eval",
  "metago_emotion",
];

describe("T2 - SKILLS × TOOLKIT_TOOLS 一致性", () => {
  it("应有 7 个同名工具（TOOLKIT_TOOLS 与 SKILLS 重叠）", () => {
    const toolkitNames = new Set(TOOLKIT_TOOLS.map((t) => t.toolName));
    const skillNames = new Set(SKILLS.map((s) => s.toolName));
    const overlap = [...toolkitNames].filter((n) => skillNames.has(n));
    expect(overlap.sort()).toEqual([...OVERLAP_TOOL_NAMES].sort());
  });

  for (const name of OVERLAP_TOOL_NAMES) {
    describe(`同名工具 ${name}`, () => {
      const toolkitVersion = TOOLKIT_TOOLS.find((t) => t.toolName === name);
      const skillVersion = SKILLS.find((s) => s.toolName === name);

      it("应同时在两处都存在", () => {
        expect(toolkitVersion).toBeDefined();
        expect(skillVersion).toBeDefined();
      });

      it("两处 description 都应有内容（≥10 字符）", () => {
        expect(toolkitVersion!.description.length).toBeGreaterThanOrEqual(10);
        expect(skillVersion!.description.length).toBeGreaterThanOrEqual(10);
      });

      it("两处 guide 都应包含三段（触发条件/执行流程/输出格式）", () => {
        const requiredSections = ["触发条件", "执行流程", "输出格式"];
        for (const section of requiredSections) {
          expect(toolkitVersion!.guide, `TOOLKIT 版本缺 ${section}`).toContain(section);
          expect(skillVersion!.guide, `SKILL 版本缺 ${section}`).toContain(section);
        }
      });

      it("两处 description 应描述同一概念（核心关键词应一致）", () => {
        // SKILLS 简洁版 + TOOLKIT_TOOLS 详细版，长度差异合理
        // 但必须描述同一概念——核心关键词应同时出现在两处
        const skillDesc = skillVersion!.description;
        const toolkitDesc = toolkitVersion!.description;

        // 从 SKILLS description 中提取所有 2-4 字中文子串（滑窗）
        // 例如 "感知用户情绪状态" → "感知"、"知用"、"用户"、"户情"、"情绪"、"绪状"、"状态"...
        const skillSubs = new Set<string>();
        const chineseTexts = skillDesc.match(/[\u4e00-\u9fa5]+/g) || [];
        for (const text of chineseTexts) {
          for (let len = 2; len <= Math.min(4, text.length); len++) {
            for (let i = 0; i <= text.length - len; i++) {
              skillSubs.add(text.substr(i, len));
            }
          }
        }

        // 至少 1 个 2 字核心子串应在 TOOLKIT 版本中也出现
        const sharedSubs = [...skillSubs].filter((sub) => toolkitDesc.includes(sub));
        expect(
          sharedSubs.length,
          `两处 description 应共享核心关键词。SKILLS: "${skillDesc}", TOOLKIT: "${toolkitDesc.slice(0, 50)}..."`,
        ).toBeGreaterThan(0);
      });
    });
  }
});
