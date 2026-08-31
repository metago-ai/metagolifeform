# 交付验证报告（UDGK · verify-delivery 输出结构模板）

> 与 scripts/udgk/verify-delivery.cjs 生成的 docs/delivery-report.md 同构。全绿才允许宣告完成。

## 四重门禁结果

| 门禁 | 检查 | 结果 | 证据 |
|------|------|------|------|
| 1 RTM 完整性 | 表头四列齐备 / 无空要求 / 无空证据 | ✅/❌ | docs/rtm.md |
| 2 形态断言 | e2e/asserts/ 全部通过 | ✅/❌ | 断言运行输出 |
| 3 视觉 diff | current/ vs baseline/ ≤ 阈值(默认2%) | ✅/❌ | .visual-baseline/ diff 报告 |
| 4 报告生成 | 本报告全绿、证据链完整 | ✅/❌ | 本文件 |

## 运行时验证（七层 L1-L7 + L8 缺陷猎杀 + L9 对抗式审查）
（按 AGENTS.md §14.2 格式逐项附证据；任一 FAIL → 回到实现修复 → 重跑）

## 结论
- [ ] 四重门禁全绿
- [ ] L1-L9 附证据
- [ ] 已知风险已明示（如有）
