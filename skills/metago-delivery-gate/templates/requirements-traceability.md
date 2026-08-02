# 需求追踪矩阵（requirements-traceability）· {项目名称}

> **本文件是 UDGK 资产 ①——RTM 模板。**
> 作用：把自然语言需求逐条翻译成「要求→代码→断言→证据」映射表。任何任务填表即用。
> 位置：`docs/rtm.md`（由 `init-delivery.cjs` 自动生成空表）

## 铁律
- **一条需求缺失 = 禁止往下**（写实现前必须逐字读需求文档填满本表）
- 四列任一为空 = 该行 FAIL（门禁脚本机器判定）
- 每行「验收证据」必须填实际产物路径（截图/日志/HTTP状态码）

## 使用步骤
1. 逐字读需求文档（`docs/requirements.md`），把每条需求拆成一行
2. 填「要求」（做什么）+「代码位置」（在哪实现）+「断言测试」（哪个断言文件验证）+「验收证据」（截图/日志路径）
3. 交付前运行 `node verify-delivery.cjs`，RTM 检查自动校验：表头四列齐备、无空要求、无空证据

## 需求追踪矩阵

| 编号 | 要求 | 代码位置 | 断言测试 | 验收证据 |
|------|------|----------|----------|----------|
| R1 | （示例）工具调用卡片内联展示 | src/components/ToolCallItem.tsx | e2e/asserts/tool-call.spec.ts | .visual-baseline/baseline/tool-call.png |
| R2 | （示例）思考流可折叠块 | src/components/ThinkingBlock.tsx | e2e/asserts/thinking-block.spec.ts | .visual-baseline/baseline/thinking-block.png |
| R3 | （示例）AI 头像 + 名称可见 | src/components/AIAvatar.tsx | e2e/asserts/ai-avatar.spec.ts | .visual-baseline/baseline/ai-avatar.png |
| R4 | （示例）事件流逐块追加 | src/store/eventStore.ts | e2e/asserts/event-stream.spec.ts | .visual-baseline/baseline/event-stream.png |

## 填写规范
- 「要求」必须可判定（有/无、是/否），禁止模糊表述（如"尽量好看"）
- 「代码位置」填相对项目根的文件路径
- 「断言测试」填 `e2e/asserts/` 下的 `.spec.ts` 文件
- 「验收证据」填实际产物路径，完成一条填一条，才算闭环