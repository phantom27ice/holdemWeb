# Cocos 类型目录设计方案

## 1. 文档目标

本文档用于回答一个很具体的问题：

在后续的 Cocos Creator 德州扑克项目中，是否应该单独建立一个数据类型目录，并把类型按领域拆分维护。

结论先说：

1. 需要单独建立类型目录。
2. 需要分块维护，但不要过度拆分。
3. 目录设计必须贴合当前已有的 Vue 德州扑克项目，而不是凭空造一个大而全的架构。

## 2. 当前项目给出的真实信号

你现在这个 Web 项目里，已经隐含了 3 层结构：

### 2.1 规则真值层

来源：

1. [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts)
2. [holdemEngine.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/engine/holdemEngine.ts)

这一层定义了：

1. `Card`
2. `PlayerState`
3. `HandState`
4. `Action`
5. `LegalAction`
6. `GameEvent`

这说明当前项目已经有一个“领域模型中心”，只是现在放在一个文件里。

### 2.2 状态编排层

来源：

1. [tableStore.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/stores/tableStore.ts)

这一层做的事情是：

1. 维护当前 `handState`
2. 维护 `events`
3. 维护 `turnTempo`
4. 处理 Hero 行动
5. 把引擎状态推进到 UI

这说明后续在 Cocos 中，`store/controller/network` 一定会反复依赖同一批类型。

### 2.3 视图映射层

来源：

1. [createMockTableState.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/mock/createMockTableState.ts)

这一层已经在做：

1. `HandState -> TableViewModel`
2. `PlayerState -> TableSeatViewModel`
3. `LegalAction -> 操作区状态`

这说明后续在 Cocos 里，除了“领域类型”，还需要“展示类型”。

## 3. 专业开发者视角的结论

从专业开发角度看，后续 Cocos 工程里应该单独建立一个类型目录，而且至少要拆成 4 层：

1. `model`
2. `protocol`
3. `ui-model`
4. `config`

原因不是为了好看，而是为了防止下面这几类维护问题：

1. 网络协议字段和牌桌内部状态混在一起。
2. Cocos prefab 直接依赖后端裸 JSON。
3. 一个字段改名后，controller、network、presenter、动画层全部一起炸。
4. 后续从 6 人桌扩到 2-10 人桌时，数据结构被写死。

## 4. 不推荐的做法

### 4.1 不要只有一个 `types.ts`

问题：

1. 文件会越来越大。
2. 大厅、牌桌、协议、UI 类型全部混在一起。
3. 改字段时影响范围不清晰。

### 4.2 不要把类型散落到每个组件内部

问题：

1. 同一个 `SeatState` 会被写出多份。
2. 很容易出现同名不同义。
3. 后续接口联调时最容易失控。

### 4.3 不要把 Cocos `Component` 当作数据模型

问题：

1. 网络对象不应该依赖 `@ccclass`
2. 业务数据不应该依赖场景节点
3. 单元测试和协议复用会很难

## 5. 推荐的目录结构

假设未来 Cocos 项目根目录下的脚本目录为 `assets/scripts/`，建议这样组织：

```text
assets/scripts/
├─ model/
│  ├─ common.ts
│  ├─ user.ts
│  ├─ lobby.ts
│  ├─ table.ts
│  ├─ action.ts
│  ├─ event.ts
│  └─ index.ts
├─ protocol/
│  ├─ http.ts
│  ├─ ws.ts
│  └─ index.ts
├─ ui-model/
│  ├─ seat-view.ts
│  ├─ table-view.ts
│  ├─ lobby-view.ts
│  └─ action-panel.ts
├─ config/
│  ├─ seat-layout.ts
│  └─ table-config.ts
└─ common/
   └─ type-guards.ts
```

如果项目早期想更轻一点，也可以先收敛成：

```text
assets/scripts/
├─ model/
│  ├─ common.ts
│  ├─ lobby.ts
│  ├─ table.ts
│  ├─ action.ts
│  ├─ event.ts
│  └─ index.ts
├─ protocol/
│  ├─ http.ts
│  ├─ ws.ts
│  └─ index.ts
├─ ui-model/
│  └─ table-view.ts
└─ config/
   └─ seat-layout.ts
```

第一阶段不建议再拆更多文件。

## 6. 每个目录到底放什么

## 6.1 `model/`

职责：

1. 放业务领域模型。
2. 放牌桌真值投影。
3. 放前端和后端都能认同的核心结构。

这里不要放：

1. HTTP 请求库逻辑
2. WebSocket 封包逻辑
3. Cocos 节点引用
4. SpriteFrame、Node、Prefab 之类的类型

### 推荐文件拆分

#### `model/common.ts`

放公共枚举和基础类型：

1. `Suit`
2. `Rank`
3. `Street`
4. `Phase`
5. `SeatStatus`
6. `Role`

#### `model/user.ts`

放用户基础类型：

1. `UserProfile`

#### `model/lobby.ts`

放大厅相关类型：

1. `LobbySeatPreview`
2. `LobbyTableSummary`
3. `JoinTableRequest`
4. `JoinTableResponse`

#### `model/table.ts`

放牌桌和对局快照类型：

1. `Card`
2. `TableInfo`
3. `SeatState`
4. `PotInfo`
5. `SelfState`
6. `TableSnapshot`

#### `model/action.ts`

放动作相关类型：

1. `ActionType`
2. `LegalAction`
3. `ActionRequest`
4. `ActionRejected`

#### `model/event.ts`

放事件相关类型：

1. `TableEvent`
2. `TableEventType`

#### `model/index.ts`

做统一导出，避免上层到处写深路径。

## 6.2 `protocol/`

职责：

1. 放接口收发结构。
2. 放请求/响应封包。
3. 放 HTTP 和 WebSocket 的消息约定。

这里要解决的是“怎么传”，不是“业务是什么”。

### 推荐文件拆分

#### `protocol/http.ts`

例如：

1. `GuestLoginRequest`
2. `GuestLoginResponse`
3. `GetTablesResponse`
4. `JoinTableHttpRequest`
5. `JoinTableHttpResponse`

#### `protocol/ws.ts`

例如：

1. `WsEnvelope<T>`
2. `TableSubscribeMessage`
3. `TableActionMessage`
4. `TableSnapshotMessage`
5. `TableEventMessage`

#### `protocol/index.ts`

统一导出。

## 6.3 `ui-model/`

职责：

1. 放 Cocos prefab 直接消费的数据。
2. 放视图层派生结构。
3. 让 presenter 不直接吃网络 JSON。

这一层是当前项目 [createMockTableState.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/mock/createMockTableState.ts) 在做的事，只不过以后要拆得更清楚。

### 推荐文件拆分

#### `ui-model/seat-view.ts`

放：

1. `SeatViewData`
2. `SeatBadgeState`

#### `ui-model/table-view.ts`

放：

1. `TableViewData`
2. `BoardViewData`
3. `PotViewData`

#### `ui-model/lobby-view.ts`

放：

1. `LobbyTableViewData`
2. `LobbySeatViewData`

#### `ui-model/action-panel.ts`

放：

1. `ActionPanelState`
2. `RaiseSliderState`

## 6.4 `config/`

职责：

1. 放跟资源和布局相关的静态配置。
2. 专门解决 2-10 人桌的座位布局问题。

这里不要混业务状态。

### 推荐文件拆分

#### `config/seat-layout.ts`

放：

1. `SeatLayoutPoint`
2. `TableLayoutConfig`
3. `layoutConfigByPlayerCount`

这块非常关键，因为你当前 Web 项目里是 6 人桌写死：

1. `createMockTableState.ts` 里固定 `HERO_SEAT = 0`
2. `TableScene.vue` 里固定 6 个 `seatAnchors`

到了 Cocos，如果后续要支持 `2-10` 人桌，这部分必须从一开始抽成配置。

#### `config/table-config.ts`

放：

1. 默认盲注
2. 默认超时
3. 买入范围
4. 本地调试桌配置

## 7. 推荐的依赖方向

为了减少耦合，依赖方向建议固定成：

```text
config -> 可被 ui/controller 使用
model -> 可被 protocol/ui-model/controller/store 使用
protocol -> 可被 network/controller 使用
ui-model -> 可被 presenter/view 使用
```

不要反过来：

1. `model` 依赖 `ui-model`
2. `protocol` 依赖 `Cocos Component`
3. `model` 直接 import `SpriteFrame`

## 8. 哪些类型该用 `interface/type`，哪些该用 `@ccclass`

这是 Cocos 项目里非常容易混乱的点。

### 应该用 `interface/type` 的内容

1. `TableSnapshot`
2. `SeatState`
3. `Card`
4. `ActionRequest`
5. `TableEvent`
6. `UserProfile`
7. `LobbyTableSummary`

原因：

1. 这些是纯数据。
2. 不需要挂在编辑器里。
3. 更适合网络通信、状态存储和测试。

### 应该考虑用 `@ccclass` 的内容

1. 编辑器里要配置的布局点
2. Prefab 引用配置
3. 可以在 Inspector 中调的静态参数

例如：

1. `SeatAnchorConfig`
2. `TableLayoutConfigAsset`

## 9. 结合当前项目，最建议先抽出来的文件

如果现在就开始做 Cocos 版，我建议第一批先落这 8 个文件：

```text
assets/scripts/model/
├─ common.ts
├─ lobby.ts
├─ table.ts
├─ action.ts
├─ event.ts
└─ index.ts

assets/scripts/protocol/
├─ http.ts
├─ ws.ts
└─ index.ts
```

第二批再补：

```text
assets/scripts/ui-model/
├─ table-view.ts
└─ action-panel.ts

assets/scripts/config/
└─ seat-layout.ts
```

也就是说，第一阶段先保证：

1. 类型有中心。
2. 网络协议有中心。
3. 后续 presenter 有明确输入。

## 10. 结合当前项目的映射关系

当前 Vue 项目到未来 Cocos 项目的推荐映射如下：

| 当前文件 | 当前职责 | Cocos 后续建议 |
| --- | --- | --- |
| [index.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/types/index.ts) | 所有核心类型集中定义 | 拆到 `model/common.ts`、`model/table.ts`、`model/action.ts`、`model/event.ts` |
| [holdemEngine.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/engine/holdemEngine.ts) | 规则引擎 | 保留为规则核心，依赖 `model/*` |
| [tableStore.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/stores/tableStore.ts) | 状态编排 | Cocos 中变成 `store/controller`，依赖 `model/*` 和 `protocol/*` |
| [createMockTableState.ts](/Users/kangzhenbin/Desktop/holdemWeb/src/game/mock/createMockTableState.ts) | UI 视图映射 | Cocos 中拆到 `ui-model/*` 和 adapter 层 |

## 11. 对你这个项目最重要的收益

如果后续 Cocos 工程按这种目录设计，收益是很直接的：

1. 大厅和牌桌的数据结构会统一。
2. 大厅选座后固定 `seatNo` 的逻辑会更稳定。
3. 后续支持 `2-10` 人桌时，不会因为 6 人写死而返工数据结构。
4. WebSocket 收到的消息会有清晰落点。
5. Prefab 的 presenter 只需要依赖 `ui-model`，不会直接污染业务模型。

## 12. 不要过度工程

虽然建议拆目录，但不要一上来拆出二十几个文件。

第一阶段只要满足下面 3 个条件就够了：

1. 大厅类型和牌桌类型分开。
2. 协议类型和展示类型分开。
3. 2-10 人桌和固定 `seatNo` 的约束被写进类型层。

如果文件拆得太细，反而会有这些问题：

1. 查类型要跳很多文件。
2. 新人接手会觉得过度设计。
3. 小项目维护成本反而上升。

## 13. 最终建议

对你当前这个德州扑克项目，专业角度的建议是：

1. 建一个独立的类型目录，必要。
2. 按 `model / protocol / ui-model / config` 四层拆，合理。
3. 第一阶段文件数量控制在 8-12 个，最稳。
4. 纯网络和业务对象坚持用 `interface/type`。
5. 只有编辑器要配置的静态参数才用 `@ccclass`。

一句话总结：

不是为了“代码看起来高级”才建类型目录，而是因为你这个项目已经天然具备了 `规则层 / 状态层 / 视图层 / 联网层`，如果不把类型集中和分层，后续 Cocos 开发会越来越难维护。
