# TURN_PACING_SPEC.md (V1)

> 项目：Holdem Web  
> 范围：回合节奏升级（轮流出招 + 行动提示 + 计时器 + 超时处理）  
> 执行模式：Spec First（先 Spec、后实现、再验收）

## 1. 背景与问题定义

当前版本的出招节奏问题：

1. AI 出招为同步批处理：用户点击一次后，多个 AI 在同一帧/极短时间内连续执行。
2. 缺少“谁正在行动”的稳定提示。
3. 缺少行动倒计时与超时兜底策略。

根因（代码层）：

1. `src/stores/tableStore.ts` 使用 `runAiUntilHeroTurn()` 的 `while` 循环，持续 dispatch，直到回到 Hero 或本手结束。
2. Store 当前没有“回合调度器”与“行动时钟”状态。

## 2. 目标（本次迭代 DoD）

1. 出招节奏改为“逐人轮流”，不再瞬时跑完。
2. 每个回合都有明确行动提示（当前座位 + 文案）。
3. 引入行动倒计时（Hero 与 AI 均有时钟）。
4. 超时后自动执行合法兜底动作。
5. 不破坏现有规则真值（规则仍由 engine 裁决）。

## 3. 设计原则

1. Engine 继续保持“同步、纯规则、无 UI 时间概念”。
2. Store 负责“回合调度与时间控制”。
3. UI 只消费 Store 暴露状态，不直接写规则逻辑。
4. 所有定时行为可测试（Fake Timers 可验证）。

## 4. 作用域与非目标

本次范围：

1. 单桌本地局的人机节奏控制。
2. 行动提示与倒计时展示。
3. 超时自动动作与提示。

不在本次范围：

1. 强策略 AI（GTO、牌力模型）。
2. 联网同步与服务端裁决。
3. 复杂“思考动画系统”。

## 5. 核心方案

## 5.1 Store 新增“回合调度器”

目标：把“同步批量”改成“单步推进”。

新增概念：

1. `turnController`（store 内部）：
   1. 当前行动座位 `actorSeat`
   2. 当前回合起止时间 `turnStartedAt / turnDeadlineAt`
   3. 倒计时剩余 `remainingMs`
   4. 定时器句柄（tick、aiAction、nextHand）
   5. 防并发锁（避免重复调度）
2. `tableTempo`（store 暴露给 UI）：
   1. `actorSeat`
   2. `remainingMs`
   3. `totalMs`
   4. `isHeroTurn`
   5. `stage`（`idle | acting | resolving`）

执行流程（单步）：

1. 每次状态变更后只推进“下一位行动者”。
2. 若到 Hero：启动 Hero 回合计时，等待玩家点击或超时。
3. 若到 AI：启动 AI 回合计时，先等待 think delay，再提交一次动作。
4. 动作提交后重新进入下一步调度。

## 5.2 超时策略

统一兜底规则（Hero/AI 一致）：

1. 若合法动作包含 `CHECK`：超时自动 `CHECK`。
2. 否则若合法动作包含 `FOLD`：超时自动 `FOLD`。
3. 若无合法动作：不执行（仅记录错误日志，防御分支）。

提示策略：

1. 触发超时时写入动作提示：`超时自动过牌` 或 `超时自动弃牌`。
2. 仍沿用 `ACTION_APPLIED` 事件驱动筹码动画/文案。

## 5.3 行动提示与倒计时 UI

展示要求：

1. 当前行动座位显示“行动中”标签。
2. 当前行动座位显示倒计时秒数（整数秒）。
3. Hero 回合倒计时期间，操作按钮可用；非 Hero 回合禁用。
4. 现有发牌/筹码动画锁与回合锁并存，取“或”关系。

建议参数（可调）：

1. Hero 行动时限：`12s`
2. AI 行动时限：`6s`
3. AI 思考延迟：`0.7s ~ 1.4s`（随机）
4. 倒计时刷新粒度：`100ms`

## 6. 数据结构改造

## 6.1 `TableViewModel` 扩展

在 `src/game/mock/createMockTableState.ts` 的 `TableViewModel` 增加：

1. `tempo`:
   1. `actorSeat: number`
   2. `remainingMs: number`
   3. `totalMs: number`
   4. `isHeroTurn: boolean`
   5. `stage: 'idle' | 'acting' | 'resolving'`

说明：`tempo` 由 store 合并提供，规则层不依赖 tempo。

## 6.2 Store API 扩展（草案）

新增：

1. `bootstrapGame()`：统一开局入口（保留首交互解锁音频逻辑）。
2. `tempoState`（readonly）。
3. `startTurnForCurrentActor()`、`finalizeTurnByAction()`、`handleTurnTimeout()`（内部）。

替换：

1. 移除 `runAiUntilHeroTurn()` 的批量 while。
2. 改为调度器驱动单步推进。

## 7. 分阶段实施（Spec 模式）

## Phase G1 - 回合节奏拆分（不含倒计时 UI）

交付：

1. 删除 AI 批处理 while 机制。
2. 改为“每次只执行一个 AI 动作”的异步调度。
3. 行为提示保持可见（逐次触发）。

验收：

1. Hero 点击后，AI 动作逐个出现（有可见时间间隔）。
2. 不出现“一次点击瞬间完成整条街”。

## Phase G2 - 行动计时与超时兜底

交付：

1. Hero/AI 回合计时器接入。
2. 超时自动 `CHECK else FOLD`。
3. 超时提示文案接入。

验收：

1. Hero 不操作会自动过牌或弃牌。
2. AI 在计时窗口内完成动作，极端情况下也有超时兜底。

## Phase G3 - UI 提示完善与交互锁

交付：

1. 当前行动座位“行动中 + 倒计时”。
2. 按钮禁用策略与 tempo 对齐。
3. 与发牌/筹码动画锁兼容。

验收：

1. 用户能稳定识别当前行动者和剩余时间。
2. 不出现可点击但非法的按钮状态。

## Phase G4 - 测试与回归

交付：

1. store 调度器单测（Fake Timers）。
2. 超时路径测试（Hero/AI）。
3. 现有规则回归测试全通过。

验收：

1. `npm test` 全绿。
2. `npm run build` 通过。
3. 连续多手运行无定时器泄漏。

## 8. 测试矩阵（新增）

1. `G1-T1`：Hero 行动后仅推进 1 个 AI 动作（不是整轮）。
2. `G1-T2`：AI 动作间有最小间隔（>= 配置阈值）。
3. `G2-T1`：Hero 超时且可 check -> 自动 check。
4. `G2-T2`：Hero 超时不可 check -> 自动 fold。
5. `G2-T3`：AI 超时同样触发兜底动作。
6. `G3-T1`：当前行动座位提示与 `toActSeat` 一致。
7. `G3-T2`：倒计时归零时动作恰好结算一次（无重复 dispatch）。
8. `G4-T1`：现有 `holdemEngine` 规则测试全部通过。

## 9. 风险与防护

风险：

1. 定时器并发导致重复动作提交。
2. 回合切换时旧定时器未清理，污染下一手。
3. 动画锁与行动锁互相覆盖导致按钮状态错乱。

防护：

1. 每回合唯一 token（提交前校验 token）。
2. `HAND_STARTED` / 组件卸载时清理所有定时器。
3. action 可用性统一由 `tempo` + `dealFlights` + `chipFlights` 三条件计算（取“或”锁定）。

## 10. 本 Spec 的执行顺序

1. 先落地 Phase G1（只改节奏，不加倒计时 UI）。
2. Phase G1 验收通过后进入 G2。
3. G2 稳定后再做 G3 可视增强。
4. 每阶段完成后回填 `GAME_SPEC.md` 与 `日志.md`。

## 11. 执行进度（截至 2026-03-18）

1. [x] G1 已完成：AI 从同步批处理改为逐回合同步调度。
2. [x] G2 已完成：Hero/AI 计时器与超时自动动作已接入。
3. [x] G3 已完成：行动中提示、倒计时标识、按钮锁策略与动画锁统一。
4. [ ] G4 进行中：补齐节奏专项回归测试并确认无定时器泄漏。
