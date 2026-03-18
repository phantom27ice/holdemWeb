# Cocos 联机德州扑克接口文档

## 1. 文档目标

本文档用于定义：

1. 基于当前已有德州扑克项目，后续改成联机版时需要哪些接口。
2. 哪些走 HTTP，哪些走 WebSocket。
3. 请求和响应应该长什么样。
4. 接口如何和当前项目里的 `Action`、`LegalAction`、`GameEvent`、`HandState` 对齐。

本文档不是面向“大平台德州系统”，而是面向你当前这个项目的第一版联机化落地。

## 2. 当前项目决定了哪些接口必须存在

当前 Web 项目里，联机化后最核心的能力有 4 个：

1. 大厅看桌子和选座。
2. 进入牌桌后固定 `seatNo`。
3. 服务端权威推进 `HandState`。
4. 客户端根据 `TableSnapshot + TableEvent` 渲染和播放动画。

这 4 件事决定了接口必须分成两类：

### 2.1 HTTP 负责一次性请求

适合做：

1. 登录
2. 拉大厅桌子列表
3. 选座进入牌桌
4. 拉全量快照

### 2.2 WebSocket 负责实时消息

适合做：

1. 牌桌订阅
2. 准备
3. 站起
4. 行动
5. 服务端事件广播
6. 快照推送
7. 座位变化推送
8. 心跳

## 3. 总体协议原则

### 3.1 服务端权威

客户端只发送动作意图：

1. `CHECK`
2. `CALL`
3. `FOLD`
4. `BET`
5. `RAISE`
6. `ALL_IN`

客户端不发送：

1. 下一行动位是谁
2. 当前合法动作是什么
3. 哪个边池应该怎么分
4. 哪个玩家赢了

这些都由服务端根据当前项目已有的规则引擎语义来决定。

### 3.2 快照 + 事件双通道

推荐同步方式：

1. 进入牌桌时，下发一次 `TableSnapshot`
2. 局内动作和发牌过程，下发 `TableEvent`
3. 如果状态纠偏或重连恢复失败，再次下发 `TableSnapshot`

### 3.3 大厅选座后固定 seatNo

这个是你当前需求里的关键点，必须写死在接口规则里：

1. 玩家在大厅点哪个空位，就申请哪个 `seatNo`
2. 服务端确认成功后，这个 `seatNo` 就是该玩家的真实逻辑座位号
3. 进入牌桌后继续沿用该 `seatNo`
4. 客户端如需把自己显示在底部，只能做展示映射，不能改协议里的真实 `seatNo`

## 4. 接口分层

推荐只保留下面这些核心接口。

## 4.1 HTTP 接口

### `POST /api/login/guest`

用途：

1. 游客登录
2. 获取 token
3. 获取用户基础信息

请求体：

```json
{
  "nickname": "游客1001",
  "deviceId": "device_xxx"
}
```

响应体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt_or_session_token",
    "profile": {
      "userId": "u_1001",
      "nickname": "游客1001",
      "avatarUrl": "https://cdn.example.com/avatar/u_1001.png",
      "balance": 10000,
      "status": "ONLINE"
    }
  }
}
```

### `GET /api/tables`

用途：

1. 获取大厅桌子列表
2. 获取每张桌子的座位占用情况
3. 用于大厅界面显示“外面看桌 + 点空位”

响应体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tables": [
      {
        "tableId": "table_01",
        "name": "德州房间 1",
        "maxPlayers": 6,
        "playerCount": 4,
        "smallBlind": 50,
        "bigBlind": 100,
        "status": "WAITING",
        "seats": [
          {
            "seatNo": 0,
            "isOccupied": true,
            "userId": "u_1001",
            "nickname": "Alice",
            "avatarUrl": "https://cdn.example.com/avatar/a.png"
          },
          {
            "seatNo": 1,
            "isOccupied": false
          }
        ]
      }
    ]
  }
}
```

### `POST /api/tables/{tableId}/join`

用途：

1. 在大厅点击某个空位后，申请进入桌子
2. 服务端原子占用该座位
3. 返回固定 `seatNo` 和后续 WebSocket 连接信息

请求体：

```json
{
  "tableId": "table_01",
  "seatNo": 3,
  "buyIn": 2000
}
```

响应体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tableId": "table_01",
    "seatNo": 3,
    "wsUrl": "wss://example.com/ws",
    "snapshot": {
      "tableId": "table_01",
      "handId": 0,
      "phase": "WAITING_FOR_PLAYERS",
      "street": "PRE_FLOP",
      "dealerSeat": 0,
      "sbSeat": 0,
      "bbSeat": 0,
      "toActSeat": -1,
      "potTotal": 0,
      "board": [],
      "pots": [],
      "seats": [],
      "version": 1
    }
  }
}
```

失败场景：

1. 座位已被别人抢先占用
2. 买入金额不合法
3. 牌桌已关闭

### `GET /api/tables/{tableId}/snapshot`

用途：

1. 拉取全量牌桌快照
2. 重连后兜底恢复
3. 客户端怀疑版本不同步时强制纠偏

响应体：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "snapshot": {
      "tableId": "table_01",
      "handId": 21,
      "phase": "BETTING_FLOP",
      "street": "FLOP",
      "dealerSeat": 3,
      "sbSeat": 4,
      "bbSeat": 5,
      "toActSeat": 0,
      "potTotal": 600,
      "board": [
        { "suit": "Spade", "rank": 14 },
        { "suit": "Heart", "rank": 10 },
        { "suit": "Club", "rank": 10 }
      ],
      "pots": [
        { "potId": "main", "amount": 600 }
      ],
      "seats": [],
      "actionDeadlineAt": 1770000000000,
      "version": 112,
      "self": {
        "seatNo": 0,
        "holeCards": [
          { "suit": "Diamond", "rank": 14 },
          { "suit": "Diamond", "rank": 13 }
        ],
        "legalActions": [
          { "type": "FOLD" },
          { "type": "CALL", "toCall": 100 },
          { "type": "RAISE", "minAmountTo": 300, "maxAmountTo": 2000 }
        ]
      }
    }
  }
}
```

## 4.2 WebSocket 接口

推荐使用统一信封：

```json
{
  "type": "table.action",
  "payload": {},
  "requestId": "req_1001",
  "ts": 1770000000000
}
```

## 5. 客户端 -> 服务端消息

### `table.subscribe`

用途：

1. 订阅牌桌实时消息
2. 进入牌桌场景后立即发送

消息体：

```json
{
  "type": "table.subscribe",
  "payload": {
    "tableId": "table_01"
  }
}
```

### `table.ready`

用途：

1. 玩家准备开始下一手

消息体：

```json
{
  "type": "table.ready",
  "payload": {
    "tableId": "table_01"
  }
}
```

### `table.stand`

用途：

1. 玩家站起离座

消息体：

```json
{
  "type": "table.stand",
  "payload": {
    "tableId": "table_01"
  }
}
```

### `table.action`

用途：

1. 向服务端发起一次正式动作
2. 这是最核心的联机接口

消息体：

```json
{
  "type": "table.action",
  "payload": {
    "requestId": "req_2001",
    "tableId": "table_01",
    "handId": 21,
    "expectedVersion": 112,
    "action": "RAISE",
    "amountTo": 600
  },
  "requestId": "req_2001",
  "ts": 1770000000000
}
```

说明：

1. `action` 与当前项目 [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) 中的动作类型保持一致。
2. `BET/RAISE` 才需要 `amountTo`
3. `expectedVersion` 用来防止客户端在过期状态上行动

### `ping`

用途：

1. 保活
2. 测网络延迟

消息体：

```json
{
  "type": "ping",
  "payload": {
    "ts": 1770000000000
  }
}
```

## 6. 服务端 -> 客户端消息

### `table.snapshot`

用途：

1. 首次进入牌桌
2. 状态纠偏
3. 重连恢复

消息体：

```json
{
  "type": "table.snapshot",
  "payload": {
    "tableId": "table_01",
    "handId": 21,
    "phase": "BETTING_PRE_FLOP",
    "street": "PRE_FLOP",
    "dealerSeat": 2,
    "sbSeat": 3,
    "bbSeat": 4,
    "toActSeat": 5,
    "potTotal": 150,
    "board": [],
    "pots": [
      { "potId": "main", "amount": 150 }
    ],
    "seats": [],
    "version": 45,
    "self": {
      "seatNo": 5,
      "holeCards": [
        { "suit": "Spade", "rank": 14 },
        { "suit": "Spade", "rank": 13 }
      ],
      "legalActions": [
        { "type": "FOLD" },
        { "type": "CALL", "toCall": 100 },
        { "type": "RAISE", "minAmountTo": 200, "maxAmountTo": 2000 }
      ]
    }
  }
}
```

### `table.event`

用途：

1. 局内事件广播
2. 给动画层驱动表现
3. 给客户端增量更新状态

消息体示例 1：玩家动作

```json
{
  "type": "table.event",
  "payload": {
    "type": "ACTION_APPLIED",
    "tableId": "table_01",
    "handId": 21,
    "version": 46,
    "seatNo": 5,
    "action": "CALL",
    "amount": 100,
    "ts": 1770000001000
  }
}
```

消息体示例 2：发翻牌

```json
{
  "type": "table.event",
  "payload": {
    "type": "BOARD_DEALT",
    "tableId": "table_01",
    "handId": 21,
    "version": 50,
    "street": "FLOP",
    "cards": [
      { "suit": "Spade", "rank": 14 },
      { "suit": "Heart", "rank": 10 },
      { "suit": "Club", "rank": 10 }
    ],
    "ts": 1770000003000
  }
}
```

说明：

1. 这里的事件类型基本直接映射当前项目里的 `GameEvent`
2. 当前项目已有的事件包括：
   1. `HAND_STARTED`
   2. `CARDS_DEALT`
   3. `BOARD_DEALT`
   4. `ACTION_APPLIED`
   5. `TURN_TIMEOUT`
   6. `SHOWDOWN_REVEAL`
   7. `POT_AWARDED`
   8. `HAND_FINISHED`

### `table.actionRejected`

用途：

1. 动作被服务端拒绝
2. 提示客户端刷新或纠偏

消息体：

```json
{
  "type": "table.actionRejected",
  "payload": {
    "requestId": "req_2001",
    "tableId": "table_01",
    "handId": 21,
    "code": "VERSION_EXPIRED",
    "message": "客户端状态已过期，请刷新牌桌状态",
    "latestVersion": 120
  }
}
```

### `table.playerUpdate`

用途：

1. 某个座位状态变化
2. 大厅和牌桌都可能用到

消息体：

```json
{
  "type": "table.playerUpdate",
  "payload": {
    "tableId": "table_01",
    "seat": {
      "seatNo": 3,
      "userId": "u_1003",
      "nickname": "Bob",
      "avatarUrl": "https://cdn.example.com/avatar/bob.png",
      "stack": 2000,
      "currentBet": 0,
      "totalBet": 0,
      "isSeated": true,
      "isInHand": false,
      "hasFolded": false,
      "isAllIn": false,
      "isReady": true,
      "role": null,
      "status": "WAITING"
    }
  }
}
```

### `pong`

用途：

1. 心跳响应

消息体：

```json
{
  "type": "pong",
  "payload": {
    "ts": 1770000000000
  }
}
```

## 7. 错误码建议

### 7.1 HTTP 错误码

| 错误码 | 说明 |
| --- | --- |
| `TABLE_NOT_FOUND` | 牌桌不存在 |
| `TABLE_CLOSED` | 牌桌已关闭 |
| `SEAT_OCCUPIED` | 座位已被占用 |
| `INVALID_BUY_IN` | 买入金额非法 |
| `UNAUTHORIZED` | 登录失效 |

### 7.2 WebSocket 动作错误码

| 错误码 | 说明 |
| --- | --- |
| `NOT_YOUR_TURN` | 不是你行动 |
| `INVALID_AMOUNT` | 金额不合法 |
| `ACTION_NOT_ALLOWED` | 当前动作不允许 |
| `VERSION_EXPIRED` | 客户端版本落后 |
| `HAND_ALREADY_FINISHED` | 当前手已结束 |
| `TABLE_NOT_FOUND` | 牌桌不存在 |

## 8. 联机流程建议

## 8.1 进入大厅

1. 调 `POST /api/login/guest`
2. 调 `GET /api/tables`
3. 渲染大厅牌桌和空位状态

## 8.2 大厅选座进入牌桌

1. 用户点击某张桌子的某个空位
2. 调 `POST /api/tables/{tableId}/join`
3. 服务端原子占位
4. 返回固定 `seatNo`
5. 客户端进入牌桌场景
6. 建立 WebSocket
7. 发送 `table.subscribe`

## 8.3 牌桌内行动

1. 服务端推 `table.snapshot`
2. 客户端渲染
3. 玩家点击按钮后发 `table.action`
4. 服务端校验并推进状态
5. 服务端推 `table.event`
6. 必要时推新的 `table.snapshot`

## 8.4 重连恢复

第一版可以先简单处理：

1. 断线后重连 WebSocket
2. 再调一次 `GET /api/tables/{tableId}/snapshot`
3. 用快照覆盖本地状态

先不要一开始就做复杂的增量补帧。

## 9. 和当前项目代码的映射关系

| 当前项目结构 | 联机版接口对应 |
| --- | --- |
| [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) 的 `Action` | `table.action` |
| [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) 的 `LegalAction` | `TableSnapshot.self.legalActions` |
| [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) 的 `GameEvent` | `table.event` |
| [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) 的 `HandState` | 服务端内部状态 + 客户端 `TableSnapshot` 投影 |
| [tableStore.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/stores/tableStore.ts) 的本地 `hero*` 操作 | 联机后改成发送 `table.action` |
| [createMockTableState.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/mock/createMockTableState.ts) 的 `TableViewModel` | 联机后由 `TableSnapshot` 映射得到 |

## 10. 第一版联机接口最小集合

如果只做第一版 MVP，建议先只实现这些：

### HTTP

1. `POST /api/login/guest`
2. `GET /api/tables`
3. `POST /api/tables/{tableId}/join`
4. `GET /api/tables/{tableId}/snapshot`

### WebSocket

1. `table.subscribe`
2. `table.ready`
3. `table.stand`
4. `table.action`
5. `table.snapshot`
6. `table.event`
7. `table.actionRejected`
8. `table.playerUpdate`
9. `ping`
10. `pong`

## 11. 结论

结合你当前已有的德州扑克项目，后续做成联机版时，真正必须的接口并不算多。关键不是接口数量，而是三件事要稳定：

1. 大厅选座后固定 `seatNo`
2. 服务端权威推进 `HandState`
3. 客户端通过 `TableSnapshot + TableEvent` 驱动牌桌

如果这三件事接口层定稳了，后续 Cocos 客户端、后端房间服务和规则引擎就能并行开发。
