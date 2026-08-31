// UDGK 门禁 2 · 形态断言模板（复制到项目 e2e/asserts/ 后按实际形态填写）
// 「长什么样」翻译成 DOM 断言：结构存在性 + 组件形态 + 内容锚点。样式参数（圆角/字号）不构成形态。
import { test, expect } from '@playwright/test';

test.describe('形态断言 · <页面/组件名>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('<目标 URL 或本地路由>');
  });

  test('关键结构存在', async ({ page }) => {
    // 例：页面有标题、主容器、导航
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
  });

  test('组件形态独立成立', async ({ page }) => {
    // 例：工具调用卡片必须是独立组件形态，而非纯文本
    await expect(page.locator('[data-component="tool-call-card"]')).toBeVisible();
    // 例：思考流必须是可折叠块
    const thinking = page.locator('[data-component="thinking-block"]');
    await expect(thinking).toBeVisible();
    await thinking.locator('summary, [role="button"]').click();
    await expect(thinking.locator('[data-role="content"]')).toBeHidden();
  });

  test('内容锚点正确', async ({ page }) => {
    // 例：状态指示与实际状态一致
    await expect(page.locator('[data-status]')).toHaveCount(1);
  });
});
