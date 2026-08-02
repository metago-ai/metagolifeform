/**
 * UDGK 资产 ② —— 形态断言模板（form-assertions.spec.ts）
 * ---------------------------------------------------------------------------
 * 作用：把「长什么样」翻译成 DOM 断言。任何 UI 套用。
 * 定位：P0 阻断项 —— 断言不过 = 形态未达标 = 禁止宣告完成。
 *
 * 用法：
 *   1. 复制本文件到项目 e2e/asserts/<feature>.spec.ts
 *   2. 按实际页面结构调整 selectors 与断言内容
 *   3. 用 Playwright/Vitest 运行（本套件默认通过 verify-delivery.cjs 批量执行）
 *
 * 注意：本模板可在测试中写性能断言（如"不可在表单里写卡顿"），
 *       即断言 UI 流畅度（无长任务 / 无未处理异常）。
 *
 * @author MetaGO / UDGK
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// 工具函数：断言「长什么样」→ DOM 存在性 + 可交互性
// ---------------------------------------------------------------------------
test.describe('形态断言（form assertions）· {功能名}', () => {
  test.beforeEach(async ({ page }) => {
    // 打开目标页面
    await page.goto('/', { waitUntil: 'networkidle0' });
    // 收集控制台错误：控制台零 error 是形态达标的一部分
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        throw new Error(`控制台错误: ${msg.text()}`);
      }
    });
  });

  // 【示例 1】工具调用卡片必须内联展示（禁止仅右侧面板显示）
  test('工具调用卡片内联展示', async ({ page }) => {
    const card = page.locator('.tool-call-card, [data-testid="tool-call"]').first();
    await expect(card).toBeVisible();
    // 卡内必须包含工具名与调用状态
    await expect(card.locator('.tool-name')).toBeVisible();
    await expect(card.locator('[data-status]')).toBeVisible();
  });

  // 【示例 2】思考流块必须存在且可折叠
  test('思考流可折叠块', async ({ page }) => {
    const block = page.locator('.thinking-block, [data-testid="thinking"]').first();
    await expect(block).toBeVisible();
    const toggle = block.locator('[role="button"], .toggle');
    await toggle.click();
    await expect(block).toHaveClass(/collapsed|hidden/i);
  });

  // 【示例 3】AI 头像 + 名称必须可见
  test('AI 头像与名称', async ({ page }) => {
    const avatar = page.locator('.ai-avatar, [data-testid="ai-avatar"]').first();
    await expect(avatar).toBeVisible();
    const name = page.locator('.ai-name, [data-testid="ai-name"]').first();
    await expect(name).toBeVisible();
    await expect(name).not.toBeEmpty();
  });

  // 【示例 4】事件流必须逐块追加（不可一次性全量渲染）
  test('事件流逐块追加', async ({ page }) => {
    const stream = page.locator('[data-testid="event-stream"]');
    const before = await stream.locator('.event-item').count();
    // 触发一次新事件
    await page.locator('[data-testid="send"]').click();
    await expect
      .poll(async () => stream.locator('.event-item').count())
      .toBeGreaterThan(before);
  });

  // 【示例 5】性能断言：表单输入不可卡顿（无长任务）
  test('表单交互流畅（无卡顿）', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    const t0 = Date.now();
    for (let i = 0; i < 50; i++) {
      await input.pressSequentially('a');
    }
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(3000); // 50 次输入 3s 内完成 = 不卡顿
  });
});

// ---------------------------------------------------------------------------
// 纯静态断言模式（无需浏览器，供 verify-delivery.cjs 无头运行）
// 若断言目录被 verify-delivery.cjs 以纯 Node 运行，可单独导出以下函数
// ---------------------------------------------------------------------------
export function assertStaticMarkup(html: string): void {
  // 这些断言只检查「产物里有没有这些形态」，作为最低门槛
  expect(html).toContain('tool-call');
  expect(html).toContain('thinking-block');
  expect(html).toContain('ai-avatar');
}
