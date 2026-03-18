# 德州扑克联网版精简数据字典

## 1. 适用范围

这份数据字典按你当前项目来设计，不走大平台架构，只覆盖：

1. 2-10 人桌德州扑克。
2. 单桌实时对局。
3. Cocos 前端展示。
4. 服务端权威判定。
5. HTTP + WebSocket 联动。

不提前设计这些暂时用不到的东西：

1. 锦标赛。
2. 多币种复杂钱包。
3. 道具系统。
4. 复杂社交系统。
5. 旁观战绩排行榜全套平台模块。

## 2. 设计原则

### 2.1 保持和当前项目结构一致

你当前项目真正核心的数据，其实就四块：

1. 玩家。
2. 牌桌。
3. 当前手牌状态。
4. 动作和事件。

所以联网版也建议只保留这条主线，不要一开始拆太多实体。

### 2.2 从一开始兼容 2-10 人桌

为了避免后面从 6 人桌扩到 9 人或 10 人返工，建议现在就把以下约束写进数据模型：

1. `maxPlayers` 直接支持 `2-10`。
2. `SeatState[]` 必须是动态数组，不能写死 6 个座位字段。
3. `seatNo` 统一定义为 `0..maxPlayers-1`。
4. 前端座位布局按 `maxPlayers` 切换配置，不要写死 6 个坐标。
5. Hero 座位不能写死成 `0`。

### 2.3 Heads-up（2 人桌）是特殊规则

2 人桌的数据结构不用单独换一套，但规则层必须特殊处理。

关键规则：

1. 2 人桌时，`BTN` 同时也是 `SB`。
2. 另一个玩家是 `BB`。
3. Preflop 先行动的是 `SB/BTN`。
4. Flop 之后先行动的是 `BB`。

### 2.4 只分三层可见性

| 层级 | 说明 | 示例 |
| --- | --- | --- |
| 公共数据 | 同桌所有人都能看到 | 公牌、底池、座位筹码、当前行动位 |
| 私有数据 | 只有自己能看到 | 自己手牌、自己合法动作 |
| 服务端私有 | 绝不发给客户端 | 牌堆、烧牌、未亮牌玩家手牌 |

### 2.5 金额统一用整数

| 项目 | 规则 |
| --- | --- |
| 筹码金额 | 一律 `int` / `bigint` |
| 时间 | 一律 Unix 毫秒时间戳 |
| 头像 | 一律 `avatarUrl`，是完整 HTTP 图片地址 |
| 资源路径 | 不进协议，不进数据库业务字段 |

### 2.6 头像直接用 HTTP 地址

这个要和上一版区别开。

推荐直接使用：

```ts
avatarUrl: string
```

要求：

1. 数据库存完整 URL。
2. 接口直接返回完整 URL。
3. Cocos 客户端拿到后直接远程加载并做缓存。
4. 不要再额外设计 `avatarId -> 资源表 -> URL` 这一层。

## 3. 推荐保留的核心对象

对你这个项目，建议先只保留 11 个核心对象。

| 对象 | 用途 | 前端是否直接使用 | 后端是否落库 |
| --- | --- | --- | --- |
| `UserProfile` | 玩家基础信息 | 是 | 是 |
| `TableInfo` | 牌桌基本配置 | 是 | 是 |
| `LobbySeatPreview` | 大厅里的座位预览 | 是 | 否 |
| `LobbyTableSummary` | 大厅中的牌桌摘要 | 是 | 否 |
| `JoinTableRequest` | 大厅选座进入牌桌 | 是 | 否 |
| `SeatState` | 当前桌上座位信息 | 是 | 部分落库 |
| `TableSnapshot` | 当前整桌对局快照 | 是 | 实时态通常不直接落库 |
| `SelfState` | 当前玩家私有数据 | 是 | 否 |
| `LegalAction` | 当前可行动作 | 是 | 否 |
| `ActionRequest` | 客户端动作请求 | 是 | 动作日志可落库 |
| `TableEvent` | 服务端广播事件 | 是 | 可选落日志 |

其余像 `DeckState`、`SettlementDetail`、`ChipLog`，都可以作为服务端内部或日志对象，不需要先暴露给前端。

## 4. 精简后的前端主数据模型

## 4.1 `UserProfile`

这是用户基础信息，前后端都要有。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 用户 ID |
| `nickname` | string | 是 | 昵称 |
| `avatarUrl` | string | 是 | HTTP 头像地址 |
| `balance` | number | 否 | 账户余额，如果有大厅资产 |
| `status` | `'ONLINE' \| 'OFFLINE' \| 'IN_GAME'` | 否 | 用户状态 |

推荐前端类型：

```ts
export interface UserProfile {
  userId: string
  nickname: string
  avatarUrl: string
  balance?: number
  status?: 'ONLINE' | 'OFFLINE' | 'IN_GAME'
}
```

## 4.2 `TableInfo`

这一层把“房间”和“牌桌”先合并处理，避免过度拆分。

对你当前项目，`table` 就够了，不一定非要单独搞 `room`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tableId` | string | 是 | 牌桌 ID |
| `name` | string | 是 | 牌桌名 |
| `maxPlayers` | number | 是 | 最大人数，支持 `2-10` |
| `smallBlind` | number | 是 | 小盲 |
| `bigBlind` | number | 是 | 大盲 |
| `ante` | number | 否 | 前注 |
| `buyInMin` | number | 否 | 最低买入 |
| `buyInMax` | number | 否 | 最高买入 |
| `turnTimeoutSec` | number | 是 | 行动超时秒数 |
| `status` | `'WAITING' \| 'PLAYING' \| 'CLOSED'` | 是 | 桌子状态 |

推荐前端类型：

```ts
export interface TableInfo {
  tableId: string
  name: string
  maxPlayers: number // 2-10
  smallBlind: number
  bigBlind: number
  ante?: number
  buyInMin?: number
  buyInMax?: number
  turnTimeoutSec: number
  status: 'WAITING' | 'PLAYING' | 'CLOSED'
}
```

## 4.2.1 `LobbySeatPreview`

这个对象专门给大厅使用，用来渲染你截图里那种“外面先看桌子，再点空位进入”的界面。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `seatNo` | number | 是 | 座位号 |
| `isOccupied` | boolean | 是 | 是否已有人 |
| `userId` | string | 否 | 已占用时的玩家 ID |
| `nickname` | string | 否 | 已占用时昵称 |
| `avatarUrl` | string | 否 | 已占用时头像 HTTP 地址 |

推荐前端类型：

```ts
export interface LobbySeatPreview {
  seatNo: number
  isOccupied: boolean
  userId?: string
  nickname?: string
  avatarUrl?: string
}
```

## 4.2.2 `LobbyTableSummary`

这是大厅列表里每一张桌子的摘要对象。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tableId` | string | 是 | 牌桌 ID |
| `name` | string | 是 | 牌桌名 |
| `maxPlayers` | number | 是 | 最大人数 |
| `playerCount` | number | 是 | 当前人数 |
| `smallBlind` | number | 是 | 小盲 |
| `bigBlind` | number | 是 | 大盲 |
| `status` | `'WAITING' \| 'PLAYING' \| 'CLOSED'` | 是 | 牌桌状态 |
| `seats` | `LobbySeatPreview[]` | 是 | 大厅座位预览 |

推荐前端类型：

```ts
export interface LobbyTableSummary {
  tableId: string
  name: string
  maxPlayers: number
  playerCount: number
  smallBlind: number
  bigBlind: number
  status: 'WAITING' | 'PLAYING' | 'CLOSED'
  seats: LobbySeatPreview[]
}
```

## 4.2.3 `JoinTableRequest`

这个对象表示“在大厅点击某个空位后进入游戏”。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tableId` | string | 是 | 牌桌 ID |
| `seatNo` | number | 是 | 在大厅选中的座位 |
| `buyIn` | number | 否 | 买入金额 |

推荐前端类型：

```ts
export interface JoinTableRequest {
  tableId: string
  seatNo: number
  buyIn?: number
}
```

说明：

1. 玩家在大厅选中的 `seatNo`，进入游戏后继续沿用。
2. 服务端一旦成功分配该座位，就不要在进入牌桌时重新洗牌式分座。
3. 如果两个玩家同时点同一个空位，服务端以事务或原子更新保证只有一个成功。

## 4.3 `Card`

卡牌只传语义值，不传图片资源路径。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `suit` | `'Spade' \| 'Heart' \| 'Diamond' \| 'Club'` | 是 | 花色 |
| `rank` | `2-14` | 是 | 点数 |
| `code` | string | 否 | 如 `SA`、`H10` |

推荐前端类型：

```ts
export interface Card {
  suit: 'Spade' | 'Heart' | 'Diamond' | 'Club'
  rank: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
  code?: string
}
```

## 4.4 `SeatState`

这是最贴近你当前 Vue 项目 `PlayerState + TableSeatViewModel` 的对象。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `seatNo` | number | 是 | 座位号，范围 `0..maxPlayers-1` |
| `userId` | string | 否 | 该位玩家 ID，没有人坐就是空 |
| `nickname` | string | 否 | 昵称 |
| `avatarUrl` | string | 否 | HTTP 头像地址 |
| `stack` | number | 是 | 桌上剩余筹码 |
| `currentBet` | number | 是 | 当前街下注额 |
| `totalBet` | number | 是 | 当前手累计下注额 |
| `isSeated` | boolean | 是 | 是否有人坐下 |
| `isInHand` | boolean | 是 | 是否参与本手 |
| `hasFolded` | boolean | 是 | 是否已弃牌 |
| `isAllIn` | boolean | 是 | 是否全下 |
| `isReady` | boolean | 否 | 是否准备 |
| `role` | `'BTN' \| 'SB' \| 'BB' \| null` | 是 | 庄位标识 |
| `status` | `'IDLE' \| 'WAITING' \| 'ACTING' \| 'OFFLINE'` | 是 | 座位状态 |
| `exposedCards` | `Card[]` | 否 | 摊牌后公开牌 |

推荐前端类型：

```ts
export interface SeatState {
  seatNo: number // 0..maxPlayers-1
  userId?: string
  nickname?: string
  avatarUrl?: string
  stack: number
  currentBet: number
  totalBet: number
  isSeated: boolean
  isInHand: boolean
  hasFolded: boolean
  isAllIn: boolean
  isReady?: boolean
  role: 'BTN' | 'SB' | 'BB' | null
  status: 'IDLE' | 'WAITING' | 'ACTING' | 'OFFLINE'
  exposedCards?: Card[]
}
```

座位规则：

1. `seatNo` 是逻辑座位号，也是大厅选中的固定座位号。
2. 玩家在大厅选择哪个座位，进入游戏后就保持哪个 `seatNo`。
3. 当前需求下，不建议把本人强行旋转到底部后再改写 `seatNo`。
4. 如果未来想做“本人永远显示底部”，那也只能新增一个客户端展示字段，例如 `displaySeatIndex`，不能改协议里的真实 `seatNo`。

## 4.5 `PotInfo`

边池先不要设计太复杂。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `potId` | string | 是 | `main`、`side-1` |
| `amount` | number | 是 | 池子金额 |

推荐前端类型：

```ts
export interface PotInfo {
  potId: string
  amount: number
}
```

## 4.6 `LegalAction`

只发给当前行动玩家自己。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | 动作枚举 | 是 | `FOLD / CHECK / CALL / BET / RAISE / ALL_IN` |
| `toCall` | number | 否 | 跟注额 |
| `minAmountTo` | number | 否 | 最小加注到 |
| `maxAmountTo` | number | 否 | 最大加注到 |

推荐前端类型：

```ts
export interface LegalAction {
  type: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'
  toCall?: number
  minAmountTo?: number
  maxAmountTo?: number
}
```

## 4.7 `SelfState`

这是只发给自己的私有区。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `seatNo` | number | 是 | 自己座位号 |
| `holeCards` | `Card[]` | 是 | 自己底牌 |
| `legalActions` | `LegalAction[]` | 是 | 当前合法动作 |

推荐前端类型：

```ts
export interface SelfState {
  seatNo: number
  holeCards: Card[]
  legalActions: LegalAction[]
}
```

## 4.8 `TableSnapshot`

这是整个前端最核心的对象。  
你后面 Cocos 牌桌，建议主要就围绕它渲染。

补充约束：

1. `seats` 必须是动态数组。
2. `seats.length` 建议与 `TableInfo.maxPlayers` 一致。
3. 空位也保留一个 `SeatState`，只是在该位 `isSeated = false`。
4. 不要把 6 个座位拆成 6 个单独字段。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tableId` | string | 是 | 牌桌 ID |
| `handId` | number | 是 | 当前手牌 ID |
| `phase` | string | 是 | 当前阶段 |
| `street` | `'PRE_FLOP' \| 'FLOP' \| 'TURN' \| 'RIVER' \| 'SHOWDOWN'` | 是 | 当前街道 |
| `dealerSeat` | number | 是 | 庄位 |
| `sbSeat` | number | 是 | 小盲位 |
| `bbSeat` | number | 是 | 大盲位 |
| `toActSeat` | number | 是 | 当前行动位 |
| `potTotal` | number | 是 | 总池金额 |
| `board` | `Card[]` | 是 | 公牌 |
| `pots` | `PotInfo[]` | 是 | 主池和边池 |
| `seats` | `SeatState[]` | 是 | 动态座位列表，支持 `2-10` 人 |
| `actionDeadlineAt` | number | 否 | 当前行动截止时间 |
| `version` | number | 是 | 快照版本号 |
| `self` | `SelfState` | 否 | 只发给当前客户端 |

推荐前端类型：

```ts
export interface TableSnapshot {
  tableId: string
  handId: number
  phase: string
  street: 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN'
  dealerSeat: number
  sbSeat: number
  bbSeat: number
  toActSeat: number
  potTotal: number
  board: Card[]
  pots: PotInfo[]
  seats: SeatState[]
  actionDeadlineAt?: number
  version: number
  self?: SelfState
}
```

## 4.9 `ActionRequest`

客户端只发动作意图，不发规则真值。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `requestId` | string | 是 | 请求唯一 ID |
| `tableId` | string | 是 | 牌桌 ID |
| `handId` | number | 是 | 当前手 ID |
| `expectedVersion` | number | 是 | 客户端当前版本 |
| `action` | 动作枚举 | 是 | 动作类型 |
| `amountTo` | number | 否 | `BET / RAISE` 时使用 |

推荐前端类型：

```ts
export interface ActionRequest {
  requestId: string
  tableId: string
  handId: number
  expectedVersion: number
  action: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'
  amountTo?: number
}
```

## 4.10 `TableEvent`

你当前项目已经有 `GameEvent` 思路，这里保持一致，只保留最关键事件。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 事件类型 |
| `tableId` | string | 是 | 牌桌 ID |
| `handId` | number | 是 | 当前手 ID |
| `version` | number | 是 | 事件后的版本号 |
| `payload` | object | 否 | 事件载荷 |
| `ts` | number | 是 | 时间戳 |

推荐事件类型：

| 事件类型 | 用途 |
| --- | --- |
| `HAND_STARTED` | 新手开始 |
| `CARDS_DEALT` | 发底牌 |
| `BOARD_DEALT` | 发公牌 |
| `ACTION_APPLIED` | 某人执行动作 |
| `TURN_TIMEOUT` | 超时自动动作 |
| `SHOWDOWN_REVEAL` | 摊牌亮牌 |
| `POT_AWARDED` | 池子派奖 |
| `HAND_FINISHED` | 一手结束 |

## 5. 后端建议的最小表结构

不要一开始建十几张表。  
对你这个项目，MVP 建议先 6 张主表就够了。

| 表名 | 用途 | 是否必须 |
| --- | --- | --- |
| `users` | 用户信息 | 是 |
| `tables` | 牌桌配置 | 是 |
| `table_seats` | 当前座位和桌上筹码 | 是 |
| `hands` | 每手牌主记录 | 是 |
| `hand_actions` | 动作流水 | 是 |
| `chip_logs` | 资金或筹码流水 | 视是否有大厅余额决定 |

## 5.1 `users`

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `user_id` | varchar(64) PK | 用户 ID |
| `nickname` | varchar(64) | 昵称 |
| `avatar_url` | varchar(512) | HTTP 头像地址 |
| `balance` | bigint | 账户余额，可选 |
| `status` | varchar(16) | 用户状态 |
| `created_at` | bigint | 创建时间 |
| `last_login_at` | bigint | 最近登录时间 |

## 5.2 `tables`

`room` 先不单拆。一个 `table` 就够你当前项目使用。

同时建议：

1. `table.maxPlayers` 从一开始就支持 `2-10`。
2. 不要为 6 人桌单独做一套数据结构。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `table_id` | varchar(64) PK | 牌桌 ID |
| `name` | varchar(64) | 牌桌名 |
| `max_players` | int | 最大人数，支持 `2-10` |
| `small_blind` | bigint | 小盲 |
| `big_blind` | bigint | 大盲 |
| `ante` | bigint | 前注 |
| `buy_in_min` | bigint | 最低买入 |
| `buy_in_max` | bigint | 最高买入 |
| `turn_timeout_sec` | int | 行动超时秒数 |
| `status` | varchar(16) | 牌桌状态 |
| `created_at` | bigint | 创建时间 |

## 5.3 `table_seats`

这里放“当前桌上坐的是谁”和“桌上筹码”。  
但手内的 `hasFolded/currentBet` 不建议长期写这里，那是运行态。

同时这张表也是“大厅选座”的直接数据来源：

1. 大厅显示空位或有人，占用信息直接看这张表。
2. 玩家在大厅点了某个空位，本质上就是抢占这张表里对应的 `(table_id, seat_no)`。
3. 一旦写入成功，进入游戏后该 `seat_no` 继续沿用，不再重新分座。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `table_id` | varchar(64) | 牌桌 ID |
| `seat_no` | int | 座位号，范围 `0..max_players-1` |
| `user_id` | varchar(64) nullable | 当前该位玩家 |
| `stack` | bigint | 桌上剩余筹码 |
| `is_ready` | tinyint/bool | 是否准备 |
| `is_sitting_out` | tinyint/bool | 是否暂离 |
| `updated_at` | bigint | 更新时间 |

联合主键建议：

| 键 | 说明 |
| --- | --- |
| `(table_id, seat_no)` | 单桌座位唯一 |

## 5.4 `hands`

为了减少表数，建议把一手牌的关键信息直接用 JSON 存起来。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `hand_id` | bigint PK | 手牌 ID |
| `table_id` | varchar(64) | 牌桌 ID |
| `dealer_seat` | int | 庄位 |
| `sb_seat` | int | 小盲位 |
| `bb_seat` | int | 大盲位 |
| `board_json` | json/text | 最终公牌 |
| `players_json` | json/text | 手牌结束时玩家快照 |
| `pots_json` | json/text | 主池/边池结构 |
| `result_json` | json/text | 结算结果 |
| `started_at` | bigint | 开始时间 |
| `ended_at` | bigint | 结束时间 |

说明：

1. `players_json` 里存该手参与玩家的起始筹码、结束筹码、是否弃牌、是否 all-in、是否亮牌。
2. `result_json` 里存赢家、牌型、派奖结果。
3. 这样你就不用一开始再拆 `hand_players`、`hand_results`、`hand_pots` 三张表。

## 5.5 `hand_actions`

这个表一定要有，后面排查规则问题很有价值。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `action_id` | varchar(64) PK | 动作 ID |
| `hand_id` | bigint | 手牌 ID |
| `table_id` | varchar(64) | 牌桌 ID |
| `seq` | int | 手牌内顺序 |
| `seat_no` | int | 座位号 |
| `street` | varchar(16) | 所属街道 |
| `action_type` | varchar(16) | 动作类型 |
| `amount` | bigint | 本次实际投入 |
| `amount_to` | bigint | 下注到多少 |
| `created_at` | bigint | 动作时间 |

## 5.6 `chip_logs`

如果你后面有大厅余额、买入、退码、结算记账，建议保留。  
如果暂时只是房间内演示，也可以先不做。

| 字段 | 类型建议 | 说明 |
| --- | --- | --- |
| `log_id` | varchar(64) PK | 流水 ID |
| `user_id` | varchar(64) | 用户 ID |
| `table_id` | varchar(64) | 牌桌 ID |
| `hand_id` | bigint nullable | 关联手牌 |
| `type` | varchar(16) | `BUY_IN / BET / RETURN / WIN / CASH_OUT` |
| `amount` | bigint | 金额变化 |
| `balance_after` | bigint | 变化后余额 |
| `created_at` | bigint | 时间 |

## 6. 建议放 Redis / 内存，而不是直接落库的运行态

这部分最容易误设计。  
对局过程中的真值应该放运行态，而不是每一步都写数据库驱动前端。

| 对象 | 是否发给客户端 | 是否落库 | 说明 |
| --- | --- | --- | --- |
| 当前 `TableSnapshot` | 是 | 否 | 高频变化 |
| 当前牌堆 `deck` | 否 | 否 | 服务端私有 |
| 烧牌 `burnCards` | 否 | 否 | 服务端私有 |
| 当前行动截止时间 | 是 | 否 | 高频变化 |
| 当前玩家私有手牌 | 只发本人 | 否 | 私有实时态 |
| 当前合法动作 | 只发本人 | 否 | 派生实时态 |

## 6.1 关于 2-10 人桌的额外说明

这部分不是新增数据对象，而是为了避免实现时把人数写死。

| 项目 | 建议 |
| --- | --- |
| 座位布局 | 维护 `layoutConfig[maxPlayers]`，按人数切换坐标 |
| 行动顺序 | 根据当前仍在手中的座位动态计算 |
| 盲注位 | 根据人数计算，2 人桌走单独规则 |
| 发牌动画锚点 | 从 `seatNo` 动态索引 |
| 前端操作区 | 不依赖固定 Hero 位置 |

## 7. 精简后的接口对象

## 7.1 HTTP

| 接口 | 返回什么 |
| --- | --- |
| `POST /api/login/guest` | `UserProfile` + token |
| `GET /api/tables` | `LobbyTableSummary[]` |
| `POST /api/tables/{tableId}/join` | 固定座位进入结果 + ws 地址 |
| `GET /api/tables/{tableId}/snapshot` | `TableSnapshot` |

`POST /api/tables/{tableId}/join` 建议请求体：

```ts
interface JoinTableRequest {
  tableId: string
  seatNo: number
  buyIn?: number
}
```

建议响应至少包含：

```ts
interface JoinTableResponse {
  tableId: string
  seatNo: number // 服务端确认后的固定座位号
  wsUrl: string
  snapshot?: TableSnapshot
}
```

## 7.2 WebSocket Client -> Server

| 消息类型 | 载荷 |
| --- | --- |
| `table.subscribe` | `{ tableId }` |
| `table.stand` | `{ tableId }` |
| `table.ready` | `{ tableId }` |
| `table.action` | `ActionRequest` |
| `ping` | `{ ts }` |

## 7.3 WebSocket Server -> Client

| 消息类型 | 载荷 |
| --- | --- |
| `table.snapshot` | `TableSnapshot` |
| `table.event` | `TableEvent` |
| `table.actionRejected` | `{ requestId, code, message, latestVersion? }` |
| `table.playerUpdate` | 座位变化后的简要数据 |
| `pong` | `{ ts }` |

## 8. 哪些字段不要设计进去

为了避免后面不好维护，以下字段建议不要进主模型。

| 字段 | 为什么不要 |
| --- | --- |
| 头像资源 ID | 你已经明确头像是 HTTP URL |
| 卡牌图片路径 | 属于客户端资源映射 |
| 快捷加注按钮列表 | 属于客户端交互逻辑 |
| 动画坐标 | 属于客户端表现层 |
| 中文文案 | 属于客户端展示 |
| 边池 eligibleSeats 对外公开 | 客户端通常不需要知道这么细 |

## 9. 推荐的最终落地结构

如果按“好维护、够用、贴合现项目”的标准，我建议你最后就按下面这套来：

### 前端最核心 7 个对象

1. `UserProfile`
2. `TableInfo`
3. `LobbyTableSummary`
4. `SeatState`
5. `TableSnapshot`
6. `JoinTableRequest`
7. `ActionRequest`

### 后端最核心 5 个表

1. `users`
2. `tables`
3. `table_seats`
4. `hands`
5. `hand_actions`

### 可选第 6 张表

1. `chip_logs`

## 10. 结论

对你当前项目来说，最稳的方案不是“设计最全”，而是“设计最贴脸”：

1. 用 `TableSnapshot` 统一驱动 Cocos 牌桌。
2. 用 `SeatState` 统一座位展示。
3. 用 `SelfState` 管理自己的手牌和合法动作。
4. 用 `hands + hand_actions` 完成服务端日志和回放基础。
5. 用 `avatarUrl` 直接承接 HTTP 头像地址，不再加中间层。

这样复杂度会明显下降，而且和你当前 Vue 项目的 `HandState + PlayerState + Event` 结构基本一致，后续从 Web 版思路迁到 Cocos 也最顺。

## 11. 2-10 人桌落地建议

如果你后续明确要支持 `2-10` 人桌，建议现在就把下面三件事写死为规范：

1. 所有桌子都通过 `TableInfo.maxPlayers` 决定座位数量。
2. 所有座位都通过 `SeatState[]` 驱动，不出现 `seat1/seat2/seat3` 这种字段。
3. 后端规则层保留一个 `heads-up` 分支，专门处理 2 人桌盲注与行动顺序。

这样后续从 6 人扩到 9 人、10 人，主要改的是布局和测试，不会把数据结构整体推翻。
