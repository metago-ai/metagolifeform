# UDGK 方法论（Universal Delivery Gate Kit · V3.0.0）

> 本文件是「第零节 UDGK 通用交付门禁」的完整方法论说明；脚本实现见 `scripts/udgk/`（零依赖、配置驱动，直接复制即用）。

## 1. 要解决的问题
AI 交付的核心失效模式是"宣告完成但未验证"。UDGK 把"完成"从主观断言变成机器可判定的四重硬门。

## 2. 六步流水线（强制按序）
1. `node scripts/udgk/init-delivery.cjs` —— 生成 RTM 空表 + delivery.config.json + 目录骨架
2. 逐字读需求 → 填满 RTM（一条需求缺失 = 禁止往下）
3. 实现 → 每条需求写形态断言（复制 `templates/form-assertions.spec.ts` 到 `e2e/asserts/`）
4. 截图基线 → 视觉 diff（`visual-regression.cjs --snapshot/--baseline`）
5. `node scripts/udgk/verify-delivery.cjs` —— 四重门禁 → 出报告
6. 报告全绿 + 证据截图 → 才允许宣告完成（任一 FAIL → 回到 2/3/4）

## 3. 四重门禁（一票否决制）
| 门禁 | 判定 | 反失效点 |
|------|------|---------|
| RTM 完整性 | 四列齐备、无空要求、无空证据 | 需求漏做、假覆盖 |
| 形态断言 | e2e/asserts/ 全通过 | "编译通过≠形态达标"（仅改样式参数不算形态） |
| 视觉 diff | 像素差 ≤ 阈值（默认 2%） | 界面没变却说变了 |
| 报告生成 | delivery-report.md 全绿 | 无证据链的口头完成 |

## 4. 配置驱动
所有脚本读 `delivery.config.json`（需求文档位置 / RTM 路径 / 断言目录 / 截图目录 / diff 阈值 / strict）。换项目只改配置不改代码。

## 5. 附加门禁：L9 对抗式审查（A38）
凡测试/检查/审计/验证类交付，报告必须含"对抗式审查结论"小节（角色切换 → 威胁建模 → 致命缺陷挖掘 → 修复闭环）。缺失 = 门禁 FAIL。

## 6. 反绕过
禁止"应该没问题"、跳门、以编译代验证、虚假勾选、隐瞒不报。每项 ✅ 必须附执行证据（命令输出 / HTTP 状态码 / 截图 / 断言结果）。

## 7. 与其他套件的关系
- AGENTS.md 第零节：UDGK 的法源（强制力来源）
- `skills/metago-delivery-gate`：智能体执行入口
- completeness-kit / metago-veracity-kit：宣称层的完整性与诚实性对账（与 UDGK 交付层互补）
