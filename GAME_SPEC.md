# GAME_SPEC.md (V2)

> 项目：Holdem Web  
> 目标：交付一个可玩的单桌德州扑克网页游戏（No-Limit Texas Hold'em, 6-max）。  
> 规则权威：`TEXAS_HOLDEM_RULEBOOK.md`。

## 0. Spec 模式执行原则

1. 先改 spec，再写代码，再跑测试，再回填 spec 与日志。
2. 每次只做当前阶段范围内的内容，不跨阶段“顺手实现”。
3. 规则争议统一回到 `TEXAS_HOLDEM_RULEBOOK.md`，不得在 UI 层自定义规则。
4. 每阶段必须有可验收标准（可通过测试或明确演示验证）。

## 1. 最终交付定义（Definition of Done）

1. 可在单桌 6 人局完整进行多手牌：
   1. 发牌
   2. Preflop/Flop/Turn/River 下注
   3. 摊牌/弃牌结算
   4. 自动开新手
2. 核心规则完整：
   1. 最小加注
   2. Reopen 规则
   3. All-in 与边池
   4. 奇数筹码
   5. 平局分池
3. UI 完整可玩：
   1. 当前行动提示
   2. 合法动作按钮
   3. 发牌/翻牌/下注/派奖动画
4. 质量门槛：
   1. 关键规则单测通过
   2. 集成流程测试通过
   3. `npm run build` 通过

## 2. 当前进度盘点（截至 2026-03-18 Phase E 完成）

## 2.1 已完成

1. 规则手册已建立：`TEXAS_HOLDEM_RULEBOOK.md`。
2. 资源说明已建立：`resourc.md`。
3. UI 基础牌桌可展示（单桌、6 座位、公共牌、Hero 手牌、操作区）。
4. Engine 已具备 M1 主干：
   1. `START_HAND -> POST_FORCED_BETS -> DEAL_HOLE_CARDS -> BETTING_PRE_FLOP`
   2. Preflop 结束后自动进 Flop
5. Hero 操作已接真实 `dispatch`。
6. 简单 AI 已接入（检查/跟注优先）。
7. M1 关键测试已建立并通过（13 条）。
8. `dispatch` 前后已接入统一不变量检查。
9. 非法动作已改为显式错误返回（含错误码）。
10. 已实现 `evaluate7` + `compareRank`，覆盖 10 类牌型识别。
11. 已打通无边池 showdown 结算（含平局分池与 odd chip）。
12. 已实现边池分层构建与逆序结算。
13. 已实现 short all-in reopen 累计规则。
14. 已实现未跟注金额返还（uncalled bet return）。
15. 已接入牌局结束后自动开新手（store 层）。
16. 已通过连续 50 手稳定性测试（无状态崩坏）。

## 2.2 部分完成（需收敛）

1. 已完成行为回显（seat action 气泡）、全局 toast 与引擎错误提示。
2. 已完成基于事件的轻量动画触发（Pot/Board）和筹码飞行动画层（下注入池/派奖）。
3. 已完成 UI 事件消费队列化（consumeEvents），避免 event 积压。
4. 已新增回归矩阵测试入口（`npm run test:regression`），覆盖引擎规则与 store 事件消费。
5. 已新增交付文档骨架：`DELIVERY_ACCEPTANCE_MATRIX.md`、`IMPLEMENTATION_NOTES.md`。
6. 已完成第一轮交付验收执行与结果沉淀：`DELIVERY_ACCEPTANCE_RESULTS.md`（12/12 Pass）。
7. 已完成构建与资源体积盘点：`PERFORMANCE_CHECK.md`。
8. 已完成多设备视觉复核与遮挡修复（移动端/平板/桌面通过）。

## 2.3 后续优化（非阻塞）

1. 动画节奏与视觉一致性进一步打磨（非功能性优化）。
2. 背景大图压缩与分辨率分档加载（性能优化）。

## 3. 重新规划后的实施阶段

## Phase A - M1 收口（规则骨架稳定）

目标：把“能跑”升级为“可验证稳定”。

交付：

1. `dispatch` 后统一不变量检查（无负筹码、toActSeat 合法、streetCommit 合法）。
2. 非法动作显式返回错误类型（而不是静默忽略）。
3. BB option、最小加注、Preflop->Flop、弃牌直胜测试稳定。

验收：

1. `npm test` 全绿。
2. M1 checklist 全勾选。

## Phase B - M2 核心（摊牌与结算）

目标：实现“谁赢”与“钱怎么分”。

交付：

1. `evaluate7` + `compareRank`（10 类牌型，含 A2345）。
2. 摊牌触发与赢家计算。
3. 无边池场景的结算。
4. 平局分池与 odd chip 规则。

验收：

1. 牌型测试覆盖 10 类 + 关键平局。
2. 单池 showdown 场景通过。

## Phase C - M3 核心（All-in、边池、reopen 完整化）

目标：补齐德州最易返工规则。

交付：

1. 边池分层构建与逆序结算。
2. short all-in 不重开 / 多次累计可重开。
3. 未跟注金额返还。

验收：

1. 2 层/3 层边池测试通过。
2. reopen 边界测试通过。

## Phase D - M4 牌局循环（可连续玩）

目标：从“单手演示”变成“可持续游戏”。

交付：

1. 一手结束后自动进入下一手。
2. 庄位轮转、盲注轮转、筹码延续。
3. 玩家破产/不可继续状态处理。

验收：

1. 连续运行 50 手无状态崩坏。

## Phase E - UI 联调与体验完善

目标：把规则真值准确映射到可玩 UI。

交付：

1. 按钮文案实时匹配合法动作（CHECK/CALL/RAISE）。
2. 行为反馈（Fold/Call/Raise/All-in）。
3. 发牌、翻牌、下注、派奖动画闭环。

验收：

1. UI 与 engine 状态一致，无“按钮可点但动作非法”情况。

## Phase F - 交付前稳定化

目标：进入可交付状态。

交付：

1. 回归测试矩阵（规则 + UI 关键路径）。
2. 性能检查（无明显卡顿、内存泄漏）。
3. 文档回填（规则实现差异、已知限制、后续扩展位）。

验收：

1. `npm test`、`npm run build` 通过。
2. 手工验收流程通过（至少 10 个完整场景）。

## 4. 立即执行计划（接下来两轮）

## Sprint 1（已完成）

1. 完成 Phase A：不变量检查 + 非法动作错误返回。
2. 补齐 M1 剩余测试。

## Sprint 2（已完成）

1. 进入 Phase B：实现 `evaluate7/compareRank`。
2. 打通无边池 showdown 结算。

## Sprint 3（已完成）

1. 进入 Phase C：实现边池分层构建与逆序结算。
2. 完成 short all-in reopen 累计规则与回归测试。
3. 实现未跟注金额返还（uncalled bet return）。

## Sprint 4（已完成）

1. 进入 Phase D：一手结束后自动开新手。
2. 完成庄位/盲注轮转与筹码延续验证。
3. 加入“连续 50 手稳定性”自动化测试。

## Sprint 5（已完成）

1. 进入 Phase E：补齐行为回显（Fold/Call/Raise/All-in）。
2. 接入 `lastEngineError` UI 提示。
3. 开始发牌/翻牌/下注/派奖动画事件联动。
4. 修复 `structuredClone` + Vue Proxy 冲突（`handState` 改为 `shallowRef`）。
5. 建立并跑通 `test:regression` 回归矩阵。

## Sprint 6（已完成）

1. 已完成：交付前手工验收矩阵（12 场景）文档化。
2. 已完成：“规则实现差异 / 已知限制 / 扩展位”文档化。
3. 已完成：首轮交付验收执行与结果记录（12/12 Pass）。
4. 已完成：首轮性能盘点与优化建议沉淀。
5. 已完成：多设备视觉复核与 UI 遮挡修复。

## Sprint 7（已完成，Phase G）

1. 已完成：G1（AI 逐回合异步调度，移除同步 while 批处理）。
2. 已完成：G2（行动计时器 + 超时自动动作 + 超时提示）。
3. 已完成：G3（当前行动提示、倒计时标识、按钮锁与动画锁统一）。
4. 已完成：G4（补齐节奏专项回归测试并封版）。

## 5. 里程碑看板

1. [x] Phase A 完成
2. [x] Phase B 完成
3. [x] Phase C 完成
4. [x] Phase D 完成
5. [x] Phase E 完成
6. [x] Phase F 完成
7. [x] Phase G 完成（G1/G2/G3/G4 全部完成），详见 `TURN_PACING_SPEC.md`

## 6. 当前不做（防止工作失焦）

1. 联网对战与后端对接。
2. 锦标赛盲注级别系统。
3. 保险、RIT、straddle 自定义房规。
4. 复杂 AI 策略（GTO/概率决策）。

## 7. 新增阶段（Phase G）

目标：把“规则正确但节奏过快”的回合流程升级为“可读、可交互、可超时兜底”的真实对局节奏。

范围：

1. AI 不再同步瞬时批处理，改为逐回合执行。
2. 增加当前行动提示与行动倒计时。
3. 加入超时自动动作（`CHECK else FOLD`）。

执行规范：

1. 严格按 `TURN_PACING_SPEC.md` 的 G1 -> G2 -> G3 -> G4 实施。
2. 每阶段完成后必须补测试与日志，避免“节奏修完规则回归”。
