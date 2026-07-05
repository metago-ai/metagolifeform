/**
 * T1 - 工具注册去重测试
 *
 * 验证内容：
 * 1. SKILLS（37 个）+ TOOLKIT_TOOLS（22 个）合并去重后总数 = 52
 * 2. 7 个同名工具（metago_critique / metago_objectivity / metago_action_plan /
 *    metago_whatif / metago_problem_trace / metago_decision_eval / metago_emotion）
 *    在合并后只保留 TOOLKIT_TOOLS 版本（结构化参数优先）
 * 3. 所有 toolName 唯一
 * 4. 重复 index.ts 中的去重逻辑，确保运行时行为与预期一致
 *
 * 历史背景：v1.1.3 因未去重导致 MCP SDK 抛出
 *   "Tool metago_action_plan is already registered" 异常，进程启动即崩溃。
 */

import { describe, it, expect } from "vitest";
import { SKILLS } from "../src/skills-data.js";
import { TOOLKIT_TOOLS } from "../src/toolkit-data.js";

describe("T1 - 工具注册去重", () => {
  // 复刻 index.ts 中的去重逻辑
  const registeredToolNames = new Set<string>();
  const registeredTools: { toolName: string; source: "toolkit" | "skill" }[] = [];

  for (const tool of TOOLKIT_TOOLS) {
    if (registeredToolNames.has(tool.toolName)) continue;
    registeredToolNames.add(tool.toolName);
    registeredTools.push({ toolName: tool.toolName, source: "toolkit" });
  }
  for (const skill of SKILLS) {
    if (registeredToolNames.has(skill.toolName)) continue;
    registeredToolNames.add(skill.toolName);
    registeredTools.push({ toolName: skill.toolName, source: "skill" });
  }

  it("SKILLS 数组长度应为 37", () => {
    expect(SKILLS.length).toBe(37);
  });

  it("TOOLKIT_TOOLS 数组长度应为 22", () => {
    expect(TOOLKIT_TOOLS.length).toBe(22);
  });

  it("合并去重后总工具数应为 52（22 toolkit + 30 独有 skill）", () => {
    expect(registeredTools.length).toBe(52);
  });

  it("所有 toolName 必须唯一（无重复）", () => {
    const names = registeredTools.map((t) => t.toolName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("7 个同名工具应优先使用 TOOLKIT_TOOLS 版本（结构化参数）", () => {
    const overlapNames = [
      "metago_critique",
      "metago_objectivity",
      "metago_action_plan",
      "metago_whatif",
      "metago_problem_trace",
      "metago_decision_eval",
      "metago_emotion",
    ];

    for (const name of overlapNames) {
      const tool = registeredTools.find((t) => t.toolName === name);
      expect(tool, `工具 ${name} 必须存在`).toBeDefined();
      expect(tool!.source, `工具 ${name} 必须来自 TOOLKIT_TOOLS（结构化参数优先）`).toBe("toolkit");
    }
  });

  it("不应出现 'Tool X is already registered' 异常条件（去重逻辑有效）", () => {
    // 去重逻辑生效 = Set 中每个 toolName 只出现一次
    // 这正是 MCP SDK 抛 "already registered" 异常的根因条件
    const toolkitNames = TOOLKIT_TOOLS.map((t) => t.toolName);
    const toolkitUnique = new Set(toolkitNames);
    expect(toolkitUnique.size).toBe(toolkitNames.length);

    const skillNames = SKILLS.map((s) => s.toolName);
    const skillUnique = new Set(skillNames);
    expect(skillUnique.size).toBe(skillNames.length);
  });

  it("所有 toolName 应符合 metago_xxx 命名规范（下划线分隔小写）", () => {
    for (const tool of registeredTools) {
      expect(tool.toolName).toMatch(/^metago_[a-z0-9_]+$/);
    }
  });

  it("所有 toolkit 工具必须包含 args 字段（结构化参数）", () => {
    for (const tool of TOOLKIT_TOOLS) {
      expect(tool.args, `工具 ${tool.toolName} 必须有 args 定义`).toBeDefined();
      expect(Object.keys(tool.args!).length, `工具 ${tool.toolName} 至少 1 个参数`).toBeGreaterThan(0);
    }
  });
});
