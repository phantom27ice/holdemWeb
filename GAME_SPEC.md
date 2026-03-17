# GAME_SPEC.md

> 项目：Holdem Web  
> 范围：No-Limit Texas Hold'em（6-max 优先）  
> 目标：定义可直接编码的游戏规则引擎规格，避免返工。

## 1. 产品范围

1. `V1 必做`
   1. 6-max 现金桌。
   2. No-Limit 德州扑克完整一手牌流程。
   3. 单桌本地逻辑（无联网）可跑通。
   4. 完整结算：弃牌胜、摊牌胜、平分池、边池。
2. `V1 不做`
   1. 锦标赛盲注升级。
   2. 保险、RIT（Run It Twice）、Straddle（可预留参数但默认关闭）。
   3. 多桌/匹配/账户系统。
3. 规则来源
   1. 实现以 [TEXAS_HOLDEM_RULEBOOK.md](/Users/kangzhenbin/Desktop/holdemWeb/TEXAS_HOLDEM_RULEBOOK.md) 为唯一执行标准。
   2. 与外部规则冲突时，以本项目手册优先。

## 2. 系统分层

1. `Engine（纯 TypeScript）`
   1. 不依赖 Vue / DOM。
   2. 输入：当前状态 + 动作。
   3. 输出：新状态 + 事件日志 + 合法动作。
2. `Store（Pinia）`
   1. 管理当前牌局状态快照。
   2. 调用 Engine 的 `dispatch(action)`。
   3. 给 UI 提供只读派生状态。
3. `UI（Vue）`
   1. 只消费状态和事件，不做规则判定。
   2. 负责动画、交互和资源渲染。

## 3. 核心数据模型

```ts
export type Suit = 'Spade' | 'Heart' | 'Diamond' | 'Club';
export type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14;
export type Street = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export interface Card { suit: Suit; rank: Rank }

export interface PlayerState {
  seat: number;
  id: string;
  name: string;
  stack: number;
  holeCards: Card[];
  inHand: boolean;
  hasFolded: boolean;
  isAllIn: boolean;
  streetCommit: number;
  handCommit: number;
  actedThisStreet: boolean;
}

export interface Pot {
  id: string;
  amount: number;
  eligibleSeats: number[];
  level: number;
}

export interface HandState {
  handId: number;
  dealerSeat: number;
  sbSeat: number;
  bbSeat: number;
  toActSeat: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  street: Street;
  board: Card[];
  burn: Card[];
  deck: Card[];
  currentBet: number;
  lastFullRaiseSize: number;
  players: PlayerState[];
  pots: Pot[];
  uncalledReturn: number;
  winnerSeatIds: number[];
}
```

## 4. 动作协议

```ts
export type Action =
  | { type: 'START_HAND' }
  | { type: 'POST_FORCED_BETS' }
  | { type: 'CHECK'; seat: number }
  | { type: 'FOLD'; seat: number }
  | { type: 'CALL'; seat: number }
  | { type: 'BET'; seat: number; amountTo: number }
  | { type: 'RAISE'; seat: number; amountTo: number }
  | { type: 'ALL_IN'; seat: number }
  | { type: 'ADVANCE_STREET' }
  | { type: 'SHOWDOWN' }
  | { type: 'PAYOUT' };
```

约束：

1. 所有动作必须由 `getLegalActions(state, seat)` 产生后才允许提交。
2. Engine 必须校验提交动作合法性，非法动作直接拒绝并返回错误。

## 5. 一手牌状态机

1. `WAITING_FOR_PLAYERS`
2. `POST_FORCED_BETS`
3. `DEAL_HOLE_CARDS`
4. `BETTING_PRE_FLOP`
5. `DEAL_FLOP`
6. `BETTING_FLOP`
7. `DEAL_TURN`
8. `BETTING_TURN`
9. `DEAL_RIVER`
10. `BETTING_RIVER`
11. `SHOWDOWN`
12. `PAYOUT`
13. `HAND_FINISHED`

状态推进条件：

1. 任意时刻仅剩 1 名 `!hasFolded && inHand` 玩家，直接 `PAYOUT`。
2. 若所有未弃牌玩家都 `isAllIn=true`，自动发完剩余公共牌并 `SHOWDOWN`。
3. 下注轮结束条件遵循规则手册 5.5。

## 6. 合法动作计算规则

输入：`state`, `seat`。输出：动作集合与金额边界。

1. 公共前提
   1. 只能轮到 `toActSeat` 行动。
   2. 若玩家 `hasFolded || isAllIn || !inHand`，无动作。
2. `toCall = max(0, currentBet - player.streetCommit)`。
3. `check`
   1. 仅当 `toCall === 0`。
4. `call`
   1. 当 `toCall > 0`。
   2. 实际补齐额为 `min(toCall, player.stack)`。
5. `bet`
   1. 仅当当前街无人领先下注（`currentBet === 0`，postflop）。
   2. 最小 `amountTo = bigBlind`。
   3. 最大 `amountTo = player.streetCommit + player.stack`。
6. `raise`
   1. 当 `toCall > 0` 且玩家有剩余筹码。
   2. `minRaiseTo = currentBet + lastFullRaiseSize`。
   3. 若 `playerMaxTo < minRaiseTo`，不提供普通 raise，只能 `ALL_IN`。
7. `all_in`
   1. 永远可选（只要 `stack > 0`）。
   2. 可能等价于 call，也可能形成完整/不完整加注。
8. `reopen` 判定
   1. 已行动玩家再次获得 raise 资格，必须满足“对其新增压力 >= lastFullRaiseSize”。
   2. 多次 short all-in 新增压力可累计。

## 7. 发牌、烧牌与随机

1. 使用 52 张牌，禁止 Joker。
2. 标准发牌顺序：
   1. 每名在局玩家发两轮各一张。
   2. Flop/Turn/River 前各烧一张。
3. 提供可注入 `seed` 的 RNG，以支持复现和回放。
4. 日志记录 `handId + seed`，便于定位 bug。

## 8. 底池与边池算法

1. 每次动作后更新 `streetCommit` 与 `handCommit`。
2. 进入 `PAYOUT` 前先处理 `uncalledReturn`。
3. 按 `handCommit` 构建分层池：
   1. 阈值升序层。
   2. 每层金额 `delta * count(contrib >= threshold)`。
   3. 资格集合 `!hasFolded && contrib >= threshold`。
4. 结算顺序：边池高层 -> 主池。
5. 池内并列时平均分配，奇数筹码给 `Button 左侧最近` 的赢家。

## 9. 比牌接口规范

```ts
export interface HandRank {
  category: number; // 9=皇家同花顺 ... 0=高牌
  primary: number[]; // 用于比较的主键
  kickers: number[];
}

export function evaluate7(cards: Card[]): HandRank;
export function compareRank(a: HandRank, b: HandRank): -1 | 0 | 1;
```

规则要点：

1. 7 选 5 最优组合。
2. A 可作高或低顺（A2345）。
3. 花色不参与大小。

## 10. 事件日志（UI 动画驱动）

```ts
export type GameEvent =
  | { type: 'HAND_STARTED'; handId: number }
  | { type: 'CARDS_DEALT'; seat: number; count: number }
  | { type: 'BOARD_DEALT'; street: Street; cards: Card[] }
  | { type: 'ACTION_APPLIED'; seat: number; action: string; amount: number }
  | { type: 'STREET_ENDED'; street: Street }
  | { type: 'SHOWDOWN_REVEAL'; seat: number; cards: Card[] }
  | { type: 'POT_AWARDED'; potId: string; winners: number[]; amount: number }
  | { type: 'HAND_FINISHED'; handId: number };
```

1. UI 禁止自行推导动画触发，统一消费事件流。
2. 事件流可用于回放模式和测试快照。

## 11. 错误处理与防呆

1. 非法动作：返回 `INVALID_ACTION`，状态不变。
2. 数据破坏（如筹码守恒失败）：返回 `STATE_INVARIANT_BROKEN`，中断 hand 并上报日志。
3. 所有金额必须是整数筹码单位。
4. 每次 `dispatch` 后执行不变量检查。

## 12. 性能与复杂度目标

1. 单次 `getLegalActions`：`O(n)`。
2. 单次 `dispatch`：平均 `O(n)`，结算阶段允许 `O(n log n)`（边池排序）。
3. 6 人桌每手 1000 次模拟耗时应在可接受范围（开发机 < 200ms 级别，作为目标而非硬阈值）。

## 13. 测试规范

1. `unit`
   1. 牌型比较 10 大类 + 平局场景。
   2. 最小加注、reopen、short all-in 累计。
   3. 边池构建与逆序结算。
   4. 未跟注返还。
2. `integration`
   1. 完整 hand 流程（2 人 / 6 人）。
   2. 全员 all-in 自动补牌。
3. `golden cases`
   1. 每个争议规则至少 1 个黄金案例，固定 `seed`。

## 14. 里程碑（Spec 驱动）

1. `M1` 引擎骨架
   1. 状态机 + 基础动作 + Preflop 跑通。
2. `M2` 结算核心
   1. 牌型比较 + 边池 + 奇数筹码。
3. `M3` UI 联调
   1. 事件流驱动发牌/翻牌/下注动画。
4. `M4` 稳定性
   1. 完整测试矩阵 + 回放工具。

## 15. 开发约束

1. 规则判断只允许出现在 Engine 层。
2. UI 不得写“业务真值”（例如谁赢了、谁可加注）。
3. 对规则有疑义时，先更新 spec，再改代码。
