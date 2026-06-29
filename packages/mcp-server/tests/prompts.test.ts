/**
 * T5 - prompts 列表校验
 *
 * 验证 8 个引导词的完整性：
 * 1. 每个都有 name, description, messages
 * 2. messages 不为空，每条消息都有 role 和 content.text
 * 3. 带参数的 prompt：每个参数在 messages 中都有对应的 {{参数名}} 占位符
 * 4. 参数命名规范（小写下划线）
 * 5. 所有 prompt name 唯一
 */

import { describe, it, expect } from "vitest";
import { PROMPTS, type PromptMeta } from "../src/prompts.js";

describe("T5 - prompts 列表校验", () => {
  it("PROMPTS 应有 8 项", () => {
    expect(PROMPTS.length).toBe(8);
  });

  it("所有 prompt name 应唯一", () => {
    const names = PROMPTS.map((p) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  for (const prompt of PROMPTS) {
    describe(`prompt: ${prompt.name}`, () => {
      it("应有非空 description（≥10 字符）", () => {
        expect(prompt.description.length).toBeGreaterThanOrEqual(10);
      });

      it("应有 messages 数组且非空", () => {
        expect(Array.isArray(prompt.messages)).toBe(true);
        expect(prompt.messages.length).toBeGreaterThan(0);
      });

      it("每条 message 应有 role 和 content.text", () => {
        for (const msg of prompt.messages) {
          expect(msg.role).toMatch(/^(user|assistant)$/);
          expect(msg.content.type).toBe("text");
          expect(msg.content.text.length).toBeGreaterThan(0);
        }
      });

      it("role 应交替（user → assistant 或单条 user）", () => {
        if (prompt.messages.length > 1) {
          for (let i = 1; i < prompt.messages.length; i++) {
            const prev = prompt.messages[i - 1].role;
            const curr = prompt.messages[i].role;
            expect(curr).not.toBe(prev);
          }
        }
      });

      if (prompt.arguments && prompt.arguments.length > 0) {
        it("每个参数都应在 messages 中有对应的 {{参数名}} 占位符", () => {
          const fullText = prompt.messages
            .map((m) => m.content.text)
            .join("\n");
          for (const arg of prompt.arguments!) {
            expect(
              fullText.includes(`{{${arg.name}}}`),
              `参数 ${arg.name} 在 messages 中未使用 {{${arg.name}}} 占位符`,
            ).toBe(true);
          }
        });

        it("参数命名应符合小写下划线规范", () => {
          for (const arg of prompt.arguments!) {
            expect(arg.name).toMatch(/^[a-z][a-z0-9_]*$/);
          }
        });

        it("参数 description 不应为空", () => {
          for (const arg of prompt.arguments!) {
            expect(arg.description.length).toBeGreaterThan(3);
          }
        });
      }
    });
  }
});
