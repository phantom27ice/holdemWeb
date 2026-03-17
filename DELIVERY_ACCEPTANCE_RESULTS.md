# DELIVERY_ACCEPTANCE_RESULTS.md

> 验收时间：2026-03-18  
> 验收方式：自动化测试 + Playwright 手工关键路径验证

## 1. 自动化门禁结果

1. `npm test`：通过（17/17）。
2. `npm run test:regression`：通过（规则回归 + store 事件消费）。
3. `npm run build`：通过。

## 2. 验收矩阵执行结果

| ID | 结果 | 证据 |
|---|---|---|
| M-01 | Pass | Playwright reload 后读取：`pot=450`，SB/BB 标记存在，Hero 按钮为 `FOLD/CALL 100/RAISE 200` |
| M-02 | Pass | `holdemEngine.test.ts`：`keeps BB option when everyone limps to BB` |
| M-03 | Pass | `holdemEngine.test.ts`：`enforces preflop minimum raise boundary` |
| M-04 | Pass | `holdemEngine.test.ts`：`goes directly to payout when only one player remains` |
| M-05 | Pass | `holdemEngine.test.ts`：`settles a single-pot showdown and restores chips to player stacks` |
| M-06 | Pass | `holdemEngine.test.ts`：`does not reopen raise after a single short all-in` |
| M-07 | Pass | `holdemEngine.test.ts`：`reopens raise after accumulated short all-ins reach a full raise` |
| M-08 | Pass | `holdemEngine.test.ts` + `regressionMatrix.test.ts`（边池分层与结算顺序） |
| M-09 | Pass | `regressionMatrix.test.ts`：`awards odd chip to first winner left of button` |
| M-10 | Pass | `holdemEngine.test.ts`：`builds side pots and settles them in showdown`（含 uncalled return） |
| M-11 | Pass | Playwright 回合推进检测：公共牌计数出现 `5 -> 0`，确认自动开新手 |
| M-12 | Pass | Playwright 检测：`toast` 出现且自动消失、`action-badge` 出现、`.chip-flight` 数量 `2 -> 0` |

## 3. 本轮结论

1. 验收矩阵 12 项全部通过。
2. 未发现阻塞交付的问题。
3. 仍建议在真实设备（手机/高分屏）做一轮视觉节奏复核。

